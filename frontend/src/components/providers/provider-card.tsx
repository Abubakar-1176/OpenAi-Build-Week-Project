import Link from "next/link";

import { Card } from "@/components/ui/card";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { StarRating } from "@/components/ui/star-rating";
import type { Provider } from "@/types";

export function ProviderCard({ provider }: { provider: Provider }) {
  return (
    <Link href={`/providers/${provider.id}`}>
      <Card className="h-full p-5 transition-transform hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-soft font-display text-lg font-medium text-primary">
            {(provider.provider_name ?? "?").charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-medium text-foreground">{provider.provider_name}</span>
              {provider.verified && <VerifiedBadge size="sm" />}
            </div>
            <span className="text-xs text-muted">{provider.category.name}</span>
          </div>
        </div>

        {provider.description && (
          <p className="mt-3 line-clamp-2 text-sm text-muted">{provider.description}</p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <span className="font-tabular text-sm font-medium text-foreground">
            {provider.hourly_rate ? `Rs. ${provider.hourly_rate}/hr` : "Rate on request"}
          </span>
          <StarRating rating={provider.average_rating} />
        </div>
      </Card>
    </Link>
  );
}
