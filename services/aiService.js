require("dotenv").config();

async function generateFeedback(content) {
const prompt = `
You are an internal reflection assistant.

Analyze the reflection below and respond ONLY in the format given.
Do NOT add introductions, explanations, or extra text.

FORMAT:

Summary:
(2 concise lines summarizing the reflection)

Suggestions:
- actionable improvement 1
- actionable improvement 2
- actionable improvement 3

Questions:
- reflective question 1
- reflective question 2

Reflection:
(short encouraging insight)

REFLECTION TEXT:
${content}
`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemma-3-12b-it:free",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.log("OpenRouter error:", data);
    throw new Error(data.error?.message || "OpenRouter request failed");
  }

  return data.choices[0].message.content;
}

module.exports = { generateFeedback };