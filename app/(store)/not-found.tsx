import { SearchX } from "lucide-react";
import Link from "next/link";
import { EmptyStateStatic } from "@/components/empty-state";

export default function NotFound() {
  return (
    <div className="container-site py-16">
      <EmptyStateStatic
        icon={<SearchX size={36} strokeWidth={1.25} />}
        title="We couldn't find that page"
        body="The phone may have sold out or the link may be wrong."
        action={
          <Link href="/shop" className="btn btn-primary hover:no-underline">
            Browse phones
          </Link>
        }
      />
    </div>
  );
}
