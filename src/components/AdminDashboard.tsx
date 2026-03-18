import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { DashboardHome } from './DashboardHome';
import { AdmissionModule } from './AdmissionModule';
import { EnquiryModule } from './EnquiryModule';
import { FeeModule } from './FeeModule';
import { StudentInformation } from './StudentInformation';
import { TeachersModule } from './TeachersModule';
import { CommunicationModule } from './CommunicationModule';
import { ReportsModule } from './ReportsModule';
import { AcademicStructureView } from './AcademicStructureView';
import SubjectMappingView from './SubjectMappingView';
import { MonitoringView } from './MonitoringView';
import { ReportsApprovalView } from './ReportsApprovalView';

export type ViewType =
  | 'dashboard'
  | 'admission'
  | 'enquiry'
  | 'fees'
  | 'students'
  | 'teachers'
  | 'communication'
  | 'academic-structure'
  | 'monitoring'
  | 'reports-approval';

export function AdminDashboard() {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [admissionInitialView, setAdmissionInitialView] = useState<'list' | 'form'>('list');
  const [admissionInitialData, setAdmissionInitialData] = useState<any>(null);
  const [studentViewOptions, setStudentViewOptions] = useState<any>({});

  const handleNavigate = (view: string, options?: any) => {
    if (view === 'admission-new') {
      setAdmissionInitialData(null);
      setAdmissionInitialView('form');
      setActiveView('admission');
    } else {
      if (view === 'admission') {
        setAdmissionInitialView('list');
        setAdmissionInitialData(null);
      }
      if (view === 'students' && options) {
        setStudentViewOptions(options);
      } else if (view !== 'students') {
        // Clear student options if navigating elsewhere (optional, depends on UX)
        // setStudentViewOptions({});
      }
      setActiveView(view as ViewType);
    }
  };

  const handleConvertToAdmission = (enquiry: any) => {
    // Transform enquiry data to admission data structure
    const prefilledData = {
      name: enquiry.childName,
      parentName: enquiry.parentName,
      phone: enquiry.phone,
      email: enquiry.email,
      classApplied: enquiry.classInterest,
      status: 'enquiry' // Default status in admission form
    };
    setAdmissionInitialData(prefilledData);
    setAdmissionInitialView('form');
    setActiveView('admission');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />

      <main className="flex-1 ml-64 overflow-auto">
        {activeView === 'dashboard' && <DashboardHome onNavigate={handleNavigate} />}
        {activeView === 'admission' && (
          <AdmissionModule 
            key={JSON.stringify(admissionInitialData)} 
            initialView={admissionInitialView} 
            initialData={admissionInitialData} 
          />
        )}
        {activeView === 'enquiry' && <EnquiryModule onConvert={handleConvertToAdmission} />}
        {activeView === 'fees' && <FeeModule />}
        {activeView === 'students' && (
          <StudentInformation 
            onNavigate={handleNavigate} 
            initialTab={studentViewOptions.tab}
            initialClass={studentViewOptions.class}
            initialSection={studentViewOptions.section}
            key={`students-${JSON.stringify(studentViewOptions)}`}
          />
        )}
        {activeView === 'teachers' && <TeachersModule />}
        {activeView === 'communication' && <CommunicationModule />}
        {activeView === 'academic-structure' && <AcademicStructureView />}
        {activeView === 'monitoring' && <MonitoringView onNavigate={handleNavigate} />}
        {activeView === 'reports-approval' && <ReportsApprovalView />}
      </main>
    </div>
  );
}