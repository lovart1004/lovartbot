export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "OPENAI_API_KEY is missing" });
  }

  // body 파싱
  let body = {};
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const message = (body?.message || "").trim();
  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }

  const maxTokens = Number(process.env.MAX_TOKENS || 900);
  const temperature = Number(process.env.TEMPERATURE || 0.7);

  const systemPrompt = `
너는 한국어로 애드센스 승인에 적합한 "정보성 블로그 글 초안"을 작성하는 도우미야.
구성: 제목, 서론, 본문(소제목 4~6개), 체크리스트, FAQ(3~5개), 결론
조건: 과장/단정 금지, 표절 금지, 1200~1800자 내
`.trim();

  // ✅ Responses API 응답 텍스트 추출(가장 안전한 버전)
  function extractTextFromResponses(data) {
    const parts = [];
    if (data?.output && Array.isArray(data.output)) {
      for (const out of data.output) {
        if (out?.content && Array.isArray(out.content)) {
          for (const c of out.content) {
            // 주로 { type: "output_text", text: "..." }
            if (typeof c?.text === "string" && c.text.trim()) parts.push(c.text);
          }
        }
      }
    }
    // 일부 케이스에서 output_text가 바로 오는 경우도 있음
    if (typeof data?.output_text === "string" && data.output_text.trim()) {
      parts.push(data.output_text);
    }
    return parts.join("\n").trim();
  }

  try {
    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_output_tokens: maxTokens,
        temperature,
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({
        error: "OpenAI API error",
        status: r.status,
        detail: data,
      });
    }

    const text = extractTextFromResponses(data);

    // ✅ 디버깅용: 텍스트가 없으면 data 일부도 같이 보내기
    if (!text) {
      return res.status(200).json({
        message: "(no output_text)",
        debug: {
          has_output: Array.isArray(data?.output),
          output_first: data?.output?.[0],
        },
      });
    }

    return res.status(200).json({ message: text });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}
