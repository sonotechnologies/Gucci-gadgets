"use client";
import { CircleAlert } from "lucide-react";
import { EmptyState } from "@/components/ui";

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <EmptyState
      icon={<CircleAlert size={36} strokeWidth={1.25} />}
      title="Couldn't load this page"
      body={error.message || "Check your connection and try again."}
      action={
        <button type="button" onClick={reset} className="btn btn-primary">
          Try again
        </button>
      }
    />
  );
}
