import { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Clock, Bell, Send, Target, TrendingUp, Plus, X } from 'lucide-react';
import { useAcademicClasses } from '../hooks/useAcademicClasses';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { createTemplatedDoc, TEMPLATE_MARGINS } from '../utils/pdfTemplateService';
import { attendanceService, feeService, studentService, reportsService } from '../utils/centralDataService';
import type { GeneratedReport, ScheduledReport } from '../utils/centralDataService';

export function ReportsApprovalView() {
  const { uniqueClasses, uniqueSections, sectionsForClass } = useAcademicClasses();
  const [isGenerating, setIsGenerating] = useState(false);
  const [scheduledReports, setScheduledReports] = useState<any[]>([]);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [reportConfig, setReportConfig] = useState({
    type: 'Attendance',
    class: 'all',
    section: 'all',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    format: 'PDF'
  });

  // Load reports from Firestore
  useEffect(() => {
    const loadReports = async () => {
      try {
        const [generated, scheduled] = await Promise.all([
          reportsService.getGenerated(),
          reportsService.getScheduled()
        ]);
        
        // Use real data if available, otherwise fallback to initial mock for empty states
        if (generated.length > 0) {
          setRecentReports(generated);
        } else {
          setRecentReports([
            {
              id: '1',
              name: 'January Attendance Summary',
              type: 'Attendance',
              generatedOn: '2024-02-01',
              format: 'PDF',
              size: '2.3 MB',
            }
          ]);
        }

        if (scheduled.length > 0) {
          setScheduledReports(scheduled);
        } else {
          setScheduledReports([
            {
              id: '1',
              name: 'Weekly Attendance Summary',
              type: 'Attendance',
              frequency: 'Weekly - Every Monday',
              recipients: 'Admin, Academic Head',
              nextRun: '2024-02-26',
              status: 'active',
            },
            {
              id: '2',
              name: 'Monthly Fee Collection',
              type: 'Fee Collection',
              frequency: 'Monthly - 1st of month',
              recipients: 'Admin, Accountant',
              nextRun: '2024-03-01',
              status: 'active',
            }
          ]);
        }
      } catch (error: any) {
        console.error("Error loading reports from Firestore:", error);
      }
    };
    loadReports();
  }, []);

  const toggleReportStatus = async (id: string) => {
    const report = scheduledReports.find(r => r.id === id);
    if (!report) return;

    const newStatus = report.status === 'active' ? 'paused' : 'active';
    
    // Update local state
    const updated = scheduledReports.map(r =>
      r.id === id ? { ...r, status: newStatus } : r
    );
    setScheduledReports(updated);

    // Persist to Firestore if it's a real report (has non-mock ID structure or just try)
    try {
      if (id.length > 5) { // Simple check for Firestore IDs vs mock IDs
        await reportsService.updateScheduled(id, { status: newStatus as 'active' | 'paused' });
      }
    } catch (error) {
      console.error("Error updating report status:", error);
    }
  };

  const handleGenerateReport = () => {
    setIsGenerating(true);
    setTimeout(async () => {
      try {
        const configName = reportConfig.class === 'all' 
          ? `${reportConfig.type} Summary` 
          : `${reportConfig.type} - Class ${reportConfig.class}${reportConfig.section !== 'all' ? ` ${reportConfig.section}` : ''}`;

        const reportData: Partial<GeneratedReport> = {
          name: configName,
          type: reportConfig.type,
          generatedOn: new Date().toISOString().split('T')[0],
          format: reportConfig.format,
          size: '1.4 MB',
          status: 'success'
        };

        // Save to Firestore
        const savedReport = await reportsService.createGenerated(reportData);

        // Update local state with the saved report (including Firestore ID)
        setRecentReports(prev => [savedReport, ...prev]);
        setIsGenerating(false);
        setShowReportBuilder(false);
        alert('Custom report generated and saved successfully!');
      } catch (error: any) {
        console.error("Error generating/saving report:", error);
        setIsGenerating(false);
        alert(`Failed to save report: ${error.message}`);
      }
    }, 2000);
  };

  const handleDownloadRecentReport = async (report: any) => {
    try {
      const activeSchoolId = sessionStorage.getItem('active_school_id');
      if (!activeSchoolId) {
        alert("School context synchronized. Please refresh the page and try again.");
        return;
      }

      const doc = createTemplatedDoc() as any;
      const topY = TEMPLATE_MARGINS.top;
      
      // Report title (branding comes from the template background)
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text(report.name, 105, topY, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text(`Generated on: ${report.generatedOn} | Type: ${report.type}`, 105, topY + 8, { align: 'center' });
      
      doc.setDrawColor(229, 231, 235);
      doc.line(20, topY + 14, 190, topY + 14);

      if (report.type === 'Attendance') {
        const attendanceData = await attendanceService.getAll();
        const students = await studentService.getAll();
        
        // Use real-time data for the report
        const tableRows = attendanceData.slice(0, 40).map((record: any) => {
          const student = students.find((s: any) => s.id === record.studentId);
          return [
            record.date || 'N/A',
            student?.name || record.studentName || 'N/A',
            record.class || 'N/A',
            record.section || 'N/A',
            (record.status || 'N/A').toUpperCase(),
            record.markedBy || 'N/A'
          ];
        });

        autoTable(doc, {
          startY: topY + 22,
          head: [['Date', 'Student Name', 'Class', 'Section', 'Status']],
          body: tableRows.length > 0 ? tableRows : [['-', 'No Records Found', '-', '-', '-']],
          headStyles: { fillColor: [126, 34, 206] },
          theme: 'grid',
          styles: { fontSize: 9 }
        });
      } else if (report.type === 'Fee Collection' || report.type === 'Fees') {
        const feePayments = await feeService.getAllPayments();
        
        const tableRows = feePayments.slice(0, 40).map((payment: any) => [
          payment.paymentDate || 'N/A',
          payment.studentName || 'N/A',
          payment.receiptNo || 'N/A',
          payment.paymentMode?.toUpperCase() || 'N/A',
          `₹ ${payment.amount?.toLocaleString() || 0}`,
          'PAID'
        ]);

        autoTable(doc, {
          startY: topY + 22,
          head: [['Date', 'Student Name', 'Receipt #', 'Mode', 'Amount', 'Status']],
          body: tableRows.length > 0 ? tableRows : [['-', 'No Payments Found', '-', '-', '-', '-']],
          headStyles: { fillColor: [126, 34, 206] },
          theme: 'grid',
          styles: { fontSize: 9 }
        });
      } else {
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text("Report generation for this specific type is being initialized.", 20, topY + 25);
        doc.text("Please check back shortly for full data integration.", 20, topY + 33);
      }

      const footerText = "Generated via Super Admin Dashboard - Confidential";
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text("Generated via School Admin Dashboard - Confidential", 105, 297 - TEMPLATE_MARGINS.bottom - 5, { align: 'center' });

      doc.save(`${report.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error: any) {
      console.error("Error generating report:", error);
      alert(`Failed to generate report: ${error?.message || 'Unknown error'}. Please verify connection and try again.`);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Reports & Analytics</h2>
          <p className="text-gray-600">Generate and manage school performance reports</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowReportBuilder(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Build Custom Report
          </button>
        </div>
      </div>

      {/* Scheduled Reports */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-gray-900">Scheduled Reports</h3>
          <p className="text-gray-600 text-sm">Automated report generation schedule</p>
        </div>
        <div className="divide-y divide-gray-200">
          {scheduledReports.map((report) => (
            <div key={report.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-gray-900">{report.name}</h4>
                    <button
                      onClick={() => toggleReportStatus(report.id)}
                      className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${report.status === 'active'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      {report.status.toUpperCase()}
                    </button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Target className="w-4 h-4" />
                      <span>Type: {report.type}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Frequency: {report.frequency}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Send className="w-4 h-4" />
                      <span>Recipients: {report.recipients}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-600 text-sm mb-2">Next Run</p>
                  <p className="text-gray-900 font-medium">{report.nextRun}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Recent Reports */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-gray-900">Recent Reports</h3>
              <p className="text-gray-600 text-sm">Recently generated school reports</p>
            </div>
          </div>
          <div className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
            {recentReports.length > 0 ? (
              recentReports.map((report) => (
                <div key={report.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium">{report.name}</p>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-4" />
                            {report.type}
                          </span>
                          <span>•</span>
                          <span>{report.format}</span>
                          <span>•</span>
                          <span>{report.size}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-4" />
                            {report.generatedOn}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDownloadRecentReport(report)}
                      className="p-3 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                      title="Download PDF"
                    >
                      <Download className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No reports generated yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Report Builder Modal */}
      {showReportBuilder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Custom Report Builder</h3>
                  <p className="text-gray-500 text-sm">Configure your tailored school report</p>
                </div>
              </div>
              <button
                onClick={() => setShowReportBuilder(false)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Report Type</label>
                  <select
                    value={reportConfig.type}
                    onChange={(e) => setReportConfig({ ...reportConfig, type: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all outline-none bg-gray-50"
                  >
                    <option value="Attendance">Attendance Report</option>
                    <option value="Fees">Fee Collection Report</option>
                    <option value="Academic">Academic Performance</option>
                    <option value="Admissions">Admissions Summary</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Class</label>
                    <select
                      value={reportConfig.class}
                      onChange={(e) => setReportConfig({ ...reportConfig, class: e.target.value, section: 'all' })}
                      className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all outline-none bg-gray-50"
                    >
                      <option value="all">All Classes</option>
                      {uniqueClasses.map((className) => (
                        <option key={className} value={className}>{className}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Section</label>
                    <select
                      value={reportConfig.section}
                      onChange={(e) => setReportConfig({ ...reportConfig, section: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all outline-none bg-gray-50"
                    >
                      <option value="all">All Sections</option>
                      {(reportConfig.class === 'all' ? uniqueSections : sectionsForClass(reportConfig.class)).map((section) => (
                        <option key={section} value={section}>Section {section}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date Range</label>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        value={reportConfig.startDate}
                        onChange={(e) => setReportConfig({ ...reportConfig, startDate: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all outline-none bg-gray-50"
                      />
                    </div>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        value={reportConfig.endDate}
                        onChange={(e) => setReportConfig({ ...reportConfig, endDate: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all outline-none bg-gray-50"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Export Format</label>
                  <div className="flex gap-4">
                    {['PDF', 'Excel', 'CSV'].map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setReportConfig({ ...reportConfig, format: fmt })}
                        className={`flex-1 py-3 rounded-xl border-2 transition-all font-semibold ${
                          reportConfig.format === fmt
                            ? 'border-purple-600 bg-purple-50 text-purple-700'
                            : 'border-gray-100 text-gray-500 hover:border-gray-200'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="flex-[2] py-4 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-700 transition-all shadow-lg hover:shadow-purple-200 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    Build & Generate Report
                  </>
                )}
              </button>
              <button
                onClick={() => setShowReportBuilder(false)}
                className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
