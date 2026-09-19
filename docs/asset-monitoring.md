# Asset Monitoring Configuration Guide

## Overview

CyberShield 360 monitors each registered asset through a standard configuration model that describes what the asset is, how it is connected to the organisation, and which security checks should be applied. This configuration is used by the dashboard to display status, trigger alerts, and determine whether the asset should be included in scans, reports, and risk calculations.

## Asset lifecycle

An asset moves through the following stages:

1. Register the asset under an organisation.
2. Assign a criticality and ownership profile.
3. Define the network and endpoint metadata.
4. Configure monitoring rules and scan frequency.
5. Review health status in the dashboard.
6. Trigger remediation or response when risk thresholds are crossed.

## Required configuration fields

Every monitored asset should include the following details:

- asset_id: unique identifier for the asset
- name: human-readable device or service name
- type: workstation, server, firewall, database, cloud workload, endpoint, or network device
- environment: production, staging, test, or development
- owner: department or user responsible for the asset
- org_id: tenant or organisation identifier
- ip_address: primary IP or CIDR-based address
- hostname: network hostname or FQDN
- criticality: low, medium, high, or critical
- status: online, offline, vulnerable, quarantined, or monitored
- tags: labels for ownership, business function, region, and service dependency
- discovery_source: manual, agent, API, or passive scanning
- monitoring_enabled: boolean flag indicating whether the asset is actively monitored
- scan_interval_minutes: time between scheduled checks
- alert_thresholds: risk or vulnerability threshold policy
- last_seen_at: most recent observed timestamp

## Monitoring settings model

A typical asset configuration in the product looks like this:

```json
{
  "asset_id": "AST-1042",
  "name": "SERVER-01",
  "type": "server",
  "environment": "production",
  "owner": "Infrastructure",
  "org_id": "ORG-KE-001",
  "ip_address": "10.10.1.12",
  "hostname": "server-01.core.local",
  "criticality": "critical",
  "status": "monitored",
  "tags": ["core", "linux", "database", "kenya-branch"],
  "discovery_source": "agent",
  "monitoring_enabled": true,
  "scan_interval_minutes": 60,
  "alert_thresholds": {
    "critical_vulns": 0,
    "high_vulns": 2,
    "cpu_threshold": 85,
    "memory_threshold": 80,
    "offline_minutes": 15
  },
  "last_seen_at": "2026-09-19T09:42:00Z"
}
```

## Monitoring rules

The website should apply the following logic when an asset is configured:

### 1. Asset registration

- The asset must belong to a valid organisation and tenant.
- It must have a unique identifier and a valid hostname or IP.
- It must be marked as either active or inactive for monitoring.

### 2. Scan eligibility

Only assets with `monitoring_enabled = true` should be considered for:

- vulnerability scanning
- compliance checks
- risk scoring
- health dashboards
- incident generation

### 3. Alerting policy

An asset should alert when any of the following occur:

- critical vulnerability count exceeds the threshold
- offline period exceeds the configured limit
- service availability drops below expected baseline
- CPU or memory usage breaches the assigned threshold
- configuration drift is detected against a known-good policy

### 4. Risk scoring

The scoring engine should combine:

- asset criticality
- exposure level
- known vulnerabilities
- patch status
- recency of telemetry
- uptime and availability

This produces the security score used in the executive dashboard and reports.

## Website configuration flow

In the product UI, the monitoring configuration should be handled in the following order:

1. Navigate to the Assets section.
2. Select Add asset or Register asset.
3. Enter asset identity details.
4. Set environment, owner, and business function.
5. Add IP, hostname, and tags.
6. Enable monitoring and set scan interval.
7. Configure alert thresholds for low, medium, high, and critical exposure.
8. Save the asset and verify it appears in the monitored inventory.

## Recommended monitoring categories

These categories are recommended for the dashboard to keep the threat model realistic:

- critical infrastructure
- user endpoints
- cloud services
- network devices
- databases and application servers
- external-facing services

## Dashboard behaviour

Once configured, the website should:

- display the asset in the asset inventory
- show its current health and status
- include it in security score calculations
- expose recent scan and alert results
- highlight it in incident and executive reporting

## Example policy for SMEs

For Kenyan SMEs, a practical default policy is:

- critical internal systems: scan every 60 minutes
- user workstations: scan every 6 hours
- internet-facing devices: scan every 30 minutes
- alert on any critical vulnerability immediately
- alert on 2 or more high-severity issues within 24 hours

## Security considerations

- Only authorised assets should be monitored.
- Tenant separation must prevent one organisation from viewing another organisation's devices.
- Monitoring should be disabled by default for untrusted or newly discovered assets until reviewed.
- Alert rules should be configurable by team or asset owner.
- Sensitive data such as internal IPs and credentials must be handled according to organisation policy.

## How to connect devices and assets to the demo

