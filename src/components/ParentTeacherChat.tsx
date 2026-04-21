// =============================================================================
// ParentTeacherChat.tsx — Parent-side chat component
// Shows: teacher list with "Chat" buttons → split-panel chat thread
// =============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  Send,
  ArrowLeft,
  Search,
  BookOpen,
  Clock,
  CheckCheck,
  Check,
  ChevronRight,
} from 'lucide-react';
import type { Student, Conversation, ChatMessage } from '../types';
import {
  getOrCreateConversation,
  subscribeToMessages,
  subscribeToConversations,
  sendMessage,
  markMessagesRead,
  createChatNotification,
} from '../services/chatService';
import { db } from '../services/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TeacherInfo {
  id: string;
  name: string;
  subject: string;
  class: string;
  section: string;
  email?: string;
}

interface Props {
  selectedChild: Student | null;
  parentId: string;
}

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
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
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

// ── Main Component ────────────────────────────────────────────────────────────

export function ParentTeacherChat({ selectedChild, parentId }: Props) {
  const { user } = useAuth();
  const [view, setView] = useState<'teachers' | 'chat'>('teachers');
  const [teachers, setTeachers] = useState<TeacherInfo[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  // ... rest of state stays the same
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openingChat, setOpeningChat] = useState<string | null>(null); // teacherId being opened
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unsubConvsRef = useRef<(() => void) | null>(null);
  const unsubMsgsRef = useRef<(() => void) | null>(null);

  // ── Load teachers assigned to the selected child ──────────────────────────
  useEffect(() => {
    if (!selectedChild) {
      setTeachers([]);
      setTeachersLoading(false);
      setError(null);
      return;
    }
    setTeachersLoading(true);
    setError(null);

    const loadTeachers = async () => {
      try {
        const schoolId = selectedChild.school_id || sessionStorage.getItem('active_school_id') || '';
        
        if (!schoolId) {
          console.warn('[ParentTeacherChat] No schoolId found for student:', selectedChild.name);
          setTeachers([]);
          setTeachersLoading(false);
          return;
        }

        const snap = await getDocs(
          query(
            collection(db, 'teachers'),
            where('school_id', '==', schoolId)
          )
        );

        const childClass = selectedChild.class?.trim().toLowerCase();
        const childSection = selectedChild.section?.trim().toLowerCase();

        const matched: TeacherInfo[] = [];
        snap.docs.forEach(d => {
          const t = d.data();
          const classes: { class: string; section: string; subject: string }[] = t.classes || [];
          const matchingClasses = classes.filter(
            c => c.class?.trim().toLowerCase() === childClass && 
                 c.section?.trim().toLowerCase() === childSection
          );
          matchingClasses.forEach(c => {
            matched.push({
              id: d.id,
              name: t.name || 'Teacher',
              subject: c.subject || 'General',
              class: c.class,
              section: c.section,
              email: t.email,
            });
          });
        });

        setTeachers(matched);
      } catch (err: any) {
        console.error('[ParentTeacherChat] Failed to load teachers:', err);
        if (err.code === 'permission-denied') {
          setError('Access Denied: Please ensure Firestore Security Rules are deployed.');
        } else {
          setError('Failed to load teachers. Please try again later.');
        }
      } finally {
        setTeachersLoading(false);
      }
    };

    loadTeachers();
  }, [selectedChild?.id]);

  // ── Subscribe to conversations for this parent ────────────────────────────
  useEffect(() => {
    if (!parentId) return;

    unsubConvsRef.current?.();
    const unsub = subscribeToConversations(parentId, 'parent', (convs) => {
      setConversations(convs);
    });
    unsubConvsRef.current = unsub;

    return () => unsub();
  }, [parentId]);

  // ── Subscribe to messages when conversation changes ───────────────────────
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

    // Mark messages as read when opening conversation
    markMessagesRead(selectedConversation.id, 'parent').catch(() => {});

    return () => unsub();
  }, [selectedConversation?.id]);

  // ── Auto-scroll to latest message ─────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Open/create a chat with a teacher ────────────────────────────────────
  const handleOpenChat = useCallback(async (teacher: TeacherInfo) => {
    if (!selectedChild || !user) return;
    setOpeningChat(teacher.id);
    setError(null);

    try {
      const conv = await getOrCreateConversation({
        parentId,
        teacherId: teacher.id,
        studentId: selectedChild.id,
        classId: `${selectedChild.class}-${selectedChild.section}`,
        parentName: user.name || 'Parent',
        teacherName: teacher.name,
        teacherEmail: teacher.email,
        teacherSubject: teacher.subject,
        studentName: selectedChild.name,
        school_id: selectedChild.school_id || '',
      });

      setSelectedConversation(conv);
      setView('chat');
    } catch (err: any) {
      console.error('[ParentTeacherChat] Failed to open chat:', err);
      if (err?.code === 'permission-denied') {
        setError('Access denied. Deploy the updated Firestore Security Rules in the Firebase Console first.');
      } else {
        setError(`Failed to open chat: ${err?.message || 'Unknown error'}`);
      }
    } finally {
      setOpeningChat(null);
    }
  }, [selectedChild, user, parentId]);

  // ── Select an existing conversation ──────────────────────────────────────
  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    markMessagesRead(conv.id, 'parent').catch(() => {});
  };

  // ── Send a message ─────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;
    setSending(true);
    const msgText = newMessage.trim();
    setNewMessage('');

    try {
      await sendMessage({
        conversationId: selectedConversation.id,
        senderId: parentId,
        senderRole: 'parent',
        senderName: user.name || 'Parent',
        message: msgText,
      });

      // Notify teacher
      await createChatNotification({
        recipientId: selectedConversation.teacherId,
        senderName: user.name || 'Parent',
        studentName: selectedConversation.studentName,
        message: msgText,
        conversationId: selectedConversation.id,
      });
    } catch (err) {
      console.error('[ParentTeacherChat] Failed to send message:', err);
      setNewMessage(msgText); // restore on error
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

  // ── Group messages by date ─────────────────────────────────────────────
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

  // ── Filter teachers by search ─────────────────────────────────────────
  const filteredTeachers = teachers.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Total unread count ────────────────────────────────────────────────
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadParent ?? 0), 0);

  // ── No child selected ─────────────────────────────────────────────────
  if (!selectedChild) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-4 border border-purple-100">
          <MessageSquare className="w-10 h-10 text-purple-300" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">No student selected</h3>
        <p className="text-gray-500">Please select a child from the dashboard to start chatting with teachers.</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: Teacher List
  // ─────────────────────────────────────────────────────────────────────────
  if (view === 'teachers') {
    return (
      <div className="flex flex-col h-full gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Chat with Teachers</h2>
            <p className="text-gray-500 font-medium mt-0.5">
              Teachers of <span className="text-purple-700 font-bold">{selectedChild.name}</span> ({selectedChild.class}-{selectedChild.section})
            </p>
          </div>
          {totalUnread > 0 && (
            <span className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">
              <span className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
              {totalUnread} unread
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Teacher List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search teachers or subjects…"
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent shadow-sm"
              />
            </div>

            {teachersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3" />
                        <div className="h-3 bg-gray-100 rounded w-1/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-red-50 rounded-2xl border border-red-100 p-12 text-center shadow-sm">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-red-600 font-bold">!</span>
                </div>
                <h3 className="text-lg font-bold text-red-700 mb-1">Error Loading Teachers</h3>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-700 mb-1">No teachers found</h3>
                <p className="text-gray-500 text-sm">
                  {teachers.length === 0
                    ? "No teachers are assigned to your child's class yet."
                    : 'No teachers match your search.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTeachers.map((teacher, idx) => {
                  const existingConv = conversations.find(
                    c => c.teacherId === teacher.id && c.studentId === selectedChild.id
                  );
                  const unread = existingConv?.unreadParent ?? 0;

                  return (
                    <div
                      key={`${teacher.id}-${idx}`}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 hover:border-purple-200 group"
                    >
                      <div className="flex items-center gap-4 p-5">
                        {/* Avatar */}
                        <div className="relative">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md">
                            {teacher.name.charAt(0).toUpperCase()}
                          </div>
                          {unread > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow">
                              {unread}
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 text-lg truncate">{teacher.name}</h3>
                            {unread > 0 && (
                              <span className="shrink-0 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-bold">
                                {unread} new
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-sm text-purple-700 font-medium">
                              <BookOpen className="w-3.5 h-3.5" />
                              {teacher.subject}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="text-sm text-gray-500">
                              Class {teacher.class}-{teacher.section}
                            </span>
                          </div>
                          {existingConv?.lastMessage && (
                            <p className="text-sm text-gray-400 mt-1 truncate max-w-xs">
                              {existingConv.lastMessage}
                            </p>
                          )}
                        </div>

                        {/* Chat Button */}
                        <button
                          onClick={() => handleOpenChat(teacher)}
                          disabled={openingChat === teacher.id}
                          className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 disabled:opacity-60 disabled:cursor-wait group-hover:bg-purple-700"
                        >
                          {openingChat === teacher.id ? (
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <MessageSquare className="w-4 h-4" />
                          )}
                          {existingConv ? 'Open Chat' : 'Start Chat'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Conversations Sidebar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 bg-gradient-to-r from-purple-50 to-white">
              <h3 className="font-black text-gray-900 text-sm uppercase tracking-wide">Recent Conversations</h3>
            </div>
            {conversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No conversations yet.<br />Click "Start Chat" to begin.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => { handleSelectConversation(conv); setView('chat'); }}
                    className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {conv.teacherName?.charAt(0).toUpperCase()}
                        {(conv.unreadParent ?? 0) > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center">
                            {conv.unreadParent}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{conv.teacherName}</p>
                        <p className="text-xs text-gray-400 truncate">{conv.lastMessage || 'No messages yet'}</p>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span className="text-[10px] text-gray-400">{conv.updatedAt ? formatRelativeTime(conv.updatedAt) : ''}</span>
                        <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-purple-500 transition-colors" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: Chat Thread
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full" style={{ minHeight: '600px' }}>
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-gray-100 mb-4">
        <button
          onClick={() => { setView('teachers'); setSelectedConversation(null); }}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
        </button>
        {selectedConversation && (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shrink-0">
              {selectedConversation.teacherName?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-gray-900 text-lg truncate leading-tight">
                {selectedConversation.teacherName}
              </h3>
              <p className="text-sm text-purple-600 font-medium">
                {selectedConversation.teacherSubject} · Re: {selectedConversation.studentName}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Conversation list + Chat split */}
      <div className="flex flex-1 gap-4 overflow-hidden" style={{ minHeight: 0 }}>
        {/* Left: Conversation List */}
        <div className="hidden lg:flex flex-col w-72 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 bg-gradient-to-r from-purple-50 to-white">
            <p className="text-xs font-black text-gray-500 uppercase tracking-wide">Conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={`w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors group ${selectedConversation?.id === conv.id ? 'bg-purple-50 border-r-2 border-purple-500' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0 mt-0.5">
                    {conv.teacherName?.charAt(0).toUpperCase()}
                    {(conv.unreadParent ?? 0) > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center">
                        {conv.unreadParent}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-sm truncate ${conv.unreadParent ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {conv.teacherName}
                      </p>
                      <span className="text-[10px] text-gray-400 shrink-0">{formatRelativeTime(conv.updatedAt)}</span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{conv.studentName}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{conv.lastMessage || 'No messages'}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Messages */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-w-0">
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">Select a conversation to view messages</p>
              </div>
            </div>
          ) : (
            <>
              {/* Messages feed */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ background: 'linear-gradient(180deg, #f8f7ff 0%, #fff 100%)' }}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                      <MessageSquare className="w-8 h-8 text-purple-300" />
                    </div>
                    <p className="text-gray-500 font-medium">No messages yet</p>
                    <p className="text-gray-400 text-sm mt-1">Say hi to {selectedConversation.teacherName}!</p>
                  </div>
                ) : (
                  groupedMessages.map(group => (
                    <div key={group.date}>
                      {/* Date separator */}
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-gray-100" />
                        <span className="text-xs font-bold text-gray-400 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                          {group.date}
                        </span>
                        <div className="flex-1 h-px bg-gray-100" />
                      </div>

                      {/* Messages */}
                      <div className="space-y-2">
                        {group.msgs.map((msg, i) => {
                          const isParent = msg.senderRole === 'parent';
                          const showName = i === 0 || group.msgs[i - 1]?.senderRole !== msg.senderRole;

                          return (
                            <div key={msg.id} className={`flex ${isParent ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[75%] ${isParent ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                {showName && !isParent && (
                                  <span className="text-xs font-bold text-purple-600 px-1">{msg.senderName}</span>
                                )}
                                <div
                                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                    isParent
                                      ? 'bg-purple-600 text-white rounded-br-sm'
                                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                                  }`}
                                >
                                  {msg.message}
                                </div>
                                <div className={`flex items-center gap-1 px-1 ${isParent ? 'justify-end' : 'justify-start'}`}>
                                  <Clock className="w-3 h-3 text-gray-300" />
                                  <span className="text-[11px] text-gray-400">{formatMessageTime(msg.createdAt)}</span>
                                  {isParent && (
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
              <div className="px-5 py-4 border-t border-gray-100 bg-white">
                <div className="flex items-end gap-3">
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100 transition-all">
                    <textarea
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                      rows={2}
                      className="w-full px-4 pt-3 pb-2 bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!newMessage.trim() || sending}
                    className="shrink-0 w-12 h-12 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-200 text-white rounded-2xl flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-2 text-center">
                  Chatting about <span className="font-bold">{selectedConversation.studentName}</span>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
