import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

type LazyModule<T extends ComponentType<any>> = Promise<{ default: T }>;

interface LazyWithPreload<T extends ComponentType<any>> extends LazyExoticComponent<T> {
  preload: () => LazyModule<T>;
}

const lazyWithPreload = <T extends ComponentType<any>>(factory: () => LazyModule<T>): LazyWithPreload<T> => {
  const Component = lazy(factory) as LazyWithPreload<T>;
  Component.preload = factory;
  return Component;
};

const dashboardLoader = () => import('../pages/Dashboard').then((module) => ({ default: module.Dashboard }));
const reportsLoader = () => import('../pages/Reports').then((module) => ({ default: module.Reports }));
const loginLoader = () => import('../pages/Login').then((module) => ({ default: module.Login }));
const mapLoader = () => import('../pages/MapView').then((module) => ({ default: module.MapView }));
const advisoriesLoader = () => import('../pages/Advisories').then((module) => ({ default: module.Advisories }));
const generatedZonesLoader = () => import('../pages/GeneratedZones').then((module) => ({ default: module.GeneratedZones }));
const auditLogsLoader = () => import('../pages/AuditLogs').then((module) => ({ default: module.AuditLogs }));
const apiReferenceLoader = () => import('../pages/ApiReference').then((module) => ({ default: module.ApiReference }));
const usersLoader = () => import('../pages/Users').then((module) => ({ default: module.Users }));
const userDetailsLoader = () => import('../pages/UserDetails').then((module) => ({ default: module.UserDetails }));
const userFormLoader = () => import('../pages/UserForm').then((module) => ({ default: module.UserForm }));
const organizationsLoader = () => import('../pages/Organizations').then((module) => ({ default: module.Organizations }));
const verificationsLoader = () => import('../pages/Verifications').then((module) => ({ default: module.Verifications }));
const verificationCaseReviewLoader = () => import('../pages/VerificationCaseReview');

export const Login = lazyWithPreload(loginLoader);
export const Dashboard = lazyWithPreload(dashboardLoader);
export const Users = lazyWithPreload(usersLoader);
export const UserDetails = lazyWithPreload(userDetailsLoader);
export const UserForm = lazyWithPreload(userFormLoader);
export const Organizations = lazyWithPreload(organizationsLoader);
export const Verifications = lazyWithPreload(verificationsLoader);
export const VerificationCaseReview = lazyWithPreload(verificationCaseReviewLoader);
export const Reports = lazyWithPreload(reportsLoader);
export const MapView = lazyWithPreload(mapLoader);
export const Advisories = lazyWithPreload(advisoriesLoader);
export const GeneratedZones = lazyWithPreload(generatedZonesLoader);
export const AuditLogs = lazyWithPreload(auditLogsLoader);
export const ApiReference = lazyWithPreload(apiReferenceLoader);

const preloadByPath: Array<{ match: (path: string) => boolean; preload: () => Promise<unknown> }> = [
  { match: (path) => path === '/' || path === '/login', preload: () => Login.preload() },
  { match: (path) => path.startsWith('/dashboard'), preload: () => Dashboard.preload() },
  { match: (path) => path.startsWith('/users/create'), preload: () => UserForm.preload() },
  { match: (path) => path.startsWith('/users/') && path.endsWith('/edit'), preload: () => UserForm.preload() },
  { match: (path) => path.startsWith('/users/'), preload: () => UserDetails.preload() },
  { match: (path) => path.startsWith('/users'), preload: () => Users.preload() },
  { match: (path) => path.startsWith('/organizations'), preload: () => Organizations.preload() },
  { match: (path) => path.startsWith('/verifications/'), preload: () => VerificationCaseReview.preload() },
  { match: (path) => path.startsWith('/verifications'), preload: () => Verifications.preload() },
  { match: (path) => path.startsWith('/reports'), preload: () => Reports.preload() },
  { match: (path) => path.startsWith('/map'), preload: () => MapView.preload() },
  { match: (path) => path.startsWith('/advisories'), preload: () => Advisories.preload() },
  { match: (path) => path.startsWith('/generated-zones'), preload: () => GeneratedZones.preload() },
  { match: (path) => path.startsWith('/audit-logs'), preload: () => AuditLogs.preload() },
  { match: (path) => path.startsWith('/api-reference'), preload: () => ApiReference.preload() },
];

const warmedPaths = new Set<string>();

export const preloadRoute = (path: string) => {
  const entry = preloadByPath.find((item) => item.match(path));
  if (!entry || warmedPaths.has(path)) {
    return;
  }

  warmedPaths.add(path);
  void entry.preload();
};

export const warmCommonRoutes = () => {
  const queue = [
    '/dashboard',
    '/users',
    '/organizations',
    '/verifications',
    '/reports',
    '/advisories',
    '/generated-zones',
    '/audit-logs',
    '/api-reference',
    '/map',
  ];

  const schedule = (callback: () => void) => {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const requestIdleCallback = window.requestIdleCallback as (cb: IdleRequestCallback) => number;
      return requestIdleCallback(() => callback());
    }

    return globalThis.setTimeout(callback, 300);
  };

  queue.forEach((path, index) => {
    globalThis.setTimeout(() => {
      schedule(() => preloadRoute(path));
    }, 600 + index * 180);
  });
};
