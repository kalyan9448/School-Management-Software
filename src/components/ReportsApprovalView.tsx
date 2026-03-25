import { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Clock, Bell, Send, Target, TrendingUp, Plus, X } from 'lucide-react';

export function ReportsApprovalView() {
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

  // Initialize with default data (no persistence until Firestore collection is set up)
  useEffect(() => {
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
  }, []);

  const toggleReportStatus = (id: string) => {
    const updated = scheduledReports.map(r =>
      r.id === id ? { ...r, status: r.status === 'active' ? 'paused' : 'active' } : r
    );
    setScheduledReports(updated);
  };

  const handleGenerateReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      
      const configName = reportConfig.class === 'all' 
        ? `${reportConfig.type} Summary` 
        : `${reportConfig.type} - Class ${reportConfig.class}${reportConfig.section !== 'all' ? ` ${reportConfig.section}` : ''}`;

      const newReport = {
        id: Date.now().toString(),
        name: configName,
        type: reportConfig.type,
        generatedOn: new Date().toISOString().split('T')[0],
        format: reportConfig.format,
        size: '1.4 MB',
      };

      const updated = [newReport, ...recentReports];
      setRecentReports(updated);
      setShowReportBuilder(false);
      alert('Custom report generated successfully!');
    }, 2000);
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
                    <button className="p-3 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all">
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
                      onChange={(e) => setReportConfig({ ...reportConfig, class: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all outline-none bg-gray-50"
                    >
                      <option value="all">All Classes</option>
                      <option value="Nursery">Nursery</option>
                      <option value="LKG">LKG</option>
                      <option value="UKG">UKG</option>
                      <option value="Class 1">Class 1</option>
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
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
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
