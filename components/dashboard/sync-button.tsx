"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { syncAllConnectedMarketplaces } from "@/app/dashboard/sync-actions";

export function SyncButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await syncAllConnectedMarketplaces();
          toast.success("Pazaryerlerinden yeni veri çekildi");
        })
      }
    >
      <RefreshCw className={isPending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
      Yenile
    </Button>
  );
}
