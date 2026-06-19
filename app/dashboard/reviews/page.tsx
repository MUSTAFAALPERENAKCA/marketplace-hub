import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { requireOrgId } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { SyncButton } from "@/components/dashboard/sync-button";
import { ReviewCard } from "@/components/dashboard/review-card";

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const orgId = await requireOrgId();

  const conditions = [eq(reviews.orgId, orgId)];
  if (filter === "yeni" || filter === "yanitlandi") {
    conditions.push(eq(reviews.status, filter));
  }

  const reviewRows = await db
    .select()
    .from(reviews)
    .where(and(...conditions))
    .orderBy(desc(reviews.createdAt));

  return (
    <div>
      <Header
        title="Yorumlar"
        description={`${reviewRows.length} yorum — yanıt bekleyenler için AI öneri üretebilirsin`}
        actions={<SyncButton />}
      />
      <div className="space-y-4 p-8">
        {reviewRows.length === 0 && (
          <p className="py-10 text-center text-muted-foreground">
            Henüz yorum yok. &quot;Yenile&quot; butonuyla pazaryerlerinden veri çekebilirsin.
          </p>
        )}
        {reviewRows.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
}
