import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  X,
  Send,
  ChefHat,
  MessageSquare,
  Bot,
  User as UserIcon,
  Minimize2,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface Message {
  id: string;
  sender: "user" | "chef";
  text: string;
  time: string;
}

interface AIChefAssistantProps {
  userId?: string;
  inventory?: Array<{ name: string; daysLeft: number }>;
  initialItemQuery?: string | null;
  onClearInitialQuery?: () => void;
}

export function AIChefAssistant({
  userId,
  inventory = [],
  initialItemQuery,
  onClearInitialQuery,
}: AIChefAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "chef",
      text: "👋 Hi! I'm Chef Remi, your AI kitchen & zero-waste assistant. Ask me anything about storage tricks, freshness checks, or what to cook with your expiring ingredients!",
      time: "Just now",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Handle triggered query from individual food item card
  useEffect(() => {
    if (initialItemQuery) {
      setIsOpen(true);
      const query = `How should I best store or cook my ${initialItemQuery}?`;
      sendMessage(query);
      onClearInitialQuery?.();
    }
  }, [initialItemQuery]);

  const sendMessage = async (messageText: string) => {
    const text = messageText.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: "user-" + Date.now(),
      sender: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          userId,
          items: inventory,
        }),
      });

      if (!response.ok) throw new Error("Assistant response failed");

      const data = await response.json();
      const chefReply: Message = {
        id: "chef-" + Date.now(),
        sender: "chef",
        text: data.reply || "I'm here to help you reduce food waste! Ask me another question.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, chefReply]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          sender: "chef",
          text: "I encountered a hiccup connecting to the kitchen knowledge engine. Please try again!",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "What should I cook tonight?",
    "Can I freeze unopened milk?",
    "How to keep fresh veggies crisp?",
  ];

  return (
    <>
      {/* Floating launcher button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer font-medium text-sm group"
          aria-label="Open AI Chef Assistant"
        >
          <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
            <ChefHat className="h-4 w-4" />
          </div>
          <span>Ask AI Chef</span>
          <span className="text-[10px] uppercase font-bold tracking-wider bg-white/25 px-1.5 py-0.5 rounded-full">
            AI
          </span>
        </button>
      )}

      {/* Floating chat window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[400px] h-[550px] max-h-[85vh] bg-card border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header */}
          <div className="p-3.5 px-4 bg-muted/40 border-b flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <ChefHat className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-sm">Chef Remi</h3>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-[11px] text-muted-foreground">Zero-Waste AI Kitchen Guide</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => setIsOpen(false)}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages scroll area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${
                  m.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.sender === "chef" && (
                  <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl p-3 leading-relaxed ${
                    m.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-br-xs"
                      : "bg-muted/70 text-foreground border border-border/50 rounded-bl-xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <span
                    className={`block text-[9px] mt-1 ${
                      m.sender === "user"
                        ? "text-primary-foreground/75 text-right"
                        : "text-muted-foreground"
                    }`}
                  >
                    {m.time}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="bg-muted/70 border border-border/50 rounded-2xl rounded-bl-xs p-3 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts */}
          <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => sendMessage(prompt)}
                className="whitespace-nowrap text-[11px] bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-full border border-border/60 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="p-3 border-t bg-card flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Chef Remi..."
              className="text-xs h-9 rounded-xl bg-background"
              disabled={loading}
            />
            <Button
              type="submit"
              size="icon"
              className="h-9 w-9 rounded-xl flex-shrink-0"
              disabled={!input.trim() || loading}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}

