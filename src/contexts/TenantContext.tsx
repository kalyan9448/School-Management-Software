import { createContext, useContext, useState, ReactNode } from 'react';

// =============================================================================
// TenantContext — multi-tenant school_id provider
// Every page/service reads school_id from this context.
// Super Admin can switch between schools; other roles inherit from login.
// =============================================================================

interface TenantContextType {
    schoolId: string | null;
    schoolName: string;
    setSchool: (id: string, name: string) => void;
    clearSchool: () => void;
}

const TenantContext = createContext<TenantContextType | null>(null);

export const useTenant = () => {
    const context = useContext(TenantContext);
    if (!context) throw new Error('useTenant must be used within TenantProvider');
    return context;
};

/** Get school_id synchronously (used inside services without React) */
export const getSchoolId = (): string | null => {
    return sessionStorage.getItem('active_school_id');
};

export function TenantProvider({ children }: { children: ReactNode }) {
    const [schoolId, setSchoolId] = useState<string | null>(
        () => sessionStorage.getItem('active_school_id')
    );
    const [schoolName, setSchoolName] = useState<string>(
        () => sessionStorage.getItem('active_school_name') ?? ''
    );

    const setSchool = (id: string, name: string) => {
        setSchoolId(id);
        setSchoolName(name);
        sessionStorage.setItem('active_school_id', id);
        sessionStorage.setItem('active_school_name', name);
    };

    const clearSchool = () => {
        setSchoolId(null);
        setSchoolName('');
        sessionStorage.removeItem('active_school_id');
        sessionStorage.removeItem('active_school_name');
    };

    return (
        <TenantContext.Provider value={{ schoolId, schoolName, setSchool, clearSchool }}>
            {children}
        </TenantContext.Provider>
    );
}
