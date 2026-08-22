import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { statusLabel, type ReviewStatus } from "@/lib/portal";

const styles: Record<ReviewStatus, string> = {
  approved: "bg-approved text-approved-foreground",
  pending: "bg-pending text-pending-foreground",
  rejected: "bg-rejected text-rejected-foreground",
};

const icons: Record<ReviewStatus, typeof Clock> = {
  approved: CheckCircle2,
  pending: Clock,
  rejected: XCircle,
};

export function StatusBadge({ status, className }: { status: ReviewStatus; className?: string }) {
  const Icon = icons[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        styles[status],
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {statusLabel(status)}
    </span>
  );
}
