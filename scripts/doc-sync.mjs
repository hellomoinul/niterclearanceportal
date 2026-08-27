#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TASK_MAP_PATH = join(ROOT, '.github', 'task-map.yml');
const STATE_PATH = join(ROOT, '.github', 'doc-sync-state.json');
const ASSIGNMENT_PATH = join(ROOT, 'Assignment.md');
const SNAPSHOT_PATH = join(ROOT, 'Snapshot.md');
const OWNER_ORDER = ['Moinul', 'Fatin', 'Shafin'];

// ── Minimal YAML parser ──
function loadTaskMap() {
  const text = readFileSync(TASK_MAP_PATH, 'utf8');
  const tasks = [];
  let current = null;
  for (const raw of text.split('\n')) {
    const t = raw.replace(/\s*$/, '');
    if (!t || t.startsWith('#')) continue;
    const indent = raw.search(/\S/);
    if (/^- id:/.test(t.trim())) {
      current = { id: t.trim().slice(5).trim().replace(/['"]/g,'') };
      tasks.push(current);
      continue;
    }
    if (current && indent >= 4) {
      const s = t.trim().replace(/['"]/g,'');
      if (s.startsWith('title:')) current.title = s.slice(6).trim();
      else if (s.startsWith('owner:')) current.owner = s.slice(6).trim();
      else if (s.startsWith('order:')) current.order = parseInt(s.slice(6).trim(),10);
      else if (s.startsWith('hint:')) current.hint = s.slice(5).trim();
      else if (s.startsWith('doc_note:')) current.doc_note = s.slice(9).trim();
      else if (s === 'paths:') current.paths = [];
      else if (s.startsWith('- ') && current.paths) current.paths.push(s.slice(2).trim());
      else if (s === 'also_completes:') current.also_completes = [];
      else if (s.startsWith('- ') && current.also_completes) current.also_completes.push(s.slice(2).trim());
    }
  }
  return tasks.map(t => ({
    id: t.id, title: t.title||'', owner: t.owner||'',
    order: t.order||999, paths: t.paths||[], hint: t.hint||'',
    also_completes: t.also_completes||[], doc_note: t.doc_note||''
  }));
}

// ── State ──
function loadState() {
  if (!existsSync(STATE_PATH)) return { done: {} };
  try { return JSON.parse(readFileSync(STATE_PATH, 'utf8')); } catch { return { done: {} }; }
}
function saveState(state) {
  state.updated_at = new Date().toISOString().slice(0, 10);
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n');
}

// ── PR files ──
async function fetchPRFiles(prNumber) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    try { return execSync('git diff --name-only HEAD~1 HEAD', { encoding:'utf8', cwd:ROOT }).trim().split('\n').filter(Boolean); } catch { return []; }
  }
  const resp = await fetch(
    `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/pulls/${prNumber}/files?per_page=100`,
    { headers: { Authorization: `token ${token}` } }
  );
  if (!resp.ok) return [];
  return (await resp.json()).map(f => f.filename);
}

function matchGlob(pattern, file) {
  const re = new RegExp('^' + pattern.replace(/\*\*/g, '§§').replace(/\*/g, '[^/]*').replace(/§§/g, '.*') + '$');
  return re.test(file);
}

function matchTaskIds(prTitle, prDesc, files, tasks) {
  const ids = new Set();
  const text = `${prTitle}\n${prDesc||''}`;
  const tagRe = /\[([A-Z]\d+)\]|(?:^|\s)([A-Z]\d+)(?::|\b)/gm;
  let m;
  while ((m = tagRe.exec(text)) !== null) {
    const id = m[1]||m[2];
    if (tasks.some(t => t.id === id)) ids.add(id);
  }
  for (const task of tasks) {
    if (task.paths.some(p => files.some(f => matchGlob(p, f)))) {
      if (ids.size === 0 || ids.has(task.id)) ids.add(task.id);
    }
  }
  return [...ids];
}

// ── Globally accessible helpers ──
let TASKS = [];
let STATE = { done: {} };

// ── Assignment.md update ──
function updateAssignment() {
  let content = readFileSync(ASSIGNMENT_PATH, 'utf8');
  const lines = content.split('\n');
  const out = [];
  for (const line of lines) {
    // Task lines: flip [ ] to [x]
    const m = line.match(/^- \[([ x])\] \*\*[^*]+\(([A-Z]\d+)\)\*\*/);
    if (m) {
      const id = m[2];
      if (STATE.done[id] && m[1] === ' ') {
        out.push(line.replace('- [ ]', '- [x]'));
        continue;
      }
    }
    // Backlog total
    if (line.startsWith('**Backlog total:')) {
      const doneCount = Object.keys(STATE.done).length;
      const remaining = TASKS.filter(t => !STATE.done[t.id]).length;
      out.push(`**Backlog total: ${TASKS.length} tasks · ${doneCount} done · ${remaining} remaining** (30 original + 1 rebuild + 4 security).`);
      continue;
    }
    // Progress table rows (must have 4 columns with Member | ...)
    const tm = line.match(/^\| (Moinul|Fatin|Shafin) \| .+ \| .+ \| .+ \|$/);
    if (tm) {
      const owner = tm[1];
      const oTasks = TASKS.filter(t => t.owner === owner);
      const done = oTasks.filter(t => STATE.done[t.id]).length;
      const rem = oTasks.length - done;
      const remText = rem > 0 ? `${rem}` : '0';
      const doneText = owner === 'Moinul' ? `${done}/${oTasks.length} + 14 bug fixes` : `${done}/${oTasks.length}`;
      const suffix = owner === 'Moinul' ? ' — core + stretch + infra' : owner === 'Fatin' ? ' — 4 original + 6 gap fixes' : ' — 5 original + 5 gap fixes + 1 rebuild';
      out.push(`| ${owner} | ${oTasks.length}${suffix} | ${doneText} | ${remText} |`);
      continue;
    }
    // Blocked-on
    if (line.startsWith('**Blocked on:**')) {
      const parts = [];
      const fRem = TASKS.filter(t => t.owner==='Fatin' && !STATE.done[t.id]).sort((a,b)=>a.order-b.order);
      const sRem = TASKS.filter(t => t.owner==='Shafin' && !STATE.done[t.id]).sort((a,b)=>a.order-b.order);
      const mRem = TASKS.filter(t => t.owner==='Moinul' && !STATE.done[t.id]).sort((a,b)=>a.order-b.order);
      if (fRem.length) parts.push(`Fatin needs ${fRem[0].title} next.`);
      if (sRem.length) parts.push(`Shafin needs ${sRem[0].title} next.`);
      if (mRem.length) parts.push(`Moinul working on ${mRem.map(t=>t.id).join(', ')}.`);
      else parts.push('Moinul in support mode — available to help Fatin/Shafin.');
      out.push(`**Blocked on:** ${parts.join(' ')}`);
      continue;
    }
    out.push(line);
  }
  writeFileSync(ASSIGNMENT_PATH, out.join('\n'));
}

// ── Snapshot.md update ──
function updateSnapshot() {
  let content = readFileSync(SNAPSHOT_PATH, 'utf8');
  const doneCount = Object.keys(STATE.done).length;
  const total = TASKS.length;
  const pct = Math.round((doneCount / total) * 100);
  const today = new Date().toISOString().slice(0, 10);

  // Update header line
  content = content.replace(
    /\*\*Last updated:\*\*.*/,
    `**Last updated:** ${today} · **Overall progress: ~${pct}%**`
  );

  // Update "What's left" paragraph
  const wlParts = [];
  for (const owner of OWNER_ORDER) {
    const oTasks = TASKS.filter(t => t.owner === owner);
    const done = oTasks.filter(t => STATE.done[t.id]);
    const pending = oTasks.filter(t => !STATE.done[t.id]).sort((a,b)=>a.order-b.order);
    const doneNames = done.map(t => t.id).join(' + ');
    wlParts.push(`${owner} at ${done.length}/${oTasks.length}${doneNames ? ' (' + doneNames + ' done)' : ''}`);
  }
  const whatsLeft = wlParts.join('. ') + '.';
  content = content.replace(/\*\*What's left:\*\*.*/, `**What's left:** ${whatsLeft}`);

  // Update sprint table status cells (lines matching "| ID | ... | ⬜ ... |")
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\|\s*(M\d+|F\d+|S\d+)\s*\|)/);
    if (m) {
      const id = m[2];
      if (STATE.done[id]) {
        lines[i] = lines[i].replace(/⬜ Not started/g, '✅ Done');
      }
    }
  }
  content = lines.join('\n');

  // Rebuild "## Remaining summary" section
  const ownerStats = OWNER_ORDER.map(owner => {
    const oTasks = TASKS.filter(t => t.owner === owner);
    const done = oTasks.filter(t => STATE.done[t.id]);
    return { owner, total: oTasks.length, done: done.length, remaining: oTasks.filter(t => !STATE.done[t.id]).sort((a,b)=>a.order-b.order) };
  });

  const remainingLines = [
    `## Remaining summary`,
    '',
    `- **Backlog: ${total} tasks · ${doneCount} done · ${total - doneCount} remaining.** ${ownerStats.map(s => `${s.owner} ${s.done}/${s.total}`).join('. ')}.`,
    ...ownerStats.map(s => {
      if (s.remaining.length === 0) return `- **${s.owner}'s work: ${s.done}/${s.total} done** — all complete.`;
      const firstTask = s.remaining[0];
      return `- **${s.owner}'s work: ${s.done}/${s.total} done** — remaining: ${s.remaining.map(t=>t.id).join(', ')}. Next: ${firstTask.title}.`;
    }),
    `- **Order of attack:** ${ownerStats.filter(s=>s.remaining.length>0).map(s=>`${s.owner} → ${s.remaining[0].title}`).join('; ')}.`,
    `- **Definition of done for v1:** student applies → staff approves/rejects with remarks → escalation works → admin route guard active → no status-forgery path → Head ordering enforced at DB level → certificate PDF downloads with scannable QR → admin manages users, overrides decisions (audited), reads batch reports, and manages notices that appear on the public home page.`
  ];

  // Replace remaining summary section, preserving anything after it (like "## How to update")
  const rsIdx = content.indexOf('## Remaining summary');
  const nextSection = content.indexOf('\n## ', rsIdx + 5);
  if (rsIdx !== -1) {
    if (nextSection !== -1) {
      content = content.slice(0, rsIdx) + remainingLines.join('\n') + '\n' + content.slice(nextSection + 1);
    } else {
      content = content.slice(0, rsIdx) + remainingLines.join('\n');
    }
  }

  // Rebuild work history
  const stateEntries = Object.entries(STATE.done);
  const byDate = {};
  for (const [id, info] of stateEntries) {
    const d = info.date || today;
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push({ id, pr: info.pr });
  }

  const whLines = ['## Work history', ''];
  for (const date of Object.keys(byDate).sort().reverse()) {
    whLines.push(`### ${date}`, '');
    for (const entry of byDate[date]) {
      const task = TASKS.find(t => t.id === entry.id);
<<<<<<< HEAD
      if (task) whLines.push(`- **${task.title} (${task.id}):** completed via PR #${entry.pr}.`);
=======
      if (!task) continue;
      if (entry.pr) {
        whLines.push(`- **${task.title} (${task.id}):** completed via PR #${entry.pr}.`);
      } else {
        whLines.push(`- **${task.title} (${task.id}):** completed (no PR needed).`);
      }
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
    }
    whLines.push('');
  }

  // Replace work history section (from ## Work history to ## Remaining summary or end)
  const whStart = content.indexOf('## Work history');
  const rsStart = content.indexOf('## Remaining summary');
  if (whStart !== -1) {
    if (rsStart !== -1 && rsStart > whStart) {
      // Replace work history, keep remaining summary
      content = content.slice(0, whStart) + whLines.join('\n') + '\n' + content.slice(rsStart);
    } else {
      // No remaining summary found — append both
      content = content.slice(0, whStart) + whLines.join('\n') + '\n' + remainingLines.join('\n');
    }
  }

  writeFileSync(SNAPSHOT_PATH, content);
}

// ── Main ──
async function main() {
  const prNumber = process.env.PR_NUMBER || process.argv.find(a => a.startsWith('--pr='))?.slice(5);
  const force = process.argv.includes('--force');
  if (!prNumber && !force) { console.error('Usage: PR_NUMBER=N node doc-sync.mjs'); process.exit(1); }

  const prTitle = process.env.PR_TITLE || (() => {
    try { return execSync('git log -1 --pretty=%s HEAD', { encoding:'utf8', cwd:ROOT }).trim(); } catch { return ''; }
  })();

  console.log(`doc-sync: processing PR #${prNumber}`);
  console.log(`  title: ${prTitle}`);

  const files = await fetchPRFiles(parseInt(prNumber, 10));
  console.log(`  files changed: ${files.length}`);

  TASKS = loadTaskMap();
  STATE = loadState();

  const matchedIds = matchTaskIds(prTitle, '', files, TASKS);
  console.log(`  matched tasks: ${matchedIds.join(', ') || '(none)'}`);

  if (matchedIds.length === 0 && !force) {
    console.log('  no tasks matched — skipping doc update');
    return;
  }

  // Update state
  const today = new Date().toISOString().slice(0, 10);
  for (const id of matchedIds) {
    STATE.done[id] = { pr: parseInt(prNumber, 10), date: today };
    const task = TASKS.find(t => t.id === id);
    if (task?.also_completes) {
      for (const extra of task.also_completes) {
        if (!STATE.done[extra]) STATE.done[extra] = { pr: parseInt(prNumber, 10), date: today };
      }
    }
  }
  saveState(STATE);

  updateAssignment();
  updateSnapshot();

  console.log(`  done: updated Assignment.md + Snapshot.md`);
}

main().catch(e => { console.error(e); process.exit(1); });
