export interface Teacher {
    id: string;
    name: string;
    email: string;
    phone: string;
    subject: string;
    classes: string[];
    qualification: string;
    joiningDate: string;
    experience: string;
    status: 'active' | 'on-leave';
    // Additional fields for the full form
    photo?: string | null;
    dob?: string;
    gender?: string;
    bloodGroup?: string;
    address?: string;
    emergencyContact?: string;
    employeeId?: string;
    documents?: {
        resume: { name: string; file: File | null; preview?: string };
        idProof: { name: string; file: File | null; preview?: string };
        educationCertificates: { name: string; file: File | null; preview?: string };
        experienceLetters: { name: string; file: File | null; preview?: string };
    };
}

export const initialTeachers: Teacher[] = [
    {
        id: '1',
        name: 'Priya Sharma',
        email: 'priya.sharma@joykids.com',
        phone: '+91 98765 43210',
        subject: 'English & Hindi',
        classes: ['Class 1', 'Class 2'],
        qualification: 'B.Ed, M.A. English',
        joiningDate: '2020-06-15',
        experience: '5 years',
        status: 'active',
    },
    {
        id: '2',
        name: 'Rajesh Kumar',
        email: 'rajesh.kumar@joykids.com',
        phone: '+91 98765 43211',
        subject: 'Mathematics & Science',
        classes: ['Class 3', 'Class 4'],
        qualification: 'B.Sc, B.Ed',
        joiningDate: '2019-08-20',
        experience: '6 years',
        status: 'active',
    },
    {
        id: '3',
        name: 'Anita Reddy',
        email: 'anita.reddy@joykids.com',
        phone: '+91 98765 43212',
        subject: 'Social Studies',
        classes: ['Class 5', 'Class 6'],
        qualification: 'M.A. History, B.Ed',
        joiningDate: '2021-04-10',
        experience: '4 years',
        status: 'active',
    },
    {
        id: '4',
        name: 'Sanjay Patel',
        email: 'sanjay.patel@joykids.com',
        phone: '+91 98765 43213',
        subject: 'Physical Education',
        classes: ['All Classes'],
        qualification: 'B.P.Ed',
        joiningDate: '2022-01-05',
        experience: '3 years',
        status: 'on-leave',
    },
];
