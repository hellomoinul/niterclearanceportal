import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/verify")({
  head: () => ({
    meta: [
      { title: "Verify a clearance certificate — NITER" },
      {
        name: "description",
        content:
          "Employers and offices can confirm a NITER clearance certificate is genuine by entering its certificate code — no account needed.",
      },
      { property: "og:title", content: "Verify a clearance certificate — NITER" },
      {
        property: "og:description",
        content: "Enter a NITER clearance certificate code to confirm it is genuine.",
      },
    ],
  }),
  component: VerifyPage,
});

function VerifyPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  return (
    <PortalShell className="max-w-2xl">
      <div className="card-surface p-6">
        <ShieldCheck className="size-6 text-primary" aria-hidden />
        <h1 className="mt-3 text-2xl font-semibold">Certificate verification</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the certificate code printed on the clearance certificate, or scan its QR code.
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = code.trim();
            if (trimmed) navigate({ to: "/verify/$code", params: { code: trimmed } });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="code">Certificate code</Label>
            <Input
              id="code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="NITER-2021-2103021-A1B2C3"
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Verify certificate
          </Button>
        </form>
      </div>
    </PortalShell>
  );
}
