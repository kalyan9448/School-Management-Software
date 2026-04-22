import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { createTemplatedDoc, addTemplatePage, TEMPLATE_MARGINS } from './pdfTemplateService';

interface ReportData {
  period: string;
  attendanceSummary: {
    present: number;
    absent: number;
    late: number;
    total: number;
    percentage: number;
  };
  homeworkSummary: {
    assigned: number;
    completed: number;
    onTime: number;
    late: number;
    pending: number;
    completionRate: number;
  };
  performanceBySubject: Array<{
    subject: string;
    averageScore: number;
    totalQuizzes: number;
    trend: 'improving' | 'steady' | 'needs-attention';
    lastScore: number;
  }>;
  skillGrowth: Array<any>;
  highlights: string[];
  teacherComments: Array<any>;
  areasOfImprovement?: Array<any>;
  recentMarks?: Array<{
    type: 'quiz' | 'exam';
    subject: string;
    title: string;
    score: number;
    marks: string;
    grade: string;
    date: string;
  }>;
}

interface StudentInfo {
  name: string;
  class: string;
  section: string;
  rollNo: string;
}

/**
 * Generate PDF report for student progress
 */
export function generateStudentReportPDF(
  reportData: ReportData,
  studentInfo: StudentInfo,
  reportType: 'weekly' | 'monthly',
  schoolName: string = 'School Management System'
): jsPDF {
  const doc = createTemplatedDoc();
  // Start below template header
  let yPos = TEMPLATE_MARGINS.top;
  const margin = TEMPLATE_MARGINS.left;
  const maxY = 297 - TEMPLATE_MARGINS.bottom;

  // Helper to add page if needed
  const checkPage = (spaceNeeded: number = 30) => {
    if (yPos + spaceNeeded > maxY) {
      addTemplatePage(doc);
      yPos = TEMPLATE_MARGINS.top;
    }
  };

  // Report title — branding/logo comes from the template background
  checkPage(15);
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(76, 29, 149);
  doc.text('Student Progress Report', margin, yPos);
  yPos += 7;

  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(100, 100, 100);
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Generated on: ${generatedDate} | Period: ${reportData.period}`, margin, yPos);
  doc.setTextColor(0, 0, 0);
  yPos += 10;

  // Student Information
  checkPage(10);
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('Student Information', margin, yPos);
  yPos += 6;

  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text(`Name: ${studentInfo.name} | Class: ${studentInfo.class}-${studentInfo.section} | Roll: ${studentInfo.rollNo}`, margin, yPos);
  yPos += 10;

  // Attendance Summary
  checkPage(25);
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('Attendance Summary', margin, yPos);
  yPos += 6;

  try {
    autoTable(doc, {
      startY: yPos,
      head: [['Total Days', 'Present', 'Absent', 'Late', 'Percentage']],
      body: [[
        reportData.attendanceSummary.total,
        reportData.attendanceSummary.present,
        reportData.attendanceSummary.absent,
        reportData.attendanceSummary.late,
        `${reportData.attendanceSummary.percentage}%`,
      ]],
      theme: 'grid',
      margin: { top: yPos + 5, left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        4: { fontStyle: 'bold', textColor: [75, 0, 130] },
      },
    });
    yPos = (doc as any).lastAutoTable.finalY + 8;
  } catch (e) {
    yPos += 20;
  }

  // Homework Summary
  checkPage(25);
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('Homework & Assignment Summary', margin, yPos);
  yPos += 6;

  try {
    autoTable(doc, {
      startY: yPos,
      head: [['Assigned', 'Completed', 'On Time', 'Late', 'Pending', 'Rate']],
      body: [[
        reportData.homeworkSummary.assigned,
        reportData.homeworkSummary.completed,
        reportData.homeworkSummary.onTime,
        reportData.homeworkSummary.late,
        reportData.homeworkSummary.pending,
        `${reportData.homeworkSummary.completionRate}%`,
      ]],
      theme: 'grid',
      margin: { top: yPos + 5, left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        5: { fontStyle: 'bold', textColor: [75, 0, 130] },
      },
    });
    yPos = (doc as any).lastAutoTable.finalY + 8;
  } catch (e) {
    yPos += 20;
  }

  // Performance by Subject
  if (reportData.performanceBySubject && reportData.performanceBySubject.length > 0) {
    checkPage(30);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Performance by Subject', margin, yPos);
    yPos += 6;

    const perfBody = reportData.performanceBySubject.map((s) => [
      s.subject || '',
      `${s.averageScore || 0}%`,
      s.totalQuizzes || 0,
      s.trend || 'N/A',
    ]);

    try {
      autoTable(doc, {
        startY: yPos,
        head: [['Subject', 'Score', 'Quizzes', 'Trend']],
        body: perfBody,
        theme: 'grid',
        margin: { top: yPos + 5, left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          1: { fontStyle: 'bold', textColor: [75, 0, 130] },
        },
      });
      yPos = (doc as any).lastAutoTable.finalY + 8;
    } catch (e) {
      yPos += 20;
    }
  }

  // Key Highlights
  if (reportData.highlights && reportData.highlights.length > 0) {
    checkPage(15);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Key Highlights', margin, yPos);
    yPos += 6;

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    reportData.highlights.forEach((highlight) => {
      checkPage(6);
      const wrapped = doc.splitTextToSize(`• ${highlight}`, 160);
      wrapped.forEach((line: string) => {
        doc.text(line, margin + 5, yPos);
        yPos += 4;
      });
    });
    yPos += 3;
  }

  // Recent Performance Updates (Individual Marks)
  if (reportData.recentMarks && reportData.recentMarks.length > 0) {
    checkPage(30);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Recent Performance Updates', margin, yPos);
    yPos += 6;

    const marksBody = reportData.recentMarks.map((m) => [
      m.date ? new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A',
      m.type.toUpperCase(),
      m.subject || '',
      m.title || '',
      m.marks || '',
      m.grade || '-',
      `${m.score || 0}%`,
    ]);

    try {
      autoTable(doc, {
        startY: yPos,
        head: [['Date', 'Type', 'Subject', 'Topic/Exam', 'Marks', 'Grade', 'Score']],
        body: marksBody,
        theme: 'grid',
        margin: { top: yPos + 5, left: margin, right: margin },
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [75, 0, 130] },
        columnStyles: {
          6: { fontStyle: 'bold', textColor: [75, 0, 130] },
        },
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
    } catch (e) {
      yPos += 20;
    }
  }

  // Areas of Improvement (Monthly only)
  if (reportType === 'monthly' && reportData.areasOfImprovement && reportData.areasOfImprovement.length > 0) {
    checkPage(30);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Areas of Improvement', margin, yPos);
    yPos += 6;

    const improvBody = reportData.areasOfImprovement.map((area) => [
      area.subject || '',
      `${area.currentScore || 0}%`,
      (area.suggestions && Array.isArray(area.suggestions)) ? area.suggestions.join('; ') : '',
    ]);

    try {
      autoTable(doc, {
        startY: yPos,
        head: [['Subject', 'Score', 'Actions']],
        body: improvBody,
        theme: 'grid',
        margin: { top: yPos + 5, left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          1: { textColor: [220, 20, 60] },
        },
      });
      yPos = (doc as any).lastAutoTable.finalY + 8;
    } catch (e) {
      yPos += 20;
    }
  }

  // Teacher Comments
  if (reportData.teacherComments && reportData.teacherComments.length > 0) {
    checkPage(15);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Teacher Comments', margin, yPos);
    yPos += 6;

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    reportData.teacherComments.forEach((comment) => {
      checkPage(8);
      const subject = comment.subject || 'General';
      const text = comment.comment || '';
      doc.setFont(undefined, 'bold');
      doc.text(`${subject}:`, margin + 5, yPos);
      yPos += 4;
      doc.setFont(undefined, 'normal');
      const wrapped = doc.splitTextToSize(text, 150);
      wrapped.forEach((line: string) => {
        checkPage(5);
        doc.text(line, margin + 10, yPos);
        yPos += 4;
      });
      yPos += 2;
    });
  }

  // Footer on all pages
  const pageCount = (doc as any).internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    (doc as any).setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - TEMPLATE_MARGINS.bottom - 5,
      { align: 'center' }
    );
  }

  return doc;
}

/**
 * Download the PDF report
 */
export function downloadPDF(
  doc: jsPDF,
  studentName: string,
  reportType: 'weekly' | 'monthly'
): void {
  try {
    const date = new Date().toISOString().split('T')[0];
    const filename = `${studentName}_${reportType}_report_${date}.pdf`;
    doc.save(filename);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
}

/**
 * Generate and download the report in one call
 */
export function generateAndDownloadReport(
  reportData: ReportData,
  studentInfo: StudentInfo,
  reportType: 'weekly' | 'monthly',
  schoolName: string = 'School Management System'
): void {
  try {
    const doc = generateStudentReportPDF(reportData, studentInfo, reportType, schoolName);
    downloadPDF(doc, studentInfo.name, reportType);
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw error;
  }
}
