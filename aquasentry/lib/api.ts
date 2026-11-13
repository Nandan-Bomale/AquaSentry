// API client for AquaSentry backend
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchAPI(endpoint: string) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  } catch (err) {
    console.error('API fetch failed:', err);
    return null;
  }
}

export const api = {
  kpis: () => fetchAPI('/api/dashboard/kpis'),
  zones: () => fetchAPI('/api/zones'),
  pipes: () => fetchAPI('/api/pipes'),
  alerts: () => fetchAPI('/api/alerts'),
  priorityList: () => fetchAPI('/api/priority-list'),
  waterBalance: () => fetchAPI('/api/water-balance'),
  impactAnalytics: () => fetchAPI('/api/impact-analytics'),
  meterHealth: () => fetchAPI('/api/meter-health'),
  flowRates: () => fetchAPI('/api/flow-rates/realtime'),
  zoneTimeseries: (zoneId: string, days = 90) => fetchAPI(`/api/zones/${zoneId}/timeseries?days=${days}`),
  zoneAnomalies: (zoneId: string) => fetchAPI(`/api/zones/${zoneId}/anomalies`),
};

export type Zone = {
  id: string; name: string; lat: number; lng: number;
  households: number; vulnerability: number; pipes_km: number;
  avg_loss_pct: number; status: string; daily_supply_L: number;
  daily_loss_L: number; open_tickets: number; last_inspection: string;
};

export type Alert = {
  id: string; zone: string; zone_id: string; type: string;
  severity: string; message: string; timestamp: string;
  loss_rate_Lpm: number | null;
};

export type PriorityItem = {
  rank: number; zone_id: string; zone_name: string; priority: string;
  total_score: number; loss_type: string; avg_loss_pct: number;
  daily_revenue_loss_INR: number; annual_revenue_loss_INR: number;
  repair_cost_estimate_INR: number; payback_days: number;
  recommended_action: string; households_affected: number;
  vulnerability_level: string; investigation_id: string;
  scores: Record<string, number>;
  pipe_age_years: number; pipe_material: string;
};
