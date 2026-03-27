export interface AcademicYear {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: 'active' | 'upcoming' | 'completed';
    isCurrent?: boolean;
}

export interface ClassSection {
    id: string;
    className: string;
    section: string;
    classTeacher: string;
    students: number;
    capacity: number;
}

export const DEFAULT_YEARS: AcademicYear[] = [];

/**
 * Gets the active academic year ID.
 */
export const getActiveAcademicYearId = (): string => {
    // This is now a fallback. Real data should come from Firestore.
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    return `${currentYear}-${nextYear}`;
};
