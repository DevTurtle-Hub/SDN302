'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { subscribeToTeamChannel } from '@/lib/realtime-client';
import {
  MessageSquare,
  Send,
  Paperclip,
  Image as ImageIcon,
  Crown,
  Shield,
  User,
  X,
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  content: string;
  teamId: string;
  senderId: string;
  fileUrl?: string | null;
  fileName?: string | null;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
  };
}

interface TeamChatProps {
  teamId: string;
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
  teamMembers: {
    userId: string;
    role: string;
  }[];
}

export default function TeamChat({ teamId, currentUser, teamMembers }: TeamChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{ [userId: string]: string }>({});
  const [isConnected, setIsConnected] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [showAttachmentInput, setShowAttachmentInput] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingSentRef = useRef<number>(0);
  const lastConfirmedTimeRef = useRef<string | null>(null);
  const isSyncingRef = useRef<boolean>(false);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  // 1. Initial message history load
  const fetchInitialMessages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/teams/${teamId}/messages`, { cache: 'no-store' });
      if (res.ok) {
        const data: ChatMessage[] = await res.json();
        setMessages(data);
        if (data.length > 0) {
          lastConfirmedTimeRef.current = data[data.length - 1].createdAt;
        }
        setTimeout(() => scrollToBottom(false), 30);
      }
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchInitialMessages();
  }, [fetchInitialMessages]);

  // 2. High-speed delta sync (<20ms query overhead with ?since=)
  const syncNewMessages = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      const lastTime = lastConfirmedTimeRef.current;
      const url = lastTime
        ? `/api/teams/${teamId}/messages?since=${encodeURIComponent(lastTime)}`
        : `/api/teams/${teamId}/messages`;

      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const incoming: ChatMessage[] = await res.json();
        if (Array.isArray(incoming) && incoming.length > 0) {
          setMessages((prev) => {
            // Remove optimistic temp message if incoming contains its real record
            const cleaned = prev.filter(
              (m) =>
                !m.id.startsWith('temp-') ||
                !incoming.some(
                  (inc) =>
                    inc.senderId === m.senderId && inc.content === m.content,
                ),
            );

            // Deduplicate by message ID
            const existingIds = new Set(cleaned.map((m) => m.id));
            const newToAdd = incoming.filter((inc) => !existingIds.has(inc.id));

            if (newToAdd.length === 0) return prev;

            const combined = [...cleaned, ...newToAdd];
            const realMessages = combined.filter((m) => !m.id.startsWith('temp-'));
            if (realMessages.length > 0) {
              lastConfirmedTimeRef.current =
                realMessages[realMessages.length - 1].createdAt;
            }
            setTimeout(() => scrollToBottom(true), 30);
            return combined;
          });
        }
      }
    } catch {
      // Silent error on fast poll
    } finally {
      isSyncingRef.current = false;
    }
  }, [teamId]);

  // 3. Real-time Subscription (Pusher / SSE instant listener)
  useEffect(() => {
    const unsubscribe = subscribeToTeamChannel(
      teamId,
      {
        'message:created': (newMsg: ChatMessage) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            const cleaned = prev.filter(
              (m) =>
                !m.id.startsWith('temp-') ||
                !(m.senderId === newMsg.senderId && m.content === newMsg.content),
            );
            const combined = [...cleaned, newMsg];
            lastConfirmedTimeRef.current = newMsg.createdAt;
            setTimeout(() => scrollToBottom(true), 30);
            return combined;
          });
          setTypingUsers((prev) => {
            const next = { ...prev };
            delete next[newMsg.senderId];
            return next;
          });
        },
        'chat:typing': ({
          userId,
          name,
          isTyping,
        }: {
          userId: string;
          name: string;
          isTyping: boolean;
        }) => {
          if (userId === currentUser.id) return;
          setTypingUsers((prev) => {
            const next = { ...prev };
            if (isTyping) {
              next[userId] = name;
            } else {
              delete next[userId];
            }
            return next;
          });
        },
      },
      () => setIsConnected(true),
    );

    return unsubscribe;
  }, [teamId, currentUser.id]);

  // 4. Adaptive Fast Poller (1000ms active, instant on focus, 3000ms background)
  useEffect(() => {
    let isMounted = true;
    let timerId: NodeJS.Timeout | null = null;

    const schedulePoll = () => {
      if (!isMounted) return;
      const intervalDelay = document.hidden ? 3000 : 1000;
      timerId = setTimeout(async () => {
        if (isMounted) {
          await syncNewMessages();
          schedulePoll();
        }
      }, intervalDelay);
    };

    schedulePoll();

    const handleFocusOrVisibility = () => {
      if (document.visibilityState === 'visible' && isMounted) {
        syncNewMessages();
      }
    };

    window.addEventListener('visibilitychange', handleFocusOrVisibility);
    window.addEventListener('focus', handleFocusOrVisibility);

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
      window.removeEventListener('visibilitychange', handleFocusOrVisibility);
      window.removeEventListener('focus', handleFocusOrVisibility);
    };
  }, [syncNewMessages]);

  // Broadcast typing status with 2-second throttle
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    const now = Date.now();
    if (now - lastTypingSentRef.current > 2000) {
      lastTypingSentRef.current = now;
      fetch(`/api/teams/${teamId}/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTyping: true }),
      }).catch(() => {});
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      fetch(`/api/teams/${teamId}/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTyping: false }),
      }).catch(() => {});
    }, 2500);
  };

  // Send message with 0ms OPTIMISTIC UI + Instant Sync Burst
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const contentToSend = inputText.trim();
    const urlToSend = attachmentUrl.trim();
    if (!contentToSend && !urlToSend) return;

    // 1. Immediately reset form
    setInputText('');
    setAttachmentUrl('');
    setShowAttachmentInput(false);

    // 2. Add optimistic message to UI immediately (0ms delay!)
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      content: contentToSend || 'Shared an image attachment',
      teamId,
      senderId: currentUser.id,
      fileUrl: urlToSend || null,
      fileName: null,
      createdAt: new Date().toISOString(),
      sender: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
      },
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom(true), 20);

    // 3. Send request in background
    setSending(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: contentToSend || 'Shared an image attachment',
          fileUrl: urlToSend || null,
        }),
      });

      if (res.ok) {
        const savedMsg: ChatMessage = await res.json();
        lastConfirmedTimeRef.current = savedMsg.createdAt;
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? savedMsg : m)),
        );

        // Immediate burst sync (checks in 300ms and 700ms for incoming responses)
        setTimeout(() => syncNewMessages(), 300);
        setTimeout(() => syncNewMessages(), 700);
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        const data = await res.json();
        alert(data.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      alert('Error sending message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const getUserRole = (userId: string) => {
    const member = teamMembers.find((m) => m.userId === userId);
    return member?.role || 'MEMBER';
  };

  const getRoleBadge = (role: string) => {
    switch (role.toUpperCase()) {
      case 'OWNER':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-black text-amber-800">
            <Crown className="h-3 w-3 text-amber-700" />
            Owner
          </span>
        );
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-100 px-1.5 py-0.5 text-[10px] font-black text-indigo-700">
            <Shield className="h-3 w-3 text-indigo-700" />
            Admin
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
            <User className="h-3 w-3 text-slate-500" />
            Member
          </span>
        );
    }
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const typingNames = Object.values(typingUsers);

  return (
    <div className="flex flex-col h-[660px] rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">
              Team Real-Time Room
            </h3>
            <p className="text-xs text-slate-500">Live chat synced with database history</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-1.5 shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-emerald-700">Real-Time Instant Sync</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
        {loading && messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              <p className="text-xs text-slate-400">Loading chat history...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-8">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <MessageSquare className="h-7 w-7" />
            </div>
            <p className="text-base font-bold text-slate-800">No messages yet</p>
            <p className="mt-1 text-xs text-slate-400 max-w-sm">
              Be the first to say hello to your team members in this real-time channel!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            const senderRole = getUserRole(msg.senderId);

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black shadow-xs ${
                    isMe
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                  title={`${msg.sender?.name} (${senderRole})`}
                >
                  {msg.sender?.name?.charAt(0).toUpperCase() || 'U'}
                </div>

                {/* Message Bubble Container */}
                <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {/* Sender meta */}
                  <div className="mb-1 flex items-center gap-2 px-1">
                    <span className="text-xs font-bold text-slate-800">
                      {isMe ? 'You' : msg.sender?.name}
                    </span>
                    {getRoleBadge(senderRole)}
                    <span className="text-[11px] text-slate-400">
                      {formatMessageTime(msg.createdAt)}
                    </span>
                  </div>

                  {/* Bubble */}
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm shadow-xs break-words leading-relaxed ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {msg.id.startsWith('temp-') && (
                      <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-indigo-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-white/70 animate-ping" />
                        <span>Sending...</span>
                      </div>
                    )}


                    {/* Image Attachment (Bonus feature) */}
                    {msg.fileUrl && (
                      <div className="mt-2.5 overflow-hidden rounded-xl border border-white/20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={msg.fileUrl}
                          alt="Attachment"
                          className="max-h-56 max-w-full rounded-lg object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator Bar */}
      {typingNames.length > 0 && (
        <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-6 py-2 text-xs text-slate-500 italic animate-pulse">
          <span className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce" />
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
          </span>
          <span>
            {typingNames.join(', ')} {typingNames.length > 1 ? 'are' : 'is'} typing...
          </span>
        </div>
      )}

      {/* Attachment Preview / Input (Bonus) */}
      {showAttachmentInput && (
        <div className="border-t border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <ImageIcon className="h-4 w-4" />
              </div>
              <input
                type="url"
                placeholder="Paste image URL (e.g. https://images.unsplash.com/...)"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setAttachmentUrl('');
                setShowAttachmentInput(false);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Message Input Box - Wide & Smooth */}
      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-3 border-t border-slate-200 bg-white p-4"
      >
        {/* Attachment Toggle Button */}
        <button
          type="button"
          onClick={() => setShowAttachmentInput(!showAttachmentInput)}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-colors cursor-pointer ${
            showAttachmentInput || attachmentUrl
              ? 'border-indigo-400 bg-indigo-50 text-indigo-600'
              : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
          title="Attach image link"
        >
          <Paperclip className="h-5 w-5" />
        </button>

        {/* Text Input */}
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Type a team message in real-time..."
          className="flex-1 rounded-2xl border border-slate-200 bg-slate-50/60 px-5 py-3 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={!inputText.trim() && !attachmentUrl}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
          title="Send message"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
