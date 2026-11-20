import { SkeletonCard } from "@/components/ui";

export default function Loading() {
  return (
    <div className="container-site flex flex-col gap-6 py-6 md:py-10" aria-busy="true" aria-label="Loading products">
      <div className="h-9 w-56 animate-pulse rounded-md bg-surface-2" />
      <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="hidden flex-col gap-4 lg:flex">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-card bg-surface" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
