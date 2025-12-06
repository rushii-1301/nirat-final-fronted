import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import Sidebar from "../../Tools/Sidebar.jsx";
import Header from "../../Tools/Header.jsx";
import { getAsset, BACKEND_API_URL } from "../../../utils/assets.js";
import { ArrowBigLeft, CircleArrowLeft, SendHorizontal, Search } from "lucide-react";

function OpenChart({ theme, isDark, toggleTheme, sidebardata }) {
    const [peers, setPeers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [error, setError] = useState(null);
    const [messagesByChat, setMessagesByChat] = useState({});
    const [typingStatus, setTypingStatus] = useState({}); // peerEnrollment -> boolean
    const socketRef = useRef(null);

    // null = no chat selected yet
    const [selectedId, setSelectedId] = useState(null);
    const [showListMobile, setShowListMobile] = useState(true); // on small screens toggle between list and chat
    const [input, setInput] = useState("");
    const listRef = useRef(null);

    // Helper to get token
    const getToken = () => localStorage.getItem('token') || localStorage.getItem('access_token');
    // Logged-in student's enrollment (primary identity for chat)
    const getMyEnrollment = () =>
        localStorage.getItem('enrolment_number') ||
        localStorage.getItem('enrollment_number') ||
        localStorage.getItem('member_id');

    // Initialize Socket
    useEffect(() => {
        const token = getToken();

        if (!token) {
            setError('Authentication token not found');
            return;
        }

        // Initialize Socket
        socketRef.current = io(BACKEND_API_URL, {
            transports: ['websocket'],
            query: { token },
            auth: { token },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketRef.current.on("connect", () => {
            console.log("[Socket.IO] Connected successfully!");
        });

        socketRef.current.on("disconnect", (reason) => {
            console.log("[Socket.IO] Disconnected:", reason);
        });

        socketRef.current.on("connect_error", (err) => {
            console.error("[Socket.IO] Connection error:", err);
        });

        socketRef.current.on("message:new", (data) => {
            console.log("[Socket.IO] Received new message:", data);
            handleNewMessage(data);
        });

        socketRef.current.on("typing", (data) => {
            handleTypingStatus(data);
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    const handleNewMessage = (payload) => {
        try {
            const message = payload.message;
            if (!message) return;

            const myEnrollment = getMyEnrollment();

            let peerEnrollment = '';

            // Determine who the peer is
            if (String(message.sender_enrollment) === String(myEnrollment)) {
                peerEnrollment = message.receiver_enrollment;
            } else {
                peerEnrollment = message.sender_enrollment;
            }

            if (!peerEnrollment) return;

            setMessagesByChat(prev => {
                const currentMessages = prev[peerEnrollment] || [];

                // Check for duplicates by ID and content/time
                const isDuplicate = currentMessages.some(m => {
                    // If it's my own message, check by message content and close time
                    if (String(message.sender_enrollment) === String(myEnrollment)) {
                        return m.from === 'me' &&
                            m.text === message.message &&
                            Math.abs(new Date(m.original?.created_at).getTime() - new Date(message.created_at).getTime()) < 5000;
                    }
                    // For other's messages, check by ID
                    return m.id === message.id;
                });

                if (isDuplicate) return prev;

                return {
                    ...prev,
                    [peerEnrollment]: [...currentMessages, mapMessage(message, myEnrollment)]
                };
            });
        } catch (e) {
            console.error("Error handling new message:", e);
        }
    };

    const handleTypingStatus = (payload) => {
        try {
            const { sender_enrollment, typing } = payload;
            if (sender_enrollment) {
                setTypingStatus(prev => ({
                    ...prev,
                    [sender_enrollment]: typing
                }));
            }
        } catch (e) {
            console.error("Error handling typing status:", e);
        }
    };

    // Fetch Peers
    useEffect(() => {
        const fetchPeers = async () => {
            try {
                setLoading(true);
                setError(null);
                const token = getToken();
                if (!token) return;

                const res = await axios.get(`${BACKEND_API_URL}/school-portal/chat/peers`, {
                    headers: {
                        accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = res.data || {};
                const peersList = (data && data.data && Array.isArray(data.data.peers))
                    ? data.data.peers
                    : [];

                if (peersList.length > 0) {
                    setPeers(peersList);
                } else {
                    setError('No chats found');
                }
            } catch (error) {
                console.error("Failed to fetch chat peers", error);
                setError('Failed to load chats');
            } finally {
                setLoading(false);
            }
        };

        fetchPeers();
    }, []);

    const chats = useMemo(() => {
        if (!peers || peers.length === 0) {
            return [];
        }

        return peers.map((peer, index) => {
            let time = "";
            if (peer.last_message_time || peer.last_message_at) {
                try {
                    time = new Date(peer.last_message_time || peer.last_message_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                    });
                } catch (e) {
                    time = "";
                }
            }

            return {
                id: peer.enrollment_number || peer.id,
                title: peer.name || peer.title || `Chat ${index + 1}`,
                subtitle: peer.last_message || "",
                time,
                unread: peer.unread_count ?? 0,
                peerEnrollment: peer.enrollment_number,
                profileImageUrl: peer.profile_image_url
            };
        });
    }, [peers]);

    const selectedChat = useMemo(
        () => (selectedId != null ? chats.find((c) => c.id === selectedId) || null : null),
        [chats, selectedId]
    );

    const selectedMessages = useMemo(
        () => (selectedId != null ? messagesByChat[selectedId] || [] : []),
        [messagesByChat, selectedId]
    );

    // Fetch Messages for selected chat
    useEffect(() => {
        if (!selectedId) return;

        const fetchMessages = async () => {
            try {
                const token = getToken();
                const res = await axios.get(`${BACKEND_API_URL}/school-portal/chat/messages/${selectedId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (res.data && res.data.data && Array.isArray(res.data.data.messages)) {
                    const myEnrollment = getMyEnrollment();
                    const mappedMessages = res.data.data.messages.map(msg => mapMessage(msg, myEnrollment));
                    setMessagesByChat(prev => ({
                        ...prev,
                        [selectedId]: mappedMessages
                    }));
                }
            } catch (error) {
                console.error("Failed to fetch messages", error);
            }
        };

        fetchMessages();
    }, [selectedId]);

    const mapMessage = (msg, myEnrollment) => {
        const isMe = String(msg.sender_enrollment) === String(myEnrollment);
        let timeStr = "";
        try {
            const date = new Date(msg.created_at);
            timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            timeStr = "";
        }

        return {
            id: msg.id,
            from: isMe ? 'me' : 'other',
            text: msg.message,
            time: timeStr,
            original: msg
        };
    };

    // Scroll to bottom
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [selectedMessages, selectedId, typingStatus]);

    const handleSend = () => {
        const text = input.trim();
        if (!text || selectedId == null) return;

        const peerEnrollment = selectedChat?.peerEnrollment;

        if (!peerEnrollment) return;

        const myEnrollment = getMyEnrollment();

        // Optimistic Update
        const tempId = Date.now();
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const optimisticMessage = {
            id: tempId,
            from: 'me',
            text: text,
            time: timeStr,
            original: {
                sender_enrollment: myEnrollment,
                receiver_enrollment: peerEnrollment,
                message: text,
                created_at: now.toISOString()
            }
        };

        setMessagesByChat(prev => ({
            ...prev,
            [peerEnrollment]: [...(prev[peerEnrollment] || []), optimisticMessage]
        }));

        setInput("");

        if (socketRef.current && socketRef.current.connected) {
            // Send via Socket
            socketRef.current.emit('send_message', {
                peer_enrollment: peerEnrollment,
                message: text,
                share_metadata: null,
            });

            // Stop typing
            socketRef.current.emit('typing', {
                peer_enrollment: peerEnrollment,
                typing: false,
            });
        } else {
            // Fallback to REST API
            fallbackSendMessage(peerEnrollment, text);
        }
    };

    const fallbackSendMessage = async (peerEnrollment, text) => {
        try {
            const token = getToken();
            await axios.post(
                `${BACKEND_API_URL}/school-portal/chat/messages`,
                {
                    peer_enrollment: peerEnrollment,
                    message: text,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
        } catch (error) {
            console.error("Failed to send message via fallback", error);
        }
    };

    const handleInputChange = (e) => {
        setInput(e.target.value);

        // Emit typing status
        if (selectedId && socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('typing', {
                peer_enrollment: selectedId,
                typing: e.target.value.length > 0
            });
        }
    };

    const shellBg = isDark ? "bg-black text-gray-100" : "bg-zinc-100 text-zinc-900";
    const paneBg = isDark ? "bg-zinc-900" : "bg-white";

    const isTyping = selectedId && typingStatus[selectedId];

    return (
        <div className={`flex ${shellBg} h-screen transition-colors duration-300`}>
            <Sidebar isDark={isDark} sidebardata={sidebardata} />

            <div className={`flex flex-col min-w-0 min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-7 pb-4 transition-all duration-300`}>
                <div className="sticky top-0 z-20">
                    <Header title="Chat" isDark={isDark} toggleTheme={toggleTheme} />
                </div>

                <main className="mt-6 flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <aside className={`${showListMobile ? 'block' : 'hidden'} lg:block lg:col-span-4 ${paneBg} rounded-xl border ${isDark ? "border-zinc-800" : "border-zinc-200"} overflow-hidden flex flex-col min-h-0`}>
                        <div className={`px-4 py-3 border-b ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>Chats</div>
                        <div className="flex-1 overflow-y-auto no-scrollbar max-h-[calc(100vh-200px)]">
                            {loading ? (
                                <div className="flex items-center justify-center h-32">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-10 h-10 border-3 border-gray-300 border-t-indigo-500 rounded-full animate-spin"></div>
                                        <div className="text-sm opacity-60">Loading chats...</div>
                                    </div>
                                </div>
                            ) : error ? (
                                <div className="flex items-center justify-center h-32">
                                    <div className="text-sm text-red-500">{error}</div>
                                </div>
                            ) : chats.length === 0 ? (
                                <div className="flex items-center justify-center h-32">
                                    <div className="text-sm opacity-60">No chats available</div>
                                </div>
                            ) : (
                                chats.map((c) => (
                                    <div
                                        key={c.id}
                                        onClick={() => { setSelectedId(c.id); setShowListMobile(false); }}
                                        className={`px-4 py-4 flex items-center gap-3 border-b ${isDark ? "border-zinc-800" : "border-zinc-200"} cursor-pointer ${selectedId === c.id ? (isDark ? 'bg-white/5' : 'bg-zinc-100') : (isDark ? 'hover:bg-white/5' : 'hover:bg-zinc-50')}`}
                                    >
                                        <img
                                            src={c.profileImageUrl || "https://i.pravatar.cc/40?img=3"}
                                            alt="avatar"
                                            className="h-10 w-10 rounded-full object-cover"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <div className="truncate text-sm font-medium">{c.title}</div>
                                                <div className="text-xs opacity-70 whitespace-nowrap">{c.time}</div>
                                            </div>
                                            <div className="truncate text-xs opacity-80">{c.subtitle}</div>
                                        </div>
                                        {c.unread > 0 && (
                                            <span className="ml-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-zinc-700 text-white text-xs px-2">{c.unread}</span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </aside>

                    <section className={`${showListMobile ? 'hidden' : 'flex'} lg:flex lg:col-span-8 flex-col min-h-0`}>
                        {selectedId == null ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center flex flex-col items-center gap-4">
                                    <div className={`${isDark ? 'bg-zinc-800' : 'bg-zinc-900/90'} h-9 w-9 rounded-full flex items-center justify-center`}>
                                        <Search size={16} className="text-white" />
                                    </div>
                                    <div>
                                        <div className="text-base sm:text-lg font-semibold tracking-wide">Select A Chat</div>
                                        <div className={`mt-1 text-[11px] sm:text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                                            Choose A Conversation From The List To Start Messaging
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className={`${paneBg} rounded-xl border ${isDark ? "border-zinc-800" : "border-zinc-200"} p-4 flex items-center gap-3 shadow-sm`}>
                                    <button onClick={() => setShowListMobile(true)} className={`lg:hidden ${isDark ? "bg-zinc-800" : "bg-zinc-100"} h-9 w-9 rounded-full flex items-center justify-center cursor-pointer`}> <CircleArrowLeft /></button>
                                    <img
                                        src={selectedChat?.profileImageUrl || "https://i.pravatar.cc/40?img=5"}
                                        alt="avatar"
                                        className="h-10 w-10 rounded-full object-cover"
                                    />
                                    <div className="flex-1">
                                        <div className="text-sm font-medium">{selectedChat?.title}</div>
                                        <div className="mt-0.5 flex items-center gap-2 text-xs">
                                            <span className={`h-2 w-2 rounded-full ${isDark ? 'bg-emerald-400' : 'bg-emerald-500'} animate-pulse`}></span>
                                            <span className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Online</span>
                                        </div>
                                    </div>
                                    <button className={`${isDark ? "bg-zinc-800" : "bg-zinc-100"} h-9 w-9 rounded-full flex items-center justify-center`}>📞</button>
                                    <button className={`${isDark ? "bg-zinc-800" : "bg-zinc-100"} h-9 w-9 rounded-full flex items-center justify-center`}>📎</button>
                                </div>

                                <div ref={listRef} className="mt-4 flex-1 min-h-0 overflow-y-auto no-scrollbar px-2">
                                    {selectedMessages.length === 0 ? (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="text-sm opacity-60">No messages yet</div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {selectedMessages.map(m => (
                                                <div key={m.id} className="space-y-1">
                                                    <div className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                                                        {m.from === 'other' && (
                                                            <img
                                                                src={selectedChat?.profileImageUrl || "https://i.pravatar.cc/32?img=1"}
                                                                alt="av"
                                                                className="h-8 w-8 rounded-full mr-2 self-end object-cover"
                                                            />
                                                        )}
                                                        <div className={`${isDark
                                                            ? (m.from === 'me' ? 'bg-zinc-300 text-zinc-900' : 'bg-zinc-800 text-white')
                                                            : (m.from === 'me' ? 'bg-white border border-zinc-200 text-zinc-900' : 'bg-zinc-200 text-zinc-900')
                                                            } rounded-full px-4 py-2 max-w-[75%] shadow-sm`}>{m.text}</div>
                                                        {m.from === 'me' && (
                                                            <img src="https://i.pravatar.cc/32?img=2" alt="av" className="h-8 w-8 rounded-full ml-2 self-end" />
                                                        )}
                                                    </div>
                                                    <div className={`text-xs ${isDark ? 'opacity-60' : 'text-zinc-500'} ${m.from === 'me' ? 'text-right pr-10' : 'text-left pl-10'}`}>{m.time}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {isTyping && (
                                        <div className="mt-3 flex items-end justify-start">
                                            <img
                                                src={selectedChat?.profileImageUrl || "https://i.pravatar.cc/32?img=1"}
                                                alt="typing avatar"
                                                className="h-7 w-7 rounded-full mr-2 object-cover"
                                            />
                                            <div
                                                className={`${isDark ? 'bg-zinc-800 text-white' : 'bg-zinc-200 text-zinc-900'} rounded-full px-3 py-2 inline-flex items-center gap-1 shadow-sm`}
                                            >
                                                <span className={`h-1.5 w-1.5 rounded-full ${isDark ? 'bg-zinc-300' : 'bg-zinc-500'} animate-bounce`}></span>
                                                <span className={`h-1.5 w-1.5 rounded-full ${isDark ? 'bg-zinc-500' : 'bg-zinc-400'} animate-bounce [animation-delay:120ms]`}></span>
                                                <span className={`h-1.5 w-1.5 rounded-full ${isDark ? 'bg-zinc-700' : 'bg-zinc-300'} animate-bounce [animation-delay:240ms]`}></span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 sticky bottom-0 left-0 right-0">
                                    <div
                                        className={`${paneBg} rounded-full border ${isDark ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-white'
                                            } flex items-center gap-2 px-3 py-2 shadow-sm`}
                                    >
                                        {/* AI Button */}
                                        <button
                                            className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors duration-200 ${isDark
                                                ? 'bg-zinc-800 hover:bg-zinc-700'
                                                : 'bg-zinc-100 hover:bg-zinc-200'
                                                }`}
                                        >
                                            <img src={getAsset('Ai_dark')} alt="AI" className={`h-5 w-5 object-contain ${!isDark ? 'invert' : ''}`} />
                                        </button>

                                        {/* Input Field */}
                                        <input
                                            value={input}
                                            onChange={handleInputChange}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSend();
                                                }
                                            }}
                                            placeholder="Type a message"
                                            className={`flex-1 bg-transparent outline-none text-[15px] font-[Inter] font-normal leading-[100%] px-2 focus:outline-none focus:ring-0 ${isDark ? 'text-white placeholder:text-zinc-500' : 'text-black placeholder:text-zinc-400'
                                                }`}
                                        />

                                        {/* Send Button */}
                                        <button
                                            onClick={handleSend}
                                            className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors duration-200 border ${isDark
                                                ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-white'
                                                : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-800'
                                                }`}
                                            aria-label="Send message"
                                        >
                                            <SendHorizontal size={18} className="shrink-0" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </section>
                </main>
            </div>
        </div>
    );
}

export default OpenChart;