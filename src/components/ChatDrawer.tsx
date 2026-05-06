import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, Minus, Phone, PhoneOff, Mic } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { sendMessage } from "../services/chat.service";
import Vapi from "@vapi-ai/web";

// ─── Vapi Setup ───────────────────────────────────────────────
const vapi = new Vapi("282f10a3-c964-4adb-9bd2-d52c1a7e7935");
const ASSISTANT_ID = "8764ca70-106c-482d-bd4a-323b8d290681";

// ─── Types ────────────────────────────────────────────────────
interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
}

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
}

const quickQuestions = [
  "What courses do you offer?",
  "Tell me about placements",
  "What is the fee structure?",
  "How to apply for admissions?",
];

export default function ChatDrawer({ open, onClose }: ChatDrawerProps) {
  const { user } = useAuth();

  // ── Text chat state ──
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: `Hi ${user?.name?.split(" ")[0] || "there"}! 👋  Iam your personal Aisstant . Ask me anything about courses, fees, admissions, or campus life. You can also click 📞 to talk to me directly!`,
      sender: "bot",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Voice call state ──
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isSpeaking, setIsSpeaking]       = useState(false);
  const [isConnecting, setIsConnecting]   = useState(false);

  // ── Auto-scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Vapi event listeners ──
  useEffect(() => {
    vapi.on("call-start", () => {
      setIsConnecting(false);
      setIsVoiceActive(true);
      // Add a bot message when voice call starts
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: "🎙️ Voice call started! I'm listening...",
          sender: "bot",
        },
      ]);
    });

    vapi.on("call-end", () => {
      setIsVoiceActive(false);
      setIsSpeaking(false);
      setIsConnecting(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: "📞 Voice call ended. Feel free to keep chatting here!",
          sender: "bot",
        },
      ]);
    });

    vapi.on("speech-start", () => setIsSpeaking(true));
    vapi.on("speech-end",   () => setIsSpeaking(false));

    vapi.on("error", (err) => {
      console.error("Vapi error:", err);
      setIsVoiceActive(false);
      setIsConnecting(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: "⚠️ Voice call failed. Please check your microphone and try again.",
          sender: "bot",
        },
      ]);
    });

    return () => {
      vapi.removeAllListeners();
    };
  }, []);

  // ── Toggle voice call ──
  const toggleVoice = async () => {
    if (isVoiceActive) {
      vapi.stop();
    } else {
      setIsConnecting(true);
      vapi.start(ASSISTANT_ID);
    }
  };

  // ── Send text message ──
  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || sending) return;

    const userMsg: Message = { id: Date.now(), text: messageText, sender: "user" };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const data = await sendMessage(messageText);
      const botMsg: Message = {
        id: Date.now() + 1,
        text: data.message,
        sender: "bot",
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errorMsg: Message = {
        id: Date.now() + 1,
        text: "Sorry, something went wrong. Please try again.",
        sender: "bot",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">

      {/* ── Header ── */}
      <div className="bg-maroon px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">EduReach Bot</h3>
            <p className="text-white/70 text-xs">
              {isConnecting
                ? "Connecting call..."
                : isVoiceActive
                ? isSpeaking
                  ? "🔊 Speaking..."
                  : "🎙️ Listening..."
                : "Ask me anything"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Voice Call Button */}
          <button
            onClick={toggleVoice}
            disabled={isConnecting}
            title={isVoiceActive ? "End voice call" : "Start voice call"}
            className={`p-1.5 rounded-full transition-all duration-200 ${
              isVoiceActive
                ? "bg-red-500 text-white animate-pulse"
                : isConnecting
                ? "bg-white/20 text-white/50 cursor-not-allowed"
                : "text-white/70 hover:text-white hover:bg-white/20"
            }`}
          >
            {isConnecting ? (
              <Mic className="w-4 h-4 animate-pulse" />
            ) : isVoiceActive ? (
              <PhoneOff className="w-4 h-4" />
            ) : (
              <Phone className="w-4 h-4" />
            )}
          </button>

          {/* Minimize */}
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 transition-colors duration-200"
          >
            <Minus className="w-4 h-4" />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 transition-colors duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Voice Active Banner ── */}
      {isVoiceActive && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-2 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <p className="text-green-700 text-xs font-medium">
            Voice call active — Narendra AI is listening
          </p>
          <button
            onClick={toggleVoice}
            className="ml-auto text-red-500 text-xs underline hover:text-red-700"
          >
            End call
          </button>
        </div>
      )}

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.sender === "bot" && (
              <div className="w-6 h-6 bg-maroon rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-3 h-3 text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                msg.sender === "user"
                  ? "bg-maroon text-white rounded-br-sm"
                  : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm"
              }`}
            >
              {msg.text}
            </div>
            {msg.sender === "user" && (
              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-3 h-3 text-gray-600" />
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {sending && (
          <div className="flex items-end gap-2">
            <div className="w-6 h-6 bg-maroon rounded-full flex items-center justify-center">
              <Bot className="w-3 h-3 text-white" />
            </div>
            <div className="bg-white border border-gray-200 px-3 py-2 rounded-2xl rounded-bl-sm shadow-sm">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Quick Questions (only on first message) ── */}
      {messages.length === 1 && (
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
          <div className="flex flex-wrap gap-1.5">
            {quickQuestions.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="text-xs px-2.5 py-1 bg-white border border-maroon/20 text-maroon rounded-full hover:bg-maroon hover:text-white transition-colors duration-200"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input ── */}
      <div className="bg-white border-t border-gray-200 p-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isVoiceActive ? "Voice call active — or type here..." : "Ask a question..."}
            disabled={sending}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-maroon text-sm disabled:opacity-50 transition-colors duration-200"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || sending}
            className="w-9 h-9 bg-maroon text-white rounded-lg flex items-center justify-center hover:bg-maroon-dark disabled:opacity-50 transition-colors duration-200"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}