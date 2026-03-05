// PURE DEMO MODE - No network calls, all API functions return demo data errors
// This ensures the application works entirely offline with pre-populated demo data

const USE_DEMO_MODE = true;

interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

async function apiCall(endpoint: string, options: ApiOptions = {}) {
  // Always throw error in demo mode to trigger fallback demo data
  if (USE_DEMO_MODE) {
    throw new Error('Demo mode enabled - using local data');
  }

  // This code will never execute in demo mode
  throw new Error('API calls are disabled in demo mode');
}

// ==================== STUDENT API ====================
export const studentAPI = {
  getAll: () => apiCall('/students'),
  getById: (id: string) => apiCall(`/students/${id}`),
  create: (data: any) => apiCall('/students', { method: 'POST', body: data }),
  update: (id: string, data: any) => apiCall(`/students/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) => apiCall(`/students/${id}`, { method: 'DELETE' }),
};

// ==================== ADMISSION API ====================
export const admissionAPI = {
  getAll: () => apiCall('/admissions'),
  create: (data: any) => apiCall('/admissions', { method: 'POST', body: data }),
  update: (id: string, data: any) => apiCall(`/admissions/${id}`, { method: 'PUT', body: data }),
};

// ==================== ENQUIRY API ====================
export const enquiryAPI = {
  getAll: () => apiCall('/enquiries'),
  create: (data: any) => apiCall('/enquiries', { method: 'POST', body: data }),
  update: (id: string, data: any) => apiCall(`/enquiries/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) => apiCall(`/enquiries/${id}`, { method: 'DELETE' }),
};

// ==================== FEE API ====================
export const feeAPI = {
  getStructures: () => apiCall('/fees/structures'),
  saveStructure: (data: any) => apiCall('/fees/structures', { method: 'POST', body: data }),
  getPayments: () => apiCall('/fees/payments'),
  createPayment: (data: any) => apiCall('/fees/payments', { method: 'POST', body: data }),
};

// ==================== ATTENDANCE API ====================
export const attendanceAPI = {
  getByDate: (date: string) => apiCall(`/attendance/${date}`),
  mark: (data: any) => apiCall('/attendance', { method: 'POST', body: data }),
};

// ==================== ANNOUNCEMENT API ====================
export const announcementAPI = {
  getAll: () => apiCall('/announcements'),
  create: (data: any) => apiCall('/announcements', { method: 'POST', body: data }),
  update: (id: string, data: any) => apiCall(`/announcements/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) => apiCall(`/announcements/${id}`, { method: 'DELETE' }),
};

// ==================== REPORTS API ====================
export const reportsAPI = {
  getDashboardStats: () => apiCall('/reports/dashboard'),
  getFeeCollection: () => apiCall('/reports/fee-collection'),
  getAttendance: () => apiCall('/reports/attendance'),
};

// ==================== AUTH API ====================
export const authAPI = {
  signup: (data: any) => apiCall('/auth/signup', { method: 'POST', body: data }),
};

// ==================== INIT API ====================
export const initAPI = {
  demoData: () => apiCall('/init-demo-data', { method: 'POST' }),
};

// ==================== HEALTH CHECK ====================
export const healthAPI = {
  check: async () => {
    // Always return false in demo mode (no backend available)
    if (USE_DEMO_MODE) {
      return false;
    }
    return false;
  },
};
