import React, { useEffect, useState } from 'react';
import { Download, FileText, TrendingUp, Users, DollarSign, Calendar, BarChart3, PieChart, Award, Sparkles } from 'lucide-react';
import { studentService, attendanceService, feeService, enquiryService, reportsService } from '../utils/centralDataService';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { createTemplatedDoc, TEMPLATE_MARGINS } from '../utils/pdfTemplateService';

export function ReportsModule() {
  const reports = [
    {
      id: 1,
      title: 'Daily Fee Collection',
      description: 'Complete breakdown of fee collected today',
      icon: DollarSign,
      gradient: 'from-emerald-400 via-green-500 to-teal-600',
      bgPattern: 'from-emerald-50 to-green-100',
      borderColor: 'border-emerald-200',
      iconBg: 'bg-emerald-500',
      category: 'Finance',
    },
    {
      id: 2,
      title: 'Monthly Attendance Report',
      description: 'Student attendance summary for the month',
      icon: Calendar,
      gradient: 'from-blue-400 via-indigo-500 to-purple-600',
      bgPattern: 'from-blue-50 to-indigo-100',
      borderColor: 'border-blue-200',
      iconBg: 'bg-blue-500',
      category: 'Attendance',
    },
    {
      id: 3,
      title: 'Outstanding Fee Dues',
      description: 'List of students with pending fee payments',
      icon: FileText,
      gradient: 'from-rose-400 via-red-500 to-pink-600',
      bgPattern: 'from-rose-50 to-red-100',
      borderColor: 'border-rose-200',
      iconBg: 'bg-rose-500',
      category: 'Finance',
    },
    {
      id: 4,
      title: 'Student Enrollment Report',
      description: 'Class-wise student enrollment statistics',
      icon: Users,
      gradient: 'from-purple-400 via-violet-500 to-indigo-600',
      bgPattern: 'from-purple-50 to-violet-100',
      borderColor: 'border-purple-200',
      iconBg: 'bg-purple-500',
      category: 'Admission',
    },
    {
      id: 5,
      title: 'Class-wise Fee Collection',
      description: 'Fee collection grouped by class',
      icon: TrendingUp,
      gradient: 'from-orange-400 via-amber-500 to-yellow-600',
      bgPattern: 'from-orange-50 to-amber-100',
      borderColor: 'border-orange-200',
      iconBg: 'bg-orange-500',
      category: 'Finance',
    },
    {
      id: 6,
      title: 'Admission Pipeline',
      description: 'Track enquiries and admission conversions',
      icon: Users,
      gradient: 'from-cyan-400 via-sky-500 to-blue-600',
      bgPattern: 'from-cyan-50 to-sky-100',
      borderColor: 'border-cyan-200',
      iconBg: 'bg-cyan-500',
      category: 'Admission',
    },
    {
      id: 7,
      title: 'Student Ledger',
      description: 'Individual student fee payment history',
      icon: FileText,
      gradient: 'from-teal-400 via-emerald-500 to-green-600',
      bgPattern: 'from-teal-50 to-emerald-100',
      borderColor: 'border-teal-200',
      iconBg: 'bg-teal-500',
      category: 'Finance',
    },
    {
      id: 8,
      title: 'Absent Students Report',
      description: 'Students absent for consecutive days',
      icon: Calendar,
      gradient: 'from-yellow-400 via-amber-500 to-orange-600',
      bgPattern: 'from-yellow-50 to-amber-100',
      borderColor: 'border-yellow-200',
      iconBg: 'bg-yellow-500',
      category: 'Attendance',
    },
  ];

  const categories = ['All', 'Finance', 'Attendance', 'Admission'];
  const [selectedCategory, setSelectedCategory] = React.useState('All');

  // Fetch dynamic data from Firestore
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [feePayments, setFeePayments] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [s, a, f, e] = await Promise.all([
          studentService.getAll(),
          attendanceService.getAll(),
          feeService.getAllPayments(),
          enquiryService.getAll(),
        ]);
        setStudents(s);
        setAttendanceRecords(a);
        setFeePayments(f);
        setEnquiries(e);
      } catch (err) {
        console.error('Failed to load report data:', err);
      }
    };
    loadData();
  }, []);

  // Compute dynamic analytics
  const totalFeeCollected = feePayments
    .filter((p: any) => p.status === 'paid')
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

  const totalStudents = students.length;
  const presentCount = attendanceRecords.filter((a: any) => a.status === 'present').length;
  const totalAttendanceRecords = attendanceRecords.length;
  const overallAttendance = totalAttendanceRecords > 0
    ? Math.round((presentCount / totalAttendanceRecords) * 100)
    : 0;

  const enquiriesTotal = enquiries.length;
  const confirmedEnquiries = enquiries.filter((e: any) => e.status === 'converted' || e.status === 'admitted').length;
  const inProcessEnquiries = enquiries.filter((e: any) => e.status === 'in_progress' || e.status === 'contacted' || e.status === 'follow_up').length;
  const pendingEnquiries = enquiriesTotal - confirmedEnquiries - inProcessEnquiries;

  const handleDownloadReport = async (report: any) => {
    try {
      const activeSchoolId = sessionStorage.getItem('active_school_id');
      if (!activeSchoolId) {
        alert("School context synchronized. Please refresh the page and try again.");
        return;
      }

      const doc = createTemplatedDoc() as any;
      const today = new Date().toISOString().split('T')[0];
      const topY = TEMPLATE_MARGINS.top;
      
      // Report title (branding comes from the template background)
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text(report.title, 105, topY, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text(`Generated on: ${today} | Category: ${report.category}`, 105, topY + 8, { align: 'center' });
      
      doc.setDrawColor(229, 231, 235);
      doc.line(20, topY + 14, 190, topY + 14);

      if (report.title.includes('Attendance')) {
        const attendanceData = await attendanceService.getAll();
        const tableRows = attendanceData.slice(0, 50).map((record: any) => [
          record.date || 'N/A',
          record.studentName || 'N/A',
          record.class || 'N/A',
          record.section || 'N/A',
          (record.status || 'N/A').toUpperCase()
        ]);

        autoTable(doc, {
          startY: topY + 22,
          head: [['Date', 'Student Name', 'Class', 'Section', 'Status']],
          body: tableRows.length > 0 ? tableRows : [['-', 'No Records Found', '-', '-', '-']],
          headStyles: { fillColor: [126, 34, 206] },
          theme: 'grid'
        });
      } else if (report.title.includes('Fee') || report.title.includes('Collection') || report.title.includes('Ledger')) {
        const feePayments = await feeService.getAllPayments();
        const tableRows = feePayments.slice(0, 50).map((payment: any) => [
          payment.paymentDate || 'N/A',
          payment.studentName || 'N/A',
          payment.receiptNo || 'N/A',
          `Rs. ${payment.amount?.toLocaleString() || 0}`,
          'PAID'
        ]);

        autoTable(doc, {
          startY: topY + 22,
          head: [['Date', 'Student Name', 'Receipt #', 'Amount', 'Status']],
          body: tableRows.length > 0 ? tableRows : [['-', 'No Payments Found', '-', '-', '-']],
          headStyles: { fillColor: [126, 34, 206] },
          theme: 'grid'
        });
      } else if (report.title.includes('Enrollment') || report.title.includes('Admission')) {
        const tableRows = students.slice(0, 50).map((s: any) => [
          s.admissionNo || 'N/A',
          s.name || 'N/A',
          s.class || 'N/A',
          s.section || 'N/A',
          s.status?.toUpperCase() || 'ACTIVE'
        ]);

        autoTable(doc, {
          startY: topY + 22,
          head: [['ID', 'Student Name', 'Class', 'Section', 'Status']],
          body: tableRows.length > 0 ? tableRows : [['-', 'No Students Found', '-', '-', '-']],
          headStyles: { fillColor: [126, 34, 206] },
          theme: 'grid'
        });
      } else {
        doc.setFontSize(12);
        doc.text("Report generation for this module is being consolidated.", 20, topY + 25);
      }

      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text("System Generated Report", 105, 297 - TEMPLATE_MARGINS.bottom - 5, { align: 'center' });

      doc.save(`${report.title.replace(/\s+/g, '_')}_${today}.pdf`);
      alert(`Report "${report.title}" generated and downloaded successfully!`);

      // Save record to Firestore for persistence
      try {
        await reportsService.createGenerated({
          name: report.title,
          type: report.category,
          generatedOn: today,
          format: 'PDF',
          size: '1.4 MB',
          status: 'success'
        });
      } catch (saveError) {
        console.error("Failed to save report record to Firestore:", saveError);
        // We don't alert here to avoid interrupting the download experience
      }
    } catch (error: any) {
      console.error("Report Download Error:", error);
      alert(`Failed to download report: ${error?.message || 'Unknown error'}. Please try again.`);
    }
  };

  const filteredReports = selectedCategory === 'All' 
    ? reports 
    : reports.filter(r => r.category === selectedCategory);

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header with Sparkle */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-xl transform -rotate-6 hover:rotate-0 transition-transform duration-300">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <Sparkles className="w-5 h-5 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div>
            <h1 className="text-gray-900 mb-1">Reports & Analytics</h1>
            <p className="text-gray-600">Generate and download various reports</p>
          </div>
        </div>
      </div>

      {/* Playful Category Filter */}
      <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`group relative px-6 py-3 rounded-full whitespace-nowrap transition-all duration-300 ${
              selectedCategory === category
                ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white shadow-2xl shadow-purple-500/40 scale-110'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300 hover:shadow-xl hover:scale-105'
            }`}
          >
            <span className="relative z-10">{category}</span>
            {selectedCategory === category && (
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 rounded-full blur opacity-50 group-hover:opacity-70 transition-opacity"></div>
            )}
          </button>
        ))}
      </div>

      {/* Beautiful Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">
        {filteredReports.map((report) => {
          const Icon = report.icon;
          return (
            <div
              key={report.id}
              className={`group relative overflow-hidden bg-gradient-to-br ${report.bgPattern} rounded-3xl shadow-xl border-3 ${report.borderColor} hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer`}
            >
              {/* Decorative circles */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
              
              {/* Icon Header with Gradient */}
              <div className={`relative h-40 bg-gradient-to-br ${report.gradient} p-6 flex items-center justify-center overflow-hidden`}>
                <div className="absolute inset-0 bg-white/5"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                
                {/* Floating Icon Container */}
                <div className="relative z-10 w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 shadow-2xl border border-white/30">
                  <Icon className="w-10 h-10 text-white drop-shadow-lg" />
                </div>
                
                {/* Sparkle effect */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Sparkles className="w-6 h-6 text-white/80 animate-pulse" />
                </div>
              </div>

              {/* Content */}
              <div className="relative p-6 bg-white/60 backdrop-blur-sm">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-gray-900 flex-1 leading-tight">{report.title}</h3>
                  <span className={`px-3 py-1.5 bg-white/80 text-gray-700 rounded-full text-xs border-2 ${report.borderColor} shadow-sm`}>
                    {report.category}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-5 leading-relaxed">{report.description}</p>
                
                <button 
                  onClick={() => handleDownloadReport(report)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r ${report.gradient} text-white rounded-2xl hover:shadow-xl transition-all duration-300 group-hover:scale-105`}
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Analytics Section */}
      <div className="mt-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-6 transition-transform">
            <PieChart className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-gray-900">Quick Analytics Dashboard</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fee Collection Trend */}
          <div className="relative overflow-hidden bg-white rounded-3xl shadow-xl border-3 border-emerald-200 p-7 hover:shadow-2xl transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-100 to-green-200 rounded-bl-full opacity-40"></div>
            
            <div className="relative flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6 group-hover:rotate-0 transition-transform">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-gray-900">Fee Collection Trend</h3>
            </div>
            
            <div className="space-y-4 relative">
              {(() => {
                // Group fee payments by month
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                const monthlyTotals: Record<string, number> = {};
                feePayments.filter((p: any) => p.status === 'paid').forEach((p: any) => {
                  const d = new Date(p.date || p.created_at || '');
                  if (!isNaN(d.getTime())) {
                    const key = monthNames[d.getMonth()];
                    monthlyTotals[key] = (monthlyTotals[key] || 0) + (p.amount || 0);
                  }
                });
                const entries = Object.entries(monthlyTotals).slice(-4);
                const maxAmount = Math.max(...entries.map(([, v]) => v), 1);
                if (entries.length === 0) return <p className="text-gray-500 text-center py-4">No fee data yet</p>;
                return entries.map(([month, amount]) => {
                  const percentage = (amount / maxAmount) * 100;
                  return (
                    <div key={month} className="p-4 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 rounded-2xl border border-emerald-100 hover:border-emerald-300 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-700">{month}</span>
                        <span className="text-gray-900 px-3 py-1 bg-white rounded-full shadow-sm border border-emerald-200">₹{amount >= 1000 ? (amount / 1000).toFixed(0) + 'K' : amount}</span>
                      </div>
                      <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full shadow-lg transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Attendance Overview */}
          <div className="relative overflow-hidden bg-white rounded-3xl shadow-xl border-3 border-blue-200 p-7 hover:shadow-2xl transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-bl-full opacity-40"></div>
            
            <div className="relative flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-6 group-hover:rotate-0 transition-transform">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-gray-900">Attendance Overview</h3>
            </div>
            
            <div className="space-y-4 relative">
              {(() => {
                // Group attendance by class ranges
                const classGroups: Record<string, { present: number; total: number }> = {};
                attendanceRecords.forEach((a: any) => {
                  const cls = parseInt(a.class || '0');
                  let group = '';
                  if (cls >= 1 && cls <= 2) group = 'Class 1-2';
                  else if (cls >= 3 && cls <= 5) group = 'Class 3-5';
                  else if (cls >= 6 && cls <= 8) group = 'Class 6-8';
                  else if (cls >= 9 && cls <= 10) group = 'Class 9-10';
                  else group = `Class ${a.class || 'Other'}`;
                  if (!classGroups[group]) classGroups[group] = { present: 0, total: 0 };
                  classGroups[group].total++;
                  if (a.status === 'present') classGroups[group].present++;
                });
                const entries = Object.entries(classGroups);
                if (entries.length === 0) {
                  return <p className="text-gray-500 text-center py-4">Overall: {overallAttendance}% ({totalStudents} students)</p>;
                }
                return entries.map(([cls, data]) => {
                  const pct = data.total > 0 ? Math.round((data.present / data.total) * 100) : 0;
                  return (
                    <div key={cls} className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-100 hover:border-blue-300 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-700">{cls}</span>
                        <span className="text-gray-900 px-3 py-1 bg-white rounded-full shadow-sm border border-blue-200">{pct}%</span>
                      </div>
                      <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-lg transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Admission Funnel */}
          <div className="relative overflow-hidden bg-white rounded-3xl shadow-xl border-3 border-purple-200 p-7 hover:shadow-2xl transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-100 to-pink-200 rounded-bl-full opacity-40"></div>
            
            <div className="relative flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6 group-hover:rotate-0 transition-transform">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-gray-900">Admission Funnel</h3>
            </div>
            
            <div className="space-y-5 relative">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700">📧 Enquiries</span>
                  <span className="text-gray-900 px-3 py-1 bg-white rounded-full shadow-sm border border-blue-200">{enquiriesTotal}</span>
                </div>
                <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-lg" style={{ width: '100%' }} />
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl border border-yellow-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700">⏳ In Process</span>
                  <span className="text-gray-900 px-3 py-1 bg-white rounded-full shadow-sm border border-yellow-200">{inProcessEnquiries}</span>
                </div>
                <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full shadow-lg" style={{ width: `${enquiriesTotal > 0 ? Math.round((inProcessEnquiries / enquiriesTotal) * 100) : 0}%` }} />
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700">✅ Confirmed</span>
                  <span className="text-gray-900 px-3 py-1 bg-white rounded-full shadow-sm border border-green-200">{confirmedEnquiries}</span>
                </div>
                <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full shadow-lg" style={{ width: `${enquiriesTotal > 0 ? Math.round((confirmedEnquiries / enquiriesTotal) * 100) : 0}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Top Performing Classes */}
          <div className="relative overflow-hidden bg-white rounded-3xl shadow-xl border-3 border-amber-200 p-7 hover:shadow-2xl transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-100 to-yellow-200 rounded-bl-full opacity-40"></div>
            
            <div className="relative flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-6 group-hover:rotate-12 transition-transform">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-gray-900">Top Performing Classes</h3>
            </div>
            
            <div className="space-y-4 relative">
              {[
                { class: 'Class 5-A', score: 98, gradient: 'from-purple-500 to-pink-600', bg: 'from-purple-50 to-pink-50' },
                { class: 'Class 7-B', score: 96, gradient: 'from-blue-500 to-indigo-600', bg: 'from-blue-50 to-indigo-50' },
                { class: 'Class 3-A', score: 95, gradient: 'from-emerald-500 to-teal-600', bg: 'from-emerald-50 to-teal-50' },
                { class: 'Class 9-C', score: 93, gradient: 'from-orange-500 to-amber-600', bg: 'from-orange-50 to-amber-50' },
              ].map((item, index) => (
                <div key={item.class} className={`flex items-center gap-3 p-4 bg-gradient-to-r ${item.bg} rounded-2xl border border-gray-100 hover:border-gray-300 transition-colors`}>
                  <div className={`w-10 h-10 bg-gradient-to-br ${item.gradient} rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-lg transform rotate-3 hover:rotate-6 transition-transform`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 mb-1.5">{item.class}</p>
                    <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${item.gradient} rounded-full shadow-lg transition-all duration-500`}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-gray-900 px-3 py-1 bg-white rounded-full shadow-sm border-2 border-gray-200">{item.score}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
