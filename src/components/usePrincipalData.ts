import { useState } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'accountant' | 'admin' | 'parent' | 'student';
  phone: string;
  status: 'active' | 'inactive';
  joinedDate: string;
}

export interface AdmissionApplication {
  id: string;
  studentName: string;
  parentName: string;
  phone: string;
  email: string;
  class: string;
  appliedDate: string;
  status: 'pending' | 'approved' | 'rejected';
  documents: string[];
}

export interface SubjectMapping {
  id: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  classes: string[];
  periodsPerWeek: number;
}

export interface FeeHead {
  id: string;
  feeHead: string;
  applicableClasses: string;
  amount: number;
  frequency: string;
  mandatory: boolean;
}

export interface Discount {
  id: string;
  name: string;
  type: string;
  applicableTo: string;
}

export interface DisciplineRecord {
  id: string;
  studentName: string;
  class: string;
  incident: string;
  severity: 'low' | 'medium' | 'high';
  date: string;
  action: string;
  reportedBy: string;
}

export interface ReportApproval {
  id: string;
  reportType: string;
  generatedBy: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  description: string;
}

export function usePrincipalData() {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'Ms. Sarah Johnson',
      email: 'sarah.johnson@kidzvision.edu',
      role: 'teacher',
      phone: '+91 98765 43210',
      status: 'active',
      joinedDate: '2023-04-15',
    },
    {
      id: '2',
      name: 'Ms. Emily Davis',
      email: 'emily.davis@kidzvision.edu',
      role: 'teacher',
      phone: '+91 98765 43211',
      status: 'active',
      joinedDate: '2023-05-20',
    },
    {
      id: '3',
      name: 'Mr. Rajesh Kumar',
      email: 'rajesh.kumar@kidzvision.edu',
      role: 'accountant',
      phone: '+91 98765 43212',
      status: 'active',
      joinedDate: '2023-06-01',
    },
  ]);

  const [admissions, setAdmissions] = useState<AdmissionApplication[]>([
    {
      id: '1',
      studentName: 'Aarav Patel',
      parentName: 'Mr. Vikram Patel',
      phone: '+91 98765 12345',
      email: 'vikram.patel@email.com',
      class: 'Nursery',
      appliedDate: '2024-02-10',
      status: 'pending',
      documents: ['Birth Certificate', 'Aadhar Card', 'Photo'],
    },
    {
      id: '2',
      studentName: 'Diya Sharma',
      parentName: 'Mrs. Neha Sharma',
      phone: '+91 98765 12346',
      email: 'neha.sharma@email.com',
      class: 'LKG',
      appliedDate: '2024-02-12',
      status: 'pending',
      documents: ['Birth Certificate', 'Aadhar Card', 'Photo', 'TC'],
    },
    {
      id: '3',
      studentName: 'Arjun Singh',
      parentName: 'Mr. Rajesh Singh',
      phone: '+91 98765 12347',
      email: 'rajesh.singh@email.com',
      class: 'UKG',
      appliedDate: '2024-02-14',
      status: 'approved',
      documents: ['Birth Certificate', 'Aadhar Card', 'Photo'],
    },
  ]);

  const [subjectMappings, setSubjectMappings] = useState<SubjectMapping[]>([
    {
      id: '1',
      teacherId: '1',
      teacherName: 'Ms. Sarah Johnson',
      subject: 'English',
      classes: ['Nursery-A', 'Nursery-B'],
      periodsPerWeek: 10,
    },
    {
      id: '2',
      teacherId: '2',
      teacherName: 'Ms. Emily Davis',
      subject: 'Mathematics',
      classes: ['Nursery-B', 'LKG-A'],
      periodsPerWeek: 12,
    },
  ]);

  const [feeHeads, setFeeHeads] = useState<FeeHead[]>([
    {
      id: '1',
      feeHead: 'Tuition Fee',
      applicableClasses: 'All Classes',
      amount: 5000,
      frequency: 'monthly',
      mandatory: true,
    },
    {
      id: '2',
      feeHead: 'Transport Fee',
      applicableClasses: 'All Classes',
      amount: 2000,
      frequency: 'monthly',
      mandatory: false,
    },
  ]);

  const [discounts, setDiscounts] = useState<Discount[]>([
    { id: '1', name: 'Sibling Discount', type: '10% off', applicableTo: 'Second child onwards' },
    { id: '2', name: 'Early Bird Discount', type: '5% off', applicableTo: 'Payment before 5th' },
    { id: '3', name: 'Staff Ward Concession', type: '50% off', applicableTo: 'Staff children' },
  ]);

  const [disciplineRecords, setDisciplineRecords] = useState<DisciplineRecord[]>([
    {
      id: '1',
      studentName: 'Rohan Kapoor',
      class: 'UKG-A',
      incident: 'Disruptive behavior in class',
      severity: 'medium',
      date: '2024-02-15',
      action: 'Verbal warning given',
      reportedBy: 'Ms. Anjali Verma',
    },
    {
      id: '2',
      studentName: 'Mira Desai',
      class: 'LKG-A',
      incident: 'Fighting with classmate',
      severity: 'high',
      date: '2024-02-14',
      action: 'Parent meeting scheduled',
      reportedBy: 'Ms. Priya Sharma',
    },
  ]);

  const [reportApprovals, setReportApprovals] = useState<ReportApproval[]>([
    {
      id: '1',
      reportType: 'Monthly Attendance Report',
      generatedBy: 'Ms. Sarah Johnson',
      date: '2024-02-18',
      status: 'pending',
      description: 'Attendance summary for all classes - January 2024',
    },
    {
      id: '2',
      reportType: 'Fee Collection Report',
      generatedBy: 'Mr. Rajesh Kumar',
      date: '2024-02-17',
      status: 'pending',
      description: 'Monthly fee collection analysis and defaulter list',
    },
    {
      id: '3',
      reportType: 'Academic Performance',
      generatedBy: 'Ms. Priya Sharma',
      date: '2024-02-16',
      status: 'approved',
      description: 'Term 2 assessment results for LKG-A',
    },
  ]);

  return {
    users,
    setUsers,
    admissions,
    setAdmissions,
    subjectMappings,
    setSubjectMappings,
    feeHeads,
    setFeeHeads,
    discounts,
    setDiscounts,
    disciplineRecords,
    setDisciplineRecords,
    reportApprovals,
    setReportApprovals,
  };
}
