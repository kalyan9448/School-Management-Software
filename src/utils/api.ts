// DEPRECATED — This file is no longer used. All data operations use Firestore
// via src/utils/firestoreService.ts and src/utils/centralDataService.ts.

async function apiCall(_endpoint: string, _options: {} = {}): Promise<never> {
  throw new Error('API calls are disabled. Use Firestore services instead.');
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
  check: async () => false,
};
