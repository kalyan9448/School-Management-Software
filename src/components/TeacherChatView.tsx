// =============================================================================
// TeacherChatView.tsx — Teacher-side chat component
// Mobile: inbox ↔ chat thread (full-screen toggle)
// Desktop: split-panel (inbox + chat thread side by side)
// =============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  Send,
  Search,
  Clock,
  CheckCheck,
  Check,
  Users,
  GraduationCap,
  Filter,
  ArrowLeft,
} from 'lucide-react';
import type { Conversation, ChatMessage } from '../types';
import {
  subscribeToMessages,
  subscribeToConversations,
  sendMessage,
  markMessagesRead,
  createChatNotification,
} from '../services/chatService';
import { useAuth } from '../contexts/AuthContext';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRelativeTime(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatMessageTime(isoString: string): string {
  if (!isoString) return '';
  return new Date(isoString).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function formatMessageDate(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  teacherId: string;
  teacherName: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TeacherChatView({ teacherId, teacherName }: Props) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStudent, setFilterStudent] = useState('');
  // Mobile: 'inbox' | 'chat'
  const [mobilePanel, setMobilePanel] = useState<'inbox' | 'chat'>('inbox');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unsubMsgsRef = useRef<(() => void) | null>(null);

  // ── Subscribe to conversations ───────────────────────────────────────────
  useEffect(() => {
    if (!user?.email) return;
    const unsub = subscribeToConversations(user.email, 'teacher', (convs) => {
      setConversations(convs);
    });
    return () => unsub();
  }, [user?.email]);

  // ── Subscribe to messages ────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }
    unsubMsgsRef.current?.();
    const unsub = subscribeToMessages(selectedConversation.id, (msgs) => {
      setMessages(msgs);
    });
    unsubMsgsRef.current = unsub;
    markMessagesRead(selectedConversation.id, 'teacher').catch(() => {});
    return () => unsub();
  }, [selectedConversation?.id]);

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Select conversation ──────────────────────────────────────────────────
  const handleSelectConversation = useCallback((conv: Conversation) => {
    setSelectedConversation(conv);
    markMessagesRead(conv.id, 'teacher').catch(() => {});
    setMobilePanel('chat'); // switch to chat view on mobile
  }, []);

  // ── Back to inbox (mobile) ───────────────────────────────────────────────
  const handleBackToInbox = () => {
    setMobilePanel('inbox');
  };

  // ── Send message ─────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;
    setSending(true);
    const msgText = newMessage.trim();
    setNewMessage('');

    try {
      await sendMessage({
        conversationId: selectedConversation.id,
        senderId: teacherId,
        senderRole: 'teacher',
        senderName: user.name || teacherName,
        message: msgText,
      });
      await createChatNotification({
        recipientId: selectedConversation.parentId,
        senderName: user.name || teacherName,
        studentName: selectedConversation.studentName,
        message: msgText,
        conversationId: selectedConversation.id,
      });
    } catch (err) {
      console.error('[TeacherChatView] Failed to send message:', err);
      setNewMessage(msgText);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Group messages by date ───────────────────────────────────────────────
  const groupedMessages = messages.reduce<{ date: string; msgs: ChatMessage[] }[]>((groups, msg) => {
    const dateLabel = formatMessageDate(msg.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.date === dateLabel) {
      last.msgs.push(msg);
    } else {
      groups.push({ date: dateLabel, msgs: [msg] });
    }
    return groups;
  }, []);

  // ── Filtered conversations ───────────────────────────────────────────────
  const filteredConvs = conversations.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchQuery = !q ||
      c.parentName?.toLowerCase().includes(q) ||
      c.studentName?.toLowerCase().includes(q) ||
      c.lastMessage?.toLowerCase().includes(q);
    const matchStudent = !filterStudent || c.studentName === filterStudent;
    return matchQuery && matchStudent;
  });

  const uniqueStudents = [...new Set(conversations.map(c => c.studentName))].sort();
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadTeacher ?? 0), 0);

  // ── Shared: Inbox panel ──────────────────────────────────────────────────
  const InboxPanel = (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Search + Filter */}
      <div className="p-3 space-y-2 border-b border-gray-50 bg-gradient-to-b from-purple-50 to-white">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search parents or students…"
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
          />
        </div>
        {uniqueStudents.length > 1 && (
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <select
              value={filterStudent}
              onChange={e => setFilterStudent(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent appearance-none"
            >
              <option value="">All students</option>
              {uniqueStudents.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
        {filteredConvs.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-500 mb-1">
              {conversations.length === 0 ? 'No conversations yet' : 'No results'}
            </p>
            <p className="text-xs text-gray-400">
              {conversations.length === 0
                ? 'Parents can initiate chats from their portal.'
                : 'Try a different search term.'}
            </p>
          </div>
        ) : (
          filteredConvs.map(conv => {
            const isSelected = selectedConversation?.id === conv.id;
            const hasUnread = (conv.unreadTeacher ?? 0) > 0;
            return (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={`w-full text-left px-4 py-3.5 transition-all ${
                  isSelected ? 'bg-purple-50 border-r-2 border-r-purple-500' : 'hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-base text-white shadow-sm ${
                      isSelected ? 'bg-gradient-to-br from-purple-600 to-indigo-700' : 'bg-gradient-to-br from-purple-400 to-indigo-500'
                    }`}>
                      {conv.parentName?.charAt(0).toUpperCase() || 'P'}
                    </div>
                    {hasUnread && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                        {conv.unreadTeacher}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate ${hasUnread ? 'font-black text-gray-900' : 'font-medium text-gray-700'}`}>
                        {conv.parentName || 'Parent'}
                      </p>
                      <span className="text-[10px] text-gray-400 shrink-0">{formatRelativeTime(conv.updatedAt)}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <GraduationCap className="w-3 h-3 text-purple-400 shrink-0" />
                      <span className="text-xs text-purple-600 font-medium truncate">{conv.studentName}</span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${hasUnread ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                      {conv.lastMessage || 'No messages yet'}
                    </p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  // ── Shared: Chat Thread panel ────────────────────────────────────────────
  const ChatPanel = (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {!selectedConversation ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-full flex items-center justify-center mb-6 border border-purple-100">
            <MessageSquare className="w-12 h-12 text-purple-300" />
          </div>
          <h3 className="text-xl font-black text-gray-800 mb-2">Select a conversation</h3>
          <p className="text-gray-400 max-w-xs text-sm">Choose a parent conversation from the list to view and respond to messages.</p>
        </div>
      ) : (
        <>
          {/* Chat Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 bg-white">
            {/* Back button — only visible on mobile */}
            <button
              onClick={handleBackToInbox}
              className="md:hidden shrink-0 w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-base shadow-md shrink-0">
              {selectedConversation.parentName?.charAt(0).toUpperCase() || 'P'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-gray-900 text-base truncate leading-tight">
                {selectedConversation.parentName}
              </h3>
              <p className="text-xs text-purple-600 font-medium truncate">
                Parent of <span className="font-bold">{selectedConversation.studentName}</span>
                {selectedConversation.teacherSubject && (
                  <> · {selectedConversation.teacherSubject}</>
                )}
              </p>
            </div>
            <span className="shrink-0 text-xs text-gray-400 font-medium hidden sm:block">
              {formatRelativeTime(selectedConversation.updatedAt)}
            </span>
          </div>

          {/* Messages feed */}
          <div
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
            style={{ background: 'linear-gradient(180deg, #f8f7ff 0%, #fff 100%)' }}
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center mb-3">
                  <MessageSquare className="w-7 h-7 text-purple-300" />
                </div>
                <p className="text-gray-500 font-medium text-sm">No messages yet</p>
                <p className="text-gray-400 text-xs mt-1">Start the conversation!</p>
              </div>
            ) : (
              groupedMessages.map(group => (
                <div key={group.date}>
                  {/* Date separator */}
                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-xs font-bold text-gray-400 px-3 py-1 bg-gray-50 rounded-full border border-gray-100 whitespace-nowrap">
                      {group.date}
                    </span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  <div className="space-y-2">
                    {group.msgs.map((msg, i) => {
                      const isTeacher = msg.senderRole === 'teacher';
                      const showName = i === 0 || group.msgs[i - 1]?.senderRole !== msg.senderRole;
                      return (
                        <div key={msg.id} className={`flex ${isTeacher ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] sm:max-w-[70%] ${isTeacher ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                            {showName && !isTeacher && (
                              <span className="text-xs font-bold text-purple-600 px-1">{msg.senderName}</span>
                            )}
                            <div className={`px-3 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                              isTeacher
                                ? 'bg-purple-600 text-white rounded-br-sm'
                                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                            }`}>
                              {msg.message}
                            </div>
                            <div className={`flex items-center gap-1 px-1 ${isTeacher ? 'justify-end' : 'justify-start'}`}>
                              <Clock className="w-3 h-3 text-gray-300" />
                              <span className="text-[10px] text-gray-400">{formatMessageTime(msg.createdAt)}</span>
                              {isTeacher && (
                                msg.isRead
                                  ? <CheckCheck className="w-3 h-3 text-purple-400" />
                                  : <Check className="w-3 h-3 text-gray-300" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="px-3 py-3 border-t border-gray-100 bg-white">
            <div className="flex items-end gap-2">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100 transition-all">
                <textarea
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your reply…"
                  rows={1}
                  className="w-full px-4 pt-3 pb-2 bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none"
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!newMessage.trim() || sending}
                className="shrink-0 w-11 h-11 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-200 text-white rounded-2xl flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 text-center">
              Replying to <span className="font-bold">{selectedConversation.parentName}</span> about{' '}
              <span className="font-bold">{selectedConversation.studentName}</span>
            </p>
          </div>
        </>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900">Parent Messages</h2>
          <p className="text-gray-500 font-medium mt-0.5 text-xs sm:text-sm">Real-time conversations with parents about their children</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {totalUnread > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
              <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-pulse" />
              {totalUnread} unread
            </span>
          )}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 text-gray-600 rounded-full text-xs border border-gray-200">
            <Users className="w-3.5 h-3.5" />
            <span className="font-medium">{conversations.length}</span>
          </div>
        </div>
      </div>

      {/* ── MOBILE: one panel at a time ──────────────────────────────────── */}
      <div
        className="md:hidden flex-1"
        style={{ height: 'calc(100vh - 200px)', minHeight: '400px' }}
      >
        {mobilePanel === 'inbox' ? InboxPanel : ChatPanel}
      </div>

      {/* ── DESKTOP: side-by-side split panel ───────────────────────────── */}
      <div
        className="hidden md:flex gap-4 flex-1"
        style={{ height: 'calc(100vh - 240px)', minHeight: '520px' }}
      >
        {/* Left: fixed-width inbox */}
        <div className="w-72 lg:w-80 xl:w-96 shrink-0">
          {InboxPanel}
        </div>
        {/* Right: flexible chat thread */}
        <div className="flex-1 min-w-0">
          {ChatPanel}
        </div>
      </div>
    </div>
  );
}
