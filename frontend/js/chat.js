document.addEventListener("DOMContentLoaded", () => {
    injectChatWidget();
});

async function injectChatWidget() {
    try {
        const response = await fetch("chat.html", { cache: "no-store" });

        if (!response.ok) {
            throw new Error(`Khong tai duoc chat widget: ${response.status}`);
        }

        const root = document.createElement("div");
        root.id = "veggie-chat-root";
        root.innerHTML = await response.text();
        document.body.appendChild(root);

        const widget = root.querySelector("[data-chat-widget]");
        if (!widget) {
            throw new Error("Khong tim thay chat widget trong chat.html");
        }

        initializeChatWidget(widget);
    } catch (error) {
        console.error("Khong khoi tao duoc Veggie chat:", error);
    }
}

function initializeChatWidget(widget) {
    const toggleButton = widget.querySelector("[data-chat-toggle]");
    const closeButton = widget.querySelector("[data-chat-close]");
    const panel = widget.querySelector("[data-chat-panel]");
    const form = widget.querySelector("[data-chat-form]");
    const input = widget.querySelector("[data-chat-input]");
    const submitButton = widget.querySelector("[data-chat-submit]");
    const log = widget.querySelector("[data-chat-log]");
    const status = widget.querySelector("[data-chat-status]");
    const suggestionButtons = widget.querySelectorAll("[data-chat-prompt]");

    if (!toggleButton || !closeButton || !panel || !form || !input || !submitButton || !log || !status) {
        console.error("Veggie chat dang thieu thanh phan can thiet.");
        return;
    }

    const state = {
        isOpen: false,
        isSending: false,
    };

    const setPanelState = (shouldOpen) => {
        state.isOpen = shouldOpen;
        panel.classList.toggle("is-hidden", !shouldOpen);
        panel.setAttribute("aria-hidden", String(!shouldOpen));
        toggleButton.setAttribute("aria-expanded", String(shouldOpen));

        if (shouldOpen) {
            requestAnimationFrame(() => {
                input.focus();
                scrollChatToBottom(log);
            });
        }
    };

    const setBusyState = (isBusy) => {
        state.isSending = isBusy;
        input.disabled = isBusy;
        submitButton.disabled = isBusy;
        toggleButton.disabled = false;
        status.textContent = isBusy ? "Veggie đang tìm thông tin..." : "Sẵn sàng hỗ trợ.";
    };

    toggleButton.addEventListener("click", () => {
        setPanelState(!state.isOpen);
    });

    closeButton.addEventListener("click", () => {
        setPanelState(false);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && state.isOpen) {
            setPanelState(false);
        }
    });

    input.addEventListener("input", () => {
        autoResizeTextarea(input);
    });

    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            form.requestSubmit();
        }
    });

    suggestionButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const prompt = button.dataset.chatPrompt?.trim();
            if (!prompt || state.isSending) {
                return;
            }

            setPanelState(true);
            input.value = prompt;
            autoResizeTextarea(input);
            form.requestSubmit();
        });
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const message = input.value.trim();
        if (!message || state.isSending) {
            return;
        }

        setPanelState(true);
        appendMessage(log, "user", message);
        input.value = "";
        autoResizeTextarea(input);

        const botReplyNode = appendMessage(log, "bot", "Veggie đang soạn câu trả lời...");
        setBusyState(true);

        try {
            const response = await sendChatRequest(message);
            const replyText = await streamResponseText(response, botReplyNode);

            if (!replyText.trim()) {
                botReplyNode.textContent = "Mình chưa lấy được nội dung phản hồi. Bạn thử hỏi lại giúp mình nhé.";
            }
        } catch (error) {
            console.error("Khong gui duoc tin nhan den Veggie chat:", error);
            botReplyNode.textContent = "Veggie tạm thời đang bận. Bạn thử lại sau ít phút nhé.";
            status.textContent = "Không kết nối được tới trợ lý.";
        } finally {
            setBusyState(false);
            scrollChatToBottom(log);
        }
    });
}

function autoResizeTextarea(input) {
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 132)}px`;
}

function appendMessage(log, role, content) {
    const article = document.createElement("article");
    article.className = `veggie-chat-message ${role === "user" ? "is-user" : "is-bot"}`;

    if (role === "bot") {
        const avatar = document.createElement("div");
        avatar.className = "veggie-chat-avatar";
        avatar.textContent = "V";
        article.appendChild(avatar);
    }

    const bubble = document.createElement("div");
    bubble.className = "veggie-chat-bubble";

    const paragraph = document.createElement("p");
    paragraph.textContent = content;
    bubble.appendChild(paragraph);

    article.appendChild(bubble);
    log.appendChild(article);
    scrollChatToBottom(log);
    return paragraph;
}

async function sendChatRequest(message) {
    const endpoints = resolveChatEndpoints();
    let lastError = null;

    for (const endpoint of endpoints) {
        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message }),
            });

            if (response.ok) {
                return response;
            }

            const errorText = await response.text();
            lastError = new Error(`API ${endpoint} tra ve ${response.status}: ${errorText}`);
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError || new Error("Khong tim thay endpoint chat phu hop.");
}

function resolveChatEndpoints() {
    const endpoints = [];
    const customEndpoint = window.VEGGIE_CHAT_ENDPOINT || document.body.dataset.chatEndpoint;

    if (customEndpoint) {
        endpoints.push(customEndpoint);
    }

    endpoints.push("/api/chat/chat");

    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        endpoints.push(`http://${window.location.hostname}:8000/chat`);
        endpoints.push("http://localhost:8000/chat");
        endpoints.push("http://127.0.0.1:8000/chat");
    }

    return [...new Set(endpoints)];
}

async function streamResponseText(response, outputNode) {
    if (!response.body) {
        const fallbackText = await response.text();
        outputNode.textContent = fallbackText.trim();
        return fallbackText;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullText = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }

        fullText += decoder.decode(value, { stream: true });
        outputNode.textContent = normalizeResponseText(fullText);
        scrollChatToBottom(outputNode.closest("[data-chat-log]"));
    }

    fullText += decoder.decode();
    outputNode.textContent = normalizeResponseText(fullText);
    return fullText;
}

function normalizeResponseText(text) {
    return text.replace(/\r\n/g, "\n").trim() || "Veggie đang soạn nội dung...";
}

function scrollChatToBottom(log) {
    if (!log) {
        return;
    }

    log.scrollTop = log.scrollHeight;
}
