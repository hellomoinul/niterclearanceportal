#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const TASK_MAP_PATH = join(ROOT, ".github", "task-map.yml");
const STATE_PATH = join(ROOT, ".github", "doc-sync-state.json");
const SNAPSHOT_PATH = join(ROOT, "Snapshot.md");
const OWNER_ORDER = ["Moinul", "Fatin", "Shafin"];
const ID_RE = /(M|F|S)-v2\.\d+/;

// ── Minimal YAML parser ──
function loadTaskMap() {
  const text = readFileSync(TASK_MAP_PATH, "utf8");
  const tasks = [];
  let current = null;
  for (const raw of text.split("\n")) {
    const t = raw.replace(/\s*$/, "");
    if (!t || t.startsWith("#")) continue;
    const indent = raw.search(/\S/);
    if (/^- id:/.test(t.trim())) {
      current = { id: t.trim().slice(5).trim().replace(/['"]/g, "") };
      tasks.push(current);
      continue;
    }
    if (current && indent >= 4) {
      const s = t.trim().replace(/['"]/g, "");
      if (s.startsWith("title:")) current.title = s.slice(6).trim();
      else if (s.startsWith("owner:")) current.owner = s.slice(6).trim();
      else if (s.startsWith("order:")) current.order = parseInt(s.slice(6).trim(), 10);
      else if (s.startsWith("hint:")) current.hint = s.slice(5).trim();
      else if (s === "paths:") current.paths = [];
      else if (s.startsWith("- ") && current.paths) current.paths.push(s.slice(2).trim());
      else if (s === "also_completes:") current.also_completes = [];
      else if (s.startsWith("- ") && current.also_completes)
        current.also_completes.push(s.slice(2).trim());
    }
  }
  return tasks.map((t) => ({
    id: t.id,
    title: t.title || "",
    owner: t.owner || "",
    order: t.order || 999,
    paths: t.paths || [],
    hint: t.hint || "",
    also_completes: t.also_completes || [],
  }));
}

// ── State ──
function loadState() {
  if (!existsSync(STATE_PATH)) return { done: {} };
  try {
    return JSON.parse(readFileSync(STATE_PATH, "utf8"));
  } catch {
    return { done: {} };
  }
}
function saveState(state) {
  state.updated_at = new Date().toISOString().slice(0, 10);
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + "\n");
}

// ── PR files ──
async function fetchPRFiles(prNumber) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    try {
      return execSync("git diff --name-only HEAD~1 HEAD", { encoding: "utf8", cwd: ROOT })
        .trim()
        .split("\n")
        .filter(Boolean);
    } catch {
      return [];
    }
  }
  const resp = await fetch(
    `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/pulls/${prNumber}/files?per_page=100`,
    { headers: { Authorization: `token ${token}` } },
  );
  if (!resp.ok) return [];
  return (await resp.json()).map((f) => f.filename);
}

function matchGlob(pattern, file) {
  const re = new RegExp(
    "^" + pattern.replace(/\*\*/g, "§§").replace(/\*/g, "[^/]*").replace(/§§/g, ".*") + "$",
  );
  return re.test(file);
}

function matchTaskIds(prTitle, files, tasks) {
  const ids = new Set();
  const tagRe = /(M|F|S)-v2\.\d+(?=:|\s|,|\]|\)|$)/g;
  let m;
  while ((m = tagRe.exec(prTitle)) !== null) {
    const id = m[0];
    if (tasks.some((t) => t.id === id)) ids.add(id);
  }
  for (const task of tasks) {
    if (task.paths.some((p) => files.some((f) => matchGlob(p, f)))) {
      if (ids.size === 0 || ids.has(task.id)) ids.add(task.id);
    }
  }
  return [...ids];
}

// ── Globally accessible helpers ──
let TASKS = [];
let STATE = { done: {} };

