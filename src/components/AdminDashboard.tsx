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
  | 'reports'
  | 'academic-structure'
  | 'user-management'
  | 'subject-mapping'
  | 'monitoring'
  | 'admission-activation'
  | 'reports-approval';

export function AdminDashboard() {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />

      <main className="flex-1 ml-64 overflow-auto">
        {activeView === 'dashboard' && <DashboardHome onNavigate={(view) => setActiveView(view as ViewType)} />}
        {activeView === 'admission' && <AdmissionModule />}
        {activeView === 'enquiry' && <EnquiryModule />}
        {activeView === 'fees' && <FeeModule />}
        {activeView === 'students' && <StudentInformation />}
        {activeView === 'teachers' && <TeachersModule />}
        {activeView === 'communication' && <CommunicationModule />}
        {activeView === 'reports' && <ReportsModule />}
        {activeView === 'academic-structure' && <AcademicStructureView />}
        {activeView === 'user-management' && <UserManagementView />}
        {activeView === 'subject-mapping' && <SubjectMappingView />}
        {activeView === 'monitoring' && <MonitoringView />}
        {activeView === 'admission-activation' && <AdmissionActivationView />}
        {activeView === 'reports-approval' && <ReportsApprovalView />}
      </main>
    </div>
  );
}