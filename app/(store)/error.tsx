"use client";
import { CircleAlert } from "lucide-react";
import { EmptyState } from "@/components/ui";

export default function StoreError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-site py-16">
      <EmptyState
        icon={<CircleAlert size={36} strokeWidth={1.25} />}
        title="Something went wrong loading this page"
        body="Please try again. If it keeps happening, message us on WhatsApp and we'll help you directly."
        action={
          <button type="button" onClick={reset} className="btn btn-primary">
            Try again
          </button>
        }
      />
    </div>
  );
}
