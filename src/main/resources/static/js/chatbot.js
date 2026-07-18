(function () {
  const lasChatHistory = [];
  let lasChatSending = false;

  window.toggleLasChatbox = function () {
    const chatbox = document.getElementById("las-chatbox-window");
    const input = document.getElementById("las-chat-user-input");

    if (!chatbox) return;

    const isOpening = chatbox.style.display !== "flex";
    chatbox.style.display = isOpening ? "flex" : "none";

    if (isOpening && input) {
      setTimeout(() => input.focus(), 100);
    }
  };

  window.checkChatSendMessageKey = function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      sendChatMessageToServer();
    }
  };

  function appendLasChatMessage(text, fromUser) {
    const zone = document.getElementById(
      "las-chat-messages-zone"
    );

    if (!zone) return null;

    const message = document.createElement("div");

    message.textContent = text;

    message.style.cssText = fromUser
      ? `
        align-self:flex-end;
        background:#ff6b35;
        color:white;
        padding:10px 14px;
        border-radius:8px;
        max-width:85%;
        font-size:13.5px;
        line-height:1.4;
        white-space:pre-wrap;
      `
      : `
        align-self:flex-start;
        background:#0b0b0e;
        color:#e4e4e7;
        padding:10px 14px;
        border-radius:8px;
        max-width:85%;
        font-size:13.5px;
        line-height:1.4;
        border-left:3px solid #ff6b35;
        white-space:pre-wrap;
      `;

    zone.appendChild(message);
    zone.scrollTop = zone.scrollHeight;

    return message;
  }

  window.sendChatMessageToServer = async function () {
    if (lasChatSending) return;

    const input = document.getElementById(
      "las-chat-user-input"
    );

    if (!input) return;

    const userMessage = input.value.trim();

    if (!userMessage) return;

    const previousHistory = lasChatHistory.slice(-8);

    appendLasChatMessage(userMessage, true);

    lasChatHistory.push({
      role: "user",
      text: userMessage
    });

    input.value = "";
    lasChatSending = true;
    input.disabled = true;

    const loadingMessage = appendLasChatMessage(
      "LAS đang suy nghĩ...",
      false
    );

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userMessage,
          history: previousHistory
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Không thể gửi câu hỏi."
        );
      }

      if (loadingMessage) loadingMessage.remove();

      const reply =
        result.reply || "Tôi chưa có câu trả lời.";

      appendLasChatMessage(reply, false);

      lasChatHistory.push({
        role: "model",
        text: reply
      });

    } catch (error) {
      if (loadingMessage) loadingMessage.remove();

      appendLasChatMessage(
        "Không thể kết nối trợ lý AI: " + error.message,
        false
      );

    } finally {
      lasChatSending = false;
      input.disabled = false;
      input.focus();
    }
  };
})();