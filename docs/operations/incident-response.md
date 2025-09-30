---
layout: default
title: Incident Response Playbook
parent: Operations Command Center
nav_order: 1
---

# Incident Response Playbook

> [!WARNING]
> Invoke this playbook the moment client-facing impact is detected. Do not wait for full confirmation - containment always beats speculation.

## Severity Matrix

| Severity | Description | Examples | Primary Owner |
| --- | --- | --- | --- |
| SEV-1 | Platform unavailable or data loss | Outage across all tenants, corrupted production database | Incident Commander (on-call lead) |
| SEV-2 | Critical functionality degraded | QuickBooks sync halted, document uploads failing for multiple clients | On-call engineer |
| SEV-3 | Single workflow impairment | One tenant affected, degraded performance on non-critical feature | Feature owner |
| SEV-4 | Question or anomaly | Alert with no user impact, proactive investigation | Support triage |

> [!TIP]
> Log every incident in the ticketing system with links to monitoring screenshots and timeline notes. Use the [Testing Automation Framework]({{ site.github.repository_url }}/blob/main/TESTING_AUTOMATION_FRAMEWORK.md) to reproduce issues rapidly.

## Five-Minute Rulebook

1. **Declare the incident** -> Post in `#advisoros-incident` with severity, impact, and on-call owner.
2. **Freeze risky changes** -> Halt deployments via the [Production Deployment Guide](DEPLOYMENT_GUIDE.md).
3. **Establish a bridge** -> Launch a Teams/Zoom bridge, capture notes in the incident record.
4. **Assign roles**:
   - Incident Commander: coordinates and communicates
   - Communications Lead: posts updates to leadership & clients
   - Scribe: maintains a minute-by-minute timeline
   - Response Engineer(s): reproduce and fix
5. **Update stakeholders** every 15 minutes minimum, or faster for SEV-1.

## Containment Checklist

- Validate monitoring alerts in Application Insights / Grafana.
- Capture query plans, logs, and error IDs before restarting services.
- Toggle feature flags when a temporary mitigation is available (see [Feature Flags section]({{ site.github.repository_url }}/blob/main/ADMINISTRATOR_GUIDE.md#feature-flags)).
- If data integrity is at risk, follow the [Database Recovery Checklist]({{ site.github.repository_url }}/blob/main/DATABASE.md#recovery-procedures) immediately.

## Communication Templates

**Internal (Slack)**
```
:rotating_light: SEV-{#} | {Summary}
Start: {UTC Timestamp}
Impact: {User scope}
Current mitigation: {What we are doing}
Next update: {Time}
Tracker: {Incident doc link}
```

**Client (Email)**
```
Subject: AdvisorOS Incident Update � {Summary}

We are actively addressing an issue impacting {impact description}. Our team initiated mitigation at {time}. Expect the next update by {time}. Track progress here: {status page or shared doc}.

Thank you for your patience.
AdvisorOS Operations Team
```

## Post-Incident Review

1. Schedule a review within two business days. Invite engineering, product, support, and customer success.
2. Populate the [Post-Incident Template]({{ site.github.repository_url }}/blob/main/POST_LAUNCH_SUPPORT_OPTIMIZATION.md#post-incident-template) with:
   - Timeline
   - Root cause and contributing factors
   - Resolution steps
   - Follow-up actions (assigned with due dates)
3. Turn systemic learnings into backlog tickets and documentation updates before closing the incident.

## Reference Library

- [Operations Runbook](RUNBOOK.md) for monitoring and alert routing
- [Production Readiness Checklist](../PRODUCTION_READINESS_CHECKLIST.md) to prevent repeat issues
- [Security Compliance Report]({{ site.github.repository_url }}/blob/main/SECURITY_COMPLIANCE_REPORT.md) when handling security-related incidents
- [Rollback Procedures]({{ site.github.repository_url }}/blob/main/PRODUCTION_ROLLBACK_PROCEDURES.md) if mitigation requires failover



