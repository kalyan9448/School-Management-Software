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
import { UserManagementView } from './UserManagementView';
import SubjectMappingView from './SubjectMappingView';
import { MonitoringView } from './MonitoringView';
import { AdmissionActivationView } from './AdmissionActivationView';
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
  | 'user-management'
  | 'monitoring'
  | 'admission-activation'
  | 'reports-approval';

export function AdminDashboard() {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [admissionInitialView, setAdmissionInitialView] = useState<'list' | 'form'>('list');

  const handleNavigate = (view: string) => {
    if (view === 'admission-new') {
      setAdmissionInitialView('form');
      setActiveView('admission');
    } else {
      if (view === 'admission') {
        setAdmissionInitialView('list');
      }
      setActiveView(view as ViewType);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />

      <main className="flex-1 ml-64 overflow-auto">
        {activeView === 'dashboard' && <DashboardHome onNavigate={handleNavigate} />}
        {activeView === 'admission' && <AdmissionModule initialView={admissionInitialView} />}
        {activeView === 'enquiry' && <EnquiryModule />}
        {activeView === 'fees' && <FeeModule />}
        {activeView === 'students' && <StudentInformation onNavigate={handleNavigate} />}
        {activeView === 'teachers' && <TeachersModule />}
        {activeView === 'communication' && <CommunicationModule />}
        {activeView === 'academic-structure' && <AcademicStructureView />}
        {activeView === 'user-management' && <UserManagementView />}
        {activeView === 'monitoring' && <MonitoringView />}
        {activeView === 'admission-activation' && <AdmissionActivationView />}
        {activeView === 'reports-approval' && <ReportsApprovalView />}
      </main>
    </div>
  );
}