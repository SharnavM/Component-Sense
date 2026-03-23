import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LibraryTabs from "../components/LibraryTabs";
import AIInput from "../components/AIInput";
import ExampleChips from "../components/ExampleChips";
import ChatMessages from "../components/ChatMessages";
import { useSidebar } from "../context/SidebarContext";
import {
  useNavigate,
  useOutletContext,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useChat } from "../context/ChatContext";
import { useSettings } from "../context/SettingsContext";

export const LIBRARIES = {
  mui: {
    id: "mui",
    label: "Material UI",
    indicatorBg: "#0073e6",
    subtext: "Ask any question related to the Material UI library",
    examples: [
      "How to customise MUI Button styles?",
      "MUI DataGrid with server-side pagination",
      "Implement a global MUI dark theme",
      "MUI Autocomplete with async search",
    ],
  },
  rnp: {
    id: "rnp",
    label: "React Native Paper",
    indicatorBg: "#7539cb",
    subtext: "Explore components and patterns for React Native Paper",
    examples: [
      "Paper Appbar with back action",
      "Paper DataTable with sorting & filtering",
      "Paper Snackbar and Toast usage",
      "How to use Paper Portal and Modal?",
    ],
  },
};


const normaliseMessages = (msgs = [], chatKey = "ephemeral") =>
  msgs.map((msg, index) => ({
    ...msg,
    id: msg.id ?? `${chatKey}-${index}-${msg.role}`,
    _animate: false,
  }));

const pageVariants = {
  initial: (isChat) => ({
    y: isChat ? "100%" : "-100%",
  }),
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: (isChat) => ({
    y: isChat ? "100%" : "-100%",
    transition: {
      duration: 0.45,
      ease: [0.4, 0, 0.2, 1],
    },
  }),
};


