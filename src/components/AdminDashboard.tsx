import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

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
import { SupportModule } from './SupportModule';
import SubjectMappingView from './SubjectMappingView';
import { MonitoringView } from './MonitoringView';
import { ReportsApprovalView } from './ReportsApprovalView';
import { auth, db } from '../services/firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

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
  | 'support'
  | 'reports-approval';

export function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialView = (searchParams.get('view') as ViewType) || 'dashboard';
  const [activeView, setActiveView] = useState<ViewType>(initialView);

  const [admissionInitialView, setAdmissionInitialView] = useState<'list' | 'form'>('list');
  const [admissionInitialData, setAdmissionInitialData] = useState<any>(null);
  const [studentViewOptions, setStudentViewOptions] = useState<any>({});
  const [schoolReady, setSchoolReady] = useState(false);
  const [schoolError, setSchoolError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();

  // Sync view state to URL
  useEffect(() => {
    if (searchParams.get('view') !== activeView) {
      setSearchParams({ view: activeView });
    }
  }, [activeView, searchParams, setSearchParams]);


  // ── Ensure school_id is in sessionStorage before any module loads ──
  useEffect(() => {
    // Don't run while AuthContext is still resolving — user is null/incomplete
    if (authLoading) return;

    if (!user) {
      setSchoolReady(false);
      setSchoolError(null);
      return;
    }

    const resolveSchoolId = async () => {
      // Clear any previous error from a stale run (e.g. when user was null)
      setSchoolError(null);

      const activeId = sessionStorage.getItem('active_school_id');
      const userSchoolId = user?.school_id?.trim();

      // Prefer the authenticated user's profile over any stale session value.
      if (userSchoolId) {
        if (activeId !== userSchoolId) {
          sessionStorage.setItem('active_school_id', userSchoolId);
        }
        setSchoolReady(true);
        return;
      }

      // Only trust an existing session value when the profile does not have one.
      if (activeId) {
        setSchoolReady(true);
        return;
      }

      // Last resort: query ALL schools and try to match by email
      try {
        const schoolsSnap = await getDocs(collection(db, 'schools'));
        const allSchools = schoolsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

        if (allSchools.length === 0) {
          setSchoolError('No schools found in the system. Please contact Super Admin.');
          return;
        }

        const userEmail = user?.email?.toLowerCase().trim();
        let matchedSchool: any = null;

        if (userEmail) {
          // Check ALL possible email fields in each school document
          for (const school of allSchools) {
            const schoolEmails = [
              school.email,
              school.principalEmail,
              school.principalGmail,
              school.principal_email,
            ]
              .filter(Boolean)
              .map((e: string) => e.toLowerCase().trim());

            if (schoolEmails.includes(userEmail)) {
              matchedSchool = school;
              break;
            }
          }
        }

        // If no email match but only 1 school exists, auto-assign it
        if (!matchedSchool && allSchools.length === 1) {
          matchedSchool = allSchools[0];
        }

        if (matchedSchool) {
          sessionStorage.setItem('active_school_id', matchedSchool.id);
          if (matchedSchool.name) {
            sessionStorage.setItem('active_school_name', matchedSchool.name);
          }

          // Also persist to user profile so this doesn't repeat
          const persistUid = user?.id || auth.currentUser?.uid;
          if (persistUid) {
            try {
              await setDoc(doc(db, 'users', persistUid), {
                school_id: matchedSchool.id,
                // Ensure role is also present for rules fallback
                role: user?.role || 'admin',
                email: user?.email || auth.currentUser?.email || '',
              }, { merge: true });
              console.log(
                '[AdminDashboard] Persisted school_id to user profile:',
                matchedSchool.id,
              );
            } catch (e) {
              console.warn('[AdminDashboard] Could not persist school_id:', e);
            }
          }

          // Call backend to update JWT custom claims with the new school_id
          try {
            const currentUser = auth.currentUser;
            if (currentUser) {
              const token = await currentUser.getIdToken();
              const apiBase = ((import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3001').replace(/\/$/, '');
              const ctrl = new AbortController();
              const timer = setTimeout(() => ctrl.abort(), 5000);
              await fetch(`${apiBase}/api/auth/login`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                signal: ctrl.signal,
              });
              clearTimeout(timer);
              // Force refresh token to pick up new custom claims
              await currentUser.getIdToken(true);
              console.log('[AdminDashboard] JWT custom claims refreshed');
            }
          } catch (e) {
            console.warn('[AdminDashboard] Backend claim sync failed (will use Firestore fallback):', e);
          }

          sessionStorage.setItem('active_school_id', matchedSchool.id);
          sessionStorage.setItem('active_school_name', matchedSchool.name);
          
          if (matchedSchool.schoolCode) {
            sessionStorage.setItem('active_school_code', matchedSchool.schoolCode);
          }

          // Update state when resolved to trigger re-render
          setSchoolReady(true);


          setSchoolReady(true);
        } else {
          setSchoolError(
            `Could not determine your school. Your email (${userEmail}) does not match any school's principal email. ` +
              `Please contact Super Admin to update your profile with the correct school_id.`,
          );
        }
      } catch (err: any) {
        console.error('[AdminDashboard] School resolution error:', err);
        setSchoolError(
          'Failed to load school data: ' + (err.message || 'Unknown error'),
        );
      }
    };

    resolveSchoolId();
  }, [user, authLoading]);

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
      }
      setActiveView(view as ViewType);
      setSearchParams({ view });
    }
  };


  const handleConvertToAdmission = (enquiry: any) => {
    const prefilledData = {
      name: enquiry.childName,
      parentName: enquiry.parentName,
      phone: enquiry.phone,
      email: enquiry.email,
      classApplied: enquiry.classInterest,
      status: 'enquiry',
    };
    setAdmissionInitialData(prefilledData);
    setAdmissionInitialView('form');
    setActiveView('admission');
  };

  // ── Error state ──
  if (schoolError) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
        <main className="flex-1 ml-64 overflow-auto flex items-center justify-center">
          <div className="text-center max-w-lg p-8 bg-white rounded-2xl shadow-lg border border-red-200">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              School Not Configured
            </h2>
            <p className="text-gray-600 mb-4">{schoolError}</p>
            <button
              onClick={() => {
                setSchoolError(null);
                setSchoolReady(false);
                window.location.reload();
              }}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ── Loading state ──
  if (!schoolReady) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
        <main className="flex-1 ml-64 overflow-auto flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Setting up your school context...</p>
          </div>
        </main>
      </div>
    );
  }

  // ── Main dashboard ──
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />

      <main className="flex-1 ml-64 overflow-auto">
        {activeView === 'dashboard' && (
          <DashboardHome onNavigate={handleNavigate} />
        )}
        {activeView === 'admission' && (
          <AdmissionModule
            key={`${admissionInitialView}-${JSON.stringify(admissionInitialData)}`}
            initialView={admissionInitialView}
            initialData={admissionInitialData}
          />
        )}
        {activeView === 'enquiry' && (
          <EnquiryModule onConvert={handleConvertToAdmission} />
        )}
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
        {activeView === 'monitoring' && (
          <MonitoringView onNavigate={handleNavigate} />
        )}
        {activeView === 'support' && <SupportModule />}
        {activeView === 'reports-approval' && <ReportsApprovalView />}
      </main>
    </div>
  );
}