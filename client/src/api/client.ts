// Base API URL configuration supporting Render Static Site + Web Service deployment
const envApiUrl = import.meta.env.VITE_API_URL;
let normalizedBase = envApiUrl ? String(envApiUrl).trim().replace(/\/+$/, '') : '';
if (normalizedBase && !normalizedBase.startsWith('http://') && !normalizedBase.startsWith('https://')) {
  normalizedBase = `https://${normalizedBase}`;
}

const API_BASE = normalizedBase
  ? normalizedBase.endsWith('/api/v1')
    ? normalizedBase
    : `${normalizedBase}/api/v1`
  : '/api/v1';

export class ApiError extends Error {
  code: string;
  details?: any;

  constructor(message: string, code = 'ERROR', details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('nivaran_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    const errorMsg = data?.error?.message || data?.message || `HTTP ${response.status} Request failed`;
    const errorCode = data?.error?.code || 'REQUEST_FAILED';
    throw new ApiError(errorMsg, errorCode, data?.error?.details);
  }

  return data.data !== undefined ? data.data : data;
}

export const api = {
  // Auth
  login: (credentials: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  registerFarmer: (payload: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  getCurrentUser: () => request<any>('/auth/me'),
  switchRole: (targetRole: string, centreId?: string) =>
    request<any>('/auth/switch-role', { method: 'POST', body: JSON.stringify({ targetRole, centreId }) }),

  // Centres & Crops
  getCentres: (params?: { district?: string; crop?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<any[]>(`/centres${query ? `?${query}` : ''}`);
  },
  getCentreById: (id: string) => request<any>(`/centres/${id}`),
  updateCentreStatus: (id: string, payload: any) =>
    request<any>(`/centres/${id}/status`, { method: 'PATCH', body: JSON.stringify(payload) }),
  getCrops: () => request<any[]>('/crops'),

  // Slots
  getSlots: (centreId: string, date: string) => request<any>(`/slots?centreId=${centreId}&date=${date}`),
  generateSlots: (payload: any) => request<any>('/slots/generate', { method: 'POST', body: JSON.stringify(payload) }),

  // Bookings & Tokens
  bookSlot: (payload: any) => request<any>('/bookings', { method: 'POST', body: JSON.stringify(payload) }),
  getMyBookings: () => request<any[]>('/bookings/my'),
  getTokenDetails: (tokenId: string) => request<any>(`/bookings/token/${tokenId}`),
  cancelBooking: (tokenId: string, reason?: string) =>
    request<any>(`/bookings/token/${tokenId}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  getDigitalReceipt: (tokenId: string) => request<any>(`/bookings/token/${tokenId}/receipt`),

  // Queue
  checkIn: (identifier: string) => request<any>('/queue/check-in', { method: 'POST', body: JSON.stringify({ identifier }) }),
  getLiveQueueBoard: (centreId: string) => request<any>(`/queue/board/${centreId}`),
  callNextToken: (centreId: string, counterNumber: number) =>
    request<any>('/queue/call-next', { method: 'POST', body: JSON.stringify({ centreId, counterNumber }) }),
  setCounterStatus: (centreId: string, payload: any) =>
    request<any>(`/queue/centre/${centreId}/counters`, { method: 'PATCH', body: JSON.stringify(payload) }),

  // Quality & Weighment
  getPendingQualityTests: (centreId?: string) =>
    request<any>(`/quality/pending${centreId ? `?centreId=${centreId}` : ''}`),
  recordQualityAssay: (payload: any) => request<any>('/quality/assay', { method: 'POST', body: JSON.stringify(payload) }),
  requestRetest: (tokenId: string, reason: string) =>
    request<any>(`/quality/retest/${tokenId}`, { method: 'POST', body: JSON.stringify({ reason }) }),
  getAwaitingWeighment: (centreId?: string) =>
    request<any>(`/weighment/awaiting${centreId ? `?centreId=${centreId}` : ''}`),
  recordWeighment: (payload: any) => request<any>('/weighment', { method: 'POST', body: JSON.stringify(payload) }),

  // Quantity Adjustments
  getPendingAdjustments: (centreId?: string) =>
    request<any[]>(`/adjustments/pending${centreId ? `?centreId=${centreId}` : ''}`),
  decideAdjustment: (id: string, decision: { approved: boolean; reason: string }) =>
    request<any>(`/adjustments/${id}/decision`, { method: 'POST', body: JSON.stringify(decision) }),

  // Procurements & Payments
  getProcurements: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/procurements${query ? `?${query}` : ''}`);
  },
  getPayments: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/payments${query ? `?${query}` : ''}`);
  },
  updatePaymentStatus: (paymentId: string, payload: any) =>
    request<any>(`/payments/${paymentId}/status`, { method: 'PATCH', body: JSON.stringify(payload) }),
  getFinanceSummary: () => request<any>('/payments/summary'),

  // Delays & Token Protection
  recordDelay: (payload: any) => request<any>('/delays', { method: 'POST', body: JSON.stringify(payload) }),
  getCentreDelays: (centreId?: string) => request<any[]>(`/delays${centreId ? `?centreId=${centreId}` : ''}`),

  // Notifications
  getNotifications: () => request<any[]>('/notifications'),
  markNotificationRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request<any>('/notifications/read-all', { method: 'POST' }),

  // Cultivation Costs & Audit
  getCultivationCosts: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return request<any[]>(`/cultivation-costs${query ? `?${query}` : ''}`);
  },
  getAuditLogs: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return request<any>(`/audit${query ? `?${query}` : ''}`);
  },

  // Dashboards
  getFarmerDashboard: () => request<any>('/dashboards/farmer'),
  getAdminDashboard: (centreId?: string) =>
    request<any>(`/dashboards/admin${centreId ? `?centreId=${centreId}` : ''}`),
};
