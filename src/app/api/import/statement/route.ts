```typescript
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { text } = await req.json();
  if (!text) {
    return Response.json({ error: "No text provided" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const msg = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    messages: [{
      role: "user",
      content: `Parse this bank statement and extract ALL transactions. Return ONLY a JSON array, no other text. Each item: date (YYYY-MM-DD), description (string), amount (number, negative for expenses, positive for income), currency (string). Extract every single transaction, do not skip any.\n\nBank statement:\n${text}`,
    }],
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text : "[]";
  const clean = raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1);
  const transactions = JSON.parse(clean);
  return Response.json({ transactions });
}
```
