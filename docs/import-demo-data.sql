-- CYBERSHIELD 360 demo data import
-- Run this in the Supabase SQL Editor.
-- This script inserts demo rows into the public tables used by the app.

TRUNCATE public.security_events, public.vulnerabilities, public.alerts, public.incidents, public.networks, public.assets RESTART IDENTITY;

INSERT INTO public.networks (org_id, name, cidr, authorised)
VALUES
  ('org-demo-kenya', 'Head Office LAN', '10.10.0.0/24', true),
  ('org-demo-kenya', 'Guest Wi-Fi', '10.10.10.0/24', false),
  ('org-demo-kenya', 'Server VLAN', '10.10.20.0/24', true),
  ('org-demo-kenya', 'Finance Segment', '10.10.30.0/24', true);

INSERT INTO public.assets (
  org_id, name, type, environment, owner, ip_address, hostname,
  criticality, status, monitoring_enabled, scan_interval_minutes, tags, last_seen_at
)
VALUES
  ('org-demo-kenya', 'DB-SERVER-01', 'server', 'production', 'Infrastructure', '10.10.0.11', 'db-server-01.local', 'critical', 'monitored', true, 60, ARRAY['linux','critical','db'], '2026-09-19T08:00:00Z'),
  ('org-demo-kenya', 'APP-SERVER-02', 'server', 'production', 'Engineering', '10.10.0.12', 'app-server-02.local', 'high', 'monitored', true, 60, ARRAY['linux','web','api'], '2026-09-19T08:05:00Z'),
  ('org-demo-kenya', 'FILE-SHARE-03', 'server', 'production', 'IT Operations', '10.10.0.21', 'file-share-03.local', 'high', 'monitored', true, 60, ARRAY['windows','storage','critical'], '2026-09-19T08:10:00Z'),
  ('org-demo-kenya', 'WORKSTATION-07', 'endpoint', 'production', 'Operations', '10.10.0.42', 'workstation-07.local', 'medium', 'monitored', true, 60, ARRAY['windows','endpoint'], '2026-09-19T08:15:00Z'),
  ('org-demo-kenya', 'FINANCE-PC-11', 'endpoint', 'production', 'Finance', '10.10.0.44', 'finance-pc-11.local', 'medium', 'monitored', true, 60, ARRAY['windows','finance'], '2026-09-19T08:20:00Z'),
  ('org-demo-kenya', 'CRM-APP-10', 'application', 'production', 'Sales', '10.10.0.60', 'crm-app-10.local', 'high', 'monitored', true, 60, ARRAY['web','crm','app'], '2026-09-19T08:25:00Z'),
  ('org-demo-kenya', 'FIREWALL-01', 'firewall', 'production', 'Security', '10.10.0.1', 'fw-01.local', 'critical', 'monitored', true, 60, ARRAY['network','edge','critical'], '2026-09-19T08:30:00Z'),
  ('org-demo-kenya', 'PRINTER-09', 'device', 'production', 'Facilities', '10.10.0.18', 'printer-09.local', 'low', 'monitored', true, 60, ARRAY['printer','network'], '2026-09-19T08:35:00Z'),
  ('org-demo-kenya', 'EMAIL-SERVER-04', 'server', 'production', 'Infrastructure', '10.10.0.31', 'email-server-04.local', 'high', 'monitored', true, 60, ARRAY['linux','email','mta'], '2026-09-19T08:40:00Z'),
  ('org-demo-kenya', 'HR-LAPTOP-06', 'endpoint', 'production', 'People Ops', '10.10.0.55', 'hr-laptop-06.local', 'medium', 'monitored', true, 60, ARRAY['windows','endpoint','user-device'], '2026-09-19T08:45:00Z'),
  ('org-demo-kenya', 'POS-TERMINAL-14', 'device', 'production', 'Operations', '10.10.0.70', 'pos-terminal-14.local', 'medium', 'monitored', true, 60, ARRAY['retail','pos','device'], '2026-09-19T08:50:00Z'),
  ('org-demo-kenya', 'VPN-GATEWAY-05', 'server', 'production', 'Security', '10.10.0.25', 'vpn-gateway-05.local', 'critical', 'monitored', true, 60, ARRAY['vpn','edge','critical'], '2026-09-19T08:55:00Z');

