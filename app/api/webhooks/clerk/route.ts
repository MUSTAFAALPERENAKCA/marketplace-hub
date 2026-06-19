import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

type ClerkOrgEvent = {
  type: string;
  data: { id: string; name: string; slug?: string };
};

export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CLERK_WEBHOOK_SECRET is not set" }, { status: 500 });
  }

  const payload = await req.text();
  const headers = {
    "svix-id": req.headers.get("svix-id") ?? "",
    "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
    "svix-signature": req.headers.get("svix-signature") ?? "",
  };

  let event: ClerkOrgEvent;
  try {
    event = new Webhook(secret).verify(payload, headers) as ClerkOrgEvent;
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "organization.created":
    case "organization.updated":
      await db
        .insert(organizations)
        .values({ id: event.data.id, name: event.data.name })
        .onConflictDoUpdate({
          target: organizations.id,
          set: { name: event.data.name },
        });
      break;
    case "organization.deleted":
      await db.delete(organizations).where(eq(organizations.id, event.data.id));
      break;
  }

  return NextResponse.json({ ok: true });
}
