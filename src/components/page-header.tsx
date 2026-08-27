import { Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight } from "lucide-react";

interface Breadcrumb {
  label: string;
  to?: string;
}

interface BackLink {
  to: string;
  label: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  back,
}: {
  title: string;
  description?: string | null;
  breadcrumbs?: Breadcrumb[];
  back?: BackLink;
}) {
  return (
<<<<<<< HEAD
    <section className="hero-surface -mx-4 -mt-8 mb-8 rounded-b-xl px-6 py-8 sm:px-10 sm:py-10">
=======
    <section className="hero-surface hero-fade-in -mt-8 mb-8 rounded-xl px-6 py-8 sm:px-10 sm:py-10">
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
      {back && (
        <Link
          to={back.to}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#07172B]/85 transition-colors hover:text-[#07172B]"
        >
          <ArrowLeft className="size-4" /> {back.label}
        </Link>
      )}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-3 flex items-center gap-1.5 text-sm font-medium text-[#07172B]">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="size-3" />}
              {crumb.to ? (
                <Link to={crumb.to} className="underline-offset-2 hover:underline">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-[#07172B]/80">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
      {description && (
<<<<<<< HEAD
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#07172B]/95">{description}</p>
=======
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-white/90">{description}</p>
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
      )}
    </section>
  );
}
