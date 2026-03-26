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
      "DataGrid with server-side pagination",
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
  }, [isConnectedToBackend]);

  useEffect(() => {
    if (chatId) {
      if (hydratedChatRef.current === chatId) return;

      const chat = loadChat(chatId);

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
            savedAssistantMsg = {
              id: crypto.randomUUID(),
              role: "assistant",
              content: `${body.detail || "Too many requests"}${retryAfter ? ` Try again in ${retryAfter}s.` : ""
                }`,
            };
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
        className="fixed inset-0 z-0"
        animate={{ backgroundColor: chatStarted ? "#0A0A0A" : "#f65294" }}
        initial={{ backgroundColor: "#f65294" }}
        transition={{ duration: 0.72, ease: [0.4, 0, 0.2, 1] }}
      />

      <motion.main
        className="relative z-10 flex flex-col flex-1 h-[100dvh] overflow-hidden"
        animate={{ marginLeft: sidebarW }}
        transition={{
          duration: 0.45,
          type: "spring",
          stiffness: 340,
          damping: 32,
        }}
      >
        <motion.div
          className="fixed top-16 md:top-6 right-0 z-50 flex justify-center pointer-events-none"
          style={{ left: sidebarW }}
          initial={{ y: -56, opacity: 0 }}
          animate={{ y: 0, opacity: 1, left: sidebarW }}
          transition={{
            y: { duration: 0.45, type: "spring", stiffness: 380, damping: 32 },
            opacity: { duration: 0.28, ease: "easeOut" },
            left: { type: "spring", stiffness: 340, damping: 32 },
          }}
        >
          <div className="pointer-events-auto">
            <LibraryTabs
              tabs={LIBRARIES}
              active={activeLib}
              onChange={setActiveLib}
              chatStarted={chatStarted}
            />
          </div>
        </motion.div>

        <div
          className={`relative flex-1 ${chatStarted ? "overflow-visible" : "overflow-y-auto overflow-x-hidden"}`}
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
                className="absolute inset-x-0 top-0 min-h-full flex flex-col items-center justify-center pt-[130px] md:pt-[100px] px-6 pb-8"
              >
                <h1
                  className="font-['Bricolage_Grotesque',sans-serif] text-[clamp(2.5rem,6.25vw,4.68rem)] font-extrabold text-[#0A0A0A] m-0 mb-3.5 leading-[1.1] tracking-[-0.02em] text-center"
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
                    className="font-jakarta text-[1.1rem] text-black/52 m-0 mb-8 md:mb-12 leading-relaxed text-center"
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
                  className="w-full max-w-2xl"
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
                    className="w-full max-w-2xl mt-5"
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
                className="absolute inset-0 flex flex-col overflow-hidden pt-24 md:pt-20"
              >
                <div
                  className="chat-container flex flex-1 min-h-0 overflow-y-auto pb-[100px] max-md:px-2"
                  key={chatId || "ephemeral"}
                >
                  <ChatMessages
                    messages={messages}
                    isLoading={isLoading}
                    libLabel={lib.label}
                    onStreamingEnd={() => { }}
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
                  className="absolute inset-x-0 bottom-0 flex justify-center py-5 px-0 pointer-events-none z-20 bg-[#0A0A0A]"
                >
                  <div className="w-[min(672px,calc(100vw-32px))] md:w-[min(672px,calc(100vw-80px))] pointer-events-auto">
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
