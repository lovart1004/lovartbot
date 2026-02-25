const API_KEY = "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";
document.getElementById("send-btn").addEventListener("click", sendMessage);
document.getElementById("user-input").addEventListener("keypress", function(e){
    if (e.key === "Enter") sendMessage();
});

async function sendMessage() {
    const input = document.getElementById("user-input");
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";

    const prompt = `
당신은 '애드센스 승인 기준에 맞는 고품질 콘텐츠 전문 작성 챗봇'입니다.
다음 기준을 반드시 준수하세요:

1) 완전히 독창적인 표현 사용  
2) SEO 최적화 (제목·소제목 구조 포함)  
3) 광고성/선정적/저작권 침해/의학 처방/정치 민감 내용 금지  
4) 정보 정확성 우선  
5) 한글 문체는 자연스럽고 매끄럽게  

사용자가 아래 주제로 글을 원합니다:

"${text}"

위 규칙에 맞는 고품질 콘텐츠를 작성하세요.
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }]
        })
    });

    const data = await response.json();
    const botMessage = data.choices[0].message.content;
    addMessage(botMessage, "bot");
}

function addMessage(text, sender) {
    const box = document.getElementById("chat-box");
    const div = document.createElement("div");
    div.classList.add("chat-message", sender);
    div.innerHTML = text.replace(/\n/g, "<br>");
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;

}
