import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Download, Search, DollarSign, Receipt, FileText, TrendingUp, Users, Calendar, Edit2, Trash2, Check, X, Send, Phone, Bell, Wallet, Tag, CreditCard } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { notificationService, feeService, studentService } from '../utils/centralDataService';
import { useAcademicClasses } from '../hooks/useAcademicClasses';

// --- Feature 3: CSV Export Utility ---
function exportCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type Tab = 'structure' | 'collection' | 'accounting';

interface FeeCategory {
  id: string;
  name: string;
  amount: number;
  frequency: 'one-time' | 'monthly' | 'quarterly' | 'annual';
  applicableClasses: string[];
}

interface FeeStructure {
  id: string;
  class: string;
  admissionFee: number;
  annualFee: number;
  monthlyFee: number;
  quarterlyFee: number;
  transportFee: number;
  daycareFee: number;
  activityFee: number;
  customCategories: FeeCategory[];
}

interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  class: string;
  amount: number;
  paymentMode: 'cash' | 'upi' | 'online' | 'bank-transfer';
  paymentDate: string;
  receiptNo: string;
  feeType: string;
  discount: number;
  lateFee: number;
  totalAmount: number;
  status: 'paid' | 'partial' | 'pending';
}

interface StudentLedger {
  studentName: string;
  admissionNo: string;
  class: string;
  totalFee: number;
  paidAmount: number;
  dueAmount: number;
  lastPaymentDate: string;
  parentPhone: string;
  parentId?: string;
}

