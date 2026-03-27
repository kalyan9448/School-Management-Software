import { useMemo } from 'react';
import { useClasses } from './useFirestoreData';
import type { Class } from '../utils/firestoreService';

/**
 * Hook that provides dynamic class and section data from Firestore.
 */
export function useAcademicClasses() {
  const { classes: classSections, loading } = useClasses();

  /** Helper for natural sorting (handles numeric strings like "Class 10" > "Class 3") */
  const naturalSort = (a: string, b: string) => {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  };
  
  /** Alphabetically-sorted list of unique class names from Firestore */
  const uniqueClasses = useMemo<string[]>(() => {
    const names = classSections.map((c: Class) => c.className);
    return [...new Set(names)].sort(naturalSort);
  }, [classSections]);

  /** Alphabetically-sorted list of unique sections across all classes */
  const uniqueSections = useMemo<string[]>(() => {
    const sections = classSections.map((c: Class) => c.section);
    return [...new Set(sections)].sort(naturalSort);
  }, [classSections]);

  /** Returns sorted sections for a given class name */
  const sectionsForClass = useMemo(() => {
    return (className: string): string[] => {
      if (!className || className === 'all') return [];
      const sections = classSections
        .filter((c: Class) => c.className === className)
        .map((c: Class) => c.section);
      return [...new Set(sections)].sort(naturalSort);
    };
  }, [classSections]);

  return { uniqueClasses, uniqueSections, sectionsForClass, classSections, loading };
}
