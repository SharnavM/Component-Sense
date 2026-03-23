import { useRef, useEffect, memo } from "react";
import { motion } from "framer-motion";
import AiResponse from "./AiResponse";

function TypingDots() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 0",
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="bounce-dot"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.45)",
            animationDelay: `${i * 0.15}s`,
          }}
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

  return <div style={{ whiteSpace: "pre-wrap" }}>{message.content}</div>;
});

function MessageBubble({ message, isStreaming, onStreamingEnd }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        gap: isUser ? 3 : 5,
        padding: "0 32px",
      }}
    >
      <span
        style={{
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.32)",
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          marginRight: isUser ? 18 : 0,
          marginLeft: !isUser ? 18 : 0,
        }}
      >
        {isUser ? "User" : "AI · with RAG"}
      </span>

      <div
        style={{
          width: isUser
            ? "min(0, calc(100vw - 64px))"
            : "min(72ch, calc(100vw - 64px))",
          minWidth: isUser && 0,
          padding: "14px 20px",
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          background: isUser ? "#1E1E20" : "transparent",
          border: isUser
            ? "1px solid rgba(255,255,255,0.07)"
            : "2px solid rgba(255,255,255,0.12)",
          color: "rgba(255,255,255,0.82)",
          fontSize: "14.5px",
          lineHeight: "1.7",
          fontFamily: '"Plus Jakarta Sans", sans-serif',
        }}
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
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 5,
        padding: "0 32px",
      }}
    >
      <span
        style={{
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.32)",
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          marginLeft: 18,
        }}
      >
        AI · with RAG
      </span>
      <div
        style={{
          padding: "14px 20px",
          borderRadius: "18px 18px 18px 4px",
          border: "2px solid rgba(255,255,255,0.12)",
        }}
      >
        <TypingDots />
      </div>
    </motion.div>
  );
}

export default function ChatMessages({ messages, isLoading, onStreamingEnd }) {
  const bottomRef = useRef(null);

  const lastMessage = messages[messages.length - 1];

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        paddingTop: "12px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          paddingBottom: "24px",
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
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

        <div ref={bottomRef} style={{ height: 1 }} />
      </div>
    </div>
  );
}