INSERT INTO public.vulnerabilities (org_id, asset_id, title, severity, score, cve, description, status)
VALUES
  ('org-demo-kenya', NULL, 'OpenSSH Config Weakness', 'high', 7.8, 'CVE-2024-12345', 'SSH service is exposed without restricted admin access controls.', 'open'),
  ('org-demo-kenya', NULL, 'SMTP Relay Misconfiguration', 'medium', 5.4, 'CVE-2024-22316', 'Mail relay allows unauthorised outbound traffic on port 25.', 'open'),
  ('org-demo-kenya', NULL, 'Unpatched Windows SMB Exposure', 'high', 8.2, 'CVE-2024-26422', 'SMB port 445 is reachable and should be restricted to trusted subnets.', 'open'),
  ('org-demo-kenya', NULL, 'HTTP Portal Without WAF', 'medium', 6.1, 'CVE-2024-31980', 'Public web portal is reachable without additional filtering or authentication hardening.', 'open'),
  ('org-demo-kenya', NULL, 'Telnet Service Enabled', 'high', 9.1, 'CVE-2023-88000', 'Telnet is enabled and transmits credentials in plain text.', 'open');

INSERT INTO public.alerts (org_id, asset_id, title, severity, status)
VALUES
  ('org-demo-kenya', NULL, 'Failed login burst detected', 'high', 'new'),
  ('org-demo-kenya', NULL, 'Unexpected network scan from guest subnet', 'medium', 'open'),
  ('org-demo-kenya', NULL, 'Malware beaconing classification', 'critical', 'new'),
  ('org-demo-kenya', NULL, 'Policy violation: guest-to-trusted segment traffic', 'medium', 'open');

INSERT INTO public.incidents (org_id, asset_id, title, severity, status)
VALUES
  ('org-demo-kenya', NULL, 'Critical VPN gateway investigation', 'critical', 'investigating'),
  ('org-demo-kenya', NULL, 'Ransomware precursor activity on finance devices', 'high', 'monitoring'),
  ('org-demo-kenya', NULL, 'Unauthorized SMB access attempt blocked', 'medium', 'resolved');

INSERT INTO public.security_events (org_id, asset_id, event_type, severity, source, message)
VALUES
  ('org-demo-kenya', NULL, 'failed_login', 'high', 'endpoint', 'Multiple failed login attempts detected on an admin workstation.'),
  ('org-demo-kenya', NULL, 'port_scan', 'medium', 'network', 'A temporary port scan targeted the finance subnet from an untrusted source.'),
  ('org-demo-kenya', NULL, 'malware_alert', 'critical', 'security', 'Suspicious outbound traffic matched a known malware beacon signature.'),
  ('org-demo-kenya', NULL, 'vulnerability_detected', 'high', 'scanner', 'Critical service exposure identified on the VPN gateway.'),
  ('org-demo-kenya', NULL, 'policy_violation', 'medium', 'compliance', 'Guest Wi-Fi traffic was observed crossing into the trusted office VLAN.');

-- Optional: show counts for verification
SELECT 'networks' AS table_name, COUNT(*) AS row_count FROM public.networks
UNION ALL
SELECT 'assets', COUNT(*) FROM public.assets
UNION ALL
SELECT 'vulnerabilities', COUNT(*) FROM public.vulnerabilities
UNION ALL
SELECT 'alerts', COUNT(*) FROM public.alerts
UNION ALL
SELECT 'incidents', COUNT(*) FROM public.incidents
UNION ALL
SELECT 'security_events', COUNT(*) FROM public.security_events;
