import { getAnthropicClient } from "./client";

export interface ReviewForReply {
  productName: string;
  rating: number;
  comment: string;
  customerName?: string | null;
}

function templateFallback(review: ReviewForReply): string {
  if (review.rating <= 2) {
    return `Merhaba${review.customerName ? ` ${review.customerName}` : ""}, yaşadığınız sorun için özür dileriz. Sizinle iletişime geçip çözüm üretmek isteriz, lütfen sipariş numaranızla bize destek kanalımızdan ulaşın.`;
  }
  return `Merhaba${review.customerName ? ` ${review.customerName}` : ""}, değerlendirmeniz için çok teşekkür ederiz! Memnuniyetiniz bizim için çok değerli. 🙏`;
}

/**
 * Yorum için kısa bir Türkçe yanıt önerir. ANTHROPIC_API_KEY yoksa veya
 * çağrı başarısız olursa basit bir şablon yanıta düşer — özellik anahtar
 * olmadan da çalışır durumda kalır.
 */
export async function suggestReviewReply(review: ReviewForReply): Promise<string> {
  const client = getAnthropicClient();
  if (!client) {
    return templateFallback(review);
  }

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 200,
      system:
        "Sen bir e-ticaret satıcısının müşteri yorumlarına yanıt veren asistanısın. " +
        "Türkçe, 1-2 cümle, samimi ama saygılı, emoji az. Olumsuz yorumlarda özür dile ve " +
        "destek kanalına yönlendir; rakip/yasal taahhüt verme.",
      messages: [
        {
          role: "user",
          content: `Ürün: ${review.productName}\nPuan: ${review.rating}/5\nYorum: ${review.comment}\n\nBu yoruma yanıt yaz.`,
        },
      ],
    });

    const text = response.content.find((b) => b.type === "text");
    return text && text.type === "text" ? text.text.trim() : templateFallback(review);
  } catch {
    return templateFallback(review);
  }
}
