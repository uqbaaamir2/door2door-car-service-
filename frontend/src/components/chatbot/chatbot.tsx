import { useState } from "react";
import { Bot, MessageCircle, Send, X } from "lucide-react";

type Message = {
  sender: "bot" | "user";
  text: string;
};

const getBotReply = (message: string) => {
  const text = message.toLowerCase();

  if (text.includes("service") || text.includes("services")) {
    return "MotorMate provides car repair, car washing, oil change, inspection, and other door-to-door car services.";
  }

  if (text.includes("oil")) {
    return "Yes! MotorMate provides oil change services. You can book an oil change through our Book Service option.";
  }

  if (text.includes("wash") || text.includes("washing")) {
    return "Yes, we provide car washing services at your location.";
  }

  if (text.includes("book") || text.includes("booking")) {
    return "You can book a service by clicking the 'Book Service' button on the website.";
  }

  if (text.includes("contact") || text.includes("phone")) {
    return "You can contact MotorMate through the contact information provided on our website.";
  }

  if (text.includes("hello") || text.includes("hi") || text.includes("hey")) {
    return "Hello! 👋 Welcome to MotorMate. How can I help you today?";
  }

  return "I'm here to help with MotorMate services, bookings, oil changes, car washing, and general questions. What would you like to know?";
};

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "Hi! 👋 I'm the MotorMate Assistant. How can I help you?",
    },
  ]);

  const sendMessage = () => {
    const message = input.trim();

    if (!message) return;

    setMessages((current) => [
      ...current,
      { sender: "user", text: message },
      { sender: "bot", text: getBotReply(message) },
    ]);

    setInput("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[60] grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
        aria-label="Open MotorMate chatbot"
      >
        <MessageCircle className="size-6" />
      </button>

      {open && (
        <div className="fixed bottom-6 right-6 z-[70] flex h-[500px] w-[360px] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
          <div className="flex items-center justify-between bg-primary px-4 py-4 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Bot className="size-5" />
              <div>
                <p className="font-semibold">MotorMate Assistant</p>
                <p className="text-xs opacity-80">How can we help?</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 hover:bg-white/10"
              aria-label="Close chatbot"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    message.sender === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 border-t border-border p-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  sendMessage();
                }
              }}
              placeholder="Ask something..."
              className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            />

            <button
              type="button"
              onClick={sendMessage}
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"
              aria-label="Send message"
            >
              <Send className="size-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}