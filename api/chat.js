export default async function handler(req, res) {
  try {
    // 1) 메서드 체크
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // 2) body 안전 파싱 (req.body가 undefined/문자열/객체 모두 대응)
    let body = req.body;
    if (!body) {
      // 일부 환경에서 body가 비는 경우가 있어 안전 처리
      body = {};
    }
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const message = body?.message;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required" });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY is missing" });
    }

    // 3) OpenAI 호출
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: message }],
      }),
    });

    // 4) OpenAI 에러면 그대로 로그/반환
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        error: "OpenAI request failed",
        details: data,
      });
    }

    const reply = data?.choices?.[0]?.message?.content ?? "(no reply)";
    // ✅ 프론트가 기대하는 키: reply
    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: err?.message || String(err) });
  }
}
