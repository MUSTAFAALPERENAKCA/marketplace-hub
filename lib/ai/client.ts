import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

/** ANTHROPIC_API_KEY yoksa null döner; çağıran taraf fallback'e düşmeli. */
export function getAnthropicClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) {
    return null;
  }
  client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}
