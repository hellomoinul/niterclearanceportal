import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { PageHeader } from "@/components/page-header";
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
<<<<<<< HEAD
          "Employers and offices can confirm a NITER clearance certificate is genuine by entering its certificate code — no account needed.",
=======
          "Employers and offices can confirm a NITER clearance certificate is genuine by entering its certificate ID — no account needed.",
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
      },
      { property: "og:title", content: "Verify a clearance certificate — NITER" },
      {
        property: "og:description",
<<<<<<< HEAD
        content: "Enter a NITER clearance certificate code to confirm it is genuine.",
=======
        content: "Enter a NITER clearance certificate ID to confirm it is genuine.",
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
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
      <PageHeader
        title="Certificate verification"
<<<<<<< HEAD
        description="Enter the certificate code printed on the clearance certificate, or scan its QR code."
=======
        description="Enter the certificate ID printed on the clearance certificate, or scan its QR code."
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
      />
      <div className="card-surface mt-4 p-6">
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = code.trim();
            if (trimmed) navigate({ to: "/verify/$code", params: { code: trimmed } });
          }}
        >
          <div className="space-y-2">
<<<<<<< HEAD
            <Label htmlFor="code">Certificate code</Label>
=======
            <Label htmlFor="code">Certificate ID</Label>
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
            <Input
              id="code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
<<<<<<< HEAD
              placeholder="NITER-2021-2103021-A1B2C3"
=======
              placeholder="e.g. f7ddbb0b-a436-491e-804b-3d48e6670124"
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
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
