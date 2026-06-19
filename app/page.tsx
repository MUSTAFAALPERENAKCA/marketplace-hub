import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Store } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 px-6 text-center dark:bg-black">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <Store className="h-5 w-5" />
        Marketplace Hub
      </div>
      <h1 className="max-w-xl text-3xl font-semibold tracking-tight">
        Trendyol, Amazon ve Hepsiburada&apos;yı tek panelden yönet
      </h1>
      <p className="max-w-md text-muted-foreground">
        Siparişler, yorumlar ve iade talepleri tek ekranda; rutin işleri AI
        otomatik halleder, kritik kararlar sana sorulur.
      </p>
      <Button asChild size="lg">
        <Link href="/dashboard">Panele git</Link>
      </Button>
    </div>
  );
}
