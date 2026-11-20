export default function Loading() {
  return (
    <div className="container-site flex flex-col gap-6 py-6 md:py-10" aria-busy="true" aria-label="Loading">
      <div className="h-9 w-56 animate-pulse rounded-md bg-surface-2" />
      <div className="h-80 animate-pulse rounded-card bg-surface" />
    </div>
  );
}
