import { useRef, memo } from "react";
import { motion } from "framer-motion";
import AiResponse from "./AiResponse";

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="bounce-dot w-1.5 h-1.5 rounded-full bg-white/45"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

const MessageContent = memo(function MessageContent({
  message,
  isStreaming,
  onStreamingEnd,
}) {
  if (message.role === "assistant") {
    return (
      <AiResponse
        content={message.content}
        isStreaming={isStreaming}
        onStreamingEnd={onStreamingEnd}
      />
    );
  }

  return <div className="whitespace-pre-wrap break-words">{message.content}</div>;
});

function MessageBubble({ message, isStreaming, onStreamingEnd }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className={`flex flex-col px-4 md:px-8 ${isUser ? "items-end gap-[3px]" : "items-start gap-1"
        }`}
    >
      <span className={`text-[11px] font-semibold tracking-wide uppercase text-white/30 font-jakarta ${isUser ? "mr-[15px]" : "ml-[15px]"}`}>
        {isUser ? "User" : "AI · with RAG"}
      </span>

      <div
        className={`w-fit max-w-full lg:max-w-[72ch] px-4 py-3 md:px-[20px] md:py-[14px] text-[14.5px] leading-relaxed font-jakarta overflow-hidden break-words ${isUser
            ? "rounded-[18px_18px_4px_18px] bg-[#1E1E20] text-white/80 border border-white/5"
            : "rounded-[18px_18px_18px_4px] bg-transparent text-white/80 border-2 border-white/10"
          }`}
      >
        <MessageContent
          message={message}
          isStreaming={isStreaming}
          onStreamingEnd={onStreamingEnd}
        />
      </div>
    </motion.div>
  );
}

function LoadingBubble() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="flex flex-col items-start gap-1 px-4 md:px-8"
    >
      <span className="text-[11px] font-semibold tracking-wide uppercase text-white/30 font-jakarta ml-[18px]">
        AI · with RAG
      </span>
      <div className="px-5 py-[14px] rounded-[18px_18px_18px_4px] border-2 border-white/10">
        <TypingDots />
      </div>
    </motion.div>
  );
}

export default function ChatMessages({ messages, isLoading, onStreamingEnd }) {
  const bottomRef = useRef(null);
  const lastMessage = messages[messages.length - 1];

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden pt-3">
      <div className="flex flex-col gap-6 pb-6 max-w-[900px] mx-auto w-full">
        {messages.map((msg, i) => {
          const messageKey = msg.id ?? `${msg.role}-${i}`;
          const shouldStream =
            msg.role === "assistant" && msg._animate === true;
          return (
            <MessageBubble
              key={messageKey}
              message={msg}
              isStreaming={shouldStream}
              onStreamingEnd={
                shouldStream ? () => onStreamingEnd?.(messageKey) : undefined
              }
            />
          );
        })}
        {isLoading && lastMessage?.role !== "assistant" && (
          <LoadingBubble key="loading" />
        )}

        <div ref={bottomRef} className="h-px" />
      </div>
    </div>
  );
}
