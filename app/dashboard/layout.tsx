import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { marketplaceConnections } from "@/db/schema";
import { requireOrgId } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const orgId = await requireOrgId();

  const [connection] = await db
    .select({ id: marketplaceConnections.id })
    .from(marketplaceConnections)
    .where(eq(marketplaceConnections.orgId, orgId))
    .limit(1);

  if (!connection) {
    redirect("/onboarding/connect");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
