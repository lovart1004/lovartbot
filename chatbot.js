const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const btn = document.getElementById("send-btn");

function addMessage(text, sender) {
  const div = document.createElement("div");
  div.className = `msg ${sender}`;
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";
  btn.disabled = true;

  try {
    const resp = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    // ✅ JSON 실패 대비: 먼저 text로 받아서 파싱 시도
    const raw = await resp.text();
    let data;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      // JSON이 아니면 그대로 보여줌
      addMessage(`서버 응답(JSON 아님)\nstatus=${resp.status}\n\n${raw.slice(0, 2000)}`, "bot");
      return;
    }

    if (!resp.ok) {
      addMessage(`에러 status=${resp.status}\n` + JSON.stringify(data, null, 2), "bot");
      return;
    }

    addMessage(data.message ?? JSON.stringify(data, null, 2), "bot");
  } catch (e) {
    addMessage("네트워크 오류: " + (e?.message || String(e)), "bot");
  } finally {
    btn.disabled = false;
    input.focus();
  }
}

btn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

// 첫 안내
addMessage("원하는 주제를 입력하면, 애드센스 승인용 글 초안을 만들어 드릴게요.", "bot");
