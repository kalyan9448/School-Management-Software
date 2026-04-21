// =============================================================================
// Chat Service — Parent–Teacher Real-Time Messaging
// Firestore structure:
//   conversations/{conversationId}            ← Conversation doc
//   conversations/{conversationId}/messages/{messageId} ← ChatMessage docs
// =============================================================================

import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Conversation, ChatMessage } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getSchoolId(): string {
  return sessionStorage.getItem('active_school_id') || '';
}

function tsToISO(ts: any): string {
  if (!ts) return new Date().toISOString();
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (typeof ts === 'string') return ts;
  return new Date().toISOString();
}

function fromFirestore<T>(snap: any): T {
  const data = snap.data() || {};
  // Convert Firestore Timestamps to ISO strings
  const converted: Record<string, any> = { id: snap.id };
  Object.entries(data).forEach(([k, v]) => {
    converted[k] = v instanceof Timestamp ? v.toDate().toISOString() : v;
  });
  return converted as T;
}

// ── Conversation Operations ───────────────────────────────────────────────────

/**
 * Get or create a conversation for a given parent↔teacher↔student triple.
 * Checks for existing conversation first; creates one if it doesn't exist.
 */
export async function getOrCreateConversation(params: {
  parentId: string;
  teacherId: string;
  studentId: string;
  classId: string;
  parentName: string;
  teacherName: string;
  teacherEmail?: string;
  teacherSubject?: string;
  studentName: string;
  school_id?: string;
}): Promise<Conversation> {
  const schoolId = params.school_id || getSchoolId();
  const convsRef = collection(db, 'conversations');

  // Query only by parentId (single-field, no index needed) then filter in JS.
  // This avoids requiring a Firestore composite index.
  const snap = await getDocs(
    query(convsRef, where('parentId', '==', params.parentId))
  );

  const existingDoc = snap.docs.find(d => {
    const data = d.data();
    return data.teacherId === params.teacherId && data.studentId === params.studentId;
  });

  if (existingDoc) {
    const docData = existingDoc.data();
    // Retroactively add teacherEmail if it's missing on older test chats
    if (!docData.teacherEmail && params.teacherEmail) {
      await updateDoc(doc(db, 'conversations', existingDoc.id), {
        teacherEmail: params.teacherEmail
      });
      return fromFirestore<Conversation>({ ...existingDoc, data: () => ({ ...docData, teacherEmail: params.teacherEmail }) } as any);
    }
    return fromFirestore<Conversation>(existingDoc);
  }

  // Create a new conversation
  const now = new Date().toISOString();
  const newConv: Omit<Conversation, 'id'> = {
    school_id: schoolId,
    parentId: params.parentId,
    teacherId: params.teacherId,
    studentId: params.studentId,
    classId: params.classId,
    parentName: params.parentName,
    teacherName: params.teacherName,
    teacherEmail: params.teacherEmail || '',
    teacherSubject: params.teacherSubject || '',
    studentName: params.studentName,
    lastMessage: '',
    updatedAt: now,
    unreadParent: 0,
    unreadTeacher: 0,
    created_at: now,
  };

  const docRef = await addDoc(convsRef, newConv);
  return { id: docRef.id, ...newConv };
}

/**
 * Fetch all conversations where the current user is the parent.
 */
export async function getConversationsByParent(parentId: string): Promise<Conversation[]> {
  const schoolId = getSchoolId();
  const snap = await getDocs(
    query(
      collection(db, 'conversations'),
      where('parentId', '==', parentId),
      where('school_id', '==', schoolId)
    )
  );
  return snap.docs
    .map(d => fromFirestore<Conversation>(d))
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}

/**
 * Fetch all conversations where the current user is the teacher.
 */
export async function getConversationsByTeacher(teacherId: string): Promise<Conversation[]> {
  const schoolId = getSchoolId();
  const snap = await getDocs(
    query(
      collection(db, 'conversations'),
      where('teacherId', '==', teacherId),
      where('school_id', '==', schoolId)
    )
  );
  return snap.docs
    .map(d => fromFirestore<Conversation>(d))
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}

// ── Message Operations ────────────────────────────────────────────────────────

/**
 * Send a message in a conversation and update the conversation's lastMessage.
 */