// ── Snapshot.md update ──
function updateSnapshot() {
  let content = readFileSync(SNAPSHOT_PATH, "utf8");
  const doneCount = Object.keys(STATE.done).length;
  const total = TASKS.length;
  const pct = Math.round((doneCount / total) * 100);
  const today = new Date().toISOString().slice(0, 10);

  // Update header line: refresh date + progress while keeping any human-written "Phase:".
  content = content.replace(/^> \*\*Last updated:\*\*.*$/m, (line) => {
    const sansProgress = line.replace(/\*\*Progress:\*\*.*$/, "").trim();
    const phase = sansProgress
      .match(/\*\*Phase:\*\* (.+)$/)?.[1]
      ?.trim()
      .replace(/\s*[·.]+\s*$/, "");
    const parts = [`> **Last updated:** ${today}`];
    if (phase) parts.push(`**Phase:** ${phase}`);
    parts.push(`**Progress:** ~${pct}%`);
    return parts.join(" · ");
  });

  // Update "What's left" paragraph (if present in v2 doc style)
  const wlParts = [];
  for (const owner of OWNER_ORDER) {
    const oTasks = TASKS.filter((t) => t.owner === owner);
    const done = oTasks.filter((t) => STATE.done[t.id]);
    const remaining = oTasks.filter((t) => !STATE.done[t.id]).sort((a, b) => a.order - b.order);
    const doneNames = done.map((t) => t.id).join(" + ");
    wlParts.push(
      `${owner} at ${done.length}/${oTasks.length}${doneNames ? " (" + doneNames + " done)" : ""}`,
    );
  }
  const whatsLeft = wlParts.join(". ") + ".";
  content = content.replace(/\*\*What's left:\*\*.*/, `**What's left:** ${whatsLeft}`);

  // Flip task bullets: `- ⬜ **M-v2.1** …` → `- ✅ **M-v2.1** …`
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\s*-)\s+([⬜🚧🔒])\s+\*\*((?:M|F|S)-v2\.\d+)\*\*/);
    if (m) {
      const id = m[3];
      if (STATE.done[id]) {
        lines[i] = lines[i].replace(/\s*[⬜🚧🔒]\s+\*\*/, " ✅ **");
      }
    }
  }
  content = lines.join("\n");

  // Append newly-completed tasks to the Work history section (current month header),
  // preserving any existing human-written history.
  const newDone = Object.entries(STATE.done)
    .filter(([id, info]) => ID_RE.test(id) && info.date === today)
    .filter(([id]) => TASKS.some((t) => t.id === id));
  if (newDone.length > 0) {
    const whStart = content.indexOf("## 📝 Work history");
    if (whStart !== -1) {
      const dateHead = `### ${today} — completed in this PR`;
      content =
        content.slice(0, whStart) +
        "## 📝 Work history\n\n" +
        newDone
          .map(([id, info]) => {
            const task = TASKS.find((t) => t.id === id);
            return `- **${task.title} (${task.id}):** completed ${info.pr ? `via PR #${info.pr}.` : "(no PR needed)."}`;
          })
          .join("\n") +
        "\n" +
        content.slice(whStart + "## 📝 Work history".length);
    }
  }

  writeFileSync(SNAPSHOT_PATH, content);
}

// ── Main ──
async function main() {
  const prNumber =
    process.env.PR_NUMBER || process.argv.find((a) => a.startsWith("--pr="))?.slice(5);
  const force = process.argv.includes("--force");
  if (!prNumber && !force) {
    console.error("Usage: PR_NUMBER=N node doc-sync.mjs");
    process.exit(1);
  }

  const prTitle =
    process.env.PR_TITLE ||
    (() => {
      try {
        return execSync("git log -1 --pretty=%s HEAD", { encoding: "utf8", cwd: ROOT }).trim();
      } catch {
        return "";
      }
    })();

  console.log(`doc-sync: processing PR #${prNumber}`);
  console.log(`  title: ${prTitle}`);

  const files = await fetchPRFiles(parseInt(prNumber, 10));
  console.log(`  files changed: ${files.length}`);

  TASKS = loadTaskMap();
  STATE = loadState();

  const matchedIds = matchTaskIds(prTitle, files, TASKS);
  console.log(`  matched tasks: ${matchedIds.join(", ") || "(none)"}`);

  if (matchedIds.length === 0 && !force) {
    console.log("  no tasks matched — skipping doc update");
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  for (const id of matchedIds) {
    if (!ID_RE.test(id)) continue;
    STATE.done[id] = { pr: parseInt(prNumber, 10), date: today };
    const task = TASKS.find((t) => t.id === id);
    if (task?.also_completes) {
      for (const extra of task.also_completes) {
        if (!STATE.done[extra]) STATE.done[extra] = { pr: parseInt(prNumber, 10), date: today };
      }
    }
  }
  saveState(STATE);

  updateSnapshot();

  console.log(`  done: updated Snapshot.md`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
