'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { subscribeToTeamChannel } from '@/lib/realtime-client';

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

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  // 1. Fetch message history
  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/teams/${teamId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data || []);
        setTimeout(() => scrollToBottom(false), 100);
      }
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // 2. Real-time Subscription (Pusher with SSE fallback)
  useEffect(() => {
    const unsubscribe = subscribeToTeamChannel(
      teamId,
      {
        'message:created': (newMsg: ChatMessage) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          setTypingUsers((prev) => {
            const next = { ...prev };
            delete next[newMsg.senderId];
            return next;
          });
          setTimeout(() => scrollToBottom(true), 50);
        },
        'chat:typing': ({ userId, name, isTyping }: { userId: string; name: string; isTyping: boolean }) => {
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

  // Broadcast typing status
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    // Broadcast isTyping = true
    fetch(`/api/teams/${teamId}/typing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isTyping: true }),
    }).catch(() => {});

    // Clear timeout and schedule isTyping = false
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

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = inputText.trim();
    if (!content && !attachmentUrl) return;

    setSending(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content || 'Shared an image attachment',
          fileUrl: attachmentUrl || null,
          fileName: attachmentUrl ? 'attachment.jpg' : null,
        }),
      });

      if (res.ok) {
        const createdMsg: ChatMessage = await res.json();
        // Optimistically add message if not already added by SSE
        setMessages((prev) => {
          if (prev.some((m) => m.id === createdMsg.id)) return prev;
          return [...prev, createdMsg];
        });
        setInputText('');
        setAttachmentUrl('');
        setShowAttachmentInput(false);
        setTimeout(() => scrollToBottom(true), 50);

        // Clear typing
        fetch(`/api/teams/${teamId}/typing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isTyping: false }),
        }).catch(() => {});
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
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
          <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-black text-amber-800">
            👑 Owner
          </span>
        );
      case 'ADMIN':
        return (
          <span className="rounded-md bg-indigo-100 px-1.5 py-0.5 text-[9px] font-black text-indigo-700">
            🛡️ Admin
          </span>
        );
      default:
        return (
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
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
    <div className="flex flex-col h-[640px] rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/80 px-5 py-3.5 backdrop-blur-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-xs">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              Team Real-time Chat
            </h3>
            <p className="text-[11px] text-slate-500">
              Live communication room for team collaborators
            </p>
          </div>
        </div>

        {/* Real-time Status Badge */}
        <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{isConnected ? 'Real-time Live' : 'Connecting...'}</span>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-slate-50/40 to-white">
        {loading ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            Loading team chat history...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-8">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm font-bold text-slate-700">No messages yet</p>
            <p className="mt-1 text-xs text-slate-400 max-w-xs">
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
                className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black shadow-xs ${
                    isMe
                      ? 'bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                  title={`${msg.sender?.name} (${senderRole})`}
                >
                  {msg.sender?.name?.charAt(0).toUpperCase() || 'U'}
                </div>

                {/* Message Bubble Container */}
                <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {/* Sender meta */}
                  <div className="mb-1 flex items-center gap-1.5 px-1">
                    <span className="text-[11px] font-bold text-slate-700">
                      {isMe ? 'You' : msg.sender?.name}
                    </span>
                    {getRoleBadge(senderRole)}
                    <span className="text-[10px] text-slate-400">
                      {formatMessageTime(msg.createdAt)}
                    </span>
                  </div>

                  {/* Bubble */}
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-xs shadow-xs break-words leading-relaxed ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {/* Image Attachment (Bonus feature) */}
                    {msg.fileUrl && (
                      <div className="mt-2 overflow-hidden rounded-xl border border-white/20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={msg.fileUrl}
                          alt="Attachment"
                          className="max-h-48 max-w-full rounded-lg object-cover"
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
        <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-1.5 text-[11px] text-slate-500 italic animate-pulse">
          <span className="flex gap-0.5">
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
        <div className="border-t border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center gap-2">
            <input
              type="url"
              placeholder="Paste image URL (e.g. https://images.unsplash.com/...)"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              type="button"
              onClick={() => {
                setAttachmentUrl('');
                setShowAttachmentInput(false);
              }}
              className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Message Input Box */}
      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-2 border-t border-slate-200/80 bg-white p-3.5"
      >
        {/* Attachment Toggle Button */}
        <button
          type="button"
          onClick={() => setShowAttachmentInput(!showAttachmentInput)}
          className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors cursor-pointer ${
            showAttachmentInput || attachmentUrl
              ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
              : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
          title="Attach image link"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>

        <input
          type="text"
          placeholder="Type a message to your team (press Enter to send)..."
          value={inputText}
          onChange={handleInputChange}
          disabled={sending}
          className="flex-1 rounded-xl border border-slate-200/90 bg-slate-50/60 px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
        />

        <button
          type="submit"
          disabled={sending || (!inputText.trim() && !attachmentUrl)}
          className="flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-4 text-xs font-bold text-white shadow-xs hover:from-indigo-700 hover:to-cyan-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <span>Send</span>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
}
