export interface AcademicYear {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: 'active' | 'upcoming' | 'completed';
}

export interface ClassSection {
    id: string;
    className: string;
    section: string;
    classTeacher: string;
    students: number;
    capacity: number;
}

export const DEFAULT_YEARS: AcademicYear[] = [
    { id: '2023-2024', name: '2023-2024', startDate: '2023-04-01', endDate: '2024-03-31', status: 'completed' },
    { id: '2024-2025', name: '2024-2025', startDate: '2024-04-01', endDate: '2025-03-31', status: 'active' },
];

/**
 * Gets the active academic year ID.
 */
export const getActiveAcademicYearId = (): string => {
    return DEFAULT_YEARS.find(y => y.status === 'active')?.id || '2024-2025';
};
