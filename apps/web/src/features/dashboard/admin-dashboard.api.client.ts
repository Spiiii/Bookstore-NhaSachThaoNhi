'use client';

import { getBrowserClient } from '@/lib/http/browser-client';
import { dashboardSchema } from './admin-dashboard.schema';

export async function getAdminDashboard() {
  return dashboardSchema.parse((await getBrowserClient().get('/admin/dashboard')).data);
}
