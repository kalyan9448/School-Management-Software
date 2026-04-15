import { useState, useEffect } from 'react';
import type { ExamScore, AttendanceRecord } from '../types';
import {
  subscribeToStudentExamScores,
  subscribeToClassExamScores,
  subscribeToExamTypeScores,
  subscribeToStudentAttendance,
  subscribeToClassAttendance,
} from '../utils/realtimeSubscriptions';

/**
 * Hook to subscribe to real-time exam scores for a student
 */
export function useStudentExamScores(studentId: string) {
  const [scores, setScores] = useState<ExamScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) {
      setScores([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const unsubscribe = subscribeToStudentExamScores(studentId, (newScores) => {
        setScores((prev) => {
          // Check if score already exists and update/remove as needed
          const filtered = prev.filter(p => p.id !== newScores[0]?.id);
          return [...filtered, ...newScores];
        });
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, [studentId]);

  return { scores, loading, error };
}

/**
 * Hook to subscribe to real-time exam scores for an entire class
 */
export function useClassExamScores(classId: string) {
  const [scores, setScores] = useState<ExamScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classId) {
      setScores([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const unsubscribe = subscribeToClassExamScores(classId, (newScores) => {
        setScores((prev) => {
          const filtered = prev.filter(p => p.id !== newScores[0]?.id);
          return [...filtered, ...newScores];
        });
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, [classId]);

  return { scores, loading, error };
}

/**
 * Hook to subscribe to real-time exam scores for a specific exam type
 */
export function useExamTypeScores(
  classId: string,
  subjectId: string,
  examType: 'Unit Test' | 'Mid' | 'Final'
) {
  const [scores, setScores] = useState<ExamScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classId || !subjectId) {
      setScores([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const unsubscribe = subscribeToExamTypeScores(
        classId,
        subjectId,
        examType,
        (newScores) => {
          setScores((prev) => {
            const filtered = prev.filter(p => p.id !== newScores[0]?.id);
            return [...filtered, ...newScores];
          });
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, [classId, subjectId, examType]);

  return { scores, loading, error };
}

/**
 * Hook to subscribe to real-time attendance for a student
 */
export function useStudentAttendance(studentId: string) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) {
      setRecords([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const unsubscribe = subscribeToStudentAttendance(studentId, (newRecords) => {
        setRecords((prev) => {
          // Update or add new records
          const recordMap = new Map(prev.map(r => [r.date, r]));
          newRecords.forEach(r => recordMap.set(r.date, r));
          return Array.from(recordMap.values());
        });
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, [studentId]);

  return { records, loading, error };
}

/**
 * Hook to subscribe to real-time attendance for a class
 */
export function useClassAttendance(classId: string, date: string) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classId || !date) {
      setRecords([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const unsubscribe = subscribeToClassAttendance(classId, date, (newRecords) => {
        setRecords((prev) => {
          const recordMap = new Map(prev.map(r => [r.studentId, r]));
          newRecords.forEach(r => recordMap.set(r.studentId, r));
          return Array.from(recordMap.values());
        });
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, [classId, date]);

  return { records, loading, error };
}
