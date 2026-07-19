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
    path: 'farm-dashboard',
    loadComponent: () =>
      import('./features/farm/farm-dashboard/farm-dashboard.component').then(
        (m) => m.FarmDashboardComponent
      ),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Farm', 'Admin'] },
  },
  {
    path: 'farm-profile',
    loadComponent: () =>
      import('./features/farm/farm-profile/farm-profile.component').then(
        (m) => m.FarmProfileComponent
      ),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Farm', 'Admin'] },
  },
  {
    path: 'farm-matches',
    loadComponent: () =>
      import('./features/farm/farm-matches/farm-matches.component').then(
        (m) => m.FarmMatchesComponent
      ),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Farm', 'Admin'] },
  },
  {
    path: 'farm-contracts',
    loadComponent: () =>
      import('./features/farm/farm-contracts/farm-contracts.component').then(
        (m) => m.FarmContractsComponent
      ),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Farm', 'Admin'] },
  },
  {
    path: 'farm-messages',
    loadComponent: () =>
      import('./features/farm/farm-messages/farm-messages.component').then(
        (m) => m.FarmMessagesComponent
      ),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Farm', 'Admin'] },
  },
  {
    path: 'farm-notifications',
    loadComponent: () =>
      import(
        './features/farm/farm-notifications/farm-notifications.component'
      ).then((m) => m.FarmNotificationsComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Farm', 'Admin'] },
  },

  // Factory (Factory + Admin)
  {
    path: 'factory-dashboard',
    loadComponent: () =>
      import(
        './features/factory/factory-dashboard/factory-dashboard.component'
      ).then((m) => m.FactoryDashboardComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Factory', 'Admin'] },
  },
  {
    path: 'factory-profile',
    loadComponent: () =>
      import(
        './features/factory/factory-profile/factory-profile.component'
      ).then((m) => m.FactoryProfileComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Factory', 'Admin'] },
  },
  {
    path: 'supply-request',
    loadComponent: () =>
      import(
        './features/factory/supply-request/supply-request.component'
      ).then((m) => m.SupplyRequestComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Factory', 'Admin'] },
  },
  {
    path: 'factory-matches',
    loadComponent: () =>
      import(
        './features/factory/factory-matches/factory-matches.component'
      ).then((m) => m.FactoryMatchesComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Factory', 'Admin'] },
  },
  {
    path: 'agent-progress',
    loadComponent: () =>
      import(
        './features/factory/agent-progress/agent-progress.component'
      ).then((m) => m.AgentProgressComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Factory', 'Admin'] },
  },
  {
    path: 'risk-report',
    loadComponent: () =>
      import('./features/factory/risk-report/risk-report.component').then(
        (m) => m.RiskReportComponent
      ),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Factory', 'Admin'] },
  },
  {
    path: 'contract-signing',
    loadComponent: () =>
      import(
        './features/factory/contract-signing/contract-signing.component'
      ).then((m) => m.ContractSigningComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Factory', 'Admin'] },
  },
  {
    path: 'factory-messages',
    loadComponent: () =>
      import(
        './features/factory/factory-messages/factory-messages.component'
      ).then((m) => m.FactoryMessagesComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Factory', 'Admin'] },
  },
  {
    path: 'factory-notifications',
    loadComponent: () =>
      import(
        './features/factory/factory-notifications/factory-notifications.component'
      ).then((m) => m.FactoryNotificationsComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Factory', 'Admin'] },
  },

  // Admin (Admin only)
  {
    path: 'admin-dashboard',
    loadComponent: () =>
      import(
        './features/admin/admin-dashboard/admin-dashboard.component'
      ).then((m) => m.AdminDashboardComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin'] },
  },
  {
    path: 'admin-users',
    loadComponent: () =>
      import('./features/admin/admin-users/admin-users.component').then(
        (m) => m.AdminUsersComponent
      ),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin'] },
  },
  {
    path: 'admin-contracts',
    loadComponent: () =>
      import('./features/admin/admin-contracts/admin-contracts.component').then(
        (m) => m.AdminContractsComponent
      ),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin'] },
  },
  {
    path: 'knowledge-base',
    loadComponent: () =>
      import('./features/admin/knowledge-base/knowledge-base.component').then(
        (m) => m.KnowledgeBaseComponent
      ),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin'] },
  },

  { path: '**', redirectTo: 'landing' },
];
