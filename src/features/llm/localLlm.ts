import type { MessageRecord } from "../../lib/schemas";

export async function summarizeMessages(input: {
  endpoint: string;
  model: string;
  messages: MessageRecord[];
}): Promise<string> {
  const prompt = [
    "Summarize these co-parenting communication records factually.",
    "Do not invent facts. Use neutral language. Highlight dates, agreements, disputes, and action items.",
    "",
    ...input.messages.map(
      (message) =>
        `Date: ${message.occurredAt}\nCounterpart: ${message.counterpart}\nChannel: ${message.channel}\nSubject: ${message.subject ?? ""}\nBody: ${message.body}`
    )
  ].join("\n\n---\n\n");

  const response = await fetch(input.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: input.model,
      prompt,
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`Local LLM returned ${response.status}`);
  }

  const payload = (await response.json()) as { response?: string; text?: string };
  return payload.response ?? payload.text ?? "No summary returned.";
}