export default function HomePage() {
  const [activeLib, setActiveLib] = useState("mui");
  const [chatStarted, setChatStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isConnected: isConnectedToBackend } = useOutletContext();
  const [isInitialLoad, setIsInitialLoad] = useState(false);

  const lib = LIBRARIES[activeLib];
  const { sidebarW } = useSidebar();
  const navigate = useNavigate();
  const { chatId } = useParams();

  const { createChat, addMessage, loadChat, clearActiveChat } = useChat();
  const { settings } = useSettings();

  const [searchParams, setSearchParams] = useSearchParams();

  const hydratedChatRef = useRef(null);

  const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    console.log("Child sees isConnected:", isConnectedToBackend);
  }, [isConnectedToBackend]);

  useEffect(() => {
    if (chatId) {
      if (hydratedChatRef.current === chatId) return;

      const chat = loadChat(chatId);
      console.log(chatId, chat);

      if (chat) {
        hydratedChatRef.current = chatId;
        setActiveLib(chat.lib === "mui" ? "mui" : "rnp");
        setMessages(normaliseMessages(chat.messages, chatId));
        setIsInitialLoad(true);

        if (!chatStarted) {
          const timer = setTimeout(() => {
            setChatStarted(true);
          }, 375);
          return () => clearTimeout(timer);
        } else {
          setChatStarted(true);
        }
      } else {
        navigate("/", { replace: true });
      }
    } else {
      hydratedChatRef.current = null;

      const isEphemeralChat = searchParams.get("chat") === "true";

      if (isEphemeralChat && !chatStarted) {
        setChatStarted(true);
      } else if (!isEphemeralChat) {
        setChatStarted(false);
        setMessages([]);
        clearActiveChat();
      }
    }
  }, [chatId, searchParams, loadChat, clearActiveChat, navigate, chatStarted]);

  const handleSubmit = useCallback(
    async (query) => {
      if (!query.trim() || isLoading) return;

      /* if (!isConnectedToBackend) {
        alert("Not connected to Backend");
        return;
      } */

      const newUserMsg = {
        id: crypto.randomUUID(),
        role: "user",
        content: query,
      };

      let currentChatId = chatId;

      if (!chatId) {
        setIsInitialLoad(false);

        if (settings.saveChatsToStorage) {
          const newId = createChat(query, activeLib);
          currentChatId = newId;
          navigate(`/chat/${newId}`);
        } else {
          setChatStarted(true);
          searchParams.set("chat", "true");
          setSearchParams(searchParams);
          setMessages([newUserMsg]);
        }
      } else if (chatId) {
        setIsInitialLoad(false);
        addMessage(chatId, newUserMsg);
        setMessages((prev) => [...prev, newUserMsg]);
      } else {
        setIsInitialLoad(false);
        setMessages((prev) => [...prev, newUserMsg]);
      }

      setIsLoading(true);

      let savedAssistantMsg;
      try {
        const data = {
          query,
          library: activeLib === "rnp" ? "rn-paper" : activeLib,
        };

        const resp = await fetch(`${BACKEND_URL}/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const body = await resp.json();

        if (!resp.ok) {
          if (resp.status === 429) {
            const retryAfter = resp.headers.get("Retry-After");
            console.log(retryAfter);
            savedAssistantMsg = {
              id: crypto.randomUUID(),
              role: "assistant",
              content: `${body.detail || "Too many requests"}${retryAfter ? ` Try again in ${retryAfter}s.` : ""
                }`,
            };

            console.log("Rate limited:", savedAssistantMsg);
          } else
            throw new Error(
              body.detail || `Request failed with ${resp.status}`,
            );
        } else {
          savedAssistantMsg = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: body.answer ?? body.detail,
          };
        }
        console.log(savedAssistantMsg);
      } catch (err) {
        console.error("Fetch error:", err);

        savedAssistantMsg = {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Could not reach server. Please try again.\n\n" + err.toString(),
        };
      }

      setMessages((prev) => [
        ...prev,
        { ...savedAssistantMsg, _animate: true },
      ]);

      if (currentChatId) {
        addMessage(currentChatId, savedAssistantMsg);
      }

      setIsLoading(false);
    },
    [
      isLoading,
      chatId,
      searchParams,
      settings.saveChatsToStorage,
      activeLib,
      lib.label,
      navigate,
      createChat,
      addMessage,
      setSearchParams,
    ],
  );

  return (
    <>
      <motion.div
        style={{ position: "fixed", inset: 0, zIndex: 0 }}
        animate={{ backgroundColor: chatStarted ? "#0A0A0A" : "#f65294" }}
        initial={{ backgroundColor: "#f65294" }}
        transition={{ duration: 0.72, ease: [0.4, 0, 0.2, 1] }}
      />

      <motion.main
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          flex: 1,
          height: "100vh",
          overflow: "hidden",
        }}
        animate={{ marginLeft: sidebarW }}
        transition={{
          duration: 0.45,
          type: "spring",
          stiffness: 340,
          damping: 32,
        }}
      >
        <motion.div
          style={{
            position: "fixed",
            top: 24,
            right: 0,
            zIndex: 50,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
            left: sidebarW,
          }}
          initial={{ y: -56, opacity: 0 }}
          animate={{ y: 0, opacity: 1, left: sidebarW }}
          transition={{
            y: { duration: 0.45, type: "spring", stiffness: 380, damping: 32 },
            opacity: { duration: 0.28, ease: "easeOut" },
            left: { type: "spring", stiffness: 340, damping: 32 },
          }}
        >
          <div style={{ pointerEvents: "auto" }}>
            <LibraryTabs
              tabs={LIBRARIES}
              active={activeLib}
              onChange={setActiveLib}
              chatStarted={chatStarted}
            />
          </div>
        </motion.div>

        <div
          style={{
            position: "relative",
            flex: 1,
            overflow: chatStarted ? "visible" : "hidden",
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {!chatStarted ? (
              <motion.div
                key="landing"
                custom={false}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "80px 24px 32px",
                }}
              >
                <h1
                  style={{
                    fontFamily: "Bricolage Grotesque, sans-serif",
                    fontSize: "clamp(3em, 6.25vw, 4.68rem)",
                    fontWeight: 800,
                    color: "#0A0A0A",
                    margin: "0 0 14px",
                    lineHeight: 1.1,
                    letterSpacing: "-0.02em",
                    textAlign: "center",
                  }}
                >
                  How can I help you today?
                </h1>

                <AnimatePresence mode="wait">
                  <motion.p
                    key={activeLib + "-sub"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    style={{
                      fontFamily: '"Plus Jakarta Sans", sans-serif',
                      fontSize: "1.1rem",
                      color: "rgba(0,0,0,0.52)",
                      margin: "0 0 48px",
                      lineHeight: 1.5,
                      textAlign: "center",
                    }}
                  >
                    {lib.subtext}
                  </motion.p>
                </AnimatePresence>

                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.38,
                    delay: 0.1,
                    ease: "easeOut",
                  }}
                  style={{ width: "100%", maxWidth: 672 }}
                >
                  <AIInput
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                    chatStarted={false}
                  />
                </motion.div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeLib + "-chips"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.28, delay: 0.1 }}
                    style={{ width: "100%", maxWidth: 672, marginTop: 20 }}
                  >
                    <ExampleChips
                      examples={lib.examples}
                      onSelect={handleSubmit}
                    />
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                custom={true}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  paddingTop: 80,
                }}
              >
                <div
                  className="chat-container"
                  key={chatId || "ephemeral"}
                  style={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: "auto",
                    paddingBottom: 100,
                  }}
                >
                  <ChatMessages
                    messages={messages}
                    isLoading={isLoading}
                    libLabel={lib.label}
                    onStreamingEnd={
                      () => { }
                    }
                  />
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.28,
                    delay: 0.18,
                    ease: "easeOut",
                  }}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: "flex",
                    justifyContent: "center",
                    padding: "20px 0 22px",
                    pointerEvents: "none",
                    zIndex: 20,
                    background: "#0A0A0A",
                  }}
                >
                  <div
                    style={{
                      width: "min(672px, calc(100vw - 80px))",
                      pointerEvents: "auto",
                    }}
                  >
                    <AIInput
                      onSubmit={handleSubmit}
                      isLoading={isLoading}
                      chatStarted={true}
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </motion.main>
    </>
  );
}
