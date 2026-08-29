import { useState } from "react";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Message = {
  sender: "bot" | "user";
  text: string;
};

type PredictionResponse = {
  label: string;
  confidence: number;
};

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "Hi! 👋 I'm the MotorMate Assistant. How can I help you?",
    },
  ]);

  const sendMessage = async () => {
    const message = input.trim();

    if (!message || loading) return;

    setMessages((current) => [...current, { sender: "user", text: message }]);
    setInput("");
    setLoading(true);

    try {
      const prediction = await apiFetch<PredictionResponse>("/api/ai/predict", {
        method: "POST",
        body: JSON.stringify({ text: message }),
      });
      const serviceLabel = prediction.label.replaceAll("_", " ");
      const confidence = Math.round(prediction.confidence * 100);
      const article = /^[aeiou]/i.test(serviceLabel) ? "an" : "a";
      setMessages((current) => [
        ...current,
        {
          sender: "bot",
          text: `This sounds like ${article} ${serviceLabel} issue. I am ${confidence}% confident.`,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          sender: "bot",
          text: "I cannot reach the MotorMate AI service right now. Please try again shortly.",
        },
      ]);
    } finally {
      setLoading(false);
    }
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
              disabled={loading}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  sendMessage();
                }
              }}
              placeholder={loading ? "Thinking..." : "Ask something..."}
              className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            />

            <button
              type="button"
              onClick={sendMessage}
              disabled={loading}
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