// =============================================================================
// Real-time Subscription Utilities — Firestore Listeners
// Enables real-time updates for exam scores, attendance, and other data
// =============================================================================

import { db } from '../services/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
  type QueryConstraint,
  DocumentData,
} from 'firebase/firestore';
import type { ExamScore, AttendanceRecord } from '../types';

// Real-time callback types
export type ExamScoreChangeCallback = (scores: ExamScore[], changeType: 'added' | 'modified' | 'removed') => void;
export type AttendanceChangeCallback = (records: AttendanceRecord[], changeType: 'added' | 'modified' | 'removed') => void;

// ==================== EXAM SCORE SUBSCRIPTIONS ====================

/**
 * Subscribe to real-time exam scores for a specific student
 * Automatically detects changes and calls the callback
 */
export function subscribeToStudentExamScores(
  studentId: string,
  onUpdate: ExamScoreChangeCallback
): Unsubscribe {
  const q = query(
    collection(db, 'exam_scores'),
    where('studentId', '==', studentId)
  );

  return onSnapshot(q, (snapshot) => {
    const changes = snapshot.docChanges();
    
    changes.forEach((change) => {
      const scoreData = change.doc.data() as ExamScore;
      
      switch (change.type) {
        case 'added':
          onUpdate([scoreData], 'added');
          break;
        case 'modified':
          onUpdate([scoreData], 'modified');
          break;
        case 'removed':
          onUpdate([scoreData], 'removed');
          break;
      }
    });
  });
}

/**
 * Subscribe to exam scores for an entire class
 */
export function subscribeToClassExamScores(
  classId: string,
  onUpdate: ExamScoreChangeCallback
): Unsubscribe {
  const q = query(
    collection(db, 'exam_scores'),
    where('classId', '==', classId)
  );

  return onSnapshot(q, (snapshot) => {
    const changes = snapshot.docChanges();
    
    changes.forEach((change) => {
      const scoreData = change.doc.data() as ExamScore;
      
      switch (change.type) {
        case 'added':
          onUpdate([scoreData], 'added');
          break;
        case 'modified':
          onUpdate([scoreData], 'modified');
          break;
        case 'removed':
          onUpdate([scoreData], 'removed');
          break;
      }
    });
  });
}

/**
 * Subscribe to exam scores for a specific subject and exam type
 * Useful for class-level analytics
 */
export function subscribeToExamTypeScores(
  classId: string,
  subjectId: string,
  examType: 'Unit Test' | 'Mid' | 'Final',
  onUpdate: ExamScoreChangeCallback
): Unsubscribe {
  const q = query(
    collection(db, 'exam_scores'),
    where('classId', '==', classId),
    where('subjectId', '==', subjectId),
    where('examType', '==', examType)
  );

  return onSnapshot(q, (snapshot) => {
    const changes = snapshot.docChanges();
    
    changes.forEach((change) => {
      const scoreData = change.doc.data() as ExamScore;
      
      switch (change.type) {
        case 'added':
          onUpdate([scoreData], 'added');
          break;
        case 'modified':
          onUpdate([scoreData], 'modified');
          break;
        case 'removed':
          onUpdate([scoreData], 'removed');
          break;
      }
    });
  });
}

// ==================== ATTENDANCE SUBSCRIPTIONS ====================

/**
 * Subscribe to real-time attendance for a specific student
 */
export function subscribeToStudentAttendance(
  studentId: string,
  onUpdate: AttendanceChangeCallback
): Unsubscribe {
  const q = query(
    collection(db, 'attendance'),
    where('studentId', '==', studentId)
  );

  return onSnapshot(q, (snapshot) => {
    const changes = snapshot.docChanges();
    
    changes.forEach((change) => {
      const attendanceData = change.doc.data() as AttendanceRecord;
      
      switch (change.type) {
        case 'added':
          onUpdate([attendanceData], 'added');
          break;
        case 'modified':
          onUpdate([attendanceData], 'modified');
          break;
        case 'removed':
          onUpdate([attendanceData], 'removed');
          break;
      }
    });
  });
}

/**
 * Subscribe to attendance for a specific class and date
 */
export function subscribeToClassAttendance(
  classId: string,
  date: string,
  onUpdate: AttendanceChangeCallback
): Unsubscribe {
  const q = query(
    collection(db, 'attendance'),
    where('classId', '==', classId),
    where('date', '==', date)
  );

  return onSnapshot(q, (snapshot) => {
    const changes = snapshot.docChanges();
    
    changes.forEach((change) => {
      const attendanceData = change.doc.data() as AttendanceRecord;
      
      switch (change.type) {
        case 'added':
          onUpdate([attendanceData], 'added');
          break;
        case 'modified':
          onUpdate([attendanceData], 'modified');
          break;
        case 'removed':
          onUpdate([attendanceData], 'removed');
          break;
      }
    });
  });
}

// ==================== GENERAL COLLECTION SUBSCRIPTIONS ====================

/**
 * Generic function to subscribe to any collection with constraints
 */
export function subscribeToCollection<T extends DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[],
  onUpdate: (docs: (T & { id: string })[]) => void
): Unsubscribe {
  const q = query(collection(db, collectionName), ...constraints);

  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as (T & { id: string })[];
    
    onUpdate(docs);
  });
}

// ==================== BULK SUBSCRIPTIONS ====================

/**
 * Subscribe to multiple streams at once
 * Returns an array of unsubscribe functions
 */
export function subscribeToMultiple(
  subscriptions: Array<{ name: string; unsubscribe: Unsubscribe }>
): () => void {
  return () => {
    subscriptions.forEach(sub => {
      try {
        sub.unsubscribe();
      } catch (error) {
        console.error(`Error unsubscribing from ${sub.name}:`, error);
      }
    });
  };
}

// ==================== MONITORING UTILITIES ====================

/**
 * Track changes to a document and log them for debugging
 */
export function logDocumentChanges(
  collectionName: string,
  documentId: string
): Unsubscribe {
  const docRef = collection(db, collectionName);
  const q = query(docRef, where('id', '==', documentId));

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      console.log(`[${collectionName}] ${change.type}:`, change.doc.data());
    });
  });
}

/**
 * Get real-time stats about a collection
 */
export function subscribeToCollectionStats(
  collectionName: string,
  onUpdate: (stats: { total: number; lastUpdate: string }) => void
): Unsubscribe {
  const q = query(collection(db, collectionName));

  return onSnapshot(q, (snapshot) => {
    onUpdate({
      total: snapshot.size,
      lastUpdate: new Date().toISOString(),
    });
  });
}
