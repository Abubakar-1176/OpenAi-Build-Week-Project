import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-danger">
        <ShieldAlert className="h-7 w-7" />
      </span>
      <h1 className="mt-5 font-display text-2xl font-medium text-foreground">
        You don&apos;t have access to this page
      </h1>
      <p className="mt-2 text-sm text-muted">
        This area is for a different account type. Head back to your dashboard.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Go home</Link>
      </Button>
    </div>
  );
}
