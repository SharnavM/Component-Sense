import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Info, Plus, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useChat } from "../context/ChatContext";

const Icons = {
  hamburger: <Menu size={18} />,
  close: <X size={18} />,
  newChat: <Plus size={18} />,
  about: <Info size={17} />,
  settings: <Settings size={17} />,
};

const NAV_ITEMS = [
  { id: "new", icon: Icons.newChat, label: "New Chat", action: "newChat" },
  { id: "about", icon: Icons.about, label: "About", action: null },
  { id: "settings", icon: Icons.settings, label: "Settings", action: null },
];

const CLOSED_W = 52;
const OPEN_W = 240;


export default function Sidebar({
  isOpen,
  onToggle,
}) {
  const { chats, activeChatId } = useChat();
  const bg = activeChatId ? "rgba(14,14,14,0.72)" : "#1a1a1a";
  let navigate = useNavigate();

  const visitRoute = (navItemId) => {
    switch (navItemId) {
      case "new":
        navigate("/");
        if (window.innerWidth < 768 && isOpen) onToggle();
        break;
      case "about":
        navigate("/about");
        if (window.innerWidth < 768 && isOpen) onToggle();
        break;
      case "settings":
        navigate("/settings");
        if (window.innerWidth < 768 && isOpen) onToggle();
        break;
    }
  };

  const handleChatClick = (id) => {
    navigate(`/chat/${id}`);
    if (window.innerWidth < 768 && isOpen) onToggle();
  };

  const historyItems = chats;

  return (
    <motion.aside
      animate={{ width: isOpen ? OPEN_W : CLOSED_W }}
      transition={{ type: "spring", stiffness: 380, damping: 34 }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "100%",
        zIndex: 60,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: bg,
        backdropFilter: "blur(16px)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        transition: "background 0.6s",
      }}
    >
      <button
        onClick={onToggle}
        style={{
          flexShrink: 0,
          width: CLOSED_W,
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "rgba(255,255,255,0.55)",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.color = "rgba(255,255,255,0.9)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = "rgba(255,255,255,0.55)")
        }
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.22 }}
        >
          {isOpen ? Icons.close : Icons.hamburger}
        </motion.div>
      </button>

      <div
        style={{
          height: "1px",
          background: "rgba(255,255,255,0.07)",
          margin: "0 12px 8px",
        }}
      />

      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          padding: "4px 8px",
        }}
      >
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            isOpen={isOpen}
            onAction={() => visitRoute(item.id)}
          />
        ))}
      </nav>

      <AnimatePresence>
        {isOpen && historyItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            style={{ padding: "8px 12px", overflow: "hidden" }}
          >
            <p
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.22)",
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                marginBottom: 6,
              }}
            >
              Recent
            </p>
            {historyItems.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleChatClick(chat.id)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  fontSize: "13px",
                  color: activeChatId === chat.id ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)",
                  background: activeChatId === chat.id ? "rgba(255,255,255,0.06)" : "transparent",
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  marginBottom: 2,
                }}
              >
                {chat.title}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}

function NavItem({ item, isOpen, onAction }) {
  return (
    <button
      onClick={() => onAction(item.action)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        height: 40,
        borderRadius: 10,
        background: "transparent",
        border: "none",
        cursor: item.action ? "pointer" : "pointer",
        color: "rgba(255,255,255,0.5)",
        transition: "color 0.2s, background 0.2s",
        width: "100%",
        textAlign: "left",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "rgba(255,255,255,0.9)";
        e.currentTarget.style.background = "rgba(255,255,255,0.07)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "rgba(255,255,255,0.5)";
        e.currentTarget.style.background = "transparent";
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {item.icon}
      </span>

      <AnimatePresence>
        {isOpen && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              fontSize: "14px",
              fontWeight: 500,
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
