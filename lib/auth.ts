import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/** Server-side helper: aktif org yoksa onboarding'e yönlendirir. */
export async function requireOrgId() {
  const { orgId } = await auth();
  if (!orgId) {
    redirect("/onboarding");
  }
  return orgId;
}
