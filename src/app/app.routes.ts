import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'landing', pathMatch: 'full' },

  // Public
  {
    path: 'landing',
    loadComponent: () =>
      import('./features/landing/landing.component').then(
        (m) => m.LandingComponent
      ),
  },

  // Guest (unauthenticated only)
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (m) => m.RegisterComponent
      ),
    canActivate: [guestGuard],
  },

  // Farm (Farm + Admin)
  {
    path: 'farm',
    loadComponent: () =>
      import('./layouts/farm-layout/farm-layout.component').then(
        (m) => m.FarmLayoutComponent
      ),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Farm', 'Admin'] },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/farm/farm-dashboard/farm-dashboard.component').then(
            (m) => m.FarmDashboardComponent
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/farm/farm-profile/farm-profile.component').then(
            (m) => m.FarmProfileComponent
          ),
      },
      {
        path: 'matches',
        loadComponent: () =>
          import('./features/farm/farm-matches/farm-matches.component').then(
            (m) => m.FarmMatchesComponent
          ),
      },
      {
        path: 'contracts',
        loadComponent: () =>
          import('./features/farm/farm-contracts/farm-contracts.component').then(
            (m) => m.FarmContractsComponent
          ),
      },
      {
        path: 'messages',
        loadComponent: () =>
          import('./features/farm/farm-messages/farm-messages.component').then(
            (m) => m.FarmMessagesComponent
          ),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import(
            './features/farm/farm-notifications/farm-notifications.component'
          ).then((m) => m.FarmNotificationsComponent),
      },
    ],
  },

  // Backward-compatible redirects
  { path: 'farm-dashboard', redirectTo: 'farm/dashboard', pathMatch: 'full' },
  { path: 'farm-profile', redirectTo: 'farm/profile', pathMatch: 'full' },
  { path: 'farm-matches', redirectTo: 'farm/matches', pathMatch: 'full' },
  { path: 'farm-contracts', redirectTo: 'farm/contracts', pathMatch: 'full' },
  { path: 'farm-messages', redirectTo: 'farm/messages', pathMatch: 'full' },
  { path: 'farm-notifications', redirectTo: 'farm/notifications', pathMatch: 'full' },

  // Factory (Factory + Admin)
  {
    path: 'factory',
    loadComponent: () =>
      import('./layouts/factory-layout/factory-layout.component').then(
        (m) => m.FactoryLayoutComponent
      ),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Factory', 'Admin'] },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import(
            './features/factory/factory-dashboard/factory-dashboard.component'
          ).then((m) => m.FactoryDashboardComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import(
            './features/factory/factory-profile/factory-profile.component'
          ).then((m) => m.FactoryProfileComponent),
      },
      {
        path: 'supply-request',
        loadComponent: () =>
          import(
            './features/factory/supply-request/supply-request.component'
          ).then((m) => m.SupplyRequestComponent),
      },
      {
        path: 'matches',
        loadComponent: () =>
          import(
            './features/factory/factory-matches/factory-matches.component'
          ).then((m) => m.FactoryMatchesComponent),
      },
      {
        path: 'agent-progress',
        loadComponent: () =>
          import(
            './features/factory/agent-progress/agent-progress.component'
          ).then((m) => m.AgentProgressComponent),
      },
      {
        path: 'risk-report',
        loadComponent: () =>
          import('./features/factory/risk-report/risk-report.component').then(
            (m) => m.RiskReportComponent
          ),
      },
      {
        path: 'contract-signing',
        loadComponent: () =>
          import(
            './features/factory/contract-signing/contract-signing.component'
          ).then((m) => m.ContractSigningComponent),
      },
      {
        path: 'messages',
        loadComponent: () =>
          import(
            './features/factory/factory-messages/factory-messages.component'
          ).then((m) => m.FactoryMessagesComponent),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import(
            './features/factory/factory-notifications/factory-notifications.component'
          ).then((m) => m.FactoryNotificationsComponent),
      },
    ],
  },

  // Backward-compatible redirects
  { path: 'factory-dashboard', redirectTo: 'factory/dashboard', pathMatch: 'full' },
  { path: 'factory-profile', redirectTo: 'factory/profile', pathMatch: 'full' },
  { path: 'supply-request', redirectTo: 'factory/supply-request', pathMatch: 'full' },
  { path: 'factory-matches', redirectTo: 'factory/matches', pathMatch: 'full' },
  { path: 'agent-progress', redirectTo: 'factory/agent-progress', pathMatch: 'full' },
  { path: 'risk-report', redirectTo: 'factory/risk-report', pathMatch: 'full' },
  { path: 'contract-signing', redirectTo: 'factory/contract-signing', pathMatch: 'full' },
  { path: 'factory-messages', redirectTo: 'factory/messages', pathMatch: 'full' },
  { path: 'factory-notifications', redirectTo: 'factory/notifications', pathMatch: 'full' },

  // Admin (Admin only)
  {
    path: 'admin',
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent
      ),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin'] },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import(
            './features/admin/admin-dashboard/admin-dashboard.component'
          ).then((m) => m.AdminDashboardComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/admin-users/admin-users.component').then(
            (m) => m.AdminUsersComponent
          ),
      },
      {
        path: 'contracts',
        loadComponent: () =>
          import('./features/admin/admin-contracts/admin-contracts.component').then(
            (m) => m.AdminContractsComponent
          ),
      },
      {
        path: 'knowledge-base',
        loadComponent: () =>
          import('./features/admin/knowledge-base/knowledge-base.component').then(
            (m) => m.KnowledgeBaseComponent
          ),
      },
    ],
  },

  // Backward-compatible redirects
  { path: 'admin-dashboard', redirectTo: 'admin/dashboard', pathMatch: 'full' },
  { path: 'admin-users', redirectTo: 'admin/users', pathMatch: 'full' },
  { path: 'admin-contracts', redirectTo: 'admin/contracts', pathMatch: 'full' },
  { path: 'knowledge-base', redirectTo: 'admin/knowledge-base', pathMatch: 'full' },

  { path: '**', redirectTo: 'landing' },
];
