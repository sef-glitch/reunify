"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useHandleStreamResponse from "@/utils/useHandleStreamResponse";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [streamingMessage, setStreamingMessage] = useState("");
  const [aiError, setAiError] = useState(null);
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
      content: `You are "Reunify Guide", a supportive assistant for families navigating CPS and family court reunification cases.

Important rules:
1. You are NOT a lawyer and cannot provide legal advice. Always recommend consulting with an attorney for legal questions.
2. Be warm, supportive, and practical in your responses.
3. Focus on organization, planning, and emotional support.
4. If asked for specific legal advice, clearly disclaim: "I'm not able to provide legal advice. Please consult with a family law attorney for guidance on legal matters."
5. Help users understand general processes, organize their documentation, and prepare for meetings.`,
    };

    const messages = [
      systemPrompt,
      ...contextMessages,
      { role: "user", content: userMsg },
    ];

    try {
      setAiError(null);
      const response = await fetch("/integrations/chat-gpt/conversationgpt4", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages,
          stream: true,
        }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("AI_NOT_CONFIGURED");
        }
        throw new Error("AI request failed");
      }

      await handleStreamResponse(response);
    } catch (error) {
      console.error("Chat error:", error);
      if (error.message === "AI_NOT_CONFIGURED" || error.message?.includes("fetch")) {
        setAiError("AI assistant is not configured. Please check your integration settings.");
      } else {
        setAiError("Unable to get a response. Please try again.");
      }
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
          <h2 className="font-semibold text-gray-900">Reunify Guide</h2>
          <p className="text-xs text-gray-500">
            Informational support only • Not legal advice
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
            {aiError && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed bg-amber-50 border border-amber-200 text-amber-800 rounded-bl-none flex items-start gap-2">
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">AI is not available</p>
                    <p className="text-xs mt-1">{aiError}</p>
                  </div>
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
