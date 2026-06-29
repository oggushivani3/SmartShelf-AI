import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, Sparkles, Clock } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { recipes } from "@/lib/mock-data";
import { useItems } from "@/lib/use-items";

export const Route = createFileRoute("/assistant")({
  head: () => ({ meta: [{ title: "AI Chef — SmartShelf AI" }] }),
  component: Assistant,
});

type Msg = { id: string; from: "user" | "ai"; text: string; recipes?: typeof recipes };

function Assistant() {
  const items = useItems();
  const expiringSoon = items.filter((i) => i.daysLeft <= 7).map((i) => i.name);
  const seed: Msg[] = [
    {
      id: "1",
      from: "ai",
      text:
        expiringSoon.length === 0
          ? "Hi! 👋 Add items to your inventory and I'll suggest recipes based on what's expiring soon."
          : `Hi Alex! 👋 I noticed you have ${expiringSoon.slice(0, 3).join(", ")} expiring soon. Want recipe ideas?`,
    },
  ];
  const [messages, setMessages] = useState<Msg[]>(seed);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = (text?: string) => {
    const content = (text ?? input).trim();
    if (!content) return;
    setMessages((m) => [...m, { id: crypto.randomUUID(), from: "user", text: content }]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          from: "ai",
          text: `Great question! Here are a few recipes you can make with your near-expiry items:`,
          recipes,
        },
      ]);
    }, 700);
  };

  const prompts = [
    "What can I cook with near-expiry items?",
    "Quick breakfast ideas?",
    "Which items should I use first?",
  ];

  return (
    <AppShell>
      <PageHeader
        title="AI Chef"
        subtitle="Get personalised recipe ideas based on what's on your shelf."
        action={
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-beauty/15 border border-beauty/30 text-xs font-semibold text-beauty">
            <Sparkles className="size-3.5" /> Online
          </span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Chat */}
        <div className="glass-card rounded-3xl flex flex-col h-[640px] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[80%] ${m.from === "user" ? "" : "flex gap-3"}`}>
                  {m.from === "ai" && (
                    <div className="size-8 shrink-0 rounded-full bg-gradient-to-br from-beauty to-meds grid place-items-center">
                      <Bot className="size-4 text-white" />
                    </div>
                  )}
                  <div className="space-y-3">
                    <div
                      className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        m.from === "user"
                          ? "bg-foreground text-background rounded-br-sm"
                          : "bg-white/5 border border-white/10 text-foreground rounded-tl-sm"
                      }`}
                    >
                      {m.text}
                    </div>
                    {m.recipes && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {m.recipes.map((r) => (
                          <div
                            key={r.id}
                            className="rounded-2xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <div className="text-3xl mb-2">{r.emoji}</div>
                            <h4 className="font-display font-semibold text-foreground text-sm mb-1">
                              {r.name}
                            </h4>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                              <Clock className="size-3" />
                              {r.time} • {r.difficulty}
                            </p>
                            <p className="text-[11px] text-beauty mt-1.5">
                              Uses: {r.using.join(", ")}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Composer */}
          <div className="border-t border-white/5 p-3">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-center bg-white/5 rounded-2xl p-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask anything about your shelf..."
                className="bg-transparent outline-none px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground min-w-0"
              />
              <button
                onClick={() => send()}
                className="size-10 grid place-items-center rounded-xl bg-foreground text-background hover:scale-105 transition-transform"
                aria-label="Send"
              >
                <Send className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Suggestions panel */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Quick Prompts
            </h4>
            <div className="space-y-2">
              {prompts.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="w-full text-left px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-foreground transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="glass-card rounded-2xl p-5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-beauty mb-3">
              Use first
            </h4>
            <ul className="space-y-2 text-sm">
              {expiringSoon.slice(0, 5).map((n) => (
                <li key={n} className="flex items-center gap-2 text-foreground">
                  <span className="size-1.5 rounded-full bg-danger" /> {n}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
