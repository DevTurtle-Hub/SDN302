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
  Users,
  X,
  FileText,
  Download,
  UploadCloud,
  CheckCheck,
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

export interface TeamMemberPresence {
  userId: string;
  role: string;
  name?: string;
  email?: string;
}

interface TeamChatProps {
  teamId: string;
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
  teamMembers: TeamMemberPresence[];
}

export default function TeamChat({ teamId, currentUser, teamMembers }: TeamChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{ [userId: string]: string }>({});
  const [isConnected, setIsConnected] = useState(false);

  // Attachment states (Bonus Feature)
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<{
    name: string;
    url: string;
    isImage: boolean;
  } | null>(null);
  const [showAttachmentInput, setShowAttachmentInput] = useState(false);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);

  // Online / Offline Presence states (Bonus Feature)
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([currentUser.id]);
  const [showPresenceModal, setShowPresenceModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // 3. Presence Heartbeat (Every 6s) - Online / Offline Tracking (Bonus Feature)
  useEffect(() => {
    let isMounted = true;
    const sendPresence = async () => {
      try {
        const res = await fetch(`/api/teams/${teamId}/presence`, {
          method: 'POST',
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          if (Array.isArray(data.onlineUserIds)) {
            setOnlineUserIds(data.onlineUserIds);
          }
        }
      } catch {
        // silent
      }
    };

    sendPresence();
    const interval = setInterval(sendPresence, 6000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [teamId]);

  // 4. Typing Sync Poll (Every 2s) - Typing Indicator (Bonus Feature)
  useEffect(() => {
    let isMounted = true;
    const fetchTyping = async () => {
      try {
        const res = await fetch(`/api/teams/${teamId}/typing`);
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.typingUsers) {
            setTypingUsers(data.typingUsers);
          }
        }
      } catch {
        // silent
      }
    };

    const interval = setInterval(fetchTyping, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [teamId]);

  // 5. Real-time Subscription (Pusher / SSE instant listener)
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

  // 6. Adaptive Fast Poller (1000ms active, instant on focus, 3000ms background)
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

  // Handle local file selection (image or document)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit. Please select a smaller file.');
      return;
    }

    const isImg = file.type.startsWith('image/');
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAttachmentFile({
        name: file.name,
        url: result,
        isImage: isImg,
      });
      setShowAttachmentInput(false);
    };
    reader.readAsDataURL(file);
  };

  // Send message with 0ms OPTIMISTIC UI + Instant Sync Burst
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const contentToSend = inputText.trim();
    const urlToSend = attachmentFile?.url || attachmentUrl.trim();
    const fileNameToSend = attachmentFile?.name || (attachmentUrl ? 'Image Attachment' : null);

    if (!contentToSend && !urlToSend) return;

    // 1. Immediately reset form
    setInputText('');
    setAttachmentUrl('');
    setAttachmentFile(null);
    setShowAttachmentInput(false);

    // 2. Add optimistic message to UI immediately (0ms delay!)
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      content:
        contentToSend ||
        (attachmentFile?.isImage
          ? 'Shared an image attachment'
          : `Shared document: ${fileNameToSend}`),
      teamId,
      senderId: currentUser.id,
      fileUrl: urlToSend || null,
      fileName: fileNameToSend,
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
          content:
            contentToSend ||
            (attachmentFile?.isImage
              ? 'Shared an image attachment'
              : `Shared document: ${fileNameToSend}`),
          fileUrl: urlToSend || null,
          fileName: fileNameToSend,
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

  // Online / Offline counts
  const isOnline = (userId: string) =>
    userId === currentUser.id || onlineUserIds.includes(userId);

  const onlineCount = teamMembers.filter((m) => isOnline(m.userId)).length;
  const offlineCount = Math.max(0, teamMembers.length - onlineCount);

  // Filter out current user from typing names
  const activeTypingNames = Object.entries(typingUsers)
    .filter(([uid]) => uid !== currentUser.id)
    .map(([, name]) => name);

  return (
    <div className="flex flex-col h-[680px] rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden relative">
      {/* Hidden native file input for direct computer uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*,.pdf,.doc,.docx,.txt"
        className="hidden"
      />

      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">
              Team Real-Time Room
            </h3>
            <p className="text-xs text-slate-500">Live chat, presence & file attachments</p>
          </div>
        </div>

        {/* Presence Indicator & Member Drawer Trigger (Bonus Feature) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPresenceModal(!showPresenceModal)}
            className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-1.5 shadow-2xs hover:border-indigo-300 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Click to view online and offline team members"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-slate-700">
              <span className="text-emerald-700 font-black">{onlineCount} Online</span>
              <span className="mx-1.5 text-slate-300">&bull;</span>
              <span className="text-slate-500">{offlineCount} Offline</span>
            </span>
            <Users className="h-3.5 w-3.5 text-slate-400 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Online / Offline Presence Drawer / Popover (Bonus Feature) */}
      {showPresenceModal && (
        <div className="absolute top-[68px] right-6 z-40 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-indigo-600" />
              Team Members ({teamMembers.length})
            </h4>
            <button
              onClick={() => setShowPresenceModal(false)}
              className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 divide-y divide-slate-50">
            {teamMembers.map((m) => {
              const userOnline = isOnline(m.userId);
              const isCurrent = m.userId === currentUser.id;

              return (
                <div key={m.userId} className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative shrink-0">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-bold text-slate-700">
                        {m.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white ${
                          userOnline ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {m.name || 'Member'} {isCurrent && '(You)'}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{m.email}</p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5 pl-2">
                    {getRoleBadge(m.role)}
                    <span
                      className={`text-[10px] font-bold ${
                        userOnline ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    >
                      {userOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
            const userOnline = isOnline(msg.senderId);

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar with live presence indicator */}
                <div className="relative shrink-0">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-black shadow-xs ${
                      isMe
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                    title={`${msg.sender?.name} (${senderRole}) - ${userOnline ? 'Online' : 'Offline'}`}
                  >
                    {msg.sender?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  {/* Live Online / Offline Dot on Avatar (Bonus Feature) */}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                      userOnline ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                    title={userOnline ? 'Online now' : 'Offline'}
                  />
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

                    {/* Optimistic Sending Status */}
                    {msg.id.startsWith('temp-') && (
                      <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-indigo-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-white/70 animate-ping" />
                        <span>Sending...</span>
                      </div>
                    )}

                    {/* Image / File Attachment (Bonus Feature) */}
                    {msg.fileUrl && (
                      <div className="mt-2.5 overflow-hidden rounded-xl">
                        {msg.fileUrl.startsWith('data:image') ||
                        msg.fileUrl.match(/\.(jpeg|jpg|png|gif|webp|svg)($|\?)/i) ? (
                          <div className="overflow-hidden rounded-xl border border-black/10">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={msg.fileUrl}
                              alt={msg.fileName || 'Attachment'}
                              onClick={() => setPreviewImageModal(msg.fileUrl || null)}
                              className="max-h-56 max-w-full rounded-lg object-cover cursor-pointer hover:opacity-95 transition-opacity"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <a
                            href={msg.fileUrl}
                            download={msg.fileName || 'attachment'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-3 rounded-xl p-3 text-xs font-semibold transition-colors ${
                              isMe
                                ? 'bg-indigo-700/60 text-white hover:bg-indigo-700'
                                : 'bg-slate-50 border border-slate-200 text-slate-800 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold truncate">
                                {msg.fileName || 'Attached Document'}
                              </p>
                              <span className="text-[10px] opacity-80 flex items-center gap-1">
                                Click to download
                              </span>
                            </div>
                            <Download className="h-4 w-4 opacity-75" />
                          </a>
                        )}
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

      {/* Typing Indicator Bar (Bonus Feature) */}
      {activeTypingNames.length > 0 && (
        <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-6 py-2 text-xs text-slate-500 italic animate-pulse">
          <span className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce" />
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
          </span>
          <span className="font-semibold text-slate-600">
            {activeTypingNames.join(', ')} {activeTypingNames.length > 1 ? 'are' : 'is'} typing...
          </span>
        </div>
      )}

      {/* Attachment Preview Chip (Bonus Feature) */}
      {attachmentFile && (
        <div className="border-t border-slate-200 bg-indigo-50/70 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {attachmentFile.isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={attachmentFile.url}
                alt="Upload preview"
                className="h-10 w-10 rounded-lg object-cover border border-indigo-200"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                <FileText className="h-5 w-5" />
              </div>
            )}
            <div className="truncate">
              <p className="text-xs font-bold text-slate-900 truncate">
                {attachmentFile.name}
              </p>
              <span className="text-[10px] font-semibold text-indigo-700">
                Ready to send with message
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAttachmentFile(null)}
            className="p-1 rounded-lg text-slate-400 hover:bg-white hover:text-slate-600 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Attachment Option Inputs (Bonus Feature) */}
      {showAttachmentInput && (
        <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-2xs transition-colors cursor-pointer"
            >
              <UploadCloud className="h-4 w-4" />
              Upload from Device
            </button>
            <span className="text-xs text-slate-400 font-medium">or paste image link:</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <ImageIcon className="h-4 w-4" />
              </div>
              <input
                type="url"
                placeholder="Paste image URL (https://images.unsplash.com/...)"
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
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
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
            showAttachmentInput || attachmentUrl || attachmentFile
              ? 'border-indigo-400 bg-indigo-50 text-indigo-600'
              : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
          title="Attach image or file"
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
          disabled={!inputText.trim() && !attachmentUrl && !attachmentFile}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
          title="Send message"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>

      {/* Fullscreen Image Preview Modal */}
      {previewImageModal && (
        <div
          onClick={() => setPreviewImageModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImageModal}
              alt="Attachment Fullscreen"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setPreviewImageModal(null)}
              className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/90 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
