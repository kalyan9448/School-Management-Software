import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { LessonLog } from './centralDataService';

/**
 * Service to handle PDF generation for Lesson Logs and AI Lesson Plans.
 */
export const pdfService = {
  /**
   * Generates and downloads a professional PDF lesson plan.
   * @param lesson The lesson log object containing metadata and AI-generated content.
   */
  generateLessonPlanPDF: async (lesson: LessonLog) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 20;

    // --- 1. Header & Branding ---
    doc.setFontSize(22);
    doc.setTextColor(76, 29, 149); // Purple-900
    doc.setFont('helvetica', 'bold');
    doc.text('BristleTech School System', pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 10;
    doc.setFontSize(14);
    doc.setTextColor(107, 114, 128); // Gray-500
    doc.setFont('helvetica', 'normal');
    doc.text('AI-Powered Lesson Preparation Record', pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 10;
    doc.setDrawColor(229, 231, 235); // Gray-200
    doc.line(20, currentY, pageWidth - 20, currentY);

    // --- 2. Lesson Metadata ---
    currentY += 15;
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('LESSON DETAILS', 20, currentY);
    
    currentY += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Grid-like layout for metadata
    const leftColX = 20;
    const rightColX = pageWidth / 2 + 10;
    
    // Row 1
    doc.setFont('helvetica', 'bold'); doc.text('Teacher:', leftColX, currentY);
    doc.setFont('helvetica', 'normal'); doc.text(lesson.teacherName || 'Not specified', leftColX + 25, currentY);
    
    doc.setFont('helvetica', 'bold'); doc.text('Date:', rightColX, currentY);
    doc.setFont('helvetica', 'normal'); doc.text(new Date(lesson.date).toLocaleDateString(), rightColX + 25, currentY);
    
    currentY += 8;
    
    // Row 2
    doc.setFont('helvetica', 'bold'); doc.text('Class:', leftColX, currentY);
    doc.setFont('helvetica', 'normal'); doc.text(`${lesson.class}-${lesson.section}`, leftColX + 25, currentY);
    
    doc.setFont('helvetica', 'bold'); doc.text('Subject:', rightColX, currentY);
    doc.setFont('helvetica', 'normal'); doc.text(lesson.subject, rightColX + 25, currentY);
    
    currentY += 12;
    
    // Topic (Full width)
    doc.setFont('helvetica', 'bold'); doc.text('Topic:', leftColX, currentY);
    doc.setFont('helvetica', 'normal');
    const topicLines = doc.splitTextToSize(lesson.topic, pageWidth - 60);
    doc.text(topicLines, leftColX + 25, currentY);
    
    currentY += (topicLines.length * 6) + 10;

    // --- 3. Learning Objectives ---
    if (lesson.objectives && lesson.objectives.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('LEARNING OBJECTIVES', 20, currentY);
      currentY += 6;
      doc.setFont('helvetica', 'normal');
      lesson.objectives.forEach((obj, index) => {
        const lines = doc.splitTextToSize(`${index + 1}. ${obj}`, pageWidth - 40);
        doc.text(lines, 25, currentY);
        currentY += (lines.length * 5) + 2;
      });
      currentY += 5;
    }

    // --- 4. Topic Explanation (AI) ---
    const aiPlan = lesson.aiPlan;
    if (aiPlan?.topicExplanation) {
      doc.setFont('helvetica', 'bold');
      doc.text('TOPIC OVERVIEW (AI)', 20, currentY);
      currentY += 6;
      doc.setFont('helvetica', 'normal');
      const explLines = doc.splitTextToSize(aiPlan.topicExplanation, pageWidth - 40);
      doc.text(explLines, 20, currentY);
      currentY += (explLines.length * 5) + 10;
    }

    // --- 5. Step-by-Step Micro-Learning Plan ---
    if (aiPlan?.stepByStepPlan && aiPlan.stepByStepPlan.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('EXECUTION STEPS', 20, currentY);
      currentY += 4;
      
      (doc as any).autoTable({
        startY: currentY,
        head: [['#', 'Step', 'Description']],
        body: aiPlan.stepByStepPlan.map((step, index) => [
          index + 1,
          step.step,
          step.description
        ]),
        headStyles: { fillColor: [76, 29, 149], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 40 },
          2: { cellWidth: 'auto' },
        },
        margin: { left: 20, right: 20 },
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // --- 6. Methodology & Support ---
    if (aiPlan?.teachingMethodology) {
      // Check for page overflow
      if (currentY > pageWidth + 20) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.text('TEACHING METHODOLOGY', 20, currentY);
      currentY += 8;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold'); doc.text('Approach:', 20, currentY);
      doc.setFont('helvetica', 'normal'); 
      const approachLines = doc.splitTextToSize(aiPlan.teachingMethodology.approach, pageWidth - 60);
      doc.text(approachLines, 45, currentY);
      
      currentY += (approachLines.length * 5) + 5;
      
      doc.setFont('helvetica', 'bold'); doc.text('Activity Idea:', 20, currentY);
      doc.setFont('helvetica', 'normal');
      const activityLines = doc.splitTextToSize(aiPlan.teachingMethodology.activity, pageWidth - 60);
      doc.text(activityLines, 45, currentY);
      
      currentY += (activityLines.length * 5) + 10;
    }

    // Final Footer
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
            `Generated on ${new Date().toLocaleString()} | Page ${i} of ${totalPages}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    // Save PDF
    const fileName = `LessonPlan_${lesson.class}_${lesson.subject}_${lesson.topic.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
  },
};
