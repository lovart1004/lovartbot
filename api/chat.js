// /api/chat.js

export default async function handler(req, res) {
  // CORS (필요하면 유지, 같은 도메인이면 없어도 됨)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ message: "OPENAI_API_KEY is missing" });

  // ✅ Vercel에서 body가 undefined로 들어오는 경우 대비
  let body = req.body;
  if (!body) {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString("utf8");
      body = raw ? JSON.parse(raw) : {};
    } catch (e) {
      return res.status(400).json({ message: "Invalid JSON body" });
    }
  }

  const userMessage = (body.message || "").toString().trim();
  if (!userMessage) return res.status(400).json({ message: "message is required" });

  try {
    // ✅ 최신 권장: /v1/responses 사용
    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: userMessage,
      }),
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      return res.status(r.status).json({
        message: "OpenAI API error",
        detail: data,
      });
    }

    // responses API는 output_text가 제일 간단
    const text = data.output_text || "(no output_text)";
    return res.status(200).json({ message: text });
  } catch (err) {
    return res.status(500).json({ message: "Server error", detail: err?.message || String(err) });
  }
}