export async function sendMessage(params: {
  conversationId: string;
  senderId: string;
  senderRole: 'parent' | 'teacher';
  senderName: string;
  message: string;
}): Promise<ChatMessage> {
  const now = new Date().toISOString();
  const msgRef = collection(db, 'conversations', params.conversationId, 'messages');

  const newMsg: Omit<ChatMessage, 'id'> = {
    conversationId: params.conversationId,
    senderId: params.senderId,
    senderRole: params.senderRole,
    senderName: params.senderName,
    message: params.message.trim(),
    createdAt: now,
    isRead: false,
  };

  const docRef = await addDoc(msgRef, newMsg);

  // Update the conversation's last message + unread counter for the recipient
  const convRef = doc(db, 'conversations', params.conversationId);
  const convSnap = await getDoc(convRef);
  const convData = convSnap.data() as Conversation | undefined;

  const update: Partial<Conversation> & { [k: string]: any } = {
    lastMessage: params.message.trim(),
    lastMessageSenderRole: params.senderRole,
    updatedAt: now,
  };

  if (params.senderRole === 'parent') {
    update.unreadTeacher = ((convData?.unreadTeacher ?? 0) + 1);
  } else {
    update.unreadParent = ((convData?.unreadParent ?? 0) + 1);
  }

  await updateDoc(convRef, update);

  return { id: docRef.id, ...newMsg };
}

/**
 * Fetch all messages for a conversation (one-time).
 */
export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const snap = await getDocs(
    query(
      collection(db, 'conversations', conversationId, 'messages')
    )
  );
  return snap.docs
    .map(d => fromFirestore<ChatMessage>(d))
    .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
}

// ── Real-Time Subscriptions ───────────────────────────────────────────────────

/**
 * Subscribe to messages in a conversation in real-time.
 * Returns an unsubscribe function.
 */
export function subscribeToMessages(
  conversationId: string,
  callback: (messages: ChatMessage[]) => void
): Unsubscribe {
  // No orderBy — avoids requiring a Firestore index on the subcollection.
  // Sort by createdAt in JS after receiving the snapshot.
  const q = query(
    collection(db, 'conversations', conversationId, 'messages')
  );

  return onSnapshot(q, (snap) => {
    const msgs = snap.docs
      .map(d => fromFirestore<ChatMessage>(d))
      .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
    callback(msgs);
  }, (err) => {
    console.error('[chatService] subscribeToMessages error:', err);
  });
}

/**
 * Subscribe to the list of conversations for a parent or teacher in real-time.
 * Returns an unsubscribe function.
 */
export function subscribeToConversations(
  identifier: string, // parentId for parents, email for teachers
  role: 'parent' | 'teacher',
  callback: (conversations: Conversation[]) => void
): Unsubscribe {
  const field = role === 'parent' ? 'parentId' : 'teacherEmail';

  // Single-field query only — no orderBy to avoid requiring a Firestore composite index.
  // We sort the results in JS after receiving them.
  const q = query(
    collection(db, 'conversations'),
    where(field, '==', identifier)
  );

  return onSnapshot(q, (snap) => {
    const convs = snap.docs
      .map(d => fromFirestore<Conversation>(d))
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    callback(convs);
  }, (err) => {
    console.error('[chatService] subscribeToConversations error:', err);
  });
}

// ── Read Status ───────────────────────────────────────────────────────────────

/**
 * Mark all unread messages in a conversation as read (for a given reader).
 * Also resets the unread counter on the conversation doc.
 */
export async function markMessagesRead(
  conversationId: string,
  readerRole: 'parent' | 'teacher'
): Promise<void> {
  const msgsRef = collection(db, 'conversations', conversationId, 'messages');
  const unreadSnap = await getDocs(
    query(msgsRef, where('isRead', '==', false))
  );

  if (unreadSnap.empty) return;

  const batch = writeBatch(db);
  unreadSnap.docs.forEach(d => {
    const data = d.data() as ChatMessage;
    // Only mark messages sent by the OTHER role as read
    if (data.senderRole !== readerRole) {
      batch.update(d.ref, { isRead: true });
    }
  });
  await batch.commit();

  // Reset the unread counter
  const convRef = doc(db, 'conversations', conversationId);
  const resetField = readerRole === 'parent' ? 'unreadParent' : 'unreadTeacher';
  await updateDoc(convRef, { [resetField]: 0 });
}

// ── Notifications ─────────────────────────────────────────────────────────────

/**
 * Create an in-app notification for the message recipient.
 */
export async function createChatNotification(params: {
  recipientId: string;
  senderName: string;
  studentName: string;
  message: string;
  conversationId: string;
  schoolId?: string;
}): Promise<void> {
  try {
    const schoolId = params.schoolId || getSchoolId();
    await addDoc(collection(db, 'notifications'), {
      school_id: schoolId,
      userId: params.recipientId,
      type: 'general',
      title: `New message from ${params.senderName}`,
      message: `Re: ${params.studentName} — "${params.message.length > 60 ? params.message.slice(0, 60) + '...' : params.message}"`,
      date: new Date().toISOString(),
      read: false,
      link: `/chat?conversation=${params.conversationId}`,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    // Notification failure is non-critical — swallow and log
    console.warn('[chatService] Failed to create notification:', err);
  }
}
