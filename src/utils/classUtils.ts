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

export const DEFAULT_CLASSES: ClassSection[] = [
    { id: '1', className: 'Nursery', section: 'A', classTeacher: 'Ms. Sarah Johnson', students: 25, capacity: 30 },
    { id: '2', className: 'Nursery', section: 'B', classTeacher: 'Ms. Anjali Verma', students: 22, capacity: 30 },
    { id: '3', className: 'LKG', section: 'A', classTeacher: 'Ms. Emily Davis', students: 28, capacity: 30 },
    { id: '4', className: 'LKG', section: 'B', classTeacher: 'Ms. Sarah Johnson', students: 26, capacity: 30 },
    { id: '5', className: 'UKG', section: 'A', classTeacher: 'Ms. Emily Davis', students: 30, capacity: 30 },
    { id: '6', className: 'UKG', section: 'B', classTeacher: 'Ms. Priya Sharma', students: 27, capacity: 30 },
    { id: '7', className: 'Class 1', section: 'A', classTeacher: 'Mrs. Kavita Reddy', students: 30, capacity: 30 },
    { id: '8', className: 'Class 1', section: 'B', classTeacher: 'Mrs. Kavita Reddy', students: 28, capacity: 30 },
];

/**
 * Gets the active academic year ID.
 */
export const getActiveAcademicYearId = (): string => {
    const storedYears = localStorage.getItem('school_academic_years');
    let years = DEFAULT_YEARS;
    if (storedYears) {
        years = JSON.parse(storedYears);
    }
    return years.find(y => y.status === 'active')?.id || '2024-2025';
};

/**
 * Gets all class sections for a given year (defaults to active year).
 */
export const getClassSections = (yearId?: string): ClassSection[] => {
    const targetYearId = yearId || getActiveAcademicYearId();
    const storedClasses = localStorage.getItem(`school_class_sections_${targetYearId}`);
    if (storedClasses) {
        return JSON.parse(storedClasses);
    }
    return DEFAULT_CLASSES;
};

/**
 * Gets an array of unique class names for the given year.
 */
export const getUniqueClasses = (yearId?: string): string[] => {
    const classSections = getClassSections(yearId);
    return [...new Set(classSections.map(cs => cs.className))];
};

/**
 * Gets an array of sections for a specific class name.
 */
export const getSectionsForClass = (className: string | 'all', yearId?: string): string[] => {
    if (className === 'all') return [];
    const classSections = getClassSections(yearId);
    const sections = classSections
        .filter(cs => cs.className === className)
        .map(cs => cs.section);
    return [...new Set(sections)].sort();
};
