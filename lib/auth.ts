import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { organizations } from "@/db/schema";

/**
 * Clerk webhook her zaman ulaşmayabilir (örn. localhost'ta tünel yoksa),
 * bu yüzden org'a erişim gerektiren her sayfada local mirror'ı garantiye al.
 */
export async function ensureOrganizationSynced(orgId: string) {
  const client = await clerkClient();
  const org = await client.organizations.getOrganization({ organizationId: orgId });

  await db
    .insert(organizations)
    .values({ id: org.id, name: org.name })
    .onConflictDoUpdate({ target: organizations.id, set: { name: org.name } });
}

/** Server-side helper: aktif org yoksa onboarding'e yönlendirir. */
export async function requireOrgId() {
  const { orgId } = await auth();
  if (!orgId) {
    redirect("/onboarding");
  }
  await ensureOrganizationSynced(orgId);
  return orgId;
}
