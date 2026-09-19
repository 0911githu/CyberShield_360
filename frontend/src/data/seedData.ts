export type AssetRecord = {
  id: string
  name: string
  ip: string
  type: 'Server' | 'Endpoint' | 'Network' | 'Cloud'
  risk: 'Critical' | 'High' | 'Medium' | 'Low'
  owner: string
  status: 'Online' | 'Monitoring' | 'Pending patch'
  region: string
}

export const assetInventory: AssetRecord[] = [
  { id: 'AS-1001', name: 'SERVER-01', ip: '10.10.0.11', type: 'Server', risk: 'Critical', owner: 'Infrastructure', status: 'Pending patch', region: 'Nairobi DC' },
  { id: 'AS-1002', name: 'WORKSTATION-07', ip: '10.10.0.12', type: 'Endpoint', risk: 'Medium', owner: 'Operations', status: 'Online', region: 'Mombasa' },
  { id: 'AS-1003', name: 'GATEWAY-01', ip: '10.10.0.9', type: 'Network', risk: 'High', owner: 'Security', status: 'Monitoring', region: 'Nairobi DC' },
  { id: 'AS-1004', name: 'MAIL-EDGE', ip: '10.10.2.18', type: 'Cloud', risk: 'High', owner: 'IT Admin', status: 'Online', region: 'Kenya West' },
  { id: 'AS-1005', name: 'DB-CORE', ip: '10.10.1.21', type: 'Server', risk: 'Critical', owner: 'Data Ops', status: 'Pending patch', region: 'Nairobi DC' },
  { id: 'AS-1006', name: 'HR-LAPTOP-12', ip: '10.10.5.44', type: 'Endpoint', risk: 'Low', owner: 'HR', status: 'Online', region: 'Kisumu' },
  { id: 'AS-1007', name: 'VPNSERVER', ip: '10.10.0.25', type: 'Network', risk: 'Medium', owner: 'Network', status: 'Monitoring', region: 'Nairobi DC' },
  { id: 'AS-1008', name: 'CRM-WEB', ip: '10.10.3.34', type: 'Cloud', risk: 'High', owner: 'Sales Ops', status: 'Online', region: 'Nairobi DC' },
]

export const securityMetrics = [
  { label: 'Security score', value: '74 / 100', change: '+4.1%', tone: 'cyan' },
  { label: 'Monitored assets', value: '37', change: '+3', tone: 'blue' },
  { label: 'Critical vulnerabilities', value: '2', change: '-1', tone: 'red' },
  { label: 'Open alerts', value: '8', change: '+2', tone: 'amber' },
]

export const riskData = [
  { name: 'Critical', value: 2 },
  { name: 'High', value: 5 },
  { name: 'Medium', value: 8 },
  { name: 'Low', value: 12 },
]

export const trendData = [
  { day: 'Mon', score: 64 },
  { day: 'Tue', score: 68 },
  { day: 'Wed', score: 70 },
  { day: 'Thu', score: 72 },
  { day: 'Fri', score: 74 },
  { day: 'Sat', score: 77 },
  { day: 'Sun', score: 76 },
]

export const recentEvents = [
  { time: '09:31', type: 'LOGIN_FAILURE', severity: 'High', message: 'Repeated auth failures from 10.10.0.12' },
  { time: '09:45', type: 'ASSET_DISCOVERED', severity: 'Low', message: 'New workstation joined the internal lab subnet' },
  { time: '10:02', type: 'VULNERABILITY_DETECTED', severity: 'Critical', message: 'Critical server exposure identified on SERVER-01' },
  { time: '10:19', type: 'RISK_ESCALATION', severity: 'High', message: 'DB-CORE backups failed integrity verification' },
  { time: '10:42', type: 'MFA_REVIEW', severity: 'Medium', message: 'Privileged users overdue for MFA enforcement' },
]

export const recommendations = [
  'Patch critical vulnerability on SERVER-01',
  'Enforce MFA on all privileged identities',
  'Validate backup integrity before end-of-day close',
  'Review segmentation for CRM-WEB and MAIL-EDGE',
  'Reconcile privileged access to DB-CORE',
]

export const executiveHighlights = [
  { label: 'Users & roles', value: '18', description: 'Accounts monitored, with MFA-ready architecture.', tone: 'cyan' },
  { label: 'Incidents', value: '1 active', description: 'Security investigation underway with documented timeline.', tone: 'amber' },
  { label: 'Audit', value: '127', description: 'Protected audit entries recorded and append-oriented.', tone: 'emerald' },
  { label: 'Recovery tests', value: '4/5', description: 'Backup restoration coverage trending upward.', tone: 'violet' },
]

export const scanHistory = [
  { id: 'SCAN-427', target: '10.10.0.0/24', status: 'Completed', findings: 6, owner: 'SOC Team' },
  { id: 'SCAN-428', target: '10.10.1.0/24', status: 'Completed', findings: 4, owner: 'Infra Ops' },
  { id: 'SCAN-429', target: 'Remote access', status: 'In progress', findings: 2, owner: 'Security' },
]

export const reports = [
  { title: 'Executive Summary', date: '2026-09-19', audience: 'Board', status: 'Ready' },
  { title: 'Patch Compliance', date: '2026-09-18', audience: 'IT Ops', status: 'Reviewed' },
  { title: 'Threat Landscape', date: '2026-09-17', audience: 'Security', status: 'Draft' },
]

export const aiAnalysis = {
  question: 'What should we fix first?',
  answer:
    'Based on internal records, the first priority is the critical exposure on SERVER-01. This is supported by active vulnerability records, a current incident under investigation, and a recent alert pattern.',
  confidence: 'medium',
  facts: [
    '2 critical vulnerabilities are currently open',
    '1 active incident is under investigation',
    'security score is 74/100',
    'backup integrity checks failed for DB-CORE',
  ],
}
