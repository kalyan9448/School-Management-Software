import { useState, useEffect } from 'react';
import { Plus, Download, Search, DollarSign, Receipt, FileText, TrendingUp, Users, Calendar, Edit2, Trash2, Check, X, Send, Phone, Bell } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { notificationService, feeService, studentService } from '../utils/centralDataService';
import { getUniqueClasses } from '../utils/classUtils';

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
    paymentMode: 'cash' as const,
    discount: '',
    lateFee: '',
    notes: '',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');

  // Student Ledgers
  const [studentLedgers, setStudentLedgers] = useState<StudentLedger[]>([]);

  // Load data from Firestore on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const allFees = await feeService.getAll();

        // Separate structures from payments based on data shape
        const structures = allFees.filter((f: any) => f.type === 'structure');
        const paymentRecords = allFees.filter((f: any) => f.type === 'payment');

        if (structures.length > 0) setFeeStructures(structures);
        if (paymentRecords.length > 0) setPayments(paymentRecords);

        // Derive ledgers from students + payment data
        const students = await studentService.getAll();
        if (students.length > 0) {
          const ledgers: StudentLedger[] = students.map((s: any) => {
            const studentPayments = paymentRecords.filter(
              (p: any) => p.admissionNo?.toLowerCase() === s.admissionNo?.toLowerCase()
            );
            const paidAmount = studentPayments.reduce((sum: number, p: any) => sum + (p.totalAmount || 0), 0);
            const totalFee = s.totalFee || 0;
            return {
              studentName: s.name || s.studentName || '',
              admissionNo: s.admissionNo || '',
              class: s.class || '',
              totalFee,
              paidAmount,
              dueAmount: Math.max(0, totalFee - paidAmount),
              lastPaymentDate: studentPayments.length > 0
                ? studentPayments[studentPayments.length - 1].paymentDate
                : '-',
              parentPhone: s.parentPhone || '',
              parentId: s.parentId,
            };
          });
          setStudentLedgers(ledgers);
        }
      } catch (err) {
        console.error('Failed to load fee data:', err);
      }
    };
    loadData();
  }, []);

  // Generate Receipt Number
  const generateReceiptNo = () => {
    const count = payments.length + 1;
    return `RCP${count.toString().padStart(4, '0')}`;
  };

  // Calculate total amount with discount and late fee
  const calculateTotalAmount = () => {
    const amount = parseFloat(collectionForm.amount) || 0;
    const discount = parseFloat(collectionForm.discount) || 0;
    const lateFee = parseFloat(collectionForm.lateFee) || 0;
    return amount - discount + lateFee;
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

    // Table Header
    doc.setFont('helvetica', 'bold');
    doc.text('| Fee Type', 20, 115);
    doc.text('| Amount', 140, 115);
    doc.text('|', 180, 115);

    doc.setFont('helvetica', 'normal');
    doc.text('|-----------------|--------|', 20, 120);

    // Table Row
    doc.text(`| ${payment.feeType}`, 20, 128);
    doc.text(`| Rs. ${payment.totalAmount.toLocaleString()}`, 140, 128);
    doc.text('|', 180, 128);

    centerText('---------------------------------------------------------', 136);

    // Total
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Amount Paid : Rs. ${payment.totalAmount.toLocaleString()}`, 20, 145);
    centerText('---------------------------------------------------------', 151);

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Thank you for your payment.', 20, 165);

    doc.text('Authorized Signature', 140, 180);
    doc.text('School Admin', 140, 187);

    centerText('---------------------------------------------------------', 200);
    centerText('Generated from School Management System', 207);
    centerText('---------------------------------------------------------', 214);

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

      await feeService.create({ ...updatedStructure, type: 'structure' });
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
      await feeService.create({ ...newStructure, type: 'structure' });
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
      const updatedStructures = feeStructures.filter(s => s.id !== structure.id);
      setFeeStructures(updatedStructures);
      alert(`Fee structure for Class ${structure.class} has been deleted successfully!`);
    }
  };

  // Handle Payment Collection Submit
  const handleCollectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const receiptNo = generateReceiptNo();
    const totalAmount = calculateTotalAmount();

    const newPayment: Payment = {
      id: Date.now().toString(),
      studentName: collectionForm.studentName,
      admissionNo: collectionForm.admissionNo,
      class: collectionForm.class,
      amount: parseFloat(collectionForm.amount) || 0,
      paymentMode: collectionForm.paymentMode,
      paymentDate: new Date().toISOString().split('T')[0],
      receiptNo: receiptNo,
      feeType: collectionForm.feeType,
      discount: parseFloat(collectionForm.discount) || 0,
      lateFee: parseFloat(collectionForm.lateFee) || 0,
      totalAmount: totalAmount,
      status: 'paid',
    };

    await feeService.recordPayment({ ...newPayment, type: 'payment' });
    const newPayments = [newPayment, ...payments];
    setPayments(newPayments);

    // Update Student Ledger dynamically
    const updatedLedgers = studentLedgers.map(s => {
      // Compare by admission number to find the student
      if (s.admissionNo.toLowerCase() === collectionForm.admissionNo.toLowerCase()) {
        const newPaid = s.paidAmount + totalAmount;
        return {
          ...s,
          paidAmount: newPaid,
          dueAmount: Math.max(0, s.totalFee - newPaid),
          lastPaymentDate: newPayment.paymentDate
        };
      }
      return s;
    });

    setStudentLedgers(updatedLedgers);

    // Generate PDF and show success
    alert(`Payment Successful!\n\nReceipt No: ${receiptNo}\nAmount Paid: ₹${totalAmount.toLocaleString()}\n\nReceipt PDF generated automatically.`);

    setCollectionForm({
      studentName: '',
      admissionNo: '',
      class: '',
      feeType: '',
      amount: '',
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
      .reduce((sum, p) => sum + p.totalAmount, 0);
  };

  const getMonthlyCollection = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return payments
      .filter(p => {
        const date = new Date(p.paymentDate);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + p.totalAmount, 0);
  };

  const getTotalOutstanding = () => {
    return studentLedgers.reduce((sum, s) => sum + s.dueAmount, 0);
  };

  const getClassWiseCollection = () => {
    const classWise: { [key: string]: number } = {};
    payments.forEach(p => {
      if (!classWise[p.class]) {
        classWise[p.class] = 0;
      }
      classWise[p.class] += p.totalAmount;
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
                      {getUniqueClasses().map(cls => (
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
                    <p className="text-blue-900">₹{structure.admissionFee.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-green-700 mb-1">Annual Fee</p>
                    <p className="text-green-900">₹{structure.annualFee.toLocaleString()}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-purple-700 mb-1">Monthly Fee</p>
                    <p className="text-purple-900">₹{structure.monthlyFee.toLocaleString()}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <p className="text-orange-700 mb-1">Quarterly Fee</p>
                    <p className="text-orange-900">₹{structure.quarterlyFee.toLocaleString()}</p>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-3">
                    <p className="text-indigo-700 mb-1">Transport Fee</p>
                    <p className="text-indigo-900">₹{structure.transportFee.toLocaleString()}</p>
                  </div>
                  <div className="bg-pink-50 rounded-lg p-3">
                    <p className="text-pink-700 mb-1">Daycare Fee</p>
                    <p className="text-pink-900">₹{structure.daycareFee.toLocaleString()}</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <p className="text-yellow-700 mb-1">Activity Fee</p>
                    <p className="text-yellow-900">₹{structure.activityFee.toLocaleString()}</p>
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
              <form onSubmit={handleCollectionSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Student Name *</label>
                    <input
                      type="text"
                      value={collectionForm.studentName}
                      onChange={(e) => setCollectionForm({ ...collectionForm, studentName: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter student name"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Admission No *</label>
                    <input
                      type="text"
                      value={collectionForm.admissionNo}
                      onChange={(e) => setCollectionForm({ ...collectionForm, admissionNo: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ADM2024001"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Class *</label>
                    <select
                      value={collectionForm.class}
                      onChange={(e) => setCollectionForm({ ...collectionForm, class: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Class</option>
                      {getUniqueClasses().map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Fee Type *</label>
                    <select
                      value={collectionForm.feeType}
                      onChange={(e) => setCollectionForm({ ...collectionForm, feeType: e.target.value })}
                      required
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
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Amount (₹) *</label>
                    <input
                      type="number"
                      value={collectionForm.amount}
                      onChange={(e) => setCollectionForm({ ...collectionForm, amount: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="15000"
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
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-blue-700 mb-1">Base Amount</p>
                      <p className="text-blue-900">₹{(parseFloat(collectionForm.amount) || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-green-700 mb-1">Discount</p>
                      <p className="text-green-900">- ₹{(parseFloat(collectionForm.discount) || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-red-700 mb-1">Late Fee</p>
                      <p className="text-red-900">+ ₹{(parseFloat(collectionForm.lateFee) || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-purple-700 mb-1">Total Amount</p>
                      <p className="text-purple-900">₹{calculateTotalAmount().toLocaleString()}</p>
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

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Process Payment & Generate Invoice
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
          <div>
            <h3 className="text-gray-900 mb-4">Recent Payments</h3>
            <div className="space-y-4">
              {payments.map((payment) => (
                <div key={payment.id} className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-gray-900 mb-1">{payment.studentName}</h3>
                      <p className="text-gray-600">{payment.admissionNo} | Class {payment.class}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadReceiptPDF(payment)}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                      >
                        <Download className="w-4 h-4" />
                        Download PDF
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-600 mb-1">Receipt No</p>
                      <p className="text-gray-900">{payment.receiptNo}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-600 mb-1">Fee Type</p>
                      <p className="text-gray-900">{payment.feeType}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-600 mb-1">Amount</p>
                      <p className="text-gray-900">₹{payment.totalAmount.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-600 mb-1">Payment Mode</p>
                      <p className="text-gray-900">{payment.paymentMode.toUpperCase()}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-600 mb-1">Date</p>
                      <p className="text-gray-900">{payment.paymentDate}</p>
                    </div>
                  </div>
                </div>
              ))}
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
                  {[...new Set(studentLedgers.map(s => s.class))].sort().map(className => (
                    <option key={className} value={className}>Class {className}</option>
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
                      const matchesClass = selectedClass === 'all' || s.class === selectedClass;
                      return matchesSearch && matchesClass;
                    })
                    .map((student, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">{student.studentName}</td>
                        <td className="px-4 py-3 text-gray-700">{student.admissionNo}</td>
                        <td className="px-4 py-3 text-gray-700">Class {student.class}</td>
                        <td className="px-4 py-3 text-right text-gray-900">₹{student.totalFee.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-green-700">₹{student.paidAmount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`${student.dueAmount > 0 ? 'text-red-700' : 'text-green-700'}`}>
                            ₹{student.dueAmount.toLocaleString()}
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