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

    const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
    });

    const data = await response.json();
    addMessage(data.message, "bot");
}

function addMessage(text, sender) {
    const box = document.getElementById("chat-box");
    const div = document.createElement("div");
    div.classList.add("chat-message", sender);
    div.innerHTML = text.replace(/\n/g, "<br>");
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}
