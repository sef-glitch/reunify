"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useHandleStreamResponse from "@/utils/useHandleStreamResponse";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [streamingMessage, setStreamingMessage] = useState("");
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: history, isLoading } = useQuery({
    queryKey: ["chat-history"],
    queryFn: () => fetch("/api/chat/history").then((res) => res.json()),
  });

  const saveMessage = useMutation({
    mutationFn: async ({ role, content }) => {
      await fetch("/api/chat/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, content }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-history"] });
    },
  });

  const handleFinish = async (content) => {
    await saveMessage.mutateAsync({ role: "assistant", content });
    setStreamingMessage("");
  };

  const handleStreamResponse = useHandleStreamResponse({
    onChunk: setStreamingMessage,
    onFinish: handleFinish,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput("");

    await saveMessage.mutateAsync({ role: "user", content: userMsg });

    const contextMessages =
      history && Array.isArray(history)
        ? history.slice(-5).map((m) => ({ role: m.role, content: m.content }))
        : [];

    const systemPrompt = {
      role: "system",
      content: `You are a helpful assistant for Reunify. Rules: 1. Not a lawyer. 2. Be supportive and practical. 3. If asked for legal advice, disclaim and refer to attorney.`,
    };

    const messages = [
      systemPrompt,
      ...contextMessages,
      { role: "user", content: userMsg },
    ];

    try {
      const response = await fetch("/integrations/chat-gpt/conversationgpt4", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages,
          stream: true,
        }),
      });

      if (!response.ok) throw new Error("AI request failed");

      await handleStreamResponse(response);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, streamingMessage]);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
          <Bot size={20} />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Reunify Assistant</h2>
          <p className="text-xs text-gray-500">
            Not legal advice • Automated support
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading ? (
          <div className="text-center text-gray-400 text-sm">
            Loading chat...
          </div>
        ) : (!history || history.length === 0) && !streamingMessage ? (
          <div className="text-center text-gray-400 text-sm py-10">
            <Bot size={48} className="mx-auto mb-4 text-gray-200" />
            <p>Ask me anything about your case, resources, or planning.</p>
          </div>
        ) : (
          <>
            {history?.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`
                  max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed
                  ${
                    msg.role === "user"
                      ? "bg-purple-600 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-800 rounded-bl-none"
                  }
                `}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {streamingMessage && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed bg-gray-100 text-gray-800 rounded-bl-none">
                  {streamingMessage}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="p-4 border-t border-gray-100">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || !!streamingMessage}
            className="p-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {streamingMessage ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Send size={20} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
