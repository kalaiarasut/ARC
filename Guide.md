# Civil Alert System Vision

This document is a product and system vision note. It is not the canonical setup guide and it should not be used as the source of truth for implementation status. For repository structure, local setup, backend bootstrap, and known gaps, use `README.md`.

## Purpose

Civil Alert System is intended to close the gap between institutional early-warning systems and on-the-ground reality during coastal and climate-related hazard events.

The platform is built around a simple operating model:

- citizens contribute structured, geotagged field intelligence
- authorities validate, monitor, and act on incoming signals
- the backend turns those signals into operationally useful map, advisory, and workflow data

The core idea is not "social reporting" in the generic sense. It is operational situational awareness with enough structure, evidence, and geospatial precision to support real decision-making.

## Problem Statement

Coastal and urban hazard response often suffers from the same failure pattern:

- official warning systems can detect broad conditions
- affected communities see local impacts first
- agencies still lack reliable, structured, ground-level information during the most time-sensitive phase

In practice, important signals are often delayed, fragmented, or buried in unstructured channels. Free-text messages, scattered media uploads, and informal reports do not easily translate into field-ready intelligence.

The platform exists to improve that handoff.

## Vision

The long-term vision is a single operational platform where:

- citizens can report hazards quickly, even with poor connectivity
- analysts can validate and prioritize evidence without switching systems
- authorities can publish timely, localized advisories
- map-based risk views evolve continuously as real reports arrive
- location, notification, and monitoring features remain privacy-aware and role-controlled

The system should support both immediate response and longer-term pattern awareness.

## Product Principles

### 1. Ground Truth First

Citizen reports are valuable because they capture what institutional models may miss at street, shoreline, or neighborhood level. The product should preserve that advantage through fast capture, simple flows, and geospatial precision.

### 2. Operational Simplicity

During an active event, both citizens and operators need clarity more than feature density. High-friction flows, ambiguous controls, and overloaded screens work against the mission.

### 3. Offline Resilience

Connectivity is not guaranteed during hazard events. Report capture, queueing, retry, and map access should degrade gracefully instead of failing hard.

### 4. Evidence Over Noise

The platform should reward structured reports, attached evidence, verification workflows, and auditability. It should reduce rumor amplification rather than become another rumor surface.

### 5. Local Relevance

Language, geography, and relevance matter. Advisories and map surfaces should be understandable, region-aware, and useful to the user standing in a real place with real constraints.

### 6. Controlled Access

Not every user should see everything. Citizen, analyst, and admin access must remain intentionally scoped, especially for exact locations, verification actions, and operational tools.

## Intended System Shape

The platform is organized around three layers.

### Citizen Layer

The citizen app should make it easy to:

- sign in with low friction
- submit hazard observations with location and media
- understand official advisories
- view nearby verified conditions on a map
- continue operating when temporarily offline

The citizen experience should stay focused on contribution, awareness, and trust.

### Operational Layer

The admin dashboard should give agencies and analysts a single place to:

- review incoming reports
- verify or reject evidence
- monitor risk zones and monitoring zones
- publish official advisories
- inspect map-based activity and live operational signals
- manage users, organizations, and verification workflows

This layer is where raw citizen input becomes operational action.

### Shared Intelligence Layer

The backend should provide:

- role-aware data access
- geospatial query and clustering capability
- storage for media and translations
- notification delivery paths
- auditability
- room for localization and future decision-support features

This layer should stay implementation-flexible, but the outcome must be reliability and consistency across both clients.

## Non-Goals

The platform is not intended to be:

- an unmoderated public social feed
- a generic messaging app
- a replacement for formal emergency command systems
- a product that exposes sensitive location data without role controls

It should complement institutional systems, not impersonate them.

## Success Criteria

At a product level, the platform is succeeding when it consistently improves these outcomes:

- faster reporting from affected communities
- more actionable evidence for analysts
- clearer prioritization of real hazards
- faster publication and delivery of official advisories
- better shared situational awareness across map, reports, and notifications

## Strategic Direction

If the platform continues to evolve, the strongest directions are:

- stronger advisory relevance and delivery diagnostics
- better monitoring-zone intelligence and alert rules
- stronger multilingual operations
- improved evidence review ergonomics for analysts
- better archival quality and export surfaces for institutional use

Those extensions only matter if the system remains trustworthy, understandable, and operationally useful under pressure.

## Relationship To The README

`Guide.md` explains why the platform exists and what it is trying to become.

`README.md` explains what is actually in the repository today, how to run it, and where the current implementation still has gaps.
