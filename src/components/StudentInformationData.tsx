// Student demo data for StudentInformation component

export interface Student {
  id: string;
  admissionNo: string;
  name: string;
  photo?: string;
  class: string;
  section: string;
  rollNo: string;
  dob: string;
  gender: string;
  bloodGroup: string;
  fatherName?: string;
  motherName?: string;
  guardianName?: string;
  fatherOccupation?: string;
  motherOccupation?: string;
  guardianOccupation?: string;
  parentName: string; // Maintain for backward compatibility / primary display
  phone: string;
  emergencyContactNumber?: string;
  email: string;
  address: string;
  admissionDate?: string;
  academicYear?: string;
  feeStatus: 'paid' | 'partial' | 'pending';
  totalFee: number;
  paidFee: number;
  dueFee: number;
  attendance: number;
  presentDays: number;
  totalDays: number;
  classTeacher: string;
  classTeacherContact: string;
  transportRoute?: string;
  busNumber?: string;
  documents?: {
    birthCertificate?: string;
    transferCertificate?: string;
    previousMarkSheets?: string;
    idProof?: string;
    medicalCertificate?: string;
    [key: string]: any;
  };
  medicalInfo: {
    allergies: string[];
    conditions: string[];
    emergencyContact: string;
    emergencyPhone: string;
  };
  academicHistory?: {
    academicYear: string;
    class: string;
    section: string;
    status: 'promoted' | 'repeated' | 'transferred' | 'removed';
  }[];
}

export const getStudents = async (): Promise<Student[]> => {
  const { studentService } = await import('../utils/centralDataService');
  return studentService.getAll();
};

export const saveStudents = async (students: Student[]) => {
  // No-op: individual student updates should use studentService.update()
};
