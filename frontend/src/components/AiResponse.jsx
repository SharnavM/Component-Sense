"use client";

import React, { useEffect, useState, useRef, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { streamText } from "../utils/string";

function AiResponse({
  content,
  isStreaming = true,
  cps = 90,
  onStreamingEnd,
  onStreamingStart,
}) {
  const [displayedText, setDisplayedText] = useState("");

  const onStreamingEndRef = useRef(onStreamingEnd);
  const onStreamingStartRef = useRef(onStreamingStart);

  useEffect(() => {
    onStreamingEndRef.current = onStreamingEnd;
  }, [onStreamingEnd]);

  useEffect(() => {
    onStreamingStartRef.current = onStreamingStart;
  }, [onStreamingStart]);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedText(content);
      return;
    }

    setDisplayedText("");

    return streamText(
      content,
      cps,
      (partial) => setDisplayedText(partial),
      () => onStreamingEndRef.current?.(),
      () => onStreamingStartRef.current?.(),
    );
  }, [content, isStreaming, cps]);

  return (
    <div className="agent-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true }]]}
      >
        {displayedText}
      </ReactMarkdown>
    </div>
  );
}

export default memo(AiResponse);