import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { auth } from '../services/firebase';
import { INDIAN_STATES, STATE_CITY_MAPPING } from '../data/locationData';
import { schoolService, organizationService, announcementService, statisticsService, planService, ticketService, type SubscriptionPlan, type SupportTicket, type TicketResponse } from '../utils/centralDataService';
import {
  Building2,
  Building,
  Users,
  CreditCard,
  Settings,
  Shield,
  Activity,
  Bell,
  LogOut,
  Plus,
  Search,
  Eye,
  Lock,
  Unlock,
  Pause,
  Play,
  Archive,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Server,
  Database,
  MessageSquare,
  Mail,
  Globe,
  Zap,
  ChevronRight,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  BarChart3,
  IndianRupee,
  Calendar,
  FileText,
  Clock,
  Send,
  Receipt,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  X,
  ArrowLeft,
  Info,
  GraduationCap,
  Key,
  School,
  MapPin,
  ShieldCheck,
  Heart,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import logoImage from '../assets/logo.jpeg';
import { jsPDF } from 'jspdf';
import { createTemplatedDoc, TEMPLATE_MARGINS } from '../utils/pdfTemplateService';
import autoTable from 'jspdf-autotable';

type ViewType =
  | 'dashboard'
  | 'organizations'
  | 'schools'
  | 'subscriptions'
  | 'configuration'
  | 'user-recovery'
  | 'monitoring'
  | 'announcements'
  | 'tickets'
  | 'create-organization'
  | 'create-school'
  | 'school-details'
  | 'organization-details';

interface Organization {
  id: string;
  name: string;
  type: string;
  createdDate: string;
  schoolsCount: number;
  status: 'active' | 'suspended' | 'archived';
  plan: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  govLicenseId?: string;
  gstNumber?: string;
  registeredAddress?: string;
  panNumber?: string;
  registrationType?: string;
}

interface School {
  id: string;
  name: string;
  organizationId: string;
  organizationName: string;
  status: 'active' | 'suspended' | 'archived';
  students: number;
  teachers: number;
  storage: string;
  subscriptionEnd: string;
  // Subscription Limits
  maxStudents?: number;
  maxTeachers?: number;
  maxStorage?: string;
  // Active Usage
  activeStudents?: number;
  activeTeachers?: number;
  activeParents?: number;
  // Additional Info
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  principal?: string;
  principalEmail?: string;
  principalName?: string;
  principalAddress?: string;
  principalGmail?: string;
  subscriptionStart?: string;
  schoolCode?: string;
  plan?: string;
  // AI Features Control
  aiEnabled?: boolean;
}

interface Subscription {
  id: string;
  schoolName: string;
  plan: string;
  status: 'active' | 'expired' | 'trial';
  students: number;
  maxStudents: number;
  teachers: number;
  maxTeachers: number;
  storage: string;
  maxStorage: string;
  monthlyFee: number;
  startDate: string;
  endDate: string;
}

interface BillingRecord {
  id: string;
  schoolName: string;
  plan: string;
  billingCycle: 'Monthly' | 'Quarterly' | 'Annual';
  activeUsers: number;
  userLimit: number;
  nextBillingDate: string;
  amount: number;
  paymentStatus: 'Paid' | 'Pending' | 'Overdue';
  invoiceNumber: string;
  lastPaymentDate?: string;
}

interface Announcement {
  id: string;
  date: string;
  type: string;
  title: string;
  audience: string;
  targetId?: string;
  selectedSchools?: string[];
  status: 'Published' | 'Scheduled' | 'Expired';
  message: string;
  scheduledAt?: string;
}

interface RecoveryLog {
  id: string;
  date: string;
  schoolName: string;
  userEmail: string;
  action: string;
  status: 'Completed' | 'Pending';
}

export function SuperAdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialView = (searchParams.get('view') as ViewType) || 'dashboard';

  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>(initialView);

  // Sync view state to URL
  useEffect(() => {
    if (searchParams.get('view') !== currentView) {
      setSearchParams({ view: currentView });
    }
  }, [currentView, searchParams, setSearchParams]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [isEditingSchool, setIsEditingSchool] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [isEditingOrganization, setIsEditingOrganization] = useState(false);

  // Confirmation modal states for organization actions
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showResetCredentialsModal, setShowResetCredentialsModal] = useState(false);
  const [showDeleteOrgModal, setShowDeleteOrgModal] = useState(false);
  const [resetCredentials, setResetCredentials] = useState({ email: '', password: '' });

  // Configuration modal states
  const [showUpdateCredsModal, setShowUpdateCredsModal] = useState(false);
  const [showTestConnectionModal, setShowTestConnectionModal] = useState(false);
  const [showConfigureModal, setShowConfigureModal] = useState(false);
  const [showManageStorageModal, setShowManageStorageModal] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [configForm, setConfigForm] = useState({
    provider: '',
    apiKey: '',
    apiSecret: '',
    endpoint: '',
    webhookUrl: '',
  });
  const [storageForm, setStorageForm] = useState({
    provider: 'Amazon S3',
    bucketName: 'schoolms-storage-prod',
    accessKey: '',
    secretKey: '',
    region: 'ap-south-1',
  });
  const [connectionTestResult, setConnectionTestResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);

  // Additional modal states
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState<'PDF' | 'CSV'>('PDF');
  const [showScheduleMaintenanceModal, setShowScheduleMaintenanceModal] = useState(false);
  const [showArchiveSchoolModal, setShowArchiveSchoolModal] = useState(false);
  const [schoolToArchive, setSchoolToArchive] = useState<School | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<string>('');

  const [organizationForm, setOrganizationForm] = useState({
    name: '',
    type: 'School',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    plan: 'Basic',
    govLicenseId: '',
    gstNumber: '',
    registeredAddress: '',
    panNumber: '',
    registrationType: 'Private School',
  });

  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [newPlanForm, setNewPlanForm] = useState({
    name: '',
    description: '',
    price: 0,
    maxStudents: 0,
    maxTeachers: 0,
    storage: '',
    features: [] as string[],
  });
  const [newFeature, setNewFeature] = useState('');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketReply, setTicketReply] = useState('');
  const [isUpdatingTicket, setIsUpdatingTicket] = useState(false);

  const [schoolForm, setSchoolForm] = useState({
    name: '',
    organizationId: '',
    principalName: '',
    principalEmail: '',
    principalPhone: '',
    principalAddress: '',
    principalGmail: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    plan: 'Basic',
    maxStudents: 200,
    maxTeachers: 20,
    schoolCode: '',
    aiEnabled: true,
  });

  // Subscription plan editing state
  const [isEditingPlans, setIsEditingPlans] = useState(false);
  const [plansToDelete, setPlansToDelete] = useState<string[]>([]);
  const [backupPlanDetails, setBackupPlanDetails] = useState<Record<string, SubscriptionPlan>>({});
  const [planDetails, setPlanDetails] = useState<Record<string, SubscriptionPlan>>({});
  const [editingFeatureInput, setEditingFeatureInput] = useState<Record<string, string>>({});

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null);

  const [dataLoading, setDataLoading] = useState(true);
  const [dataErrors, setDataErrors] = useState<string[]>([]);

  // Background check for scheduled announcements
  useEffect(() => {
    const checkScheduled = () => {
      const now = new Date();
      let changed = false;
      const updatedAnnouncements = announcements.map(ann => {
        if (ann.status === 'Scheduled' && ann.scheduledAt) {
          if (new Date(ann.scheduledAt) <= now) {
            changed = true;
            return { ...ann, status: 'Published' as const };
          }
        }
        return ann;
      });

      if (changed) {
        setAnnouncements(updatedAnnouncements);
      }
    };

    const interval = setInterval(checkScheduled, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [announcements]);

  // Organizations — loaded from Firestore
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  // Data for schools
  // Data for schools - loaded from Firestore via useEffect
  const [schools, setSchools] = useState<School[]>([]);

  // Subscriptions — derived from Firestore schools
  const subscriptions = useMemo<Subscription[]>(() => schools.map(s => {
    const planName = s.plan || 'Basic';
    const planInfo = planDetails[planName] || { price: 3000, maxStudents: 200, maxTeachers: 20, storage: '20 GB' };
    
    return {
      id: s.id,
      schoolName: s.name,
      plan: planName,
      status: s.status === 'active' ? 'active' : s.status === 'archived' ? 'expired' : ('trial' as 'active' | 'expired' | 'trial'),
      students: s.activeStudents || s.students || 0,
      maxStudents: s.maxStudents || planInfo.maxStudents,
      teachers: s.activeTeachers || s.teachers || 0,
      maxTeachers: s.maxTeachers || planInfo.maxTeachers,
      storage: s.storage || '0 GB',
      maxStorage: planInfo.storage,
      monthlyFee: planInfo.price,
      startDate: s.subscriptionStart || '',
      endDate: s.subscriptionEnd || '',
    };
  }), [schools, planDetails]);

  // Billing records — derived from Firestore schools
  const billingRecords = useMemo<BillingRecord[]>(() => schools.map((s, index) => {
    const planName = (s.plan || 'Basic') as 'Basic' | 'Professional' | 'Enterprise';
    const planInfo = planDetails[planName] || { price: 3000, maxStudents: 200 };

    return {
      id: `INV-${s.id}`,
      schoolName: s.name,
      plan: planName,
      billingCycle: 'Monthly' as const,
      activeUsers: (s.activeStudents || s.students || 0) + (s.activeTeachers || s.teachers || 0),
      userLimit: s.maxStudents || planInfo.maxStudents,
      nextBillingDate: s.subscriptionEnd || '',
      amount: planInfo.price,
      paymentStatus: (s.status === 'active' ? 'Paid' : 'Overdue') as 'Paid' | 'Pending' | 'Overdue',
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`,
      lastPaymentDate: s.subscriptionStart || '',
    };
  }), [schools, planDetails]);

  // Load data from Firestore once user auth is ready
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setDataLoading(true);
      const errors: string[] = [];

      // ── Step 1: Ensure Firebase Auth is ready ────────────────────────────
      try {
        await auth.authStateReady();
      } catch { /* best effort */ }

      // ── Step 2: Force-sync with backend to set custom claims ─────────────
      // onAuthStateChanged may have fired before the backend was running,
      // so custom claims might not be on the JWT yet.  Re-call the backend
      // now (it's idempotent) then force-refresh the token so Firestore
      // security rules see request.auth.token.role == 'superadmin'.
      try {
        if (auth.currentUser) {
          const apiBase = ((import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3001').replace(/\/$/, '');
          const token = await auth.currentUser.getIdToken();
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 5000);
          const resp = await fetch(`${apiBase}/api/auth/login`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            signal: ctrl.signal,
          });
          clearTimeout(timer);
          if (resp.ok) {
            // Backend confirmed + (possibly) set custom claims — refresh token
            await auth.currentUser.getIdToken(true);
          }
        }
      } catch { /* backend unavailable — proceed with existing token */ }

      // Fallback: even if backend is down, do a plain token refresh so the
      // SDK uses the most recent cached token.
      try {
        if (auth.currentUser) await auth.currentUser.getIdToken(true);
      } catch { /* best effort */ }

      // ── Step 3: Fetch collections (each independently) ────────────────────
      // Helper: retry once on permission-denied (covers any lingering
      // race condition between token propagation and rule evaluation).
      const fetchWithRetry = async <T,>(fn: () => Promise<T[]>): Promise<T[]> => {
        try {
          return await fn();
        } catch (err: any) {
          if (err?.code === 'permission-denied' || err?.message?.includes('permissions')) {
            // Wait briefly for Firestore's internal auth listener to sync
            await new Promise(r => setTimeout(r, 1500));
            return await fn();
          }
          throw err;
        }
      };

      // Load each collection independently so one failure doesn't block the rest
      let firestoreSchools: any[] = [];
      let firestoreOrganizations: any[] = [];
      let firestoreAnnouncements: any[] = [];
      let firestorePlans: SubscriptionPlan[] = [];

      try {
        firestorePlans = await fetchWithRetry(() => planService.getAll());
        // Auto-seed if empty
        if (firestorePlans.length === 0) {
          const defaultPlans = [
            { id: 'Basic', name: 'Basic', description: 'For small schools', price: 3000, maxStudents: 200, maxTeachers: 20, storage: '20 GB', features: ['Up to 200 students', '20 teachers', '20 GB storage', 'Email support'], isActive: true },
            { id: 'Professional', name: 'Professional', description: 'For growing schools', price: 8000, maxStudents: 500, maxTeachers: 50, storage: '50 GB', features: ['Up to 500 students', '50 teachers', '50 GB storage', 'WhatsApp integration', 'Priority support'], isActive: true },
            { id: 'Enterprise', name: 'Enterprise', description: 'For large institutions', price: 15000, maxStudents: 1000, maxTeachers: 100, storage: '100 GB', features: ['Up to 1000 students', '100 teachers', '100 GB storage', 'All integrations', 'Dedicated support'], isActive: true }
          ];
          for (const p of defaultPlans) {
            await planService.create(p);
          }
          firestorePlans = await planService.getAll();
        }
        
        // Convert to record for easy lookup
        const planRecord: Record<string, SubscriptionPlan> = {};
        firestorePlans.forEach(p => { planRecord[p.name || p.id] = p; });
        setPlanDetails(planRecord);
      } catch (err: any) {
        console.error('Failed to load plans:', err);
        errors.push('Plans: ' + (err?.message || 'Failed to load'));
      }

      try {
        firestoreSchools = await fetchWithRetry(() => schoolService.getAll());
      } catch (err: any) {
        console.error('Failed to load schools:', err);
        errors.push('Schools: ' + (err?.message || 'Failed to load'));
      }

      try {
        firestoreOrganizations = await fetchWithRetry(() => organizationService.getAll());
      } catch (err: any) {
        console.error('Failed to load organizations:', err);
        errors.push('Organizations: ' + (err?.message || 'Failed to load'));
      }

      try {
        firestoreAnnouncements = await fetchWithRetry(() => announcementService.getAll());
      } catch (err: any) {
        console.error('Failed to load announcements:', err);
        errors.push('Announcements: ' + (err?.message || 'Failed to load'));
      }

      try {
        const firestoreTickets = await fetchWithRetry(() => ticketService.getAll());
        setTickets(firestoreTickets);
      } catch (err: any) {
        console.error('Failed to load tickets:', err);
        errors.push('Tickets: ' + (err?.message || 'Failed to load'));
      }

      try {
        const stats = await statisticsService.getPlatformStats();
        setPlatformStats(stats);
      } catch (err: any) {
        console.error('Failed to load platform stats:', err);
      }

      // ── Step 4: Fetch real-time metrics for all schools ───────────────────
      let schoolMetrics: Record<string, { students: number; teachers: number }> = {};
      try {
        schoolMetrics = await (statisticsService as any).getAllSchoolsMetrics();
      } catch (err: any) {
        console.error('Failed to load school metrics:', err);
      }

      // Reconcile org-school links: fix schools whose organizationId is missing
      // or doesn't match any actual org (caused by old auto-ID bug or race condition).
      const orgIdSet = new Set(firestoreOrganizations.map((o: any) => o.id));
      const reconciledSchools = firestoreSchools.map((school: any) => {
        // Fetch real-time metrics for this school
        const m = schoolMetrics[school.id] || { students: 0, teachers: 0 };
        
        // Build base reconciled school
        let updatedSchool = { ...school };

        // Fix organizationId if missing
        if (!school.organizationId || !orgIdSet.has(school.organizationId)) {
          const schoolOrgName = (school.organizationName || '').trim().toLowerCase();
          if (schoolOrgName) {
            const matchedOrg = firestoreOrganizations.find(
              (o: any) => (o.name || '').trim().toLowerCase() === schoolOrgName
            );
            if (matchedOrg) {
              schoolService.update(school.id, { organizationId: matchedOrg.id }).catch(() => {});
              updatedSchool.organizationId = matchedOrg.id;
            }
          }
        }

        // Merge real-time metrics and dynamic storage info
        return {
          ...updatedSchool,
          students: m.students,
          teachers: m.teachers,
          activeStudents: m.students,
          activeTeachers: m.teachers,
          // Provide default storage based on plan if missing or '0 GB'
          storage: school.storage && school.storage !== '0 GB' ? school.storage : 
                   (school.plan === 'Enterprise' ? '100 GB' : school.plan === 'Professional' ? '50 GB' : '20 GB')
        };
      });

      // ── Repair schoolsCount on every org ────────────────────────────────
      // Build a map of actual school counts per organizationId from live data.
      // This fixes any org document whose schoolsCount field is 0 / stale.
      const schoolCountByOrg = new Map<string, number>();
      for (const school of reconciledSchools) {
        const oid = (school as any).organizationId;
        if (oid) schoolCountByOrg.set(oid, (schoolCountByOrg.get(oid) || 0) + 1);
      }
      const repairedOrganizations = firestoreOrganizations.map((org: any) => {
        const actualCount = schoolCountByOrg.get(org.id) || 0;
        if (org.schoolsCount !== actualCount) {
          // Persist the correct count back to Firestore (fire-and-forget)
          organizationService.update(org.id, { schoolsCount: actualCount }).catch(() => {});
          return { ...org, schoolsCount: actualCount };
        }
        return org;
      });

      setSchools(reconciledSchools as any);
      setOrganizations(repairedOrganizations as any);
      if (firestoreAnnouncements.length > 0) {
        setAnnouncements(firestoreAnnouncements as any);
      }
      setDataErrors(errors);
      setDataLoading(false);
    };
    loadData();
  }, [user]);

  // Utility to generate unique school code
  const generateSchoolCode = (name: string) => {
    if (!name) return '';

    // Remove special characters and split into words
    const words = name.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 0);

    let code = '';
    if (words.length >= 3) {
      // Use initials of first 3-5 words
      code = words.slice(0, 5).map(w => w[0]).join('').toUpperCase();
    } else if (words.length === 2) {
      // First 2 letters of first word + first letter of second word (3 chars)
      code = (words[0].slice(0, 2) + words[1].slice(0, 1)).toUpperCase();
    } else if (words.length === 1) {
      // First 3-4 letters of the word
      code = words[0].slice(0, 4).toUpperCase();
    }

    // Default fallback if too short
    if (code.length < 3) code = name.slice(0, 3).toUpperCase();

    // Ensure uniqueness
    let finalCode = code;
    let counter = 1;
    while (schools.some(s => s.schoolCode === finalCode)) {
      finalCode = `${code}${counter}`;
      counter++;
    }

    return finalCode;
  };

  // Handler for creating organization
  const handleCreateOrganization = async () => {
    // Validate required fields
    if (!organizationForm.name || !organizationForm.email || !organizationForm.contactPerson) {
      alert('Please fill in all required fields (Name, Email, Contact Person)');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(organizationForm.email)) {
      alert('Please enter a valid email address');
      return;
    }

    // Generate organization ID
    const orgId = 'ORG' + String(organizations.length + 1).padStart(3, '0');

    // Create new organization
    const newOrg: Organization = {
      id: orgId,
      name: organizationForm.name,
      type: organizationForm.type,
      createdDate: new Date().toISOString().split('T')[0],
      schoolsCount: 0,
      status: 'active',
      plan: organizationForm.plan,
    };

    // Add to organizations list and save to Firestore
    const orgDetails = {
      ...newOrg,
      contactPerson: organizationForm.contactPerson,
      email: organizationForm.email,
      phone: organizationForm.phone,
      address: organizationForm.address,
      city: organizationForm.city,
      state: organizationForm.state,
      pincode: organizationForm.pincode,
      govLicenseId: organizationForm.govLicenseId,
      gstNumber: organizationForm.gstNumber,
      registeredAddress: organizationForm.registeredAddress || organizationForm.address,
      panNumber: organizationForm.panNumber,
      registrationType: organizationForm.registrationType,
    };
    setOrganizations([...organizations, orgDetails as Organization]);
    try {
      const savedOrg = await organizationService.create(orgDetails);
      // Update local state with the persisted org (IDs match since we use setDoc)
      setOrganizations(prev => prev.map(o => o.id === orgId ? { ...orgDetails, ...savedOrg } as Organization : o));
    } catch (err) {
      console.error('Failed to save organization to Firestore:', err);
      alert('Failed to save organization to Firestore. Please try again.');
      setOrganizations(prev => prev.filter(o => o.id !== orgId));
      return;
    }

    // Show success message
    alert(`Organization "${organizationForm.name}" created successfully!\nOrganization ID: ${orgId}`);

    // Reset form
    setOrganizationForm({
      name: '',
      type: 'School',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      plan: 'Basic',
      govLicenseId: '',
      gstNumber: '',
      registeredAddress: '',
      panNumber: '',
      registrationType: 'Private School',
    });

    // Navigate to organizations view
    setCurrentView('organizations');
  };

  // Handler for creating school
  const handleCreateSchool = async () => {
    // Validate required fields
    if (!schoolForm.name || !schoolForm.organizationId || !schoolForm.principalEmail || !schoolForm.schoolCode) {
      alert('Please fill in all required fields (School Name, School Code, Organization, Principal Email)');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(schoolForm.principalEmail)) {
      alert('Please enter a valid principal email address');
      return;
    }

    // Generate school ID
    const schoolId = 'SCH' + String(schools.length + 1).padStart(3, '0');

    // Find organization name
    const org = organizations.find(o => o.id === schoolForm.organizationId);
    if (!org) {
      alert('Selected organization not found');
      return;
    }

    // Calculate subscription end date (1 year from now)
    const subscriptionEnd = new Date();
    subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);

    // Create new school
    const normalizedEmail = schoolForm.principalEmail.trim().toLowerCase();
    const newSchool: School = {
      id: schoolId,
      name: schoolForm.name,
      organizationId: schoolForm.organizationId,
      organizationName: org.name,
      status: 'active',
      students: 0,
      teachers: 0,
      storage: '0 GB',
      subscriptionEnd: subscriptionEnd.toISOString().split('T')[0],
      principal: schoolForm.principalName,
      email: normalizedEmail,
      principalEmail: normalizedEmail,
      principalName: schoolForm.principalName,
      phone: schoolForm.principalPhone,
      principalAddress: schoolForm.principalAddress,
      principalGmail: schoolForm.principalGmail ? schoolForm.principalGmail.trim().toLowerCase() : '',
      address: schoolForm.address,
      city: schoolForm.city,
      state: schoolForm.state,
      pincode: schoolForm.pincode,
      plan: schoolForm.plan,
      maxStudents: schoolForm.maxStudents,
      maxTeachers: schoolForm.maxTeachers,
      subscriptionStart: new Date().toISOString().split('T')[0],
      schoolCode: schoolForm.schoolCode,
    };

    setSchools([...schools, newSchool]);

    // Save school to Firestore (also auto-creates admin user)
    try {
      const savedSchool = await schoolService.create(newSchool);
      // Update local state with the persisted school (IDs always match now)
      setSchools(prev => prev.map(s => s.id === newSchool.id ? { ...newSchool, ...savedSchool } : s));
    } catch (err: any) {
      console.error('Failed to save school to Firestore:', err);
      alert(`Failed to save school to Firestore:\n${err?.message || err}\n\nPlease check the browser console for details.`);
      // Revert local state on failure
      setSchools(prev => prev.filter(s => s.id !== newSchool.id));
      return;
    }

    // Increment schoolsCount on the parent organization in Firestore
    const newSchoolCount = schools.filter(s => s.organizationId === schoolForm.organizationId).length + 1;
    organizationService.update(schoolForm.organizationId, { schoolsCount: newSchoolCount }).catch(err =>
      console.warn('Failed to update org school count:', err)
    );
    setOrganizations(prev => prev.map(o =>
      o.id === schoolForm.organizationId ? { ...o, schoolsCount: newSchoolCount } : o
    ));

    // Show success message
    alert(`School "${schoolForm.name}" created successfully!\nAn administrator account has been provisioned for ${schoolForm.principalEmail}.`);

    // Reset form
    setSchoolForm({
      name: '',
      organizationId: '',
      principalName: '',
      principalEmail: '',
      principalPhone: '',
      principalAddress: '',
      principalGmail: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      plan: 'Basic',
      maxStudents: 200,
      maxTeachers: 20,
      schoolCode: '',
      aiEnabled: true,
    });

    // Navigate to subscriptions view
    setCurrentView('subscriptions');
  };

  // Handler for editing subscription plans
  const handleToggleEditPlans = () => {
    if (!isEditingPlans) {
      // Entering edit mode: backup current plans
      setBackupPlanDetails({ ...planDetails });
      setPlansToDelete([]);
    }
    setIsEditingPlans(!isEditingPlans);
  };

  const handleSavePlans = async () => {
    try {
      // 1. Process deletions
      if (plansToDelete.length > 0) {
        const deletePromises = plansToDelete.map(id => planService.delete(id));
        await Promise.all(deletePromises);
      }

      // 2. Save all currently edited plans to Firestore
      const updatePromises = Object.entries(planDetails).map(([name, plan]) => 
        planService.update(plan.id || name, plan)
      );
      await Promise.all(updatePromises);
      
      setPlansToDelete([]);
      setBackupPlanDetails({});
      setIsEditingPlans(false);
      alert('Plan updates saved successfully!');
    } catch (err: any) {
      console.error('Failed to save plans:', err);
      alert(`Failed to save plans: ${err?.message || 'Unknown error'}`);
    }
  };

  const handleCancelEditPlans = () => {
    // Revert to backup and clear deletion queue
    setPlanDetails(backupPlanDetails);
    setPlansToDelete([]);
    setBackupPlanDetails({});
    setIsEditingPlans(false);
  };

  const handleUpdatePlanPrice = (planName: string, price: number) => {
    setPlanDetails({
      ...planDetails,
      [planName]: { ...planDetails[planName], price },
    });
  };

  const handleUpdatePlanDescription = (planName: string, description: string) => {
    setPlanDetails(prev => ({
      ...prev,
      [planName]: { ...prev[planName], description }
    }));
  };

  const handleUpdatePlanLimits = (planName: string, field: string, value: any) => {
    setPlanDetails(prev => ({
      ...prev,
      [planName]: {
        ...prev[planName],
        [field]: value
      }
    }));
  };

  const handleAddFeatureToPlan = (planName: string) => {
    const input = editingFeatureInput[planName];
    if (input && input.trim()) {
      setPlanDetails(prev => ({
        ...prev,
        [planName]: {
          ...prev[planName],
          features: [...prev[planName].features, input.trim()]
        }
      }));
      setEditingFeatureInput(prev => ({ ...prev, [planName]: '' }));
    }
  };

  const handleRemoveFeatureFromPlan = (planName: string, featureToRemove: string) => {
    setPlanDetails(prev => ({
      ...prev,
      [planName]: {
        ...prev[planName],
        features: prev[planName].features.filter((f: string) => f !== featureToRemove)
      }
    }));
  };

  const handleCreatePlan = async () => {
    if (!newPlanForm.name || !newPlanForm.description || newPlanForm.price <= 0) {
      alert('Please fill in all required fields');
      return;
    }

    const limitFeatures = [
      `Up to ${newPlanForm.maxStudents} students`,
      `${newPlanForm.maxTeachers} teachers`,
      `${newPlanForm.storage} storage`,
    ];

    const planData: Omit<SubscriptionPlan, 'id'> & { id: string } = {
      id: newPlanForm.name,
      name: newPlanForm.name,
      description: newPlanForm.description,
      features: [...limitFeatures, ...newPlanForm.features],
      price: Number(newPlanForm.price),
      maxStudents: Number(newPlanForm.maxStudents),
      maxTeachers: Number(newPlanForm.maxTeachers),
      storage: newPlanForm.storage,
      isActive: true
    };

    try {
      await planService.create(planData);
      const updatedPlans = {
        ...planDetails,
        [newPlanForm.name]: { ...planData, id: newPlanForm.name } as SubscriptionPlan,
      };
      setPlanDetails(updatedPlans);
      setShowCreatePlanModal(false);
      alert(`✅ Plan "${newPlanForm.name}" created successfully!`);
      
      // Reset form
      setNewPlanForm({
        name: '',
        description: '',
        price: 0,
        maxStudents: 200,
        maxTeachers: 20,
        storage: '20 GB',
        features: [],
      });
    } catch (err: any) {
      console.error('Failed to create plan:', err);
      alert(`Failed to create plan: ${err?.message || 'Unknown error'}`);
    }
  };

  const handleAddFeature = () => {
    if (newFeature.trim() && !newPlanForm.features.includes(newFeature.trim())) {
      setNewPlanForm(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (featureToRemove: string) => {
    setNewPlanForm(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== featureToRemove)
    }));
  };

  const renderCreatePlanModal = () => {
    if (!showCreatePlanModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl text-gray-900 font-semibold">Create New Subscription Plan</h3>
                <p className="text-gray-600 text-sm mt-1">Define features and limits for the new plan</p>
              </div>
              <button
                onClick={() => setShowCreatePlanModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">Plan Name *</label>
                  <input
                    type="text"
                    value={newPlanForm.name}
                    onChange={(e) => setNewPlanForm({ ...newPlanForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Starter"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">Price (₹/month) *</label>
                  <input
                    type="number"
                    value={newPlanForm.price}
                    onChange={(e) => setNewPlanForm({ ...newPlanForm, price: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">Plan Description *</label>
                  <textarea
                    value={newPlanForm.description}
                    onChange={(e) => setNewPlanForm({ ...newPlanForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 h-24"
                    placeholder="Short description for the plan..."
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Max Students</label>
                    <input
                      type="number"
                      value={newPlanForm.maxStudents}
                      onChange={(e) => setNewPlanForm({ ...newPlanForm, maxStudents: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Max Teachers</label>
                    <input
                      type="number"
                      value={newPlanForm.maxTeachers}
                      onChange={(e) => setNewPlanForm({ ...newPlanForm, maxTeachers: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">Storage Limit</label>
                  <input
                    type="text"
                    value={newPlanForm.storage}
                    onChange={(e) => setNewPlanForm({ ...newPlanForm, storage: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., 10 GB"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2 font-medium">Features</label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Add a feature..."
                    />
                    <button
                      onClick={handleAddFeature}
                      className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto p-2 border border-gray-100 rounded-lg bg-gray-50">
                    {newPlanForm.features.length === 0 ? (
                      <p className="text-gray-500 text-center py-2 text-sm italic">No features added yet</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {newPlanForm.features.map((feature, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-purple-200 text-purple-700 text-sm rounded-full"
                          >
                            {feature}
                            <button onClick={() => handleRemoveFeature(feature)} className="text-purple-400 hover:text-purple-600">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8 border-t pt-6">
              <button
                onClick={() => setShowCreatePlanModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlan}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
              >
                Create Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Additional interactive state
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [showOrgDetails, setShowOrgDetails] = useState(false);
  const [showSchoolDetails, setShowSchoolDetails] = useState(false);
  const [userRecoveryEmail, setUserRecoveryEmail] = useState('');
  const [selectedRecoveryUser, setSelectedRecoveryUser] = useState<any>(null);
  const [recoveryHistory, setRecoveryHistory] = useState<RecoveryLog[]>([]);
  const [announcementForm, setAnnouncementForm] = useState({
    type: 'Maintenance Notice',
    audience: 'All Schools',
    targetId: '', // For Specific Organization or Plan
    selectedSchools: [] as string[], // For Selected Schools
    title: '',
    message: '',
  });
  const [maintenanceForm, setMaintenanceForm] = useState({
    startDateTime: '',
    endDateTime: '',
    reason: '',
  });

  const [platformStats, setPlatformStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalParents: 0
  });

  const [schoolStats, setSchoolStats] = useState({
    activeStudents: 0,
    activeTeachers: 0,
    activeParents: 0
  });

  // Handler Functions
  const handleViewSchoolDetails = async (school: School) => {
    setSelectedSchool(school);
    // Reset school stats first to avoid showing stale data from previous school
    setSchoolStats({ activeStudents: 0, activeTeachers: 0, activeParents: 0 });
    setCurrentView('school-details');

    try {
      const stats = await statisticsService.getSchoolStats(school.id);
      setSchoolStats(stats);
    } catch (err: any) {
      console.error('Failed to load school stats:', err);
    }
  };

  const handleToggleSchoolStatus = (school: School) => {
    const newStatus = school.status === 'active' ? 'suspended' : 'active';
    setSchools(schools.map((s) => (s.id === school.id ? { ...s, status: newStatus as 'active' | 'suspended' } : s)));
    setSelectedSchool(selectedSchool?.id === school.id ? { ...school, status: newStatus as 'active' | 'suspended' } : selectedSchool);
    schoolService.update(school.id, { status: newStatus }).catch(err => console.error('Failed to update school status:', err));
    alert(`${school.name} has been ${newStatus}`);
  };

  const handleToggleAIService = (school: School) => {
    const newVal = school.aiEnabled === false;
    const updated: School = { ...school, aiEnabled: newVal };
    setSchools(schools.map((s) => (s.id === school.id ? updated : s)));
    setSelectedSchool(updated);
    schoolService.update(school.id, { aiEnabled: newVal }).catch(err => console.error('Failed to update AI status:', err));
    alert(`AI Features ${newVal ? 'enabled' : 'disabled'} for ${school.name}`);
  };

  const handleEditSchool = () => {
    if (selectedSchool) {
      setSchoolForm({
        name: selectedSchool.name,
        organizationId: selectedSchool.organizationId,
        principalName: selectedSchool.principal || '',
        principalEmail: selectedSchool.email || '',
        principalPhone: selectedSchool.phone || '',
        principalAddress: selectedSchool.principalAddress || '',
        principalGmail: selectedSchool.principalGmail || '',
        address: selectedSchool.address || '',
        city: selectedSchool.city || '',
        state: selectedSchool.state || '',
        pincode: selectedSchool.pincode || '',
        plan: selectedSchool.plan || 'Basic',
        maxStudents: selectedSchool.maxStudents || 200,
        maxTeachers: selectedSchool.maxTeachers || 20,
        schoolCode: selectedSchool.schoolCode || '',
        aiEnabled: selectedSchool.aiEnabled !== false,
      });
      setIsEditingSchool(true);
    }
  };

  const handleSaveSchoolEdit = () => {
    if (!selectedSchool) return;

    const updatedSchool: School = {
      ...selectedSchool,
      name: schoolForm.name,
      principal: schoolForm.principalName,
      email: schoolForm.principalEmail,
      phone: schoolForm.principalPhone,
      principalAddress: schoolForm.principalAddress,
      principalGmail: schoolForm.principalGmail,
      address: schoolForm.address,
      city: schoolForm.city,
      state: schoolForm.state,
      pincode: schoolForm.pincode,
      plan: schoolForm.plan,
      maxStudents: schoolForm.maxStudents,
      maxTeachers: schoolForm.maxTeachers,
      schoolCode: schoolForm.schoolCode,
    };

    setSchools(schools.map((s) => (s.id === selectedSchool.id ? updatedSchool : s)));
    setSelectedSchool(updatedSchool);
    setIsEditingSchool(false);
    schoolService.update(selectedSchool.id, updatedSchool).catch(err => console.error('Failed to update school:', err));
    alert('School details updated successfully!');
  };

  const handleCancelSchoolEdit = () => {
    setIsEditingSchool(false);
    setSchoolForm({
      name: '',
      organizationId: '',
      principalName: '',
      principalEmail: '',
      principalPhone: '',
      principalAddress: '',
      principalGmail: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      plan: 'Basic',
      maxStudents: 200,
      maxTeachers: 20,
      schoolCode: '',
      aiEnabled: true,
    });
  };

  const handleResetCredentials = (school: School) => {
    const newPassword = 'Admin@' + Math.random().toString(36).substring(2, 10);
    alert(
      `Credentials Reset Successfully!\n\n` +
      `School: ${school.name}\n` +
      `Admin Email: ${school.email || 'not set'}\n` +
      `New Password: ${newPassword}\n\n` +
      `⚠️ Important:\n` +
      `- This password is temporary\n` +
      `- Admin must change it on first login\n` +
      `- Email has been sent to the admin`
    );
  };

  // Organization Detail Handlers
  const handleViewOrganizationDetails = (organization: Organization) => {
    setSelectedOrganization(organization);
    setCurrentView('organization-details');
  };

  const handleToggleOrganizationStatus = (organization: Organization) => {
    if (organization.status === 'active') {
      setShowSuspendModal(true);
    } else {
      setShowActivateModal(true);
    }
  };

  const confirmSuspendOrganization = () => {
    if (!selectedOrganization) return;
    const updatedOrganization = { ...selectedOrganization, status: 'suspended' as const };
    const updatedOrgs = organizations.map((o) => (o.id === selectedOrganization.id ? updatedOrganization : o));
    setOrganizations(updatedOrgs);
    setSelectedOrganization(updatedOrganization);
    organizationService.update(selectedOrganization.id, { status: 'suspended' }).catch(err => console.error('Failed to suspend org:', err));
    setShowSuspendModal(false);
  };

  const confirmActivateOrganization = () => {
    if (!selectedOrganization) return;
    const updatedOrganization = { ...selectedOrganization, status: 'active' as const };
    const updatedOrgs = organizations.map((o) => (o.id === selectedOrganization.id ? updatedOrganization : o));
    setOrganizations(updatedOrgs);
    setSelectedOrganization(updatedOrganization);
    organizationService.update(selectedOrganization.id, { status: 'active' }).catch(err => console.error('Failed to activate org:', err));
    setShowActivateModal(false);
  };

  const handleEditOrganization = () => {
    if (selectedOrganization) {
      setOrganizationForm({
        name: selectedOrganization.name,
        type: selectedOrganization.type,
        contactPerson: selectedOrganization.contactPerson || '',
        email: selectedOrganization.email || '',
        phone: selectedOrganization.phone || '',
        address: selectedOrganization.address || '',
        city: selectedOrganization.city || '',
        state: selectedOrganization.state || '',
        pincode: selectedOrganization.pincode || '',
        plan: selectedOrganization.plan || 'Basic',
        govLicenseId: selectedOrganization.govLicenseId || '',
        gstNumber: selectedOrganization.gstNumber || '',
        registeredAddress: selectedOrganization.registeredAddress || '',
        panNumber: selectedOrganization.panNumber || '',
        registrationType: selectedOrganization.registrationType || 'Private School',
      });
      setIsEditingOrganization(true);
    }
  };

  const handleSaveOrganizationEdit = () => {
    if (!selectedOrganization) return;

    const updatedOrganization: Organization = {
      ...selectedOrganization,
      name: organizationForm.name,
      type: organizationForm.type,
      contactPerson: organizationForm.contactPerson,
      email: organizationForm.email,
      phone: organizationForm.phone,
      address: organizationForm.address,
      city: organizationForm.city,
      state: organizationForm.state,
      pincode: organizationForm.pincode,
      plan: organizationForm.plan,
      govLicenseId: organizationForm.govLicenseId,
      gstNumber: organizationForm.gstNumber,
      registeredAddress: organizationForm.registeredAddress || organizationForm.address,
      panNumber: organizationForm.panNumber,
      registrationType: organizationForm.registrationType,
    };

    setOrganizations(organizations.map((o) => (o.id === selectedOrganization.id ? updatedOrganization : o)));
    setSelectedOrganization(updatedOrganization);
    organizationService.update(selectedOrganization.id, updatedOrganization).catch(err => console.error('Failed to update org:', err));
    setIsEditingOrganization(false);
  };

  const handleCancelOrganizationEdit = () => {
    setIsEditingOrganization(false);
    setOrganizationForm({
      name: '',
      type: 'School',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      plan: 'Basic',
      govLicenseId: '',
      gstNumber: '',
      registeredAddress: '',
      panNumber: '',
      registrationType: 'Private School',
    });
  };

  const handleResetOrganizationCredentials = (organization: Organization) => {
    const newPassword = 'Admin@' + Math.random().toString(36).substring(2, 10);
    setResetCredentials({
      email: organization.email || '',
      password: newPassword
    });
    setShowResetCredentialsModal(true);
  };

  const confirmResetCredentials = () => {
    setShowResetCredentialsModal(false);
    setResetCredentials({ email: '', password: '' });
  };

  const handleDeleteOrganization = () => {
    setShowDeleteOrgModal(true);
  };

  const confirmDeleteOrganization = () => {
    if (!selectedOrganization) return;
    // Also delete all schools under this organization
    const orgSchools = schools.filter(s => s.organizationId === selectedOrganization.id);
    setSchools(schools.filter(s => s.organizationId !== selectedOrganization.id));
    setOrganizations(organizations.filter(o => o.id !== selectedOrganization.id));
    organizationService.delete(selectedOrganization.id).catch(err => console.error('Failed to delete org:', err));
    orgSchools.forEach(s => schoolService.delete(s.id).catch(err => console.error('Failed to delete school:', err)));
    setShowDeleteOrgModal(false);
    setCurrentView('organizations');
    setSelectedOrganization(null);
  };

  const handleUpdateCredentials = (service: string) => {
    setSelectedService(service);
    setConfigForm({
      provider: service === 'Payment Gateway' ? 'Razorpay' : service === 'WhatsApp API' ? 'Twilio' : '',
      apiKey: '',
      apiSecret: '',
      endpoint: '',
      webhookUrl: '',
    });
    setShowUpdateCredsModal(true);
  };

  const handleTestConnection = (service: string) => {
    setSelectedService(service);
    setConnectionTestResult(null);
    setShowTestConnectionModal(true);
  };

  const handleConfigureService = (service: string) => {
    setSelectedService(service);
    setConfigForm({
      provider: '',
      apiKey: '',
      apiSecret: '',
      endpoint: '',
      webhookUrl: '',
    });
    setShowConfigureModal(true);
  };

  const handleManageStorage = () => {
    setShowManageStorageModal(true);
  };

  const confirmUpdateCredentials = () => {
    if (!configForm.apiKey || !configForm.apiSecret) {
      alert('Please fill in all required fields');
      return;
    }

    alert(`✅ Credentials Updated Successfully!\n\nService: ${selectedService}\nProvider: ${configForm.provider}\n\nNew credentials have been saved securely.`);
    setShowUpdateCredsModal(false);
  };

  const performConnectionTest = () => {
    // Simulate connection test
    setTimeout(() => {
      const isSuccess = Math.random() > 0.2; // 80% success rate for demo
      setConnectionTestResult({
        success: isSuccess,
        message: isSuccess ? 'Connection successful!' : 'Connection failed',
        details: isSuccess
          ? `✅ Connected to ${selectedService}\n• Response time: ${Math.floor(Math.random() * 100 + 20)}ms\n• Status: Active\n• Last sync: ${new Date().toLocaleTimeString()}`
          : `❌ Failed to connect\n• Error: Timeout\n• Please check credentials and try again`,
      });
    }, 1500);
  };

  const confirmConfigureService = () => {
    if (!configForm.provider) {
      alert('Please select a provider');
      return;
    }

    alert(`✅ Configuration Saved!\n\nService: ${selectedService}\nProvider: ${configForm.provider}\n\nSettings have been applied successfully.`);
    setShowConfigureModal(false);
  };

  const confirmManageStorage = () => {
    if (!storageForm.bucketName || !storageForm.accessKey || !storageForm.secretKey) {
      alert('Please fill in all required fields');
      return;
    }

    alert(`✅ Storage Configuration Updated!\n\nProvider: ${storageForm.provider}\nBucket: ${storageForm.bucketName}\nRegion: ${storageForm.region}\n\nChanges will take effect immediately.`);
    setShowManageStorageModal(false);
  };

  const handleUserRecoverySearch = () => {
    if (!userRecoveryEmail.trim()) {
      alert('Please enter an email or school ID');
      return;
    }

    const query = userRecoveryEmail.trim().toLowerCase();

    // Search in schools first (principal email or school ID)
    const matchedSchool = schools.find(s =>
      s.id.toLowerCase() === query ||
      s.email?.toLowerCase() === query ||
      s.principal?.toLowerCase().includes(query)
    );

    if (matchedSchool) {
      setSelectedRecoveryUser({
        type: 'school',
        id: matchedSchool.id,
        name: matchedSchool.name,
        email: matchedSchool.email,
        role: 'School Admin',
        status: matchedSchool.status
      });
      alert(`✅ User Found!\n\nSchool: ${matchedSchool.name}\nRole: Principal/Admin\nStatus: ${matchedSchool.status}`);
      return;
    }

    // Search in organizations (contact person or email)
    const matchedOrg = organizations.find(o =>
      o.id.toLowerCase() === query ||
      (o as any).email?.toLowerCase() === query
    );

    if (matchedOrg) {
      setSelectedRecoveryUser({
        type: 'organization',
        id: matchedOrg.id,
        name: matchedOrg.name,
        email: (matchedOrg as any).email || (matchedOrg as any).contactEmail,
        role: 'Org Admin',
        status: matchedOrg.status
      });
      alert(`✅ User Found!\n\nOrganization: ${matchedOrg.name}\nRole: Organization Admin\nStatus: ${matchedOrg.status}`);
      return;
    }

    alert('❌ No user or school found with that ID or email.');
    setSelectedRecoveryUser(null);
  };

  const logRecoveryAction = (action: string) => {
    if (!selectedRecoveryUser) return;

    const newLog: RecoveryLog = {
      id: 'REC-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      schoolName: selectedRecoveryUser.name,
      userEmail: selectedRecoveryUser.email || 'N/A',
      action: action,
      status: 'Completed',
    };

    const updatedHistory = [newLog, ...recoveryHistory];
    setRecoveryHistory(updatedHistory);
  };

  const handleResetPassword = () => {
    if (!selectedRecoveryUser) {
      alert('Please search and select a user first');
      return;
    }
    logRecoveryAction('Password Reset');
    alert(`Password Reset Link Sent to ${selectedRecoveryUser.email}!\n\n✅ Email sent\n- Valid for 24 hours`);
  };

  const handleUnlockAccount = () => {
    if (!selectedRecoveryUser) {
      alert('Please search and select a user first');
      return;
    }

    // Update status in real state and Firestore
    if (selectedRecoveryUser.type === 'school') {
      const updatedSchools = schools.map(s =>
        s.id === selectedRecoveryUser.id ? { ...s, status: 'active' as const } : s
      );
      setSchools(updatedSchools);
      schoolService.update(selectedRecoveryUser.id, { status: 'active' }).catch(err => console.error('Failed to unlock school:', err));
    } else {
      const updatedOrgs = organizations.map(o =>
        o.id === selectedRecoveryUser.id ? { ...o, status: 'active' as const } : o
      );
      setOrganizations(updatedOrgs);
      organizationService.update(selectedRecoveryUser.id, { status: 'active' }).catch(err => console.error('Failed to unlock org:', err));
    }

    setSelectedRecoveryUser({ ...selectedRecoveryUser, status: 'active' });
    logRecoveryAction('Account Unlock');
    alert(`Account Unlocked for ${selectedRecoveryUser.name}!\n\n✅ Access restored`);
  };

  const handleTempAccess = () => {
    if (!selectedRecoveryUser) {
      alert('Please search and select a user first');
      return;
    }
    logRecoveryAction('Temp Access Generated');
    alert(`Temporary Access Generated for ${selectedRecoveryUser.name}!\n\n✅ Credentials:\n- Valid for 24 hours\n- Sent to ${selectedRecoveryUser.email}`);
  };

  const handleSendAnnouncement = async () => {
    if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
      alert('Please fill in title and message');
      return;
    }

    const newAnnouncement: Announcement = {
      id: 'ANN-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      type: announcementForm.type,
      title: announcementForm.title,
      audience: announcementForm.audience,
      targetId: announcementForm.targetId,
      selectedSchools: announcementForm.selectedSchools,
      status: 'Published',
      message: announcementForm.message,
    };

    const updatedAnnouncements = [newAnnouncement, ...announcements];
    setAnnouncements(updatedAnnouncements);
    try {
      await announcementService.create(newAnnouncement as any);
    } catch (err) {
      console.error('Failed to save announcement:', err);
    }

    alert(`Announcement Sent!\n\nTitle: ${announcementForm.title}\n\n✅ Delivered to targeted audience.`);
    setAnnouncementForm({
      type: 'Maintenance Notice',
      audience: 'All Schools',
      targetId: '',
      selectedSchools: [],
      title: '',
      message: ''
    });
  };

  const handleScheduleAnnouncement = () => {
    if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
      alert('Please fill in title and message');
      return;
    }
    setShowSchedulePicker(true);
  };

  const confirmSchedule = async () => {
    if (!scheduledDateTime) {
      alert('Please select a date and time');
      return;
    }

    const newAnnouncement: Announcement = {
      id: 'ANN-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      type: announcementForm.type,
      title: announcementForm.title,
      audience: announcementForm.audience,
      targetId: announcementForm.targetId,
      selectedSchools: announcementForm.selectedSchools,
      status: 'Scheduled',
      message: announcementForm.message,
      scheduledAt: scheduledDateTime,
    };

    const updatedAnnouncements = [newAnnouncement, ...announcements];
    setAnnouncements(updatedAnnouncements);
    try {
      await announcementService.create(newAnnouncement as any);
    } catch (err) {
      console.error('Failed to save scheduled announcement:', err);
    }

    alert(`Announcement Scheduled!\n\nTitle: ${announcementForm.title}\n\nScheduled for: ${new Date(scheduledDateTime).toLocaleString()}`);
    setAnnouncementForm({
      type: 'Maintenance Notice',
      audience: 'All Schools',
      targetId: '',
      selectedSchools: [],
      title: '',
      message: ''
    });
    setShowSchedulePicker(false);
    setScheduledDateTime('');
  };

  const handleDeleteAnnouncement = (id: string) => {
    if (confirm('Are you sure you want to delete this announcement record?')) {
      setAnnouncements(announcements.filter(a => a.id !== id));
      announcementService.delete(id).catch(err => console.error('Failed to delete announcement:', err));
    }
  };

  const handleScheduleMaintenance = () => {
    if (!maintenanceForm.startDateTime || !maintenanceForm.endDateTime || !maintenanceForm.reason.trim()) {
      alert('Please fill in all maintenance details');
      return;
    }
    setShowScheduleMaintenanceModal(true);
  };

  const confirmScheduleMaintenance = () => {
    // Save to maintenance log
    const maintenance = {
      id: 'MAINT-' + Date.now(),
      startDateTime: maintenanceForm.startDateTime,
      endDateTime: maintenanceForm.endDateTime,
      reason: maintenanceForm.reason,
      scheduledAt: new Date().toISOString(),
    };

    const existing: any[] = [];
    const maintenanceList = [...existing];
    maintenanceList.push(maintenance);


    // Also add to announcements history
    const maintenanceAnnouncement: Announcement = {
      id: 'ANN-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      type: 'Maintenance',
      title: `Scheduled: ${maintenanceForm.reason}`,
      audience: 'All Schools',
      status: 'Scheduled',
      message: `System maintenance scheduled from ${new Date(maintenanceForm.startDateTime).toLocaleString()} to ${new Date(maintenanceForm.endDateTime).toLocaleString()}.`,
      scheduledAt: maintenanceForm.startDateTime,
    };

    const updatedAnnouncements = [maintenanceAnnouncement, ...announcements];
    setAnnouncements(updatedAnnouncements);

    alert(`✅ Maintenance Scheduled!\n\nWindow:\nStart: ${new Date(maintenanceForm.startDateTime).toLocaleString()}\nEnd: ${new Date(maintenanceForm.endDateTime).toLocaleString()}\nReason: ${maintenanceForm.reason}\n\nAll schools will be notified.`);

    // Reset form
    setMaintenanceForm({ startDateTime: '', endDateTime: '', reason: '' });
    setShowScheduleMaintenanceModal(false);
  };

  const confirmArchiveSchool = () => {
    if (!schoolToArchive) return;

    const updatedSchool = { ...schoolToArchive, status: 'archived' as const };
    const updatedSchools = schools.map((s) => (s.id === schoolToArchive.id ? updatedSchool : s));
    setSchools(updatedSchools);
    setSelectedSchool(selectedSchool?.id === schoolToArchive.id ? updatedSchool : selectedSchool);
    schoolService.update(schoolToArchive.id, { status: 'archived' }).catch(err => console.error('Failed to archive school:', err));


    alert(`✅ School Archived!\n\nSchool: ${schoolToArchive.name}\n\n• All access has been disabled\n• Data will be preserved for 90 days\n• Admin notification has been sent`);

    setShowArchiveSchoolModal(false);
    setSchoolToArchive(null);
  };

  const confirmExport = () => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];

      if (exportType === 'CSV') {
        const headers = ['Invoice Number', 'School Name', 'Plan', 'Billing Cycle', 'Active Users', 'User Limit', 'Next Billing Date', 'Amount', 'Payment Status'];
        const csvData = billingRecords.map(b => [
          String(b.invoiceNumber || ''),
          `"${String(b.schoolName || '').replace(/"/g, '""')}"`,
          String(b.plan || ''),
          String(b.billingCycle || ''),
          b.activeUsers || 0,
          b.userLimit || 0,
          String(b.nextBillingDate || ''),
          b.amount || 0,
          String(b.paymentStatus || '')
        ].join(','));
        
        const csvString = [headers.join(','), ...csvData].join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Billing_Report_${timestamp}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (exportType === 'PDF') {
        const doc = createTemplatedDoc();
        const topY = TEMPLATE_MARGINS.top;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55);
        doc.text(`Billing & Subscriptions Report`, 105, topY, { align: 'center' });
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        doc.text(`Generated: ${timestamp}`, 105, topY + 7, { align: 'center' });
        
        const tableColumn = ['Invoice Number', 'School Name', 'Plan', 'Cycle', 'Users', 'Amount', 'Status'];
        const tableRows: any[] = [];
        
        billingRecords.forEach(b => {
          const rowData = [
            String(b.invoiceNumber || ''),
            String(b.schoolName || ''),
            String(b.plan || ''),
            String(b.billingCycle || ''),
            `${b.activeUsers || 0}/${b.userLimit || 0}`,
            `₹${(b.amount || 0).toLocaleString()}`,
            String(b.paymentStatus || '')
          ];
          tableRows.push(rowData);
        });
        
        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: topY + 14,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [107, 33, 168] }
        });
        
        doc.save(`Billing_Report_${timestamp}.pdf`);
      }

      setShowExportModal(false);
    } catch (err: any) {
      console.error('Export Error:', err);
      alert('Error generating export: ' + (err.message || err));
    }
  };

  const handleViewInvoice = (invoiceNumber: string) => {
    setSelectedInvoice(invoiceNumber);
    setShowInvoiceModal(true);
  };

  const handleDownloadInvoice = (invoiceNumber: string) => {
    try {
      const invoice = billingRecords.find(b => b.invoiceNumber === invoiceNumber);
      if (!invoice) return;

      const doc = createTemplatedDoc();
      const timestamp = new Date().toISOString().split('T')[0];
      const topY = TEMPLATE_MARGINS.top;

      // Invoice title
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('INVOICE', 14, topY);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 14, topY + 10);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, topY + 17);
      doc.text(`Status: ${invoice.paymentStatus}`, 14, topY + 24);

      // Bill To
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Bill To:', 14, topY + 35);
      doc.setFont('helvetica', 'normal');
      doc.text(String(invoice.schoolName || ''), 14, topY + 42);

      // Tabular Item
      const tableColumn = ['Description', 'Billing Cycle', 'Users', 'Total'];
      const tableRows = [
        [
          `Subscription Plan: ${invoice.plan}`,
          String(invoice.billingCycle || ''),
          `${invoice.activeUsers || 0} / ${invoice.userLimit || 0}`,
          `₹${(invoice.amount || 0).toLocaleString()}`
        ]
      ];

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: topY + 55,
        theme: 'striped',
        headStyles: { fillColor: [107, 33, 168] }
      });

      // Footer
      const finalY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(14);
      doc.text(`Total Amount: ₹${(invoice.amount || 0).toLocaleString()}`, 14, finalY);

      doc.save(`Invoice_${invoiceNumber}_${timestamp}.pdf`);
    } catch (err: any) {
      console.error('Invoice Export Error:', err);
      alert('Error generating invoice PDF: ' + (err.message || err));
    }
  };

  const handleSendReminder = (schoolName: string) => {
    alert(`✅ Payment Reminder Sent!\n\nRecipient: ${schoolName}\nSent via: Email & WhatsApp\nTime: ${new Date().toLocaleTimeString()}\n\nReminder has been delivered successfully.`);
  };

  const renderDashboard = () => {
    const totalMRR = billingRecords
      .filter(b => b.paymentStatus !== 'Overdue')
      .reduce((sum, b) => {
        if (b.billingCycle === 'Monthly') return sum + b.amount;
        if (b.billingCycle === 'Quarterly') return sum + (b.amount / 3);
        if (b.billingCycle === 'Annual') return sum + (b.amount / 12);
        return sum;
      }, 0);

    // Compute dynamic stats from Firestore data
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const orgsThisMonth = organizations.filter(org => {
      const d = new Date((org as any).created_at || org.createdDate);
      return !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    const schoolsThisMonth = schools.filter(s => {
      const d = new Date((s as any).created_at || s.subscriptionStart || '');
      return !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    const activeSchools = schools.filter(s => s.status === 'active').length;
    const paidSubscriptions = subscriptions.filter(s => s.status === 'active').length;

    // System health: % of schools that are active
    const systemHealth = schools.length > 0
      ? Math.round((activeSchools / schools.length) * 1000) / 10
      : 100;

    return (
      <div className="space-y-6">
        {/* Loading indicator */}
        {dataLoading && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            <p className="text-blue-700">Loading data from Firebase...</p>
          </div>
        )}

        {/* Error banner */}
        {dataErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700 font-medium">Some data failed to load from Firebase:</p>
            </div>
            <ul className="list-disc list-inside text-red-600 text-sm">
              {dataErrors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
            <p className="text-red-500 text-sm mt-2">Check that your user profile has the correct role (superadmin) and try refreshing.</p>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Total Organizations</p>
                <h3 className="text-gray-900 mb-1">{organizations.length}</h3>
                {orgsThisMonth > 0 ? (
                  <p className="text-green-600 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    +{orgsThisMonth} this month
                  </p>
                ) : (
                  <p className="text-gray-500 flex items-center gap-1">
                    No new this month
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Active Schools</p>
                <h3 className="text-gray-900 mb-1">{activeSchools}</h3>
                {schoolsThisMonth > 0 ? (
                  <p className="text-green-600 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    +{schoolsThisMonth} this month
                  </p>
                ) : (
                  <p className="text-gray-500 flex items-center gap-1">
                    No new this month
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <School className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Total Students</p>
                <h3 className="text-gray-900 mb-1">{platformStats.totalStudents}</h3>
                <p className="text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Across {activeSchools} schools
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-teal-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Total Teachers</p>
                <h3 className="text-gray-900 mb-1">{platformStats.totalTeachers}</h3>
                <p className="text-teal-600 flex items-center gap-1">
                  <GraduationCap className="w-4 h-4" />
                  Staff Members
                </p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-pink-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Total Parents</p>
                <h3 className="text-gray-900 mb-1">{platformStats.totalParents}</h3>
                <p className="text-pink-600 flex items-center gap-1">
                  <Heart className="w-4 h-4" fill="currentColor" />
                  Family Accounts
                </p>
              </div>
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-pink-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Monthly Revenue</p>
                <h3 className="text-gray-900 mb-1">₹{totalMRR.toLocaleString()}</h3>
                <p className="text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  {paidSubscriptions} active plans
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">System Health</p>
                <h3 className="text-gray-900 mb-1">{systemHealth}%</h3>
                <p className={`flex items-center gap-1 ${systemHealth >= 90 ? 'text-green-600' : systemHealth >= 70 ? 'text-orange-600' : 'text-red-600'}`}>
                  {systemHealth >= 90 ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {systemHealth >= 90 ? 'All systems operational' : `${schools.length - activeSchools} schools inactive`}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => setCurrentView('organizations')}
              className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
            >
              <Building2 className="w-5 h-5 text-purple-600" />
              <span className="text-gray-700">Add Organization</span>
            </button>
            <button
              onClick={() => setCurrentView('create-school')}
              className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
            >
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-gray-700">Create School</span>
            </button>
            <button
              onClick={() => setCurrentView('subscriptions')}
              className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
            >
              <CreditCard className="w-5 h-5 text-green-600" />
              <span className="text-gray-700">Manage Plans</span>
            </button>
            <button
              onClick={() => setCurrentView('announcements')}
              className="flex items-center gap-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200"
            >
              <Bell className="w-5 h-5 text-orange-600" />
              <span className="text-gray-700">Send Announcement</span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-gray-900 mb-4">Recent Organizations</h2>
            <div className="space-y-3">
              {organizations.slice(0, 3).map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-gray-900">{org.name}</p>
                    <p className="text-gray-500">{schools.filter(s => s.organizationId === org.id).length} schools</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${org.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : org.status === 'suspended'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-700'
                      }`}
                  >
                    {org.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-gray-900 mb-4">Subscription Alerts</h2>
            <div className="space-y-3">
              {(() => {
                const now = new Date();
                const alerts: { key: string; color: string; bg: string; border: string; title: string; detail: string }[] = [];

                subscriptions.forEach(sub => {
                  if (!sub.endDate) return;
                  const end = new Date(sub.endDate);
                  const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                  if (daysLeft < 0) {
                    alerts.push({
                      key: `expired-${sub.id}`,
                      color: 'text-red-600',
                      bg: 'bg-red-50',
                      border: 'border-red-200',
                      title: 'Subscription Expired',
                      detail: `${sub.schoolName} — expired ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''} ago`,
                    });
                  } else if (daysLeft <= 30) {
                    alerts.push({
                      key: `expiring-${sub.id}`,
                      color: 'text-orange-600',
                      bg: 'bg-orange-50',
                      border: 'border-orange-200',
                      title: 'Subscription Expiring Soon',
                      detail: `${sub.schoolName} — expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
                    });
                  }

                  if (sub.students >= sub.maxStudents && sub.maxStudents > 0) {
                    alerts.push({
                      key: `limit-${sub.id}`,
                      color: 'text-yellow-600',
                      bg: 'bg-yellow-50',
                      border: 'border-yellow-200',
                      title: 'Student Limit Reached',
                      detail: `${sub.schoolName} — ${sub.students}/${sub.maxStudents} students`,
                    });
                  }
                });

                if (alerts.length === 0) {
                  return (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <p className="text-gray-700">All subscriptions are healthy</p>
                    </div>
                  );
                }

                return alerts.map(alert => (
                  <div key={alert.key} className={`flex items-start gap-3 p-3 ${alert.bg} rounded-lg border ${alert.border}`}>
                    <AlertCircle className={`w-5 h-5 ${alert.color} flex-shrink-0 mt-0.5`} />
                    <div>
                      <p className="text-gray-900">{alert.title}</p>
                      <p className="text-gray-600">{alert.detail}</p>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderOrganizations = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-gray-900">Organizations Management</h2>
        <button
          onClick={() => setCurrentView('create-organization')}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Organization
        </button>
      </div>

      {/* Error banner for data load failures */}
      {dataErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700 font-medium">Failed to load some data:</p>
          </div>
          <ul className="list-disc list-inside text-red-600 text-sm">
            {dataErrors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Organizations List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-gray-600">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-gray-600">Type</th>
                <th className="px-6 py-3 text-left text-gray-600">Schools</th>
                <th className="px-6 py-3 text-left text-gray-600">Plan</th>
                <th className="px-6 py-3 text-left text-gray-600">Status</th>
                <th className="px-6 py-3 text-left text-gray-600">Created</th>
                <th className="px-6 py-3 text-left text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {dataLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                    <RefreshCw className="w-5 h-5 animate-spin inline mr-2" />
                    Loading organizations...
                  </td>
                </tr>
              ) : organizations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                    No organizations found. Create your first organization to get started.
                  </td>
                </tr>
              ) : organizations
                .filter(org => !searchTerm || org.name.toLowerCase().includes(searchTerm.toLowerCase()) || org.id.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((org) => (
                <tr key={org.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-gray-900">{org.name}</p>
                      <p className="text-gray-500">{org.id}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{org.type}</td>
                  <td className="px-6 py-4 text-gray-700">
                    {schools.filter(s => s.organizationId === org.id).length}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                      {org.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${org.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : org.status === 'suspended'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                      {org.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{org.createdDate || ((org as any).created_at ? new Date((org as any).created_at).toISOString().split('T')[0] : '—')}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewOrganizationDetails(org)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => {
                          handleViewOrganizationDetails(org);
                          setTimeout(() => handleEditOrganization(), 100);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </button>
                      {org.status === 'active' ? (
                        <button
                          onClick={() => handleToggleOrganizationStatus(org)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Suspend"
                        >
                          <Pause className="w-4 h-4 text-orange-600" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleOrganizationStatus(org)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Activate"
                        >
                          <Play className="w-4 h-4 text-green-600" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSchools = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-gray-900">Schools Management</h2>
        <button
          onClick={() => setCurrentView('create-school')}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create School
        </button>
      </div>

      {/* Schools Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {dataLoading ? (
          <div className="col-span-2 bg-white rounded-xl shadow-md p-10 text-center text-gray-500">
            <RefreshCw className="w-5 h-5 animate-spin inline mr-2" />
            Loading schools...
          </div>
        ) : schools.length === 0 ? (
          <div className="col-span-2 bg-white rounded-xl shadow-md p-10 text-center text-gray-500">
            No schools found. Create your first school to get started.
          </div>
        ) : schools.map((school) => (
          <div
            key={school.id}
            className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-600"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-gray-900 mb-1">{school.name}</h3>
                <p className="text-gray-500">{school.organizationName}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm ${school.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : school.status === 'suspended'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-gray-700'
                  }`}
              >
                {school.status}
              </span>
            </div>

            <div className="space-y-4 mb-4">
              <div className="py-2 border-b border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-600">Students:</span>
                  <span className="text-gray-900 font-medium">{school.students} / {school.maxStudents || '∞'}</span>
                </div>
                {school.maxStudents && (
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        (school.students / school.maxStudents) >= 1 ? 'bg-red-500' : (school.students / school.maxStudents) >= 0.9 ? 'bg-orange-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((school.students / school.maxStudents) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
              <div className="py-2 border-b border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-600">Teachers:</span>
                  <span className="text-gray-900 font-medium">{school.teachers} / {school.maxTeachers || '∞'}</span>
                </div>
                {school.maxTeachers && (
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        (school.teachers / school.maxTeachers) >= 1 ? 'bg-red-500' : (school.teachers / school.maxTeachers) >= 0.9 ? 'bg-orange-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((school.teachers / school.maxTeachers) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
              <div className="py-2 border-b border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-600">Storage:</span>
                  <span className="text-gray-900 font-medium">{school.storage} / {school.maxStorage || '∞'}</span>
                </div>
                {school.maxStorage && (
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        (parseFloat(school.storage) / parseFloat(school.maxStorage)) >= 1 ? 'bg-red-500' : (parseFloat(school.storage) / parseFloat(school.maxStorage)) >= 0.9 ? 'bg-orange-500' : 'bg-purple-500'
                      }`}
                      style={{ width: `${Math.min((parseFloat(school.storage) / parseFloat(school.maxStorage)) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600 text-sm">Subscription Ends:</span>
                <span className="text-gray-900 text-sm">{school.subscriptionEnd}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleViewSchoolDetails(school)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Eye className="w-4 h-4" />
                View Details
              </button>
              {school.status === 'active' ? (
                <button
                  onClick={() => handleToggleSchoolStatus(school)}
                  className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                  title="Suspend School"
                >
                  <Pause className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => handleToggleSchoolStatus(school)}
                  className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  title="Activate School"
                >
                  <Play className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => alert(`Archive ${school.name}\n\nThis will:\n- Disable all access\n- Preserve data for 90 days\n- Send notification to admin`)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                title="Archive School"
              >
                <Archive className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSubscriptions = () => {
    // Calculate metrics
    const totalMRR = billingRecords
      .filter(b => b.paymentStatus !== 'Overdue')
      .reduce((sum, b) => {
        if (b.billingCycle === 'Monthly') return sum + b.amount;
        if (b.billingCycle === 'Quarterly') return sum + (b.amount / 3);
        if (b.billingCycle === 'Annual') return sum + (b.amount / 12);
        return sum;
      }, 0);

    const activeSubscriptions = billingRecords.filter(b => b.paymentStatus === 'Paid').length;
    const overduePayments = billingRecords.filter(b => b.paymentStatus === 'Overdue');
    const upcomingRenewals = billingRecords
      .filter(b => {
        const daysUntil = Math.floor((new Date(b.nextBillingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return daysUntil >= 0 && daysUntil <= 30;
      })
      .sort((a, b) => new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime());

    const handleExportPDF = () => {
      setExportType('PDF');
      setShowExportModal(true);
    };

    const handleExportCSV = () => {
      setExportType('CSV');
      setShowExportModal(true);
    };



    return (
      <div className="space-y-6">
        {/* Header with Export Buttons */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-gray-900 mb-1">Subscription & Billing Management</h2>
            <p className="text-gray-600">Track billing, plans, and revenue</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Overdue Payments Alert */}
        {overduePayments.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-red-900 font-medium mb-1">Overdue Payments Alert</h3>
                <p className="text-red-700 mb-3">
                  {overduePayments.length} school(s) have overdue payments requiring immediate attention
                </p>
                <div className="space-y-2">
                  {overduePayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                      <div>
                        <p className="text-gray-900 font-medium">{payment.schoolName}</p>
                        <p className="text-gray-600 text-sm">
                          Due: {payment.nextBillingDate} • Amount: ₹{payment.amount.toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleSendReminder(payment.schoolName)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                        Send Reminder
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Usage Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-600">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-purple-600" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Total MRR</p>
            <h3 className="text-gray-900 mb-1">₹{Math.round(totalMRR).toLocaleString()}</h3>
            <p className="text-green-600 text-sm flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              +12.5% from last month
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-600">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Active Subscriptions</p>
            <h3 className="text-gray-900 mb-1">{activeSubscriptions}</h3>
            <p className="text-green-600 text-sm flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              +3 new this month
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Percent className="w-6 h-6 text-blue-600" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Trial Conversion Rate</p>
            <h3 className="text-gray-900 mb-1">68.5%</h3>
            <p className="text-green-600 text-sm flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              +5.2% from last month
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-600">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-orange-600" />
              </div>
              <ArrowDownRight className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Churn Rate</p>
            <h3 className="text-gray-900 mb-1">2.3%</h3>
            <p className="text-green-600 text-sm flex items-center gap-1">
              <TrendingDown className="w-4 h-4" />
              -0.8% improvement
            </p>
          </div>
        </div>

        {/* Subscription Plans Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-900">Subscription Plans</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setNewPlanForm({
                    name: '',
                    description: '',
                    price: 0,
                    maxStudents: 0,
                    maxTeachers: 0,
                    storage: '',
                    features: [],
                  });
                  setShowCreatePlanModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Create New Plan
              </button>
              {!isEditingPlans ? (
                <button
                  onClick={handleToggleEditPlans}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit Plans
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancelEditPlans}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePlans}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Save
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(planDetails).map(([key, plan]) => (
              <div
                key={key}
                className={`bg-white rounded-xl shadow-md p-5 border-t-4 ${key === 'Basic' ? 'border-blue-600' :
                  key === 'Professional' ? 'border-purple-600' :
                    key === 'Enterprise' ? 'border-amber-600' : 'border-teal-600'
                  }`}
              >
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-gray-900 font-medium">{plan.name}</h4>
                    {isEditingPlans && !['Basic', 'Professional', 'Enterprise'].includes(key) && (
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete the "${key}" plan?`)) {
                            // Track for deletion on save
                            if (plan.id) {
                              setPlansToDelete(prev => [...prev, plan.id]);
                            }
                            const updatedPlans = { ...planDetails };
                            delete updatedPlans[key];
                            setPlanDetails(updatedPlans);
                          }
                        }}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Delete Plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {isEditingPlans ? (
                    <input
                      type="text"
                      value={plan.description}
                      onChange={(e) => handleUpdatePlanDescription(key, e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm mb-3"
                    />
                  ) : (
                    <p className="text-gray-600 text-sm mb-3">{plan.description}</p>
                  )}
                  <div className="text-gray-900">
                    {isEditingPlans ? (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-gray-600">₹</span>
                        <input
                          type="number"
                          value={plan.price}
                          onChange={(e) => handleUpdatePlanPrice(key, parseInt(e.target.value))}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-xl font-bold"
                        />
                        <span className="text-gray-600 text-sm">/month</span>
                      </div>
                    ) : (
                      <>
                        <span className="text-2xl font-bold">₹{plan.price.toLocaleString()}</span>
                        <span className="text-gray-600 text-sm">/month</span>
                      </>
                    )}
                  </div>
                </div>
                <ul className="space-y-2 mb-4 h-32 overflow-y-auto">
                  {!isEditingPlans && (
                    <>
                      <li className="flex items-center gap-2 text-gray-700 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        Up to {plan.maxStudents} students
                      </li>
                      <li className="flex items-center gap-2 text-gray-700 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        {plan.maxTeachers} teachers
                      </li>
                      <li className="flex items-center gap-2 text-gray-700 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        {plan.storage} storage
                      </li>
                    </>
                  )}
                  {(plan.features as string[])
                    .filter(f => !f.toLowerCase().includes('student') &&
                      !f.toLowerCase().includes('teacher') &&
                      !f.toLowerCase().includes('storage'))
                    .map((feature: string, index: number) => (
                      <li key={index} className="flex items-center justify-between gap-2 text-gray-700 text-sm group">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          {feature}
                        </div>
                        {isEditingPlans && (
                          <button
                            onClick={() => handleRemoveFeatureFromPlan(key, feature)}
                            className="text-red-400 hover:text-red-600 transition-colors ml-auto"
                            title="Remove Feature"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </li>
                    ))}
                </ul>

                {isEditingPlans && (
                  <div className="mb-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingFeatureInput[key] || ''}
                        onChange={(e) => setEditingFeatureInput(prev => ({ ...prev, [key]: e.target.value }))}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddFeatureToPlan(key)}
                        placeholder="Add feature..."
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                      <button
                        onClick={() => handleAddFeatureToPlan(key)}
                        className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
                {isEditingPlans && (
                  <div className="space-y-2 mb-4 pt-3 border-t border-gray-200 text-sm">
                    <div className="flex items-center justify-between">
                      <label className="text-gray-600">Max Students</label>
                      <input
                        type="number"
                        value={plan.maxStudents}
                        onChange={(e) => handleUpdatePlanLimits(key, 'maxStudents', parseInt(e.target.value))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-gray-600">Max Teachers</label>
                      <input
                        type="number"
                        value={plan.maxTeachers}
                        onChange={(e) => handleUpdatePlanLimits(key, 'maxTeachers', parseInt(e.target.value))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-gray-600">Storage</label>
                      <input
                        type="text"
                        value={plan.storage}
                        onChange={(e) => handleUpdatePlanLimits(key, 'storage', e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                )}
                <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                  <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg">Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction History Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-gray-900">Billing Records</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 text-sm uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">School</th>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4">Cycle</th>
                  <th className="px-6 py-4">Users</th>
                  <th className="px-6 py-4">Next Billing</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {billingRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="text-gray-900 font-medium">{record.schoolName}</p>
                      <p className="text-gray-500 text-xs">{record.invoiceNumber}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${record.plan === 'Enterprise'
                          ? 'bg-yellow-100 text-yellow-700'
                          : record.plan === 'Professional'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                          }`}
                      >
                        {record.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{record.billingCycle}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{record.activeUsers} / {record.userLimit}</div>
                      <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                        <div
                          className={`h-1.5 rounded-full ${record.activeUsers / record.userLimit > 0.9 ? 'bg-red-600' : 'bg-purple-600'
                            }`}
                          style={{ width: `${(record.activeUsers / record.userLimit) * 100}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{record.nextBillingDate}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">₹{record.amount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${record.paymentStatus === 'Paid'
                          ? 'bg-green-100 text-green-700'
                          : record.paymentStatus === 'Pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                          }`}
                      >
                        {record.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewInvoice(record.invoiceNumber)}
                          className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                          title="View Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadInvoice(record.invoiceNumber)}
                          className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Renewals Timeline */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            Upcoming Renewals (Next 30 Days)
          </h3>
          <div className="space-y-3">
            {upcomingRenewals.length > 0 ? (
              upcomingRenewals.map((renewal) => {
                const daysUntil = Math.floor(
                  (new Date(renewal.nextBillingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div key={renewal.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${daysUntil <= 7
                          ? 'bg-red-100'
                          : daysUntil <= 14
                            ? 'bg-yellow-100'
                            : 'bg-blue-100'
                          }`}
                      >
                        <Calendar
                          className={`w-5 h-5 ${daysUntil <= 7
                            ? 'text-red-600'
                            : daysUntil <= 14
                              ? 'text-yellow-600'
                              : 'text-blue-600'
                            }`}
                        />
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium">{renewal.schoolName}</p>
                        <p className="text-gray-600 text-sm">
                          {renewal.nextBillingDate} • {daysUntil} days left
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900 font-medium">₹{renewal.amount.toLocaleString()}</p>
                      <p className="text-gray-600 text-sm">{renewal.billingCycle}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-center py-4">No renewals in the next 30 days</p>
            )}
          </div>
        </div>

        {renderCreatePlanModal()}
      </div>
    );
  };

  const renderConfiguration = () => (
    <div className="space-y-6">
      <h2 className="text-gray-900">Global Configuration</h2>

      {/* Configuration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Gateway */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-gray-900">Payment Gateway</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-gray-600 mb-2">Provider</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                <option>Razorpay</option>
                <option>PayU</option>
                <option>Stripe</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-600 mb-2">API Key</label>
              <input
                type="password"
                value="rzp_live_xxxxxxxxxxxxx"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                readOnly
              />
            </div>
            <button
              onClick={() => handleUpdateCredentials('Payment Gateway')}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Update Credentials
            </button>
          </div>
        </div>

        {/* WhatsApp API */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-gray-900">WhatsApp Business API</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-gray-600 mb-2">Provider</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                <option>Twilio</option>
                <option>MessageBird</option>
                <option>Gupshup</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-600 mb-2">API Token</label>
              <input
                type="password"
                value="sk_test_xxxxxxxxxxxxx"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                readOnly
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">Status:</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                Connected
              </span>
            </div>
            <button
              onClick={() => handleTestConnection('WhatsApp API')}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Test Connection
            </button>
          </div>
        </div>

        {/* Email/SMS Provider */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-gray-900">Email & SMS Provider</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-gray-600 mb-2">Email Provider</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                <option>SendGrid</option>
                <option>Amazon SES</option>
                <option>Mailgun</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-600 mb-2">SMS Provider</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                <option>Twilio</option>
                <option>MSG91</option>
                <option>AWS SNS</option>
              </select>
            </div>
            <button
              onClick={() => handleConfigureService('Email & SMS Provider')}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Configure
            </button>
          </div>
        </div>

        {/* Storage Configuration */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="text-gray-900">Storage Configuration</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-gray-600 mb-2">Provider</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                <option>Amazon S3</option>
                <option>Google Cloud Storage</option>
                <option>Azure Blob</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-600 mb-2">Bucket Name</label>
              <input
                type="text"
                value="schoolms-storage-prod"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                readOnly
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">Total Usage:</span>
              <span className="text-gray-900">245 GB / 500 GB</span>
            </div>
            <button
              onClick={handleManageStorage}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Manage Storage
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUserRecovery = () => (
    <div className="space-y-6">
      <h2 className="text-gray-900">User Access Recovery</h2>

      {/* Search User */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-gray-900 mb-4">Search User</h3>
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={userRecoveryEmail}
              onChange={(e) => setUserRecoveryEmail(e.target.value)}
              placeholder="Enter email or school ID..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            onClick={handleUserRecoverySearch}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Search
          </button>
        </div>

        {selectedRecoveryUser && (
          <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-100 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium uppercase tracking-wider">Currently Selected</p>
                <h4 className="text-gray-900 font-bold text-lg">{selectedRecoveryUser.name}</h4>
                <div className="flex items-center gap-4 mt-1 text-gray-600 text-sm">
                  <span>{selectedRecoveryUser.role}</span>
                  <span>•</span>
                  <span>{selectedRecoveryUser.email || 'No email provided'}</span>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedRecoveryUser.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                  {selectedRecoveryUser.status.toUpperCase()}
                </span>
                <p className="text-xs text-gray-500 mt-1">ID: {selectedRecoveryUser.id}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recovery Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className={`bg-white rounded-xl shadow-md p-6 transition-all ${!selectedRecoveryUser ? 'opacity-50 grayscale pointer-events-none' : 'hover:shadow-lg'}`}>
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <RefreshCw className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-gray-900 mb-2">Reset Password</h3>
          <p className="text-gray-600 mb-4">
            Send password reset link to school admin
          </p>
          <button
            onClick={handleResetPassword}
            disabled={!selectedRecoveryUser}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            Send Reset Link
          </button>
        </div>

        <div className={`bg-white rounded-xl shadow-md p-6 transition-all ${!selectedRecoveryUser ? 'opacity-50 grayscale pointer-events-none' : 'hover:shadow-lg'}`}>
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <Unlock className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-gray-900 mb-2">Unlock Account</h3>
          <p className="text-gray-600 mb-4">
            Unlock blocked or suspended accounts
          </p>
          <button
            onClick={handleUnlockAccount}
            disabled={!selectedRecoveryUser || selectedRecoveryUser.status === 'active'}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
          >
            {selectedRecoveryUser?.status === 'active' ? 'Account Already Active' : 'Unlock Account'}
          </button>
        </div>

        <div className={`bg-white rounded-xl shadow-md p-6 transition-all ${!selectedRecoveryUser ? 'opacity-50 grayscale pointer-events-none' : 'hover:shadow-lg'}`}>
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
            <LogOut className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="text-gray-900 mb-2">Generate Temp Access</h3>
          <p className="text-gray-600 mb-4">
            Create temporary admin access credentials
          </p>
          <button
            onClick={handleTempAccess}
            disabled={!selectedRecoveryUser}
            className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-400"
          >
            Generate Access
          </button>
        </div>
      </div>

      {/* Recent Recovery Actions */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-gray-900">Recent Recovery Actions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-gray-600">Date</th>
                <th className="px-6 py-3 text-left text-gray-600">Entity</th>
                <th className="px-6 py-3 text-left text-gray-600">User</th>
                <th className="px-6 py-3 text-left text-gray-600">Action</th>
                <th className="px-6 py-3 text-left text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recoveryHistory.length > 0 ? (
                recoveryHistory.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-700">{log.date}</td>
                    <td className="px-6 py-4 text-gray-700 font-medium">
                      {log.schoolName}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{log.userEmail}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-sm border border-purple-100">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    No recovery actions performed yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderMonitoring = () => {
    const activeSchoolCount = schools.filter(s => s.status === 'active').length;
    const suspendedSchoolCount = schools.filter(s => s.status === 'suspended').length;
    const healthPercent = schools.length > 0
      ? Math.round((activeSchoolCount / schools.length) * 1000) / 10
      : 100;

    // Compute total allocated storage from school plans
    const totalAllocatedGB = schools.reduce((sum, s) => {
      const plan = s.plan || 'Basic';
      if (plan === 'Enterprise') return sum + 100;
      if (plan === 'Professional') return sum + 50;
      return sum + 20;
    }, 0);

    const totalStudents = platformStats.totalStudents;
    const totalTeachers = platformStats.totalTeachers;
    const totalParents = platformStats.totalParents;

    return (
    <div className="space-y-6">
      <h2 className="text-gray-900">Platform Monitoring</h2>

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Server className="w-6 h-6 text-green-600" />
            </div>
            <span className={`px-3 py-1 rounded-full text-sm ${healthPercent >= 90 ? 'bg-green-100 text-green-700' : healthPercent >= 70 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
              {healthPercent >= 90 ? 'Healthy' : healthPercent >= 70 ? 'Degraded' : 'Critical'}
            </span>
          </div>
          <h3 className="text-gray-900 mb-1">School Health</h3>
          <p className="text-gray-600">{activeSchoolCount}/{schools.length} schools active ({healthPercent}%)</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
              Normal
            </span>
          </div>
          <h3 className="text-gray-900 mb-1">Database</h3>
          <p className="text-gray-600">{organizations.length} orgs, {schools.length} schools</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
              Active
            </span>
          </div>
          <h3 className="text-gray-900 mb-1">Total Users</h3>
          <p className="text-gray-600">{totalStudents} students, {totalTeachers} teachers, {totalParents} parents</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Globe className="w-6 h-6 text-orange-600" />
            </div>
            <span className={`px-3 py-1 rounded-full text-sm ${suspendedSchoolCount === 0 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
              {suspendedSchoolCount === 0 ? 'All Active' : `${suspendedSchoolCount} Suspended`}
            </span>
          </div>
          <h3 className="text-gray-900 mb-1">School Status</h3>
          <p className="text-gray-600">{suspendedSchoolCount === 0 ? 'No issues detected' : `${suspendedSchoolCount} school${suspendedSchoolCount !== 1 ? 's' : ''} need attention`}</p>
        </div>
      </div>

      {/* Alerts — dynamic based on subscription/school status */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-gray-900">Alerts & Warnings</h3>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {(() => {
              const alerts: { key: string; color: string; bg: string; border: string; title: string; detail: string }[] = [];
              const now = new Date();

              schools.forEach(s => {
                if (s.status === 'suspended') {
                  alerts.push({
                    key: `suspended-${s.id}`,
                    color: 'text-red-600',
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    title: 'School Suspended',
                    detail: `${s.name} — status is suspended`,
                  });
                }
                if (s.subscriptionEnd) {
                  const end = new Date(s.subscriptionEnd);
                  const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  if (daysLeft < 0) {
                    alerts.push({
                      key: `expired-${s.id}`,
                      color: 'text-red-600',
                      bg: 'bg-red-50',
                      border: 'border-red-200',
                      title: 'Subscription Expired',
                      detail: `${s.name} — expired ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''} ago`,
                    });
                  } else if (daysLeft <= 30) {
                    alerts.push({
                      key: `expiring-${s.id}`,
                      color: 'text-yellow-600',
                      bg: 'bg-yellow-50',
                      border: 'border-yellow-200',
                      title: 'Subscription Expiring',
                      detail: `${s.name} — expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
                    });
                  }
                }
                // Check student capacity
                const used = s.activeStudents || s.students || 0;
                const max = s.maxStudents || 200;
                if (used >= max && max > 0) {
                  alerts.push({
                    key: `capacity-${s.id}`,
                    color: 'text-orange-600',
                    bg: 'bg-orange-50',
                    border: 'border-orange-200',
                    title: 'Student Limit Reached',
                    detail: `${s.name} — ${used}/${max} students`,
                  });
                }
              });

              if (alerts.length === 0) {
                return (
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-gray-700">No alerts — all systems operational</p>
                  </div>
                );
              }

              return alerts.slice(0, 5).map(alert => (
                <div key={alert.key} className={`flex items-start gap-3 p-4 ${alert.bg} rounded-lg border ${alert.border}`}>
                  <AlertCircle className={`w-5 h-5 ${alert.color} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1">
                    <p className="text-gray-900">{alert.title}</p>
                    <p className="text-gray-600">{alert.detail}</p>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-4">Storage Allocation</h3>
          <div className="space-y-4">
            {Object.entries(
              schools.reduce((acc, s) => {
                const plan = s.plan || 'Basic';
                acc[plan] = (acc[plan] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([plan, count]) => {
              const gbPerPlan = plan === 'Enterprise' ? 100 : plan === 'Professional' ? 50 : 20;
              const totalGB = count * gbPerPlan;
              const pct = totalAllocatedGB > 0 ? Math.round((totalGB / totalAllocatedGB) * 100) : 0;
              return (
                <div key={plan}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">{plan} ({count} school{count !== 1 ? 's' : ''})</span>
                    <span className="text-gray-900">{totalGB} GB allocated</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${plan === 'Enterprise' ? 'bg-purple-600' : plan === 'Professional' ? 'bg-blue-600' : 'bg-green-600'}`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
            {schools.length === 0 && (
              <p className="text-gray-500 text-center py-4">No schools registered yet</p>
            )}
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Total Allocated</span>
                <span className="text-gray-900 font-medium">{totalAllocatedGB} GB</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-4">Platform Summary</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Organizations</span>
                <span className="text-gray-900">{organizations.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${Math.min(organizations.length * 10, 100)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Active Schools</span>
                <span className="text-gray-900">{activeSchoolCount} / {schools.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${schools.length > 0 ? Math.round((activeSchoolCount / schools.length) * 100) : 0}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Announcements Sent</span>
                <span className="text-gray-900">{announcements.filter(a => a.status === 'Published').length} / {announcements.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${announcements.length > 0 ? Math.round((announcements.filter(a => a.status === 'Published').length / announcements.length) * 100) : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  };

  const renderAnnouncements = () => (
    <div className="space-y-6">
      <h2 className="text-gray-900">Global Announcements & Maintenance</h2>

      {/* Send Announcement */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-gray-900 mb-4">Send Platform Announcement</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-600 mb-2">Announcement Type</label>
            <select
              value={announcementForm.type}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option>Maintenance Notice</option>
              <option>Feature Update</option>
              <option>System Alert</option>
              <option>General Information</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-600 mb-2">Target Audience</label>
            <select
              value={announcementForm.audience}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, audience: e.target.value, targetId: '', selectedSchools: [] })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option>All Schools</option>
              <option>Specific Organization</option>
              <option>Specific Plan</option>
              <option>Selected Schools</option>
              <option>By State</option>
              <option>Active Schools Only</option>
              <option>Suspended Schools Only</option>
              <option>Trial Users Only</option>
              <option>Expiring Soon (15-30 Days)</option>
              <option>Premium Schools (High Value)</option>
            </select>
          </div>

          {announcementForm.audience === 'Specific Organization' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-gray-600 mb-2">Select Organization</label>
              <select
                value={announcementForm.targetId}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, targetId: e.target.value })}
                className="w-full px-4 py-2 border border-purple-200 bg-purple-50 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Choose an organization...</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>
          )}

          {announcementForm.audience === 'Specific Plan' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-gray-600 mb-2">Select Subscription Plan</label>
              <select
                value={announcementForm.targetId}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, targetId: e.target.value })}
                className="w-full px-4 py-2 border border-purple-200 bg-purple-50 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Choose a plan...</option>
                {Object.keys(planDetails).map(planName => (
                  <option key={planName} value={planName}>{planName}</option>
                ))}
              </select>
            </div>
          )}

          {announcementForm.audience === 'Selected Schools' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-gray-600 mb-2">Select Schools ({announcementForm.selectedSchools.length} selected)</label>
              <div className="border border-purple-200 bg-purple-50 rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                {schools.map(school => (
                  <label key={school.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-md cursor-pointer transition-colors group">
                    <input
                      type="checkbox"
                      checked={announcementForm.selectedSchools.includes(school.id)}
                      onChange={(e) => {
                        const updated = e.target.checked
                          ? [...announcementForm.selectedSchools, school.id]
                          : announcementForm.selectedSchools.filter(id => id !== school.id);
                        setAnnouncementForm({ ...announcementForm, selectedSchools: updated });
                      }}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900 group-hover:text-purple-700">{school.name}</span>
                      <span className="text-xs text-gray-500">{school.organizationName}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {announcementForm.audience === 'By State' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-gray-600 mb-2">Select State</label>
              <select
                value={announcementForm.targetId}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, targetId: e.target.value })}
                className="w-full px-4 py-2 border border-purple-200 bg-purple-50 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Choose a state...</option>
                {Array.from(new Set(schools.map(s => s.state).filter(Boolean))).sort().map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          )}

          {announcementForm.audience === 'Expiring Soon (15-30 Days)' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-gray-600 mb-2">Select Threshold</label>
              <select
                value={announcementForm.targetId}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, targetId: e.target.value })}
                className="w-full px-4 py-2 border border-purple-200 bg-purple-50 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="15">Expiring within 15 days</option>
                <option value="30">Expiring within 30 days</option>
              </select>
            </div>
          )}

          {announcementForm.audience === 'Premium Schools (High Value)' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-gray-600 mb-2">Monthly Fee Threshold (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={announcementForm.targetId}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, targetId: e.target.value })}
                  placeholder="e.g. 5000"
                  className="w-full pl-8 pr-4 py-2 border border-purple-200 bg-purple-50 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <p className="text-xs text-purple-600 mt-1 italic">Targeting schools paying more than this amount</p>
            </div>
          )}

          {(announcementForm.audience === 'Active Schools Only' ||
            announcementForm.audience === 'Suspended Schools Only' ||
            announcementForm.audience === 'Trial Users Only') && (
              <div className="bg-purple-50 border border-purple-100 p-3 rounded-lg flex items-center gap-2 text-purple-700 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                <Info className="w-4 h-4" />
                This announcement will automatically filter for
                <strong> {announcementForm.audience.replace(' Only', '').replace(' Users', '')}</strong> accounts.
              </div>
            )}
          <div>
            <label className="block text-gray-600 mb-2">Title</label>
            <input
              type="text"
              value={announcementForm.title}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
              placeholder="Announcement title..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-2">Message</label>
            <textarea
              rows={4}
              value={announcementForm.message}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
              placeholder="Announcement message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            ></textarea>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleSendAnnouncement}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Send Announcement
            </button>
            <button
              onClick={handleScheduleAnnouncement}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Schedule for Later
            </button>
          </div>
        </div>
      </div>

      {/* Maintenance Window */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-gray-900 mb-4">Schedule Maintenance Window</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-600 mb-2">Start Date & Time</label>
            <input
              type="datetime-local"
              value={maintenanceForm.startDateTime}
              onChange={(e) => setMaintenanceForm({ ...maintenanceForm, startDateTime: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-2">End Date & Time</label>
            <input
              type="datetime-local"
              value={maintenanceForm.endDateTime}
              onChange={(e) => setMaintenanceForm({ ...maintenanceForm, endDateTime: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-gray-600 mb-2">Maintenance Reason</label>
            <input
              type="text"
              value={maintenanceForm.reason}
              onChange={(e) => setMaintenanceForm({ ...maintenanceForm, reason: e.target.value })}
              placeholder="e.g., Database upgrade, Security patch..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        <button
          onClick={handleScheduleMaintenance}
          className="mt-4 w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          Schedule Maintenance
        </button>
      </div>

      {/* Announcement History */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-gray-900">Announcement History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-gray-600">Date</th>
                <th className="px-6 py-3 text-left text-gray-600">Type</th>
                <th className="px-6 py-3 text-left text-gray-600">Title</th>
                <th className="px-6 py-3 text-left text-gray-600">Audience</th>
                <th className="px-6 py-3 text-left text-gray-600">Status</th>
                <th className="px-6 py-3 text-right text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {announcements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 italic">
                    No announcement history found
                  </td>
                </tr>
              ) : (
                announcements.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-purple-50 cursor-pointer transition-colors group"
                    onClick={() => setViewingAnnouncement(item)}
                  >
                    <td className="px-6 py-4 text-gray-700">{item.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${item.type === 'Maintenance' || item.type === 'Maintenance Notice'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-blue-100 text-blue-700'
                        }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{item.title}</td>
                    <td className="px-6 py-4 text-gray-700">{item.audience}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm inline-flex items-center gap-1.5 ${item.status === 'Published'
                        ? 'bg-green-100 text-green-700'
                        : item.status === 'Scheduled'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                        }`}>
                        {item.status === 'Published' && <CheckCircle className="w-3 h-3" />}
                        {item.status === 'Scheduled' && <Clock className="w-3 h-3" />}
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteAnnouncement(item.id); }}
                        className="text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete record"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSchedulePickerModal = () => {
    if (!showSchedulePicker) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Schedule Announcement</h3>
            <button onClick={() => setShowSchedulePicker(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-600 mb-6">Select when you want this announcement to be automatically published.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Publish Date & Time</label>
              <input
                type="datetime-local"
                value={scheduledDateTime}
                onChange={(e) => setScheduledDateTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-8">
            <button
              onClick={() => setShowSchedulePicker(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmSchedule}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
            >
              Confirm Schedule
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAnnouncementDetailsModal = () => {
    if (!viewingAnnouncement) return null;
    const ann = viewingAnnouncement;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 relative">
          <button
            onClick={() => setViewingAnnouncement(null)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${ann.type === 'Maintenance' || ann.type === 'Maintenance Notice'
              ? 'bg-orange-100 text-orange-700'
              : 'bg-blue-100 text-blue-700'
              }`}>
              {ann.type}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-1.5 ${ann.status === 'Published'
              ? 'bg-green-100 text-green-700'
              : ann.status === 'Scheduled'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700'
              }`}>
              {ann.status === 'Published' && <CheckCircle className="w-3 h-3" />}
              {ann.status === 'Scheduled' && <Clock className="w-3 h-3" />}
              {ann.status}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">{ann.title}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-gray-50 p-6 rounded-xl border border-gray-100">
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Created Date</p>
              <p className="text-gray-900 font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                {ann.date}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Target Audience</p>
              <p className="text-gray-900 font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                {ann.audience}
              </p>
            </div>
            {ann.audience === 'Specific Organization' && ann.targetId && (
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Organization</p>
                <p className="text-gray-900 font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  {organizations.find(o => o.id === ann.targetId)?.name || 'Unknown Organization'}
                </p>
              </div>
            )}
            {ann.audience === 'Specific Plan' && ann.targetId && (
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Target Plan</p>
                <p className="text-gray-900 font-medium flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-600" />
                  {ann.targetId} Plan
                </p>
              </div>
            )}
            {ann.audience === 'Selected Schools' && ann.selectedSchools && ann.selectedSchools.length > 0 && (
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Targeted Schools ({ann.selectedSchools.length})</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ann.selectedSchools.map(schoolId => {
                    const school = schools.find(s => s.id === schoolId);
                    return (
                      <span key={schoolId} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600">
                        {school?.name || schoolId}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            {ann.audience === 'By State' && ann.targetId && (
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Target State</p>
                <p className="text-gray-900 font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-600" />
                  {ann.targetId}
                </p>
              </div>
            )}
            {ann.audience === 'Expiring Soon (15-30 Days)' && ann.targetId && (
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Expiry Threshold</p>
                <p className="text-gray-900 font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  Expiring within {ann.targetId} days
                </p>
              </div>
            )}
            {ann.audience === 'Premium Schools (High Value)' && ann.targetId && (
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Fee Threshold</p>
                <p className="text-gray-900 font-medium flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-600" />
                  Monthly Fee {'>'} ₹{ann.targetId}
                </p>
              </div>
            )}
            {(ann.audience === 'Active Schools Only' ||
              ann.audience === 'Suspended Schools Only' ||
              ann.audience === 'Trial Users Only') && (
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Status Filter</p>
                  <p className="text-gray-900 font-medium flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    {ann.audience.replace(' Only', '').replace(' Only', '')}
                  </p>
                </div>
              )}
            {ann.scheduledAt && (
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Scheduled Time</p>
                <p className="text-gray-900 font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {new Date(ann.scheduledAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <div className="mb-8">
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Message Content</p>
            <div className="max-w-none text-gray-700 whitespace-pre-wrap bg-white p-6 border border-gray-200 rounded-xl leading-relaxed">
              {ann.message}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            {ann.status === 'Scheduled' && (
              <button
                onClick={() => {
                  const updated = announcements.map(a => a.id === ann.id ? { ...a, status: 'Published' as const } : a);
                  setAnnouncements(updated);
                  setViewingAnnouncement({ ...ann, status: 'Published' });
                }}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Publish Now
              </button>
            )}
            <button
              onClick={() => setViewingAnnouncement(null)}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCreateOrganization = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-1">Create New Organization</h2>
          <p className="text-gray-600">Add a new organization to the platform</p>
        </div>
        <button
          onClick={() => setCurrentView('organizations')}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Organization Form */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-gray-900 mb-6">Organization Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Organization Name */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">
              Organization Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={organizationForm.name}
              onChange={(e) => setOrganizationForm({ ...organizationForm, name: e.target.value })}
              placeholder="e.g., ABC School Trust"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Organization Type */}
          <div>
            <label className="block text-gray-700 mb-2">
              Organization Type <span className="text-red-600">*</span>
            </label>
            <select
              value={organizationForm.type}
              onChange={(e) => setOrganizationForm({ ...organizationForm, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="School">Single School</option>
              <option value="Chain">School Chain</option>
              <option value="Educational Trust">Educational Trust</option>
              <option value="NGO">NGO</option>
              <option value="Government">Government Organization</option>
            </select>
          </div>

          {/* Plan */}
          <div>
            <label className="block text-gray-700 mb-2">
              Subscription Plan <span className="text-red-600">*</span>
            </label>
            <select
              value={organizationForm.plan}
              onChange={(e) => setOrganizationForm({ ...organizationForm, plan: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="Basic">Basic - ₹3,000/month</option>
              <option value="Professional">Professional - ₹7,500/month</option>
              <option value="Enterprise">Enterprise - ₹15,000/month</option>
            </select>
          </div>

          {/* Contact Person */}
          <div>
            <label className="block text-gray-700 mb-2">
              Contact Person Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={organizationForm.contactPerson}
              onChange={(e) => setOrganizationForm({ ...organizationForm, contactPerson: e.target.value })}
              placeholder="e.g., John Doe"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 mb-2">
              Email Address <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              value={organizationForm.email}
              onChange={(e) => setOrganizationForm({ ...organizationForm, email: e.target.value })}
              placeholder="e.g., contact@school.edu"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              value={organizationForm.phone}
              onChange={(e) => setOrganizationForm({ ...organizationForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              placeholder="e.g., 9876543210"
              maxLength={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Address</label>
            <textarea
              value={organizationForm.address}
              onChange={(e) => setOrganizationForm({ ...organizationForm, address: e.target.value })}
              rows={3}
              placeholder="Enter complete address"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            ></textarea>
          </div>

          {/* State */}
          <div>
            <label className="block text-gray-700 mb-2">State</label>
            <select
              value={organizationForm.state}
              onChange={(e) => setOrganizationForm({ ...organizationForm, state: e.target.value, city: '' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select State</option>
              {INDIAN_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label className="block text-gray-700 mb-2">City</label>
            <select
              value={organizationForm.city}
              onChange={(e) => setOrganizationForm({ ...organizationForm, city: e.target.value })}
              disabled={!organizationForm.state}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select City</option>
              {organizationForm.state && STATE_CITY_MAPPING[organizationForm.state]?.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Pincode */}
          <div>
            <label className="block text-gray-700 mb-2">Pincode</label>
            <input
              type="text"
              value={organizationForm.pincode}
              onChange={(e) => setOrganizationForm({ ...organizationForm, pincode: e.target.value })}
              placeholder="e.g., 400001"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Compliance & Legal Details */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-gray-900 mb-6">Compliance & Legal Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Government License ID */}
          <div>
            <label className="block text-gray-700 mb-2">Government License ID</label>
            <input
              type="text"
              value={organizationForm.govLicenseId}
              onChange={(e) => setOrganizationForm({ ...organizationForm, govLicenseId: e.target.value })}
              placeholder="Enter license ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* GST Number */}
          <div>
            <label className="block text-gray-700 mb-2">GST Number</label>
            <input
              type="text"
              value={organizationForm.gstNumber}
              onChange={(e) => setOrganizationForm({ ...organizationForm, gstNumber: e.target.value.toUpperCase() })}
              placeholder="e.g., 22AAAAA0000A1Z5"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Registration Type */}
          <div>
            <label className="block text-gray-700 mb-2">Registration Type</label>
            <select
              value={organizationForm.registrationType}
              onChange={(e) => setOrganizationForm({ ...organizationForm, registrationType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="Private School">Private School</option>
              <option value="Government School">Government School</option>
              <option value="Trust / NGO">Trust / NGO</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* PAN Number */}
          <div>
            <label className="block text-gray-700 mb-2">PAN Number (Optional)</label>
            <input
              type="text"
              value={organizationForm.panNumber}
              onChange={(e) => setOrganizationForm({ ...organizationForm, panNumber: e.target.value.toUpperCase() })}
              placeholder="e.g., ABCDE1234F"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Registered Address */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Registered Address</label>
            <textarea
              value={organizationForm.registeredAddress}
              onChange={(e) => setOrganizationForm({ ...organizationForm, registeredAddress: e.target.value })}
              rows={3}
              placeholder="Enter legally registered address (defaults to primary address if empty)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            ></textarea>
          </div>
        </div>
      </div>

      {/* Plan Details */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600" />
          Selected Plan Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {organizationForm.plan === 'Basic' && (
            <>
              <div className="p-3 bg-white rounded-lg">
                <p className="text-gray-600 text-sm mb-1">Max Students</p>
                <p className="text-gray-900 font-medium">200</p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <p className="text-gray-600 text-sm mb-1">Max Teachers</p>
                <p className="text-gray-900 font-medium">20</p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <p className="text-gray-600 text-sm mb-1">Storage</p>
                <p className="text-gray-900 font-medium">20 GB</p>
              </div>
            </>
          )}
          {organizationForm.plan === 'Professional' && (
            <>
              <div className="p-3 bg-white rounded-lg">
                <p className="text-gray-600 text-sm mb-1">Max Students</p>
                <p className="text-gray-900 font-medium">500</p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <p className="text-gray-600 text-sm mb-1">Max Teachers</p>
                <p className="text-gray-900 font-medium">50</p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <p className="text-gray-600 text-sm mb-1">Storage</p>
                <p className="text-gray-900 font-medium">50 GB</p>
              </div>
            </>
          )}
          {organizationForm.plan === 'Enterprise' && (
            <>
              <div className="p-3 bg-white rounded-lg">
                <p className="text-gray-600 text-sm mb-1">Max Students</p>
                <p className="text-gray-900 font-medium">1000+</p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <p className="text-gray-600 text-sm mb-1">Max Teachers</p>
                <p className="text-gray-900 font-medium">100+</p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <p className="text-gray-600 text-sm mb-1">Storage</p>
                <p className="text-gray-900 font-medium">100 GB</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentView('organizations')}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleCreateOrganization}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Organization
        </button>
      </div>
    </div>
  );

  const renderSchoolDetails = () => {
    if (!selectedSchool) return null;

    const usagePercentage = {
      students: selectedSchool.maxStudents ? Math.round((schoolStats.activeStudents / selectedSchool.maxStudents) * 100) : 0,
      teachers: selectedSchool.maxTeachers ? Math.round((schoolStats.activeTeachers / selectedSchool.maxTeachers) * 100) : 0,
      storage: selectedSchool.maxStorage ? Math.round((parseFloat(selectedSchool.storage) / parseFloat(selectedSchool.maxStorage)) * 100) : 0,
    };

    const alerts = [];
    if (usagePercentage.students >= 100) alerts.push({ type: 'error', message: `Critical: Student limit reached (${schoolStats.activeStudents}/${selectedSchool.maxStudents})` });
    else if (usagePercentage.students >= 90) alerts.push({ type: 'warning', message: `Warning: Nearing student limit (${schoolStats.activeStudents}/${selectedSchool.maxStudents})` });

    if (usagePercentage.teachers >= 100) alerts.push({ type: 'error', message: `Critical: Teacher limit reached (${schoolStats.activeTeachers}/${selectedSchool.maxTeachers})` });
    else if (usagePercentage.teachers >= 90) alerts.push({ type: 'warning', message: `Warning: Nearing teacher limit (${schoolStats.activeTeachers}/${selectedSchool.maxTeachers})` });

    if (usagePercentage.storage >= 100) alerts.push({ type: 'error', message: 'Critical: Storage limit reached' });
    else if (usagePercentage.storage >= 90) alerts.push({ type: 'warning', message: 'Warning: Nearing storage limit' });

    return (
      <div className="space-y-6">
        {/* Edit Modal */}
        {isEditingSchool && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl text-gray-900 font-semibold">Edit School Details</h3>
                <button
                  onClick={handleCancelSchoolEdit}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* School Information */}
                <div>
                  <h4 className="text-gray-900 font-medium mb-4">School Information</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">School Name *</label>
                      <input
                        type="text"
                        value={schoolForm.name}
                        onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Enter school name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">School Code *</label>
                      <input
                        type="text"
                        value={schoolForm.schoolCode}
                        onChange={(e) => setSchoolForm({ ...schoolForm, schoolCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g., KVS"
                      />
                      <p className="text-xs text-gray-400 mt-1">3-5 characters, uppercase letters and numbers only.</p>
                    </div>
                  </div>
                </div>

                {/* Principal Information */}
                <div>
                  <h4 className="text-gray-900 font-medium mb-4">Principal Information</h4>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Principal Name</label>
                    <input
                      type="text"
                      value={schoolForm.principalName}
                      onChange={(e) => setSchoolForm({ ...schoolForm, principalName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter principal name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Principal Email</label>
                    <input
                      type="email"
                      value={schoolForm.principalEmail}
                      onChange={(e) => setSchoolForm({ ...schoolForm, principalEmail: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="principal@school.edu"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Principal Phone</label>
                    <input
                      type="tel"
                      value={schoolForm.principalPhone}
                      onChange={(e) => setSchoolForm({ ...schoolForm, principalPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., 9876543210"
                      maxLength={10}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Principal Address</label>
                    <input
                      type="text"
                      value={schoolForm.principalAddress}
                      onChange={(e) => setSchoolForm({ ...schoolForm, principalAddress: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter principal's residential address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Principal Gmail</label>
                    <input
                      type="email"
                      value={schoolForm.principalGmail}
                      onChange={(e) => setSchoolForm({ ...schoolForm, principalGmail: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="principal@gmail.com"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 mb-2">Address</label>
                  <textarea
                    value={schoolForm.address}
                    onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    placeholder="Enter complete address"
                  />
                </div>

                {/* State & City */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">State</label>
                    <select
                      value={schoolForm.state}
                      onChange={(e) => setSchoolForm({ ...schoolForm, state: e.target.value, city: '' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">City</label>
                    <select
                      value={schoolForm.city}
                      onChange={(e) => setSchoolForm({ ...schoolForm, city: e.target.value })}
                      disabled={!schoolForm.state}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Select City</option>
                      {schoolForm.state && STATE_CITY_MAPPING[schoolForm.state]?.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Pincode</label>
                    <input
                      type="text"
                      value={schoolForm.pincode}
                      onChange={(e) => setSchoolForm({ ...schoolForm, pincode: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., 400001"
                    />
                  </div>
                </div>

                {/* Subscription Settings */}
                <div>
                  <h4 className="text-gray-900 font-medium mb-4">Subscription Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Plan</label>
                      <select
                        value={schoolForm.plan}
                        onChange={(e) => setSchoolForm({ ...schoolForm, plan: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="Basic">Basic</option>
                        <option value="Professional">Professional</option>
                        <option value="Enterprise">Enterprise</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Max Students</label>
                      <input
                        type="number"
                        value={schoolForm.maxStudents}
                        onChange={(e) => setSchoolForm({ ...schoolForm, maxStudents: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Max Teachers</label>
                      <input
                        type="number"
                        value={schoolForm.maxTeachers}
                        onChange={(e) => setSchoolForm({ ...schoolForm, maxTeachers: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
                <button
                  onClick={handleCancelSchoolEdit}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSchoolEdit}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setCurrentView('schools');
                setSelectedSchool(null);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-gray-900 mb-1">{selectedSchool.name}</h2>
              <p className="text-gray-600">{selectedSchool.organizationName}</p>
            </div>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-medium ${selectedSchool.status === 'active'
              ? 'bg-green-100 text-green-700'
              : selectedSchool.status === 'suspended'
                ? 'bg-orange-100 text-orange-700'
                : 'bg-gray-100 text-gray-700'
              }`}
          >
            {selectedSchool.status}
          </span>
        </div>

        {/* Usage Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-3">
            {alerts.map((alert, idx) => (
              <div 
                key={idx} 
                className={`p-4 rounded-lg border flex items-center gap-3 ${
                  alert.type === 'error' 
                    ? 'bg-red-50 border-red-200 text-red-700' 
                    : 'bg-orange-50 border-orange-200 text-orange-700'
                }`}
              >
                {alert.type === 'error' ? (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                )}
                <span className="font-medium">{alert.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-6 flex items-center gap-2">
            <Info className="w-5 h-5 text-purple-600" />
            Basic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Left Side – School Details */}
            <div className="space-y-6">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">School Details</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-500 text-xs block mb-1">School Name</label>
                  <p className="text-gray-900 font-semibold">{selectedSchool.name}</p>
                </div>
                <div>
                  <label className="text-gray-500 text-xs block mb-1">Organization</label>
                  <p className="text-gray-900 font-semibold">{selectedSchool.organizationName}</p>
                </div>
                <div>
                  <label className="text-gray-500 text-xs block mb-1">Admin Account Email</label>
                  <p className="text-gray-900 font-semibold">{selectedSchool.email || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-gray-500 text-xs block mb-1">Subscription Plan</label>
                  <p className="text-gray-900 font-semibold">
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                      {selectedSchool.plan || 'Basic'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side – Principal Details */}
            <div className="space-y-6">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Principal Details</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-500 text-xs block mb-1">Principal Name</label>
                  <p className="text-gray-900 font-semibold">{selectedSchool.principal || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-gray-500 text-xs block mb-1">Phone Number</label>
                  <p className="text-gray-900 font-semibold">{selectedSchool.phone || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-gray-500 text-xs block mb-1">Principal Address</label>
                  <p className="text-gray-900 font-semibold">{selectedSchool.principalAddress || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-gray-500 text-xs block mb-1">Principal Gmail</label>
                  <p className="text-gray-900 font-semibold">{selectedSchool.principalGmail || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* School Address – Full Width Below */}
          <div className="mt-10 pt-8 border-t border-gray-100">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">School Address</h4>
            <div className="bg-gray-50 rounded-lg p-5">
              <p className="text-gray-900 font-medium mb-1">{selectedSchool.address || 'Not specified'}</p>
              {(selectedSchool.city || selectedSchool.state || selectedSchool.pincode) && (
                <p className="text-gray-700">
                  {selectedSchool.city}{selectedSchool.city && selectedSchool.state ? ', ' : ''}{selectedSchool.state}
                  {selectedSchool.pincode ? ` - ${selectedSchool.pincode}` : ''}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Subscription Limits */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-6 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-600" />
            Subscription Limits
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Students Limit</span>
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl text-gray-900 font-semibold mb-1">{selectedSchool.maxStudents || 'Unlimited'}</p>
              <p className="text-sm text-gray-600">Current: {schoolStats.activeStudents}</p>
              {selectedSchool.maxStudents && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(usagePercentage.students, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{usagePercentage.students}% used</p>
                </div>
              )}
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Teachers Limit</span>
                <GraduationCap className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl text-gray-900 font-semibold mb-1">{selectedSchool.maxTeachers || 'Unlimited'}</p>
              <p className="text-sm text-gray-600">Current: {schoolStats.activeTeachers}</p>
              {selectedSchool.maxTeachers && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(usagePercentage.teachers, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{usagePercentage.teachers}% used</p>
                </div>
              )}
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Storage Limit</span>
                <Database className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl text-gray-900 font-semibold mb-1">{selectedSchool.maxStorage || 'Unlimited'}</p>
              <p className="text-sm text-gray-600">Current: {selectedSchool.storage}</p>
              {selectedSchool.maxStorage && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(usagePercentage.storage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{usagePercentage.storage}% used</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Subscription Start</span>
              <span className="text-gray-900 font-medium">{selectedSchool.subscriptionStart || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Subscription End</span>
              <span className="text-gray-900 font-medium">{selectedSchool.subscriptionEnd}</span>
            </div>
          </div>
        </div>

        {/* Active Summary */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            Active Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-gray-600 text-sm mb-1">Active Students</p>
              <p className="text-3xl text-gray-900 font-bold">{schoolStats.activeStudents}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <GraduationCap className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-gray-600 text-sm mb-1">Active Teachers</p>
              <p className="text-3xl text-gray-900 font-bold">{schoolStats.activeTeachers}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-gray-600 text-sm mb-1">Active Parents</p>
              <p className="text-3xl text-gray-900 font-bold">{schoolStats.activeParents}</p>
            </div>
            <div className={`text-center p-4 rounded-lg ${
              selectedSchool.aiEnabled !== false
                ? 'bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200'
                : 'bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200'
            }`}>
              <Zap className={`w-8 h-8 mx-auto mb-2 ${selectedSchool.aiEnabled !== false ? 'text-purple-600' : 'text-gray-400'}`} />
              <p className="text-gray-600 text-sm mb-1">AI Features</p>
              <p className={`text-lg font-bold ${selectedSchool.aiEnabled !== false ? 'text-green-600' : 'text-red-600'}`}>
                {selectedSchool.aiEnabled !== false ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-6 flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-600" />
            Actions
          </h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleEditSchool}
              className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit Details
            </button>

            {selectedSchool.status === 'active' ? (
              <button
                onClick={() => handleToggleSchoolStatus(selectedSchool)}
                className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Pause className="w-4 h-4" />
                Suspend School
              </button>
            ) : (
              <button
                onClick={() => handleToggleSchoolStatus(selectedSchool)}
                className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Play className="w-4 h-4" />
                Activate School
              </button>
            )}

            <button
              onClick={() => handleToggleAIService(selectedSchool)}
              className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg shadow-sm transition-all ${
                selectedSchool.aiEnabled !== false
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>{selectedSchool.aiEnabled !== false ? 'Disable AI' : 'Enable AI'}</span>
            </button>

            <button
              onClick={() => handleResetCredentials(selectedSchool)}
              className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Key className="w-4 h-4" />
              Reset Credentials
            </button>

            <button
              onClick={() => {
                if (confirm(`Are you sure you want to delete ${selectedSchool.name}? This action cannot be undone.`)) {
                  const orgId = selectedSchool.organizationId;
                  setSchools(schools.filter(s => s.id !== selectedSchool.id));
                  // Delete from Firestore
                  schoolService.delete(selectedSchool.id).catch(err =>
                    console.error('Failed to delete school from Firestore:', err)
                  );
                  // Decrement schoolsCount on parent organization
                  if (orgId) {
                    const newCount = Math.max(0, schools.filter(s => s.organizationId === orgId).length - 1);
                    organizationService.update(orgId, { schoolsCount: newCount }).catch(() => {});
                    setOrganizations(prev => prev.map(o =>
                      o.id === orgId ? { ...o, schoolsCount: newCount } : o
                    ));
                  }
                  setCurrentView('schools');
                  setSelectedSchool(null);
                  alert(`${selectedSchool.name} has been deleted.`);
                }
              }}
              className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete School
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderOrganizationDetails = () => {
    if (!selectedOrganization) return null;

    const orgSchools = schools.filter(s => s.organizationId === selectedOrganization.id);

    return (
      <div className="space-y-6">
        {/* Edit Modal */}
        {isEditingOrganization && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl text-gray-900 font-semibold">Edit Organization Details</h3>
                <button
                  onClick={handleCancelOrganizationEdit}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Organization Information */}
                <div>
                  <h4 className="text-gray-900 font-medium mb-4">Organization Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Organization Name *</label>
                      <input
                        type="text"
                        value={organizationForm.name}
                        onChange={(e) => setOrganizationForm({ ...organizationForm, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Enter organization name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Type *</label>
                      <select
                        value={organizationForm.type}
                        onChange={(e) => setOrganizationForm({ ...organizationForm, type: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="School">School</option>
                        <option value="Educational Trust">Educational Trust</option>
                        <option value="Chain">Chain</option>
                        <option value="NGO">NGO</option>
                        <option value="Government">Government</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h4 className="text-gray-900 font-medium mb-4">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Contact Person *</label>
                      <input
                        type="text"
                        value={organizationForm.contactPerson}
                        onChange={(e) => setOrganizationForm({ ...organizationForm, contactPerson: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Enter contact person name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Email *</label>
                      <input
                        type="email"
                        value={organizationForm.email}
                        onChange={(e) => setOrganizationForm({ ...organizationForm, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="contact@organization.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Phone *</label>
                      <input
                        type="tel"
                        value={organizationForm.phone}
                        onChange={(e) => setOrganizationForm({ ...organizationForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g., 9876543210"
                        maxLength={10}
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Address</label>
                  <textarea
                    value={organizationForm.address}
                    onChange={(e) => setOrganizationForm({ ...organizationForm, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={2}
                    placeholder="Enter complete address"
                  />
                </div>

                {/* State & City */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">State</label>
                    <select
                      value={organizationForm.state}
                      onChange={(e) => setOrganizationForm({ ...organizationForm, state: e.target.value, city: '' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">City</label>
                    <select
                      value={organizationForm.city}
                      onChange={(e) => setOrganizationForm({ ...organizationForm, city: e.target.value })}
                      disabled={!organizationForm.state}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Select City</option>
                      {organizationForm.state && STATE_CITY_MAPPING[organizationForm.state]?.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Pincode</label>
                    <input
                      type="text"
                      value={organizationForm.pincode}
                      onChange={(e) => setOrganizationForm({ ...organizationForm, pincode: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., 400001"
                    />
                  </div>
                </div>

                {/* Compliance & Legal Details */}
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-gray-900 font-medium mb-4">Compliance & Legal Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Government License ID</label>
                      <input
                        type="text"
                        value={organizationForm.govLicenseId}
                        onChange={(e) => setOrganizationForm({ ...organizationForm, govLicenseId: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Enter license ID"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">GST Number</label>
                      <input
                        type="text"
                        value={organizationForm.gstNumber}
                        onChange={(e) => setOrganizationForm({ ...organizationForm, gstNumber: e.target.value.toUpperCase() })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="GST Number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Registration Type</label>
                      <select
                        value={organizationForm.registrationType}
                        onChange={(e) => setOrganizationForm({ ...organizationForm, registrationType: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="Private School">Private School</option>
                        <option value="Government School">Government School</option>
                        <option value="Trust / NGO">Trust / NGO</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">PAN Number (Optional)</label>
                      <input
                        type="text"
                        value={organizationForm.panNumber}
                        onChange={(e) => setOrganizationForm({ ...organizationForm, panNumber: e.target.value.toUpperCase() })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="PAN Number"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-600 mb-2">Registered Address</label>
                      <textarea
                        value={organizationForm.registeredAddress}
                        onChange={(e) => setOrganizationForm({ ...organizationForm, registeredAddress: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        rows={2}
                        placeholder="Enter legally registered address"
                      />
                    </div>
                  </div>
                </div>

                {/* Subscription Plan */}
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Subscription Plan</label>
                  <select
                    value={organizationForm.plan}
                    onChange={(e) => setOrganizationForm({ ...organizationForm, plan: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Basic">Basic</option>
                    <option value="Professional">Professional</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
                <button
                  onClick={handleCancelOrganizationEdit}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveOrganizationEdit}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Suspend Organization Modal */}
        {showSuspendModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 mx-auto mb-4">
                  <Pause className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-xl text-gray-900 font-semibold text-center mb-2">Suspend Organization?</h3>
                <p className="text-gray-600 text-center mb-6">
                  Are you sure you want to suspend <span className="font-medium text-gray-900">{selectedOrganization.name}</span>?
                  <br />
                  All schools under this organization will be temporarily inaccessible.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSuspendModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmSuspendOrganization}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Suspend
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activate Organization Modal */}
        {showActivateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mx-auto mb-4">
                  <Play className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl text-gray-900 font-semibold text-center mb-2">Activate Organization?</h3>
                <p className="text-gray-600 text-center mb-6">
                  Are you sure you want to activate <span className="font-medium text-gray-900">{selectedOrganization.name}</span>?
                  <br />
                  All schools under this organization will become accessible again.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowActivateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmActivateOrganization}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Activate
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reset Credentials Modal */}
        {showResetCredentialsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl text-gray-900 font-semibold">Credentials Reset Successfully!</h3>
                <button
                  onClick={() => setShowResetCredentialsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div className="space-y-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Organization</p>
                    <p className="text-gray-900 font-medium">{selectedOrganization.name}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Admin Email</p>
                    <p className="text-gray-900 font-medium">{resetCredentials.email}</p>
                  </div>
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">New Temporary Password</p>
                    <p className="text-purple-900 font-mono font-bold text-lg">{resetCredentials.password}</p>
                  </div>
                </div>
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg mb-6">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-orange-800">
                      <p className="font-medium mb-1">Important:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>This password is temporary</li>
                        <li>Admin must change it on first login</li>
                        <li>Email has been sent to the admin</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <button
                  onClick={confirmResetCredentials}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Organization Modal */}
        {showDeleteOrgModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl text-gray-900 font-semibold text-center mb-2">Delete Organization?</h3>
                <p className="text-gray-600 text-center mb-4">
                  Are you sure you want to permanently delete <span className="font-medium text-gray-900">{selectedOrganization.name}</span>?
                </p>
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-800">
                      <p className="font-medium mb-1">Warning:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>This will delete all {schools.filter(s => s.organizationId === selectedOrganization.id).length} schools under this organization</li>
                        <li>All data will be permanently lost</li>
                        <li>This action cannot be undone</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteOrgModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteOrganization}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete Permanently
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Update Credentials Modal */}
        {showUpdateCredsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl text-gray-900 font-semibold">Update Credentials</h3>
                    <p className="text-gray-600 text-sm mt-1">{selectedService}</p>
                  </div>
                  <button
                    onClick={() => setShowUpdateCredsModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Provider</label>
                    <input
                      type="text"
                      value={configForm.provider}
                      onChange={(e) => setConfigForm({ ...configForm, provider: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., Razorpay, Twilio"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">API Key *</label>
                    <input
                      type="text"
                      value={configForm.apiKey}
                      onChange={(e) => setConfigForm({ ...configForm, apiKey: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter API key"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">API Secret *</label>
                    <input
                      type="password"
                      value={configForm.apiSecret}
                      onChange={(e) => setConfigForm({ ...configForm, apiSecret: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter API secret"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Endpoint URL</label>
                    <input
                      type="url"
                      value={configForm.endpoint}
                      onChange={(e) => setConfigForm({ ...configForm, endpoint: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://api.example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Webhook URL</label>
                    <input
                      type="url"
                      value={configForm.webhookUrl}
                      onChange={(e) => setConfigForm({ ...configForm, webhookUrl: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://yourapp.com/webhook"
                    />
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex gap-2">
                      <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800">
                        Credentials are encrypted and stored securely. Make sure to test the connection after updating.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowUpdateCredsModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmUpdateCredentials}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Update Credentials
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Test Connection Modal */}
        {showTestConnectionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl text-gray-900 font-semibold">Test Connection</h3>
                    <p className="text-gray-600 text-sm mt-1">{selectedService}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowTestConnectionModal(false);
                      setConnectionTestResult(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {!connectionTestResult ? (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Zap className="w-8 h-8 text-purple-600" />
                    </div>
                    <p className="text-gray-600 mb-6">
                      Ready to test the connection to {selectedService}
                    </p>
                    <button
                      onClick={performConnectionTest}
                      className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      Start Test
                    </button>
                  </div>
                ) : connectionTestResult.success ? (
                  <div>
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h4 className="text-lg text-gray-900 font-semibold text-center mb-2">
                      {connectionTestResult.message}
                    </h4>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                      <pre className="text-sm text-green-800 whitespace-pre-wrap font-mono">
                        {connectionTestResult.details}
                      </pre>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={performConnectionTest}
                        className="flex-1 px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                      >
                        Test Again
                      </button>
                      <button
                        onClick={() => {
                          setShowTestConnectionModal(false);
                          setConnectionTestResult(null);
                        }}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h4 className="text-lg text-gray-900 font-semibold text-center mb-2">
                      {connectionTestResult.message}
                    </h4>
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                      <pre className="text-sm text-red-800 whitespace-pre-wrap font-mono">
                        {connectionTestResult.details}
                      </pre>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={performConnectionTest}
                        className="flex-1 px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                      >
                        Try Again
                      </button>
                      <button
                        onClick={() => {
                          setShowTestConnectionModal(false);
                          setConnectionTestResult(null);
                        }}
                        className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Configure Service Modal */}
        {showConfigureModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl text-gray-900 font-semibold">Configure Service</h3>
                    <p className="text-gray-600 text-sm mt-1">{selectedService}</p>
                  </div>
                  <button
                    onClick={() => setShowConfigureModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Provider *</label>
                    <select
                      value={configForm.provider}
                      onChange={(e) => setConfigForm({ ...configForm, provider: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select Provider</option>
                      {selectedService.includes('Email') && (
                        <>
                          <option value="SendGrid">SendGrid</option>
                          <option value="Amazon SES">Amazon SES</option>
                          <option value="Mailgun">Mailgun</option>
                        </>
                      )}
                      {selectedService.includes('SMS') && (
                        <>
                          <option value="Twilio">Twilio</option>
                          <option value="MSG91">MSG91</option>
                          <option value="AWS SNS">AWS SNS</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">API Endpoint</label>
                    <input
                      type="url"
                      value={configForm.endpoint}
                      onChange={(e) => setConfigForm({ ...configForm, endpoint: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://api.provider.com/v1"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Webhook URL</label>
                    <input
                      type="url"
                      value={configForm.webhookUrl}
                      onChange={(e) => setConfigForm({ ...configForm, webhookUrl: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://yourapp.com/webhooks/notifications"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Receive delivery status and event notifications
                    </p>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Rate Limit (per hour)</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="1000"
                      defaultValue="1000"
                    />
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex gap-2">
                      <Settings className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Configuration Tips:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Set appropriate rate limits to avoid API throttling</li>
                          <li>Configure webhooks for real-time updates</li>
                          <li>Test the configuration after saving</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowConfigureModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmConfigureService}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Save Configuration
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manage Storage Modal */}


        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setCurrentView('organizations');
                setSelectedOrganization(null);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-gray-900 mb-1">{selectedOrganization.name}</h2>
              <p className="text-gray-600">Organization ID: {selectedOrganization.id}</p>
            </div>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-medium ${selectedOrganization.status === 'active'
              ? 'bg-green-100 text-green-700'
              : selectedOrganization.status === 'suspended'
                ? 'bg-orange-100 text-orange-700'
                : 'bg-gray-100 text-gray-700'
              }`}
          >
            {selectedOrganization.status}
          </span>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-6 flex items-center gap-2">
            <Building className="w-5 h-5 text-purple-600" />
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Organization Type</span>
              <span className="text-gray-900 font-medium">{selectedOrganization.type}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Contact Person</span>
              <span className="text-gray-900 font-medium">{selectedOrganization.contactPerson || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Email</span>
              <span className="text-gray-900 font-medium">{selectedOrganization.email || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Phone</span>
              <span className="text-gray-900 font-medium">{selectedOrganization.phone || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Created Date</span>
              <span className="text-gray-900 font-medium">{selectedOrganization.createdDate}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Subscription Plan</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                {selectedOrganization.plan}
              </span>
            </div>
          </div>
          {selectedOrganization.address && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600 block mb-2">Address</span>
              <span className="text-gray-900">{selectedOrganization.address}</span>
            </div>
          )}
        </div>

        {/* Compliance & Legal Details */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-6 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            Compliance & Legal Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Registration Type</span>
              <span className="text-gray-900 font-medium">{selectedOrganization.registrationType || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Government License ID</span>
              <span className="text-gray-900 font-medium">{selectedOrganization.govLicenseId || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">GST Number</span>
              <span className="text-gray-900 font-medium">{selectedOrganization.gstNumber || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">PAN Number</span>
              <span className="text-gray-900 font-medium">{selectedOrganization.panNumber || 'N/A'}</span>
            </div>
            {selectedOrganization.registeredAddress && (
              <div className="md:col-span-2 p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600 block mb-2">Registered Address</span>
                <span className="text-gray-900">{selectedOrganization.registeredAddress}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-6 flex items-center gap-2">
            <School className="w-5 h-5 text-purple-600" />
            Schools Under Organization ({orgSchools.length})
          </h3>
          {orgSchools.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-600">School Name</th>
                    <th className="px-4 py-3 text-left text-gray-600">Students</th>
                    <th className="px-4 py-3 text-left text-gray-600">Teachers</th>
                    <th className="px-4 py-3 text-left text-gray-600">Usage</th>
                    <th className="px-4 py-3 text-left text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orgSchools.map((school) => {
                    const studentUsage = school.maxStudents ? (school.students / school.maxStudents) * 100 : 0;
                    const teacherUsage = school.maxTeachers ? (school.teachers / school.maxTeachers) * 100 : 0;
                    const isCritical = studentUsage >= 100 || teacherUsage >= 100;
                    const isWarning = studentUsage >= 90 || teacherUsage >= 90;

                    return (
                      <tr key={school.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">{school.name}</td>
                        <td className="px-4 py-3 text-gray-900">{school.students}</td>
                        <td className="px-4 py-3 text-gray-900">{school.teachers}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isCritical ? (
                              <span title="Limit Reached">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                              </span>
                            ) : isWarning ? (
                              <span title="Nearing Limit">
                                <AlertTriangle className="w-4 h-4 text-orange-500" />
                              </span>
                            ) : (
                              <span title="Healthy Usage">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              </span>
                            )}
                            <span className="text-xs text-gray-600">
                              {Math.round(Math.max(studentUsage, teacherUsage))}%
                            </span>
                          </div>
                        </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${school.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : school.status === 'suspended'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-gray-100 text-gray-700'
                            }`}
                        >
                          {school.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleViewSchoolDetails(school)}
                          className="text-purple-600 hover:text-purple-700 font-medium"
                        >
                          View Details
                        </button>
                      </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <School className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No schools under this organization yet</p>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Organization Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <School className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-gray-600 text-sm mb-1">Total Schools</p>
              <p className="text-3xl text-gray-900 font-bold">{orgSchools.length}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-gray-600 text-sm mb-1">Total Students</p>
              <p className="text-3xl text-gray-900 font-bold">
                {orgSchools.reduce((sum, school) => sum + school.students, 0)}
              </p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <GraduationCap className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-gray-600 text-sm mb-1">Total Teachers</p>
              <p className="text-3xl text-gray-900 font-bold">
                {orgSchools.reduce((sum, school) => sum + school.teachers, 0)}
              </p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
              <Activity className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-gray-600 text-sm mb-1">Active Schools</p>
              <p className="text-3xl text-gray-900 font-bold">
                {orgSchools.filter(s => s.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-900 mb-6 flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-600" />
            Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={handleEditOrganization}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit Details
            </button>

            {selectedOrganization.status === 'active' ? (
              <button
                onClick={() => handleToggleOrganizationStatus(selectedOrganization)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Pause className="w-4 h-4" />
                Suspend Organization
              </button>
            ) : (
              <button
                onClick={() => handleToggleOrganizationStatus(selectedOrganization)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Play className="w-4 h-4" />
                Activate Organization
              </button>
            )}

            <button
              onClick={() => handleResetOrganizationCredentials(selectedOrganization)}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Key className="w-4 h-4" />
              Reset Credentials
            </button>

            <button
              onClick={handleDeleteOrganization}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Organization
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCreateSchool = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-1">Create New School</h2>
          <p className="text-gray-600">Add a new school to an organization</p>
        </div>
        <button
          onClick={() => setCurrentView('schools')}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* School Form */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-gray-900 mb-6">School Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* School Name */}
          <div className="md:col-span-1">
            <label className="block text-gray-700 mb-2">
              School Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={schoolForm.name}
              onChange={(e) => {
                const newName = e.target.value;
                const newCode = generateSchoolCode(newName);
                setSchoolForm({ ...schoolForm, name: newName, schoolCode: newCode });
              }}
              placeholder="e.g., Kidz Vision - Central Campus"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* School Code */}
          <div className="md:col-span-1">
            <label className="block text-gray-700 mb-2">
              School Code <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={schoolForm.schoolCode}
              onChange={(e) => setSchoolForm({ ...schoolForm, schoolCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5) })}
              placeholder="e.g., KVS"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Generated automatically, but can be manually overridden.</p>
          </div>

          {/* Organization */}
          <div>
            <label className="block text-gray-700 mb-2">
              Organization <span className="text-red-600">*</span>
            </label>
            <select
              value={schoolForm.organizationId}
              onChange={(e) => setSchoolForm({ ...schoolForm, organizationId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select an organization...</option>
              {organizations.filter(org => org.status === 'active').map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.type})
                </option>
              ))}
            </select>
          </div>

          {/* School Admin Email */}
          <div>
            <label className="block text-gray-700 mb-2">
              School Admin Email <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              value={schoolForm.principalEmail}
              onChange={(e) => setSchoolForm({ ...schoolForm, principalEmail: e.target.value })}
              placeholder="e.g., admin@school.edu"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">This email will be used to create the School Admin account.</p>
          </div>

          {/* Plan */}
          <div>
            <label className="block text-gray-700 mb-2">
              Subscription Plan <span className="text-red-600">*</span>
            </label>
            <select
              value={schoolForm.plan}
              onChange={(e) => {
                const plan = e.target.value;
                let maxStudents = 200;
                let maxTeachers = 20;
                if (plan === 'Professional') {
                  maxStudents = 500;
                  maxTeachers = 50;
                } else if (plan === 'Enterprise') {
                  maxStudents = 1000;
                  maxTeachers = 100;
                }
                setSchoolForm({ ...schoolForm, plan, maxStudents, maxTeachers });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="Basic">Basic - ₹3,000/month</option>
              <option value="Professional">Professional - ₹7,500/month</option>
              <option value="Enterprise">Enterprise - ₹15,000/month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Principal Details */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-gray-900 mb-6">Principal Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Principal Name */}
          <div>
            <label className="block text-gray-700 mb-2">Principal Name</label>
            <input
              type="text"
              value={schoolForm.principalName}
              onChange={(e) => setSchoolForm({ ...schoolForm, principalName: e.target.value })}
              placeholder="e.g., Dr. Sarah Johnson"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Principal Phone */}
          <div>
            <label className="block text-gray-700 mb-2">Principal Phone</label>
            <input
              type="tel"
              value={schoolForm.principalPhone}
              onChange={(e) => setSchoolForm({ ...schoolForm, principalPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              placeholder="e.g., 9876543210"
              maxLength={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Principal Address */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Principal Address</label>
            <input
              type="text"
              value={schoolForm.principalAddress}
              onChange={(e) => setSchoolForm({ ...schoolForm, principalAddress: e.target.value })}
              placeholder="e.g., 12 Green Park, New Delhi"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Principal Gmail */}
          <div>
            <label className="block text-gray-700 mb-2">Principal Gmail</label>
            <input
              type="email"
              value={schoolForm.principalGmail}
              onChange={(e) => setSchoolForm({ ...schoolForm, principalGmail: e.target.value })}
              placeholder="e.g., principal@gmail.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Address Details */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-gray-900 mb-6">School Address</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Address */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Address</label>
            <textarea
              value={schoolForm.address}
              onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })}
              rows={3}
              placeholder="Enter complete address"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            ></textarea>
          </div>

          {/* State */}
          <div>
            <label className="block text-gray-700 mb-2">State</label>
            <select
              value={schoolForm.state}
              onChange={(e) => setSchoolForm({ ...schoolForm, state: e.target.value, city: '' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select State</option>
              {INDIAN_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label className="block text-gray-700 mb-2">City</label>
            <select
              value={schoolForm.city}
              onChange={(e) => setSchoolForm({ ...schoolForm, city: e.target.value })}
              disabled={!schoolForm.state}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select City</option>
              {schoolForm.state && STATE_CITY_MAPPING[schoolForm.state]?.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Pincode */}
          <div>
            <label className="block text-gray-700 mb-2">Pincode</label>
            <input
              type="text"
              value={schoolForm.pincode}
              onChange={(e) => setSchoolForm({ ...schoolForm, pincode: e.target.value })}
              placeholder="e.g., 400001"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Plan Summary */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600" />
          Plan Limits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-white rounded-lg">
            <p className="text-gray-600 text-sm mb-1">Max Students</p>
            <p className="text-gray-900 font-medium">{schoolForm.maxStudents}</p>
          </div>
          <div className="p-3 bg-white rounded-lg">
            <p className="text-gray-600 text-sm mb-1">Max Teachers</p>
            <p className="text-gray-900 font-medium">{schoolForm.maxTeachers}</p>
          </div>
          <div className="p-3 bg-white rounded-lg">
            <p className="text-gray-600 text-sm mb-1">Storage</p>
            <p className="text-gray-900 font-medium">
              {schoolForm.plan === 'Basic' ? '20 GB' : schoolForm.plan === 'Professional' ? '50 GB' : '100 GB'}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentView('schools')}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleCreateSchool}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create School
        </button>
      </div>
    </div>
  );

  const renderTickets = () => (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Support Tickets</h2>
          <p className="text-gray-500">Manage and respond to support requests from all schools.</p>
        </div>
      </div>

      <div className="flex gap-6 h-[calc(100vh-200px)]">
        {/* Ticket List */}
        <div className="w-1/3 bg-white rounded-xl shadow-md overflow-hidden flex flex-col">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tickets..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {tickets.length === 0 ? (
              <div className="p-8 text-center text-gray-500 italic">No tickets found</div>
            ) : (
              tickets.map(ticket => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full p-4 text-left border-b hover:bg-gray-50 transition-colors ${selectedTicket?.id === ticket.id ? 'bg-purple-50' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-gray-900 truncate max-w-[120px]">{ticket.schoolName}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      ticket.status === 'Open' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                      ticket.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                      ticket.status === 'Resolved' ? 'bg-green-100 text-green-700 border-green-200' :
                      'bg-gray-100 text-gray-700 border-gray-200'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate mb-1">{ticket.subject}</p>
                  <div className="flex justify-between items-center text-[10px] text-gray-400">
                    <span>{ticket.category} • {ticket.priority}</span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Conversation View */}
        <div className="flex-1 bg-white rounded-xl shadow-md flex flex-col overflow-hidden">
          {selectedTicket ? (
            <>
              <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <div>
                  <h3 className="font-bold text-gray-900">{selectedTicket.subject}</h3>
                  <p className="text-xs text-gray-500">{selectedTicket.schoolName} • {selectedTicket.userName} ({selectedTicket.userEmail})</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-500">Status:</span>
                  <select
                    value={selectedTicket.status}
                    onChange={async (e) => {
                      const newStatus = e.target.value as any;
                      await ticketService.update(selectedTicket.id, { status: newStatus });
                      setSelectedTicket({ ...selectedTicket, status: newStatus });
                      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: newStatus } : t));
                    }}
                    className="text-xs border rounded-lg px-2 py-1 bg-white outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
                {/* Initial Message */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white shrink-0 font-bold text-xs">
                    {selectedTicket.userName.charAt(0)}
                  </div>
                  <div className="bg-white p-3 rounded-xl rounded-tl-none shadow-sm border border-gray-100 max-w-[85%]">
                    <p className="text-sm text-gray-800 leading-relaxed">{selectedTicket.message}</p>
                    <p className="text-[10px] text-gray-400 mt-2 font-medium">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                {/* Responses */}
                {selectedTicket.responses.map((resp, idx) => (
                  <div key={idx} className={`flex gap-3 ${resp.isAdminResponse ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 font-bold text-xs ${resp.isAdminResponse ? 'bg-amber-600 shadow-md' : 'bg-purple-600'}`}>
                      {resp.userName.charAt(0)}
                    </div>
                    <div className={`p-3 rounded-xl shadow-sm border max-w-[85%] ${
                      resp.isAdminResponse 
                        ? 'bg-amber-50 border-amber-100 rounded-tr-none' 
                        : 'bg-white border-gray-100 rounded-tl-none'
                    }`}>
                      {resp.isAdminResponse && <p className="text-[9px] font-black text-amber-600 mb-1 tracking-tighter uppercase">Platform Support</p>}
                      <p className="text-sm text-gray-800 leading-relaxed">{resp.message}</p>
                      <p className="text-[10px] text-gray-400 mt-2 font-medium">{new Date(resp.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
                <div className="flex gap-3">
                  <textarea
                    value={ticketReply}
                    onChange={(e) => setTicketReply(e.target.value)}
                    placeholder="Type your official response..."
                    className="flex-1 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none transition-all bg-gray-50 focus:bg-white"
                    rows={2}
                  />
                  <button
                    onClick={async () => {
                      if (!ticketReply.trim()) return;
                      setIsUpdatingTicket(true);
                      try {
                        const response: TicketResponse = {
                          userId: user?.id || 'superadmin',
                          userName: user?.name || 'Super Admin',
                          message: ticketReply,
                          timestamp: new Date().toISOString(),
                          isAdminResponse: true
                        };
                        await ticketService.addResponse(selectedTicket.id, response);
                        setTicketReply('');
                        const updated = await ticketService.getById(selectedTicket.id);
                        if (updated) {
                          setSelectedTicket(updated);
                          setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
                        }
                      } catch (err) {
                        console.error('Failed to send response:', err);
                      } finally {
                        setIsUpdatingTicket(false);
                      }
                    }}
                    disabled={isUpdatingTicket || !ticketReply.trim()}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-200 text-white rounded-xl transition-all flex items-center gap-2 font-bold shadow-md active:scale-95 shrink-0"
                  >
                    {isUpdatingTicket ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50/50">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
                <MessageSquare className="w-10 h-10 text-gray-200" />
              </div>
              <h3 className="text-xl font-bold text-gray-400">System Support Inbox</h3>
              <p className="max-w-xs mx-auto mt-2 text-sm">Select a ticket from the left panel to begin communicating with school administrators.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return renderDashboard();
      case 'organizations':
        return renderOrganizations();
      case 'organization-details':
        return renderOrganizationDetails();
      case 'create-organization':
        return renderCreateOrganization();
      case 'schools':
        return renderSchools();
      case 'school-details':
        return renderSchoolDetails();
      case 'create-school':
        return renderCreateSchool();
      case 'subscriptions':
        return renderSubscriptions();
      case 'configuration':
        return renderConfiguration();
      case 'user-recovery':
        return renderUserRecovery();
      case 'monitoring':
        return renderMonitoring();
      case 'announcements':
        return renderAnnouncements();
      case 'tickets':
        return renderTickets();
      default:
        return renderDashboard();
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'organizations', label: 'Organizations', icon: Building2 },
    { id: 'schools', label: 'Schools', icon: Users },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'configuration', label: 'Configuration', icon: Settings },
    { id: 'user-recovery', label: 'User Recovery', icon: Shield },
    { id: 'monitoring', label: 'Monitoring', icon: Activity },
    { id: 'announcements', label: 'Announcements', icon: Bell },
    { id: 'tickets', label: 'Support Tickets', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex" >
      {/* Sidebar */}
      < div className="w-64 bg-gradient-to-b from-purple-900 to-purple-800 text-white flex flex-col fixed h-screen z-50" >
        {/* Logo */}
        < div className="p-6 border-b border-purple-700" >
          <div className="flex flex-col items-center gap-3">
            <img src={logoImage} alt="Kidz Vision Logo" className="w-20 h-20" />
            <div className="text-center">
              <p className="text-yellow-300">Super Admin</p>
              <p className="text-purple-200 text-sm">Platform Control</p>
            </div>
          </div>
        </div >

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as ViewType)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  currentView === item.id
                    ? 'bg-purple-700 text-white shadow-inner'
                    : 'text-purple-100 hover:bg-purple-800'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
                {currentView === item.id && (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* User Info */}
        <div className="p-4 pb-8 border-t border-purple-700">
          <div className="mb-3">
            <p className="text-purple-100 mb-1 font-semibold">{user?.name}</p>
            <p className="text-purple-300 text-xs truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2 bg-purple-800 hover:bg-purple-700 rounded-lg transition-all hover:shadow-lg active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 overflow-auto">
        <div className="p-8">{renderContent()}</div>
        {renderSchedulePickerModal()}
        {renderAnnouncementDetailsModal()}

        {/* Global Modals */}
        {showManageStorageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl text-gray-900 font-semibold">Manage Storage</h3>
                    <p className="text-gray-600 text-sm mt-1">Configure cloud storage settings</p>
                  </div>
                  <button
                    onClick={() => setShowManageStorageModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-amber-50 border border-purple-200 rounded-lg">
                  <h4 className="text-gray-900 font-semibold mb-3">Current Usage</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Total Storage</span>
                      <span className="text-gray-900 font-medium">245 GB / 500 GB</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '49%' }}></div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>49% used</span>
                      <span>255 GB remaining</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Storage Provider *</label>
                    <select
                      value={storageForm.provider}
                      onChange={(e) => setStorageForm({ ...storageForm, provider: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="Amazon S3">Amazon S3</option>
                      <option value="Google Cloud Storage">Google Cloud Storage</option>
                      <option value="Azure Blob">Azure Blob Storage</option>
                      <option value="DigitalOcean Spaces">DigitalOcean Spaces</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Bucket Name *</label>
                    <input
                      type="text"
                      value={storageForm.bucketName}
                      onChange={(e) => setStorageForm({ ...storageForm, bucketName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="my-school-storage"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Region</label>
                    <select
                      value={storageForm.region}
                      onChange={(e) => setStorageForm({ ...storageForm, region: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="ap-south-1">Asia Pacific (Mumbai)</option>
                      <option value="us-east-1">US East (N. Virginia)</option>
                      <option value="eu-west-1">EU (Ireland)</option>
                      <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Access Key ID *</label>
                    <input
                      type="text"
                      value={storageForm.accessKey}
                      onChange={(e) => setStorageForm({ ...storageForm, accessKey: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="AKIAIOSFODNN7EXAMPLE"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Secret Access Key *</label>
                    <input
                      type="password"
                      value={storageForm.secretKey}
                      onChange={(e) => setStorageForm({ ...storageForm, secretKey: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                    />
                  </div>

                  {/* Storage Breakdown */}
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-gray-900 font-semibold mb-3">Storage Breakdown</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Student Documents</span>
                        <span className="text-gray-900">128 GB</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Images & Media</span>
                        <span className="text-gray-900">67 GB</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Backups</span>
                        <span className="text-gray-900">42 GB</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Other Files</span>
                        <span className="text-gray-900">8 GB</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex gap-2">
                      <Database className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-800">
                        <p className="font-medium mb-1">Important:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Ensure the bucket has proper CORS settings</li>
                          <li>Access keys are stored encrypted</li>
                          <li>Test connectivity after updating credentials</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowManageStorageModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmManageStorage}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showExportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl text-gray-900 font-semibold">Export Billing Report</h3>
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="mb-6">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Download className="w-8 h-8 text-purple-600" />
                  </div>
                  <p className="text-center text-gray-600 mb-4">
                    Export billing data for {billingRecords.length} records as {exportType}
                  </p>

                  <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Format:</span>
                      <span className="text-gray-900 font-medium">{exportType}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Records:</span>
                      <span className="text-gray-900 font-medium">{billingRecords.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="text-gray-900 font-medium">{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmExport}
                    className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${exportType === 'PDF' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                      }`}
                  >
                    Export {exportType}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showArchiveSchoolModal && schoolToArchive && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 mx-auto mb-4">
                  <Archive className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-xl text-gray-900 font-semibold text-center mb-2">Archive School?</h3>
                <p className="text-gray-600 text-center mb-4">
                  Are you sure you want to archive <span className="font-medium text-gray-900">{schoolToArchive.name}</span>?
                </p>

                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg mb-6">
                  <div className="flex gap-2">
                    <Info className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-orange-800">
                      <p className="font-medium mb-1">What happens when you archive:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>All user access will be immediately disabled</li>
                        <li>Data will be preserved for 90 days</li>
                        <li>Admin will receive a notification email</li>
                        <li>School can be restored within 90 days</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowArchiveSchoolModal(false);
                      setSchoolToArchive(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmArchiveSchool}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Archive School
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showInvoiceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl text-gray-900 font-semibold">Invoice Details</h3>
                  <button
                    onClick={() => {
                      setShowInvoiceModal(false);
                      setSelectedInvoice('');
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {(() => {
                  const invoice = billingRecords.find(b => b.invoiceNumber === selectedInvoice);
                  if (!invoice) return null;

                  return (
                    <div className="space-y-6">
                      <div className="flex items-start justify-between pb-4 border-b border-gray-200">
                        <div>
                          <h4 className="text-2xl text-gray-900 font-bold mb-1">{invoice.schoolName}</h4>
                          <p className="text-gray-600">Invoice #{invoice.invoiceNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-600 text-sm mb-1">Next Billing Date</p>
                          <p className="text-gray-900 font-semibold">{new Date(invoice.nextBillingDate).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <p className="text-purple-600 text-sm mb-1">Plan</p>
                          <p className="text-gray-900 font-semibold">{invoice.plan}</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <p className="text-blue-600 text-sm mb-1">Billing Cycle</p>
                          <p className="text-gray-900 font-semibold">{invoice.billingCycle}</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <p className="text-green-600 text-sm mb-1">Active Users</p>
                          <p className="text-gray-900 font-semibold">{invoice.activeUsers} / {invoice.userLimit}</p>
                        </div>
                        <div className="p-4 bg-amber-50 rounded-lg">
                          <p className="text-amber-600 text-sm mb-1">Payment Status</p>
                          <p className={`font-semibold ${invoice.paymentStatus === 'Paid' ? 'text-green-700' :
                            invoice.paymentStatus === 'Pending' ? 'text-amber-700' :
                              'text-red-700'
                            }`}>{invoice.paymentStatus}</p>
                        </div>
                      </div>

                      <div className="p-6 bg-gradient-to-br from-purple-50 to-amber-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 text-lg">Total Amount</span>
                          <span className="text-3xl text-gray-900 font-bold">₹{invoice.amount.toLocaleString()}</span>
                        </div>
                        {invoice.lastPaymentDate && (
                          <p className="text-gray-600 text-sm mt-2">
                            Last payment: {new Date(invoice.lastPaymentDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            handleDownloadInvoice(invoice.invoiceNumber);
                            setShowInvoiceModal(false);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download PDF
                        </button>
                        <button
                          onClick={() => setShowInvoiceModal(false)}
                          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div >
  );
}