The demo should support three ways to bring assets into the system:

### 1. Manual registration

This is the simplest path for a small business. A user adds a device manually from the dashboard.

Process:

1. Open the Assets view.
2. Click Add asset.
3. Enter the device name, type, IP address, hostname, and owner.
4. Select the environment and criticality.
5. Enable monitoring.
6. Choose the scan schedule.
7. Save the asset.

The system then treats the device as a monitored endpoint and makes it eligible for scanning and reporting.

### 2. Network discovery / range scan

For a business that has an office LAN or cloud subnet, the platform should allow an authorised scan range to be entered. The app can then simulate discovery of devices inside that range.

Example configuration:

```json
{
  "network_name": "Kenya Office LAN",
  "cidr_range": "10.10.0.0/24",
  "org_id": "ORG-KE-001",
  "scan_type": "network",
  "schedule": "hourly",
  "trust_level": "internal",
  "monitoring_enabled": true
}
```

Discovery flow:

1. User enters a CIDR range such as `10.10.0.0/24`.
2. The platform checks the network for live hosts.
3. Hosts are listed as discovered assets.
4. Each detected device is compared against the asset registry.
5. New devices are added with a pending or monitored status.
6. Existing devices are updated with the latest metadata and scan timestamps.

### 3. Agent or endpoint integration

In a live deployment, this would be done by installing an agent or connector on devices. For the MVP/demo, this can be simulated by registering a device and confirming telemetry is received.

Typical fields for endpoint integration:

- device_id
- last_seen_at
- os_version
- patch_level
- connected_network
- health_status
- service_checks

## Scan workflow for networks and devices

The website should follow a standard scan process:

1. Select target network or asset.
2. Validate that the user is authorised for the tenant and the target.
3. Start a scan workflow.
4. Collect device information and service metadata.
5. Compare findings against the vulnerability baseline.
6. Mark status as healthy, warning, or critical.
7. Record results in the dashboard and report engine.

## How vulnerability checks are evaluated

The platform should decide whether an asset is healthy by checking:

- open ports and exposed services
- outdated software versions
- missing patches or OS updates
- known CVEs attached to installed packages
- misconfigurations or weak settings
- insecure protocols or default credentials
- abnormal login and network activity

A sample result could look like this:

```json
{
  "asset_id": "AST-1042",
  "scan_id": "SCAN-9912",
  "status": "critical",
  "summary": "Critical vulnerability detected on public-facing service.",
  "vulnerabilities": [
    {
      "severity": "critical",
      "title": "Outdated Apache HTTP server",
      "score": 9.8,
      "cve": "CVE-2024-12345"
    },
    {
      "severity": "high",
      "title": "Weak TLS configuration",
      "score": 8.2,
      "cve": "CVE-2024-54321"
    }
  ],
  "recommendation": "Patch the server and restrict external access until remediation is complete."
}
```

## Decision logic for healthy vs vulnerable assets

The website should show a device as healthy only when:

- it is online and reachable
- there are no critical or high unresolved vulnerabilities
- the patch level is acceptable
- the asset is within its configured policy thresholds
- there is no active alert requiring intervention

If any of the following occurs, it should be marked vulnerable or unhealthy:

- critical vulnerability found
- non-compliant configuration
- device offline beyond allowed time
- suspicious network exposure
- security controls not enabled

## Example demo workflow

For the demo environment, the website can simulate this user flow:

1. A user adds the office LAN of `10.10.0.0/24`.
2. The system discovers `SERVER-01`, `WORKSTATION-07`, and `FIREWALL-01`.
3. The app evaluates the assets against the vulnerability model.
4. `SERVER-01` is flagged as critical due to an outdated service.
5. `WORKSTATION-07` is flagged as medium risk due to missing updates.
6. `FIREWALL-01` is considered healthy and monitored.
7. The dashboard surface shows risk scores and immediate recommendations.

## Suggested implementation in this project

To make the MVP realistic, the app can implement the following:

1. Add an Assets page with Add device and Add network range actions.
2. Include a search field for IP, hostname, or asset tag.
3. Add a Scan button that runs a demo vulnerability assessment.
4. Present result cards with Healthy, Warning, and Critical status.
5. Record vulnerability details in a structured result object.
6. Link each asset to the incidents and report views.

## Security note

This is a demo environment, so scanning is intentionally limited to approved tenant ranges and simulated data. The product should never scan unknown or unauthorised networks and should clearly restrict results to the tenant that owns the asset.

## Summary

The core principle is simple: devices and networks are added to the system, monitored according to policy, scanned for risk, and evaluated as healthy or vulnerable. This gives CyberShield 360 a realistic monitoring model for SMEs while keeping the demo safe and understandable.

This gives the website a clean and operationally realistic model for monitoring assets continuously while keeping the configuration simple enough for SMEs to manage without a full SOC team.
