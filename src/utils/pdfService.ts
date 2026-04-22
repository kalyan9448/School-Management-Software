import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { createTemplatedDoc, addTemplatePage, TEMPLATE_MARGINS } from './pdfTemplateService';
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
    const doc = createTemplatedDoc();

    const pageWidth = doc.internal.pageSize.getWidth();
    // Start below the template header
    let currentY = TEMPLATE_MARGINS.top;

    // --- 1. Title (branding comes from the template background) ---
    doc.setFontSize(16);
    doc.setTextColor(76, 29, 149); // Purple-900
    doc.setFont('helvetica', 'bold');
    doc.text('AI-Powered Lesson Preparation Record', pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 8;
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
      
      autoTable(doc, {
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
      if (currentY > doc.internal.pageSize.getHeight() - TEMPLATE_MARGINS.bottom - 20) {
        addTemplatePage(doc);
        currentY = TEMPLATE_MARGINS.top;
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

    // Page numbers (placed above the footer bar)
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
            `Generated on ${new Date().toLocaleString()} | Page ${i} of ${totalPages}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - TEMPLATE_MARGINS.bottom - 5,
            { align: 'center' }
        );
    }

    // Save PDF
    const fileName = `LessonPlan_${lesson.class}_${lesson.subject}_${lesson.topic.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
  },
};
