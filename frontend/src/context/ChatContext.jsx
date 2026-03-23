import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

const STORAGE_KEY = "ragdocs_chats";

const ChatContext = createContext(null);

export function ChatProvider({ children }) {

    const [chats, setChats] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    });

    const [activeChatId, setActiveChatId] = useState(null);


    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
        } catch {

        }
    }, [chats]);


    const chatsList = useMemo(() => {
        return Object.values(chats).sort((a, b) => b.createdAt - a.createdAt);
    }, [chats]);

    const activeChat = activeChatId ? chats[activeChatId] : null;


    const generateId = () => {
        return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    };

    const createChat = useCallback((firstMessage, lib) => {
        const id = generateId();
        const newChat = {
            id,
            title: firstMessage.slice(0, 30) + (firstMessage.length > 30 ? "…" : ""),
            lib,
            createdAt: Date.now(),
            messages: [{ role: "user", content: firstMessage }],
        };

        setChats((prev) => ({
            ...prev,
            [id]: newChat
        }));

        setActiveChatId(id);
        return id;
    }, []);

    const addMessage = useCallback((chatId, message) => {
        setChats((prev) => {
            const chat = prev[chatId];
            if (!chat) return prev;

            return {
                ...prev,
                [chatId]: {
                    ...chat,
                    messages: [...chat.messages, message]
                }
            };
        });
    }, []);

    const loadChat = useCallback((chatId) => {
        if (chats[chatId]) {
            setActiveChatId(chatId);
            return chats[chatId];
        }
        return null;
    }, [chats]);

    const clearAllChats = useCallback(() => {
        setChats({});
        setActiveChatId(null);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {

        }
    }, []);

    const clearActiveChat = useCallback(() => {
        setActiveChatId(null);
    }, []);

    return (
        <ChatContext.Provider
            value={{
                chats: chatsList,
                activeChatId,
                activeChat,
                createChat,
                addMessage,
                loadChat,
                clearAllChats,
                clearActiveChat
            }}
        >
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const ctx = useContext(ChatContext);
    if (!ctx) throw new Error("useChat must be used inside <ChatProvider>");
    return ctx;
}
