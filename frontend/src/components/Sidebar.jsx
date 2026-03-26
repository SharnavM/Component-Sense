import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Info, Plus, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useChat } from "../context/ChatContext";
import { useSidebar } from "../context/SidebarContext";

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

export default function Sidebar({ isOpen, onToggle }) {
  const { chats, activeChatId } = useChat();
  const bgClass = activeChatId ? "bg-[#0e0e0e]/70" : "bg-[#1a1a1a]";
  let navigate = useNavigate();
  const { isMobile } = useSidebar();

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
    <aside
      className={`fixed top-0 left-0 h-full z-[60] flex flex-col overflow-hidden backdrop-blur-md border-r border-white/5 transition-all duration-300 ${bgClass} ${isOpen
        ? "w-full md:w-[240px] translate-x-0"
        : "-translate-x-full md:translate-x-0 md:w-[52px]"
        }`}
    >
      <button
        onClick={onToggle}
        className={`shrink-0 h-16 flex items-center bg-transparent border-none cursor-pointer text-white/55 hover:text-white/90 transition-colors ${isOpen ? "justify-end px-6 md:justify-center md:px-0 md:w-[52px]" : "justify-center w-[52px]"
          }`}
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        <div className={`transition-transform duration-200 ${isOpen ? "rotate-90" : "rotate-0"}`}>
          {isOpen ? Icons.close : Icons.hamburger}
        </div>
      </button>

      <div className="h-px bg-white/5 mx-3 mb-2" />

      <nav className="flex flex-col gap-1 px-2 py-1">
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
            className="px-3 py-2 overflow-hidden"
          >
            <p className="text-[11px] font-bold tracking-widest uppercase text-white/20 font-jakarta mb-1.5">
              Recent
            </p>
            {historyItems.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleChatClick(chat.id)}
                className={`py-2 px-2.5 rounded-lg text-[13px] font-jakarta cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis mb-0.5 transition-colors ${activeChatId === chat.id
                  ? "text-white/90 bg-white/5"
                  : "text-white/50 hover:bg-white/5"
                  }`}
              >
                {chat.title}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}

function NavItem({ item, isOpen, onAction }) {
  return (
    <button
      onClick={() => onAction(item.action)}
      className="flex items-center gap-3 h-10 rounded-lg bg-transparent border-none cursor-pointer text-white/50 hover:text-white/90 hover:bg-white/5 transition-all w-full text-left"
    >
      <span className="shrink-0 w-8 flex items-center justify-center">
        {item.icon}
      </span>

      <AnimatePresence>
        {isOpen && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="text-sm font-medium font-jakarta whitespace-nowrap overflow-hidden"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
