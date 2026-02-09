"use client";
import React, { useEffect, useRef, useState } from "react";

async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...opts,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok) {
    const errMsg = data?.error || data?.message || text || "Unknown error";
    throw new Error(`${res.status}: ${errMsg}`);
  }
  return data;
}

export default function ChatPage() {
  const [configured, setConfigured] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi — I'm Reunify Guide. I can help you organize your case and plan next steps. I'm not a lawyer, and this isn't legal advice.",
    },
  ]);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const cfg = await fetchJSON("/api/chat/config");
        setConfigured(Boolean(cfg.configured));
      } catch {
        setConfigured(false);
      } finally {
        setConfigLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;

    setError("");
    setSending(true);
    setInput("");

    setMessages((m) => [...m, { role: "user", content: text }]);

    try {
      const data = await fetchJSON("/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: text, case_id: null }),
      });
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setError(e.message || "Chat failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3 p-4">
      <div>
        <div className="text-xl font-semibold">Reunify Guide</div>
        <div className="text-sm text-gray-600">
          Informational support only — not legal advice.
        </div>
      </div>

      {configLoading ? null : !configured ? (
        <div className="rounded border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
          AI is not configured. Add <code>OPENAI_API_KEY</code> to{" "}
          <code>apps/web/.env.local</code> and restart the server.
        </div>
      ) : null}

      <div className="flex-1 space-y-2 overflow-auto rounded border bg-white p-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <div
              className={[
                "inline-block max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm",
                m.role === "user"
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-900",
              ].join(" ")}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending ? <div className="text-sm text-gray-500">Thinking…</div> : null}
        <div ref={bottomRef} />
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex gap-2">
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          placeholder="Ask a question…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          disabled={sending}
        />
        <button
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          onClick={send}
          disabled={sending || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