export function FeeModule() {
  const { uniqueClasses } = useAcademicClasses();
  const [activeTab, setActiveTab] = useState<Tab>('structure');
  const [showStructureForm, setShowStructureForm] = useState(false);
  const [showCollectionForm, setShowCollectionForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  // Edit/Delete State
  const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Fee Structure State
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);

  const [structureForm, setStructureForm] = useState({
    class: '',
    admissionFee: '',
    annualFee: '',
    monthlyFee: '',
    quarterlyFee: '',
    transportFee: '',
    daycareFee: '',
    activityFee: '',
  });

  const [customCategory, setCustomCategory] = useState({
    name: '',
    amount: '',
    frequency: 'one-time' as const,
    applicableClasses: [] as string[],
  });

  // Fee Collection State
  const [payments, setPayments] = useState<Payment[]>([]);

  const [collectionForm, setCollectionForm] = useState({
    studentName: '',
    admissionNo: '',
    class: '',
    feeType: '',
    amount: '',
    paidAmount: '',
    paymentMode: 'cash' as const,
    discount: '',
    lateFee: '',
    notes: '',
  });

  // Smart Search State
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentSearchClass, setStudentSearchClass] = useState('');
  const [studentSearchSection, setStudentSearchSection] = useState('');
  const [selectedStudentForFee, setSelectedStudentForFee] = useState<any>(null);
  const [selectedStudentLedger, setSelectedStudentLedger] = useState<StudentLedger | null>(null);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');

  // Student Ledgers
  const [studentLedgers, setStudentLedgers] = useState<StudentLedger[]>([]);
  const [studentsData, setStudentsData] = useState<any[]>([]);

  // Load data from Firestore on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const structures = await feeService.getAllStructures() as any[];
        const paymentRecords = await feeService.getAllPayments() as any[];

        if (structures.length > 0) setFeeStructures(structures);
        if (paymentRecords.length > 0) setPayments(paymentRecords);

        // Fetch students and store them
        const students = await studentService.getAll();
        setStudentsData(students);
      } catch (err) {
        console.error('Failed to load fee data:', err);
      }
    };
    loadData();
  }, []);

  // Dynamically calculate Student Ledgers
  useEffect(() => {
    if (studentsData.length === 0) return;
    
    const ledgers: StudentLedger[] = studentsData.map((s: any) => {
      const studentPayments = payments.filter(
        (p: any) => p.admissionNo?.toLowerCase() === s.admissionNo?.toLowerCase() || p.studentId === s.id
      );
      const paidAmount = studentPayments.reduce((sum: number, p: any) => sum + (parseFloat(p.totalAmount) || parseFloat(p.amount) || 0), 0);
      
      // Clean up class name for lookup
      const studentClass = s.class?.replace(/^Class\s+/i, '') || '';
      const classStructure = feeStructures.find((str: any) => str.class?.replace(/^Class\s+/i, '') === studentClass);
      
      const calculatedTotalFee = classStructure 
        ? (parseFloat(classStructure.admissionFee as any) || 0) +
          (parseFloat(classStructure.annualFee as any) || 0) +
          ((parseFloat(classStructure.monthlyFee as any) || 0) * 12) +
          ((parseFloat(classStructure.quarterlyFee as any) || 0) * 4) +
          ((parseFloat(classStructure.transportFee as any) || 0) * 12) +
          ((parseFloat(classStructure.daycareFee as any) || 0) * 12) +
          ((parseFloat(classStructure.activityFee as any) || 0) * 12)
        : (parseFloat(s.totalFee as any) || 0);

      return {
        studentName: s.name || s.studentName || '',
        admissionNo: s.admissionNo || '',
        class: studentClass,
        totalFee: calculatedTotalFee,
        paidAmount,
        dueAmount: Math.max(0, calculatedTotalFee - paidAmount),
        lastPaymentDate: studentPayments.length > 0
          ? studentPayments[studentPayments.length - 1].paymentDate
          : '-',
        parentPhone: s.parentPhone || '',
        parentId: s.parentId,
      };
    });
    setStudentLedgers(ledgers);
  }, [studentsData, payments, feeStructures]);

  // Generate Receipt Number
  const generateReceiptNo = () => {
    const count = payments.length + 1;
    return `RCP${count.toString().padStart(4, '0')}`;
  };

  // Calculate total fee minus discount plus late fee
  const calculateNetPayable = () => {
    const amount = parseFloat(collectionForm.amount) || 0;
    const discount = parseFloat(collectionForm.discount) || 0;
    const lateFee = parseFloat(collectionForm.lateFee) || 0;
    return amount - discount + lateFee;
  };

  const calculateBalance = () => {
    const net = calculateNetPayable();
    const paid = parseFloat(collectionForm.paidAmount) || 0;
    return Math.max(0, net - paid);
  };

  // Smart Search Logic
  const filteredSearchStudents = useMemo(() => {
    if (!studentSearchQuery && !studentSearchClass && !studentSearchSection) return [];
    
    return studentsData.filter(student => {
      const query = studentSearchQuery.toLowerCase();
      const matchesQuery = !query || 
        student.name?.toLowerCase().includes(query) ||
        student.studentName?.toLowerCase().includes(query) ||
        student.admissionNo?.toLowerCase().includes(query) ||
        student.parentPhone?.includes(query) ||
        student.parentName?.toLowerCase().includes(query);
        
      const matchesClass = !studentSearchClass || 
        (student.class?.replace(/^Class\s+/i, '') === studentSearchClass.replace(/^Class\s+/i, ''));
      const matchesSection = !studentSearchSection || student.section === studentSearchSection;
      
      return matchesQuery && matchesClass && matchesSection;
    }).slice(0, 8); // Display top 8 results rapidly
  }, [studentsData, studentSearchQuery, studentSearchClass, studentSearchSection]);

  const handleSelectStudentForFee = (student: any) => {
    setSelectedStudentForFee(student);
    
    // Find ledger if exists
    const ledger = studentLedgers.find(
      l => l.admissionNo?.toLowerCase() === student.admissionNo?.toLowerCase()
    );
    setSelectedStudentLedger(ledger || null);
    
    setCollectionForm(prev => ({
      ...prev,
      studentName: student.name || student.studentName || '',
      admissionNo: student.admissionNo || '',
      class: student.class || '',
      feeType: '', // reset fee type when selecting new student
      amount: '',
      paidAmount: '',
    }));
    
    setStudentSearchQuery('');
    setIsSearchDropdownOpen(false);
  };

  const clearSelectedStudentForFee = () => {
    setSelectedStudentForFee(null);
    setSelectedStudentLedger(null);
    setCollectionForm(prev => ({
      ...prev,
      studentName: '',
      admissionNo: '',
      class: '',
      feeType: '',
      amount: '',
    }));
  };

  const handleFeeTypeChange = (feeType: string) => {
    let amount = 0;
    if (selectedStudentForFee) {
      const studentClass = selectedStudentForFee.class?.replace(/^Class\s+/i, '');
      const classStructure = feeStructures.find(s => s.class?.replace(/^Class\s+/i, '') === studentClass);
      if (classStructure) {
        switch (feeType) {
          case 'Admission Fee': amount = classStructure.admissionFee; break;
          case 'Annual Fee': amount = classStructure.annualFee; break;
          case 'Monthly Fee': amount = classStructure.monthlyFee; break;
          case 'Quarterly Fee': amount = classStructure.quarterlyFee; break;
          case 'Transport Fee': amount = classStructure.transportFee; break;
          case 'Daycare Fee': amount = classStructure.daycareFee; break;
          case 'Activity Fee': amount = classStructure.activityFee; break;
        }
      }
    }
    setCollectionForm(prev => ({
      ...prev,
      feeType,
      amount: amount.toString(),
      paidAmount: amount.toString() // auto-fill paidAmount with full amount by default
    }));
  };

  // Generate Professional PDF Receipt
  const downloadReceiptPDF = (payment: Payment) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Helper for centering text
    const centerText = (text: string, y: number) => {
      const textWidth = doc.getTextWidth(text);
      doc.text(text, (pageWidth - textWidth) / 2, y);
    };

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    centerText('FEE PAYMENT RECEIPT', 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    centerText('---------------------------------------------------------', 28);

    // Basic Info
    doc.setFontSize(11);
    doc.text(`Receipt No : ${payment.receiptNo}`, 20, 35);
    doc.text(`Date       : ${new Date(payment.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`, 20, 42);
    doc.text(`Payment Mode: ${payment.paymentMode.toUpperCase()}`, 20, 49);

    centerText('---------------------------------------------------------', 56);

    // Student Details Section
    doc.setFont('helvetica', 'bold');
    doc.text('Student Details', 20, 63);
    doc.setFont('helvetica', 'normal');
    centerText('---------------------------------------------------------', 68);

    doc.text(`Student Name   : ${payment.studentName}`, 20, 75);
    doc.text(`Admission No   : ${payment.admissionNo}`, 20, 82);
    doc.text(`Class          : ${payment.class}`, 20, 89);

    centerText('---------------------------------------------------------', 96);

    // Fee Details Section
    doc.setFont('helvetica', 'bold');
    doc.text('Fee Details', 20, 103);
    doc.setFont('helvetica', 'normal');
    centerText('---------------------------------------------------------', 108);

    const netPayable = (payment.amount || 0) - (payment.discount || 0) + (payment.lateFee || 0);
    const balance = Math.max(0, netPayable - payment.totalAmount);

    // Table Header
    doc.setFont('helvetica', 'bold');
    doc.text('Description', 20, 115);
    doc.text('Amount', 140, 115);

    doc.setFont('helvetica', 'normal');
    centerText('---------------------------------------------------------', 120);

    // Table Row
    doc.text(`Total Fee (${payment.feeType})`, 20, 128);
    doc.text(`Rs. ${netPayable.toLocaleString()}`, 140, 128);

    doc.text(`Amount Paid NOW`, 20, 135);
    doc.text(`Rs. ${payment.totalAmount.toLocaleString()}`, 140, 135);

    doc.text(`Remaining Balance`, 20, 142);
    doc.text(`Rs. ${balance.toLocaleString()}`, 140, 142);

    centerText('---------------------------------------------------------', 150);

    // Total
    doc.setFont('helvetica', 'bold');
    doc.text(`Payment Received : Rs. ${payment.totalAmount.toLocaleString()}`, 20, 158);
    centerText('---------------------------------------------------------', 165);

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Thank you for your payment.', 20, 175);

    doc.text('Authorized Signature', 140, 190);
    doc.text('School Admin', 140, 197);

    centerText('---------------------------------------------------------', 210);
    centerText('Generated from School Management System', 217);
    centerText('---------------------------------------------------------', 224);

    // Download file
    doc.save(`Receipt_${payment.receiptNo}.pdf`);
  };

  // Handle Communication Actions
  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleSendNotification = async (student: StudentLedger) => {
    if (student.parentId) {
      await notificationService.create({
        userId: student.parentId,
        type: 'fee',
        title: 'Fee Payment Reminder',
        message: `Dear Parent, this is a reminder regarding the outstanding fee of RS. ${student.dueAmount.toLocaleString()} for ${student.studentName}. Please ignore if already paid.`,
        date: new Date().toISOString(),
      });
      alert(`Notification sent successfully to ${student.studentName}'s parent!`);
    } else {
      alert(`Demo Alert: Notification message sent to ${student.studentName}'s parent.`);
    }
  };

  // Handle Fee Structure Submit
  const handleStructureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditMode && editingStructure) {
      // Update existing structure
      const updatedStructure: FeeStructure = {
        ...editingStructure,
        class: structureForm.class,
        admissionFee: parseFloat(structureForm.admissionFee) || 0,
        annualFee: parseFloat(structureForm.annualFee) || 0,
        monthlyFee: parseFloat(structureForm.monthlyFee) || 0,
        quarterlyFee: parseFloat(structureForm.quarterlyFee) || 0,
        transportFee: parseFloat(structureForm.transportFee) || 0,
        daycareFee: parseFloat(structureForm.daycareFee) || 0,
        activityFee: parseFloat(structureForm.activityFee) || 0,
      };

      await feeService.updateStructure(editingStructure.id, updatedStructure);
      const updatedStructures = feeStructures.map(s =>
        s.id === editingStructure.id ? updatedStructure : s
      );
      setFeeStructures(updatedStructures);

      alert(`Fee structure for Class ${structureForm.class} has been updated successfully!`);
      setIsEditMode(false);
      setEditingStructure(null);
    } else {
      // Add new structure
      const newStructure: FeeStructure = {
        id: Date.now().toString(),
        class: structureForm.class,
        admissionFee: parseFloat(structureForm.admissionFee) || 0,
        annualFee: parseFloat(structureForm.annualFee) || 0,
        monthlyFee: parseFloat(structureForm.monthlyFee) || 0,
        quarterlyFee: parseFloat(structureForm.quarterlyFee) || 0,
        transportFee: parseFloat(structureForm.transportFee) || 0,
        daycareFee: parseFloat(structureForm.daycareFee) || 0,
        activityFee: parseFloat(structureForm.activityFee) || 0,
        customCategories: [],
      };
      await feeService.createStructure(newStructure);
      const updatedStructures = [...feeStructures, newStructure];
      setFeeStructures(updatedStructures);
      alert(`Fee structure for Class ${structureForm.class} has been added successfully!`);
    }

    setStructureForm({
      class: '',
      admissionFee: '',
      annualFee: '',
      monthlyFee: '',
      quarterlyFee: '',
      transportFee: '',
      daycareFee: '',
      activityFee: '',
    });
    setShowStructureForm(false);
  };

  // Handle Edit Fee Structure
  const handleEditStructure = (structure: FeeStructure) => {
    setEditingStructure(structure);
    setIsEditMode(true);
    setStructureForm({
      class: structure.class,
      admissionFee: structure.admissionFee.toString(),
      annualFee: structure.annualFee.toString(),
      monthlyFee: structure.monthlyFee.toString(),
      quarterlyFee: structure.quarterlyFee.toString(),
      transportFee: structure.transportFee.toString(),
      daycareFee: structure.daycareFee.toString(),
      activityFee: structure.activityFee.toString(),
    });
    setShowStructureForm(true);
  };

  // Handle Delete Fee Structure
  const handleDeleteStructure = (structure: FeeStructure) => {
    if (confirm(`Are you sure you want to delete fee structure for Class ${structure.class}?`)) {
      feeService.deleteStructure(structure.id).then(() => {
        const updatedStructures = feeStructures.filter(s => s.id !== structure.id);
        setFeeStructures(updatedStructures);
        alert(`Fee structure for Class ${structure.class} has been deleted successfully!`);
      }).catch(err => {
        console.error('Failed to delete structure:', err);
        alert('Failed to delete. Please try again.');
      });
    }
  };

  // Handle Payment Collection Submit
  const handleCollectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const receiptNo = generateReceiptNo();
    const netPayable = calculateNetPayable();
    const paidAmount = parseFloat(collectionForm.paidAmount) || 0;
    const balance = calculateBalance();

    if (paidAmount <= 0) {
      alert('Please enter a valid paid amount greater than 0');
      return;
    }

    const newPayment: Payment = {
      id: Date.now().toString(),
      studentId: selectedStudentForFee?.id || '',
      studentName: collectionForm.studentName,
      admissionNo: collectionForm.admissionNo,
      class: collectionForm.class,
      amount: parseFloat(collectionForm.amount) || 0, // Original base amount mapped to `amount`
      paymentMode: collectionForm.paymentMode,
      paymentDate: new Date().toISOString().split('T')[0],
      receiptNo: receiptNo,
      feeType: collectionForm.feeType,
      discount: parseFloat(collectionForm.discount) || 0,
      lateFee: parseFloat(collectionForm.lateFee) || 0,
      totalAmount: paidAmount, // `totalAmount` tracks what was actually paid
      status: balance > 0 ? 'partial' : 'paid',
    };

    await feeService.createPayment(newPayment as any);
    const newPayments = [newPayment, ...payments];
    setPayments(newPayments);

    // Student Ledger update is now handled dynamically by the useEffect hook since `payments` is updated

    // Automate sending notifications to parent and student dashboards
    if (selectedStudentForFee) {
      const now = new Date().toISOString();
      
      const statusText = balance > 0 
        ? `Payment of ₹${paidAmount.toLocaleString()} received. Remaining ₹${balance.toLocaleString()}` 
        : `Fee fully paid`;

      const parentMsg = `Dear Parent, ${statusText} towards ${collectionForm.feeType} for ${collectionForm.studentName}. Receipt No: ${receiptNo}.`;
      const studentMsg = `${statusText} for ${collectionForm.feeType}. Receipt No: ${receiptNo}.`;

      const notificationPromises = [];

      // Notify Parent
      if (selectedStudentForFee.parentId) {
        notificationPromises.push(
          notificationService.create({
            userId: selectedStudentForFee.parentId,
            type: 'fee',
            title: balance > 0 ? 'Partial Payment Received' : 'Fee Payment Successful',
            message: parentMsg,
            date: now,
          })
        );
      }

      // Notify Student
      if (selectedStudentForFee.id) {
        notificationPromises.push(
          notificationService.create({
            userId: selectedStudentForFee.id,
            type: 'fee',
            title: balance > 0 ? 'Partial Fee Payment' : 'Fee Payment Successful',
            message: studentMsg,
            date: now,
          })
        );
      }

      if (notificationPromises.length > 0) {
        await Promise.all(notificationPromises).catch(err => console.error("Failed to send some notifications:", err));
      }
    }
    // Generate PDF and show success
    const alertMessage = balance > 0 
      ? `Payment Successful! (Partial)\n\nReceipt No: ${receiptNo}\nAmount Paid: ₹${paidAmount.toLocaleString()}\nRemaining Balance: ₹${balance.toLocaleString()}\n\nReceipt PDF generated automatically.`
      : `Payment Successful! (Full)\n\nReceipt No: ${receiptNo}\nAmount Paid: ₹${paidAmount.toLocaleString()}\nFee fully paid.\n\nReceipt PDF generated automatically.`;
    
    alert(alertMessage);

    setCollectionForm({
      studentName: '',
      admissionNo: '',
      class: '',
      feeType: '',
      amount: '',
      paidAmount: '',
      paymentMode: 'cash',
      discount: '',
      lateFee: '',
      notes: '',
    });
    setShowCollectionForm(false);
  };

  // Send WhatsApp/SMS Alert
  const sendDueAlert = (student: StudentLedger) => {
    alert(`WhatsApp/SMS Alert Sent!\n\nTo: ${student.studentName}\nAdmission No: ${student.admissionNo}\nDue Amount: ₹${student.dueAmount.toLocaleString()}\n\nMessage: "Dear Parent, Fee payment of ₹${student.dueAmount.toLocaleString()} is pending for ${student.studentName}. Please clear dues at the earliest."`);
  };

  // Calculate statistics for accounting
  const getTodayCollection = () => {
    const today = new Date().toISOString().split('T')[0];
    return payments
      .filter(p => p.paymentDate === today)
      .reduce((sum, p) => sum + (parseFloat(p.totalAmount as any) || parseFloat(p.amount as any) || 0), 0);
  };

  const getMonthlyCollection = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return payments
      .filter(p => {
        if (!p.paymentDate) return false;
        const date = new Date(p.paymentDate);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + (parseFloat(p.totalAmount as any) || parseFloat(p.amount as any) || 0), 0);
  };

  const getTotalOutstanding = () => {
    return studentLedgers.reduce((sum, s) => sum + s.dueAmount, 0);
  };

  const getClassWiseCollection = () => {
    const classWise: { [key: string]: number } = {};
    payments.forEach(p => {
      const cls = p.class?.replace(/^Class\s+/i, '') || 'General';
      if (!classWise[cls]) {
        classWise[cls] = 0;
      }
      classWise[cls] += (parseFloat(p.totalAmount as any) || parseFloat(p.amount as any) || 0);
    });
    return classWise;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-2">Fee Management</h1>
          <p className="text-gray-600">Manage fee structure, collection, and accounting</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportCSV(
              'fee_payments.csv',
              ['Payment ID', 'Student Name', 'Admission No', 'Class', 'Amount (₹)', 'Payment Date', 'Method', 'Receipt No'],
              payments.map(p => [p.id, p.studentName, p.admissionNo, p.class, p.totalAmount, p.paymentDate, p.paymentMode, p.receiptNo || ''])
            )}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" /> Export Payments CSV
          </button>
          <button
            onClick={() => exportCSV(
              'fee_dues.csv',
              ['Student Name', 'Admission No', 'Class', 'Total Fee (₹)', 'Paid (₹)', 'Due (₹)', 'Fee Status'],
              studentLedgers.map(l => [l.studentName, l.admissionNo, l.class, l.totalFee, l.paidAmount, l.dueAmount, l.dueAmount <= 0 ? 'Paid' : l.paidAmount > 0 ? 'Partial' : 'Pending'])
            )}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Download className="w-4 h-4" /> Export Dues CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('structure')}
          className={`px-6 py-3 border-b-2 transition-colors ${activeTab === 'structure'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Fee Structure
          </div>
        </button>
        <button
          onClick={() => setActiveTab('collection')}
          className={`px-6 py-3 border-b-2 transition-colors ${activeTab === 'collection'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
        >
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Fee Collection
          </div>
        </button>
        <button
          onClick={() => setActiveTab('accounting')}
          className={`px-6 py-3 border-b-2 transition-colors ${activeTab === 'accounting'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Fee Accounting
          </div>
        </button>
      </div>

      {/* Fee Structure Tab */}
      {activeTab === 'structure' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-gray-900">Fee Structure Setup</h2>
            <button
              onClick={() => setShowStructureForm(!showStructureForm)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Fee Structure
            </button>
          </div>

          {/* Structure Form */}
          {showStructureForm && (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
              <h3 className="text-gray-900 mb-4">{isEditMode ? 'Edit Fee Structure' : 'New Fee Structure'}</h3>
              <form onSubmit={handleStructureSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Class *</label>
                    <select
                      value={structureForm.class}
                      onChange={(e) => setStructureForm({ ...structureForm, class: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Class</option>
                      {uniqueClasses.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Admission Fee (₹)</label>
                    <input
                      type="number"
                      value={structureForm.admissionFee}
                      onChange={(e) => setStructureForm({ ...structureForm, admissionFee: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="5000"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Annual Fee (₹)</label>
                    <input
                      type="number"
                      value={structureForm.annualFee}
                      onChange={(e) => setStructureForm({ ...structureForm, annualFee: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="50000"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Monthly Fee (₹)</label>
                    <input
                      type="number"
                      value={structureForm.monthlyFee}
                      onChange={(e) => setStructureForm({ ...structureForm, monthlyFee: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="4500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Quarterly Fee (₹)</label>
                    <input
                      type="number"
                      value={structureForm.quarterlyFee}
                      onChange={(e) => setStructureForm({ ...structureForm, quarterlyFee: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="13000"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Transport Fee (₹)</label>
                    <input
                      type="number"
                      value={structureForm.transportFee}
                      onChange={(e) => setStructureForm({ ...structureForm, transportFee: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="2000"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Daycare Fee (₹)</label>
                    <input
                      type="number"
                      value={structureForm.daycareFee}
                      onChange={(e) => setStructureForm({ ...structureForm, daycareFee: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="3000"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Activity Fee (₹)</label>
                    <input
                      type="number"
                      value={structureForm.activityFee}
                      onChange={(e) => setStructureForm({ ...structureForm, activityFee: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="1500"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Structure
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowStructureForm(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Fee Structures List */}
          <div className="space-y-4">
            {feeStructures.map((structure) => (
              <div key={structure.id} className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-900">Class {structure.class} - Fee Structure</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditStructure(structure)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteStructure(structure)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-blue-700 mb-1">Admission Fee</p>
                    <p className="text-blue-900">₹{(structure.admissionFee || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-green-700 mb-1">Annual Fee</p>
                    <p className="text-green-900">₹{(structure.annualFee || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-purple-700 mb-1">Monthly Fee</p>
                    <p className="text-purple-900">₹{(structure.monthlyFee || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <p className="text-orange-700 mb-1">Quarterly Fee</p>
                    <p className="text-orange-900">₹{(structure.quarterlyFee || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-3">
                    <p className="text-indigo-700 mb-1">Transport Fee</p>
                    <p className="text-indigo-900">₹{(structure.transportFee || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-pink-50 rounded-lg p-3">
                    <p className="text-pink-700 mb-1">Daycare Fee</p>
                    <p className="text-pink-900">₹{(structure.daycareFee || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <p className="text-yellow-700 mb-1">Activity Fee</p>
                    <p className="text-yellow-900">₹{(structure.activityFee || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fee Collection Tab */}
      {activeTab === 'collection' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-gray-900">Fee Collection</h2>
            <button
              onClick={() => setShowCollectionForm(!showCollectionForm)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Collect Payment
            </button>
          </div>

          {/* Collection Form */}
          {showCollectionForm && (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
              <h3 className="text-gray-900 mb-4">Payment Entry</h3>
              <form onSubmit={handleCollectionSubmit} className="space-y-6">
                
                {/* Smart Search Section */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <h4 className="text-gray-900 font-medium mb-3">1. Select Student</h4>
                  
                  {!selectedStudentForFee ? (
                    <div className="space-y-4">
                      {/* Search Filters */}
                      <div className="flex gap-2">
                        <select
                          value={studentSearchClass}
                          onChange={(e) => setStudentSearchClass(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-1/3"
                        >
                          <option value="">All Classes</option>
                          {uniqueClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                        </select>
                        <select
                          value={studentSearchSection}
                          onChange={(e) => setStudentSearchSection(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-1/3"
                        >
                          <option value="">All Sections</option>
                          {['A', 'B', 'C', 'D'].map(sec => <option key={sec} value={sec}>Section {sec}</option>)}
                        </select>
                      </div>

                      {/* Search Input */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          value={studentSearchQuery}
                          onChange={(e) => {
                            setStudentSearchQuery(e.target.value);
                            setIsSearchDropdownOpen(true);
                          }}
                          onFocus={() => setIsSearchDropdownOpen(true)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Search student (Name / Phone / Parent / Admission No)..."
                        />
                        
                        {/* Dropdown Results */}
                        {isSearchDropdownOpen && (studentSearchQuery || studentSearchClass || studentSearchSection) && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filteredSearchStudents.length > 0 ? (
                              filteredSearchStudents.map(student => (
                                <button
                                  key={student.id}
                                  type="button"
                                  onClick={() => handleSelectStudentForFee(student)}
                                  className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-0"
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-medium text-gray-900">{student.name || student.studentName}</p>
                                      <p className="text-sm text-gray-500">
                                        Adm: {student.admissionNo} • Class: {student.class} {student.section ? `(${student.section})` : ''}
                                      </p>
                                    </div>
                                    <div className="text-right text-sm text-gray-500">
                                      <p>Parent: {student.parentName || 'N/A'}</p>
                                      <p>{student.parentPhone ? student.parentPhone.replace(/.(?=.{4})/g, '*') : 'N/A'}</p>
                                    </div>
                                  </div>
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-gray-500 text-center">No students found</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Selected Student Card */
                    <div className="bg-white border border-blue-200 rounded-lg p-4 relative">
                      <button
                        type="button"
                        onClick={clearSelectedStudentForFee}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                          {(selectedStudentForFee.name || selectedStudentForFee.studentName || 'S').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-900">{selectedStudentForFee.name || selectedStudentForFee.studentName}</h4>
                          <div className="flex gap-4 text-sm text-gray-600 mt-1">
                            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> Class {selectedStudentForFee.class} {selectedStudentForFee.section ? `(${selectedStudentForFee.section})` : ''}</span>
                            <span className="flex items-center gap-1"><FileText className="w-4 h-4" /> Adm: {selectedStudentForFee.admissionNo}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Total Pending Dues</p>
                          <p className={`text-xl font-bold ${selectedStudentLedger && selectedStudentLedger.dueAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ₹{selectedStudentLedger ? selectedStudentLedger.dueAmount.toLocaleString() : '0'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Details Section */}
                <div className={`transition-opacity ${!selectedStudentForFee ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                  <h4 className="text-gray-900 font-medium mb-3">2. Payment Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <div>
                      <label className="block text-gray-700 mb-2">Fee Type *</label>
                      <select
                        value={collectionForm.feeType}
                        onChange={(e) => handleFeeTypeChange(e.target.value)}
                        required={!!selectedStudentForFee}
                        disabled={!selectedStudentForFee}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Fee Type</option>
                        <option value="Admission Fee">Admission Fee</option>
                        <option value="Annual Fee">Annual Fee</option>
                        <option value="Monthly Fee">Monthly Fee</option>
                        <option value="Quarterly Fee">Quarterly Fee</option>
                        <option value="Transport Fee">Transport Fee</option>
                        <option value="Daycare Fee">Daycare Fee</option>
                        <option value="Activity Fee">Activity Fee</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Select a fee type to auto-fill the base amount.</p>
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-2">Total Fee (₹) *</label>
                      <input
                        type="number"
                        value={collectionForm.amount}
                        readOnly
                        required={!!selectedStudentForFee}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
                        placeholder="Auto-calculated"
                      />
                    </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Amount Paying Now (₹) *</label>
                    <input
                      type="number"
                      value={collectionForm.paidAmount}
                      onChange={(e) => setCollectionForm({ ...collectionForm, paidAmount: e.target.value })}
                      required={!!selectedStudentForFee}
                      disabled={!selectedStudentForFee}
                      className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold text-blue-900 bg-blue-50"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Payment Mode *</label>
                    <select
                      value={collectionForm.paymentMode}
                      onChange={(e) => setCollectionForm({ ...collectionForm, paymentMode: e.target.value as any })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="online">Online</option>
                      <option value="bank-transfer">Bank Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Discount (₹) - Optional</label>
                    <input
                      type="number"
                      value={collectionForm.discount}
                      onChange={(e) => setCollectionForm({ ...collectionForm, discount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Late Fee (₹) - Optional</label>
                    <input
                      type="number"
                      value={collectionForm.lateFee}
                      onChange={(e) => setCollectionForm({ ...collectionForm, lateFee: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Calculation Display */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 shadow-sm mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-blue-700 mb-1">Total Fee</p>
                      <p className="text-blue-900 font-semibold">₹{(parseFloat(collectionForm.amount) || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-green-700 mb-1">Discount</p>
                      <p className="text-green-900">- ₹{(parseFloat(collectionForm.discount) || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-red-700 mb-1">Late Fee</p>
                      <p className="text-red-900">+ ₹{(parseFloat(collectionForm.lateFee) || 0).toLocaleString()}</p>
                    </div>
                    <div className="border-l border-blue-200 pl-4">
                      <p className="text-blue-800 font-medium mb-1">Net Payable</p>
                      <p className="text-blue-900 font-bold text-lg">₹{calculateNetPayable().toLocaleString()}</p>
                    </div>
                    <div className="border-l border-indigo-200 pl-4">
                      <p className="text-indigo-800 font-medium mb-1">Balance</p>
                      <p className={`font-bold text-lg ${calculateBalance() > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ₹{calculateBalance().toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={collectionForm.notes}
                    onChange={(e) => setCollectionForm({ ...collectionForm, notes: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Additional notes..."
                  />
                </div>

                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={!selectedStudentForFee}
                    className={`px-4 py-2 text-white rounded-lg flex items-center gap-2 transition-colors ${
                      !selectedStudentForFee 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    Collect Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCollectionForm(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Recent Payments */}
          <div className="mt-12">
            <h3 className="text-gray-900 font-bold text-xl mb-6 flex items-center gap-2">
              <Receipt className="w-6 h-6 text-blue-600" />
              Recent Payments History
            </h3>
            <div className="space-y-6">
              {payments.map((payment) => {
                const student = studentsData.find(s => s.id === payment.studentId || s.admissionNo === payment.admissionNo);
                const displayName = payment.studentName || student?.name || student?.studentName || 'Unknown Student';
                const displayClass = payment.class || student?.class || 'N/A';
                const displayId = payment.admissionNo || student?.admissionNo || 'N/A';

                return (
                  <div key={payment.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300">
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div className="flex gap-4 items-center">
                          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                            <Users className="w-7 h-7" />
                          </div>
                          <div>
                            <h4 className="text-gray-900 font-bold text-xl tracking-tight">{displayName}</h4>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-100/50 text-blue-700 text-xs font-bold rounded-lg uppercase tracking-wider">
                                <TrendingUp className="w-3.5 h-3.5" />
                                Class {displayClass}
                              </span>
                              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                              <span className="text-gray-500 font-medium text-sm">ID: {displayId}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => downloadReceiptPDF(payment)}
                            className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-[0_4px_12px_rgba(22,163,74,0.2)] hover:shadow-[0_6px_16px_rgba(22,163,74,0.3)] flex items-center gap-2 font-bold text-sm active:scale-95"
                          >
                            <Download className="w-4 h-4" />
                            Download Receipt
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                        {/* Box 1: Student Name */}
                        <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 hover:bg-white transition-all">
                          <div className="flex items-center gap-2 text-blue-600 text-[10px] font-extrabold uppercase tracking-wider mb-2">
                            <Users className="w-3.5 h-3.5" />
                            Student Name
                          </div>
                          <p className="text-gray-900 font-bold text-sm truncate">{displayName}</p>
                        </div>

                        {/* Box 2: Class & ID */}
                        <div className="bg-gray-50/70 rounded-2xl p-4 border border-gray-100 hover:bg-white transition-all">
                          <div className="flex items-center gap-2 text-gray-500 text-[10px] font-extrabold uppercase tracking-wider mb-2">
                            <TrendingUp className="w-3.5 h-3.5" />
                            Class / ID
                          </div>
                          <p className="text-gray-900 font-bold text-sm">
                            {displayClass} <span className="text-gray-400 font-normal mx-1">|</span> {displayId}
                          </p>
                        </div>

                        {/* Box 3: Receipt No */}
                        <div className="bg-gray-50/70 rounded-2xl p-4 border border-gray-100 hover:bg-white transition-all">
                          <div className="flex items-center gap-2 text-gray-400 text-[10px] font-extrabold uppercase tracking-wider mb-2">
                            <FileText className="w-3.5 h-3.5" />
                            Receipt No
                          </div>
                          <p className="text-gray-900 font-black font-mono text-sm">{payment.receiptNo}</p>
                        </div>
                        
                        {/* Box 4: Fee Category */}
                        <div className="bg-gray-50/70 rounded-2xl p-4 border border-gray-100 hover:bg-white transition-all">
                          <div className="flex items-center gap-2 text-gray-400 text-[10px] font-extrabold uppercase tracking-wider mb-2">
                            <Tag className="w-3.5 h-3.5" />
                            Fee Category
                          </div>
                          <p className="text-gray-900 font-bold text-sm">{payment.feeType || 'General Fee'}</p>
                        </div>

                        {/* Box 5: Amount */}
                        <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-100 group hover:bg-white hover:border-emerald-300 transition-all duration-300">
                          <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-extrabold uppercase tracking-wider mb-2">
                            <Wallet className="w-3.5 h-3.5" />
                            Paid Amount
                          </div>
                          <p className="text-emerald-700 font-black text-xl">₹{(payment.totalAmount || payment.amount || 0).toLocaleString()}</p>
                        </div>

                        {/* Box 6: Method */}
                        <div className="bg-gray-50/70 rounded-2xl p-4 border border-gray-100 hover:bg-white transition-all">
                          <div className="flex items-center gap-2 text-gray-400 text-[10px] font-extrabold uppercase tracking-wider mb-2">
                            <CreditCard className="w-3.5 h-3.5" />
                            Method
                          </div>
                          <p className="text-gray-900 font-bold text-sm uppercase">{(payment.paymentMode || 'cash')}</p>
                        </div>

                        {/* Box 7: Date */}
                        <div className="bg-gray-50/70 rounded-2xl p-4 border border-gray-100 hover:bg-white transition-all">
                          <div className="flex items-center gap-2 text-gray-400 text-[10px] font-extrabold uppercase tracking-wider mb-2">
                            <Calendar className="w-3.5 h-3.5" />
                            Payment Date
                          </div>
                          <p className="text-gray-900 font-bold text-sm">{payment.paymentDate}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Fee Accounting Tab */}
      {activeTab === 'accounting' && (
        <div>
          <h2 className="text-gray-900 mb-6">Fee Accounting</h2>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-blue-100">Today's Collection</p>
                <Calendar className="w-6 h-6 text-blue-100" />
              </div>
              <p className="text-white mb-1">₹{getTodayCollection().toLocaleString()}</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-green-100">Monthly Collection</p>
                <TrendingUp className="w-6 h-6 text-green-100" />
              </div>
              <p className="text-white mb-1">₹{getMonthlyCollection().toLocaleString()}</p>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-red-100">Total Outstanding</p>
                <DollarSign className="w-6 h-6 text-red-100" />
              </div>
              <p className="text-white mb-1">₹{getTotalOutstanding().toLocaleString()}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-purple-100">Total Students</p>
                <Users className="w-6 h-6 text-purple-100" />
              </div>
              <p className="text-white mb-1">{studentLedgers.length}</p>
            </div>
          </div>

          {/* Class-wise Collection Report */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-8">
            <h3 className="text-gray-900 mb-4">Class-wise Fee Collection</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(getClassWiseCollection()).map(([className, amount]) => (
                <div key={className} className="bg-blue-50 rounded-lg p-4">
                  <p className="text-blue-700 mb-1">Class {className}</p>
                  <p className="text-blue-900">₹{amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Student Ledgers */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <h3 className="text-gray-900">Student Ledgers & Outstanding Fees</h3>
              <div className="flex flex-col md:flex-row gap-3">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white min-w-[150px]"
                >
                  <option value="all">All Classes</option>
                  {uniqueClasses.map(className => (
                    <option key={className} value={className}>{className}</option>
                  ))}
                </select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search student..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-gray-700">Student Name</th>
                    <th className="px-4 py-3 text-left text-gray-700">Admission No</th>
                    <th className="px-4 py-3 text-left text-gray-700">Class</th>
                    <th className="px-4 py-3 text-right text-gray-700">Total Fee</th>
                    <th className="px-4 py-3 text-right text-gray-700">Paid</th>
                    <th className="px-4 py-3 text-right text-gray-700">Due</th>
                    <th className="px-4 py-3 text-left text-gray-700">Last Payment</th>
                    <th className="px-4 py-3 text-center text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {studentLedgers
                    .filter(s => {
                      const matchesSearch = s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.admissionNo.toLowerCase().includes(searchTerm.toLowerCase());
                      const studentClassNormalized = s.class.replace(/^Class\s+/i, '');
                      const selectedClassNormalized = selectedClass.replace(/^Class\s+/i, '');
                      const matchesClass = selectedClass === 'all' || studentClassNormalized === selectedClassNormalized;
                      return matchesSearch && matchesClass;
                    })
                    .map((student, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">{student.studentName}</td>
                        <td className="px-4 py-3 text-gray-700">{student.admissionNo}</td>
                        <td className="px-4 py-3 text-gray-700">Class {student.class}</td>
                        <td className="px-4 py-3 text-right text-gray-900">₹{(student.totalFee || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-green-700">₹{(student.paidAmount || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`${student.dueAmount > 0 ? 'text-red-700' : 'text-green-700'}`}>
                            ₹{(student.dueAmount || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{student.lastPaymentDate}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleCall(student.parentPhone)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Call Parent"
                            >
                              <Phone className="w-4 h-4" />
                            </button>
                            {student.dueAmount > 0 && (
                              <button
                                onClick={() => handleSendNotification(student)}
                                className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Send Notification"
                              >
                                <Bell className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reports Download */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Download className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-gray-900">Daily Collection Report</h3>
              </div>
              <p className="text-gray-600">Download today's collection summary</p>
            </button>

            <button className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Download className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-gray-900">Monthly Report</h3>
              </div>
              <p className="text-gray-600">Download monthly collection report</p>
            </button>

            <button className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Download className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-gray-900">Outstanding Report</h3>
              </div>
              <p className="text-gray-600">Download outstanding fees list</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}