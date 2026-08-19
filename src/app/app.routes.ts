import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';
import { kybVerifiedGuard } from './core/guards/kyb-verified.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'landing', pathMatch: 'full' },

  // Public
  {
    path: 'verify/:hash',
    loadComponent: () =>
      import('./features/integrity/verify-contract.component').then(
        (m) => m.VerifyContractComponent
      ),
  },
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
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      ),
    canActivate: [guestGuard],
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent
      ),
    canActivate: [guestGuard],
  },
  {
    path: 'confirm-email',
    loadComponent: () =>
      import('./features/auth/confirm-email/confirm-email.component').then(
        (m) => m.ConfirmEmailComponent
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (m) => m.RegisterComponent
      ),
    canActivate: [guestGuard],
  },
  {
    path: 'verification-pending',
    loadComponent: () =>
      import('./features/auth/verification-pending/verification-pending.component').then(
        (m) => m.VerificationPendingComponent
      ),
    canActivate: [authGuard],
    data: { allowUnverified: true },
  },

  // Farm portal landing (no sidebar — website-style)
  {
    path: 'farm/home',
    loadComponent: () =>
      import('./features/farm/farm-home/farm-home.component').then(
        (m) => m.FarmHomeComponent
      ),
    canActivate: [authGuard, roleGuard, kybVerifiedGuard],
    data: { roles: ['Farm'] },
  },

  // Farm (Farm + Admin)
  {
    path: 'farm',
    loadComponent: () =>
      import('./layouts/farm-layout/farm-layout.component').then(
        (m) => m.FarmLayoutComponent
      ),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Farm'] },
    children: [
      {
        path: '',
        redirectTo: '/farm/home',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        canActivate: [kybVerifiedGuard],
        loadComponent: () =>
          import('./features/farm/farm-dashboard/farm-dashboard.component').then(
            (m) => m.FarmDashboardComponent
          ),
      },
      {
        path: 'profile',
        data: { allowUnverified: true },
        loadComponent: () =>
          import('./features/farm/farm-profile/farm-profile.component').then(
            (m) => m.FarmProfileComponent
          ),
      },
      {
        path: 'matches',
        canActivate: [kybVerifiedGuard],
        loadComponent: () =>
          import('./features/farm/farm-matches/farm-matches.component').then(
            (m) => m.FarmMatchesComponent
          ),
      },
      {
        path: 'factories/:factoryId',
        canActivate: [kybVerifiedGuard],
        loadComponent: () =>
          import(
            './features/farm/farm-factory-public-profile/farm-factory-public-profile.component'
          ).then((m) => m.FarmFactoryPublicProfileComponent),
      },
      {
        path: 'contracts',
        canActivate: [kybVerifiedGuard],
        loadComponent: () =>
          import('./features/farm/farm-contracts/farm-contracts.component').then(
            (m) => m.FarmContractsComponent
          ),
      },
      {
        path: 'contracts/:contractId',
        canActivate: [kybVerifiedGuard],
        loadComponent: () =>
          import(
            './features/farm/farm-contract-details/farm-contract-details.component'
          ).then((m) => m.FarmContractDetailsComponent),
      },
      {
        path: 'wallet',
        canActivate: [kybVerifiedGuard],
        loadComponent: () =>
          import('./features/wallet/wallet-page.component').then(
            (m) => m.WalletPageComponent
          ),
      },
      {
        path: 'billing',
        canActivate: [kybVerifiedGuard],
        loadComponent: () =>
          import('./features/billing/billing-page.component').then(
            (m) => m.BillingPageComponent
          ),
      },
      {
        path: 'messages',
        canActivate: [kybVerifiedGuard],
        loadComponent: () =>
          import('./features/farm/farm-messages/farm-messages.component').then(
            (m) => m.FarmMessagesComponent
          ),
      },
      {
        path: 'notifications',
        canActivate: [kybVerifiedGuard],
        loadComponent: () =>
          import('./features/farm/farm-notifications/farm-notifications.component').then(
            (m) => m.FarmNotificationsComponent
          ),
      },
      {
        path: 'negotiations',
        canActivate: [kybVerifiedGuard],
        loadComponent: () =>
          import('./shared/negotiations/party-negotiations-page.component').then(
            (m) => m.PartyNegotiationsPageComponent
          ),
      },
      {
        path: 'disputes',
        canActivate: [kybVerifiedGuard],
        loadComponent: () =>
          import('./shared/disputes/party-disputes-page.component').then(
            (m) => m.PartyDisputesPageComponent
          ),
      },
      {
        path: 'crop-request',
        canActivate: [kybVerifiedGuard],
        loadComponent: () =>
          import('./features/crop-request/crop-request.component').then(
            (m) => m.CropRequestComponent
          ),
      },
    ],
  },

  // Backward-compatible redirects
  { path: 'farm-dashboard', redirectTo: 'farm/dashboard', pathMatch: 'full' },
  { path: 'farm-profile', redirectTo: 'farm/profile', pathMatch: 'full' },
  { path: 'farm-matches', redirectTo: 'farm/matches', pathMatch: 'full' },
  { path: 'farm-contracts', redirectTo: 'farm/contracts', pathMatch: 'full' },
  { path: 'farm-messages', redirectTo: 'farm/messages', pathMatch: 'full' },
  {
    path: 'farm-notifications',
    redirectTo: 'farm/notifications',
    pathMatch: 'full',
  },

  // Factory portal landing (no sidebar — website-style)
  {
    path: 'factory/home',
    loadComponent: () =>
      import('./features/factory/factory-home/factory-home.component').then(
        (m) => m.FactoryHomeComponent
      ),
    canActivate: [authGuard, roleGuard, kybVerifiedGuard],
    data: { roles: ['Factory'] },
  },

  // Factory (Factory + Admin)
  {
    path: 'factory',
    loadComponent: () =>
      import('./layouts/factory-layout/factory-layout.component').then(
        (m) => m.FactoryLayoutComponent
      ),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Factory'] },
    children: [
      {
        path: '',
        redirectTo: '/factory/home',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        canActivate: [kybVerifiedGuard],
        loadComponent: () =>
          import('./features/factory/factory-dashboard/factory-dashboard.component').then(
            (m) => m.FactoryDashboardComponent
          ),
      },
      {
        path: 'profile',
        data: { allowUnverified: true },
        loadComponent: () =>
          import('./features/factory/factory-profile/factory-profile.component').then(
            (m) => m.FactoryProfileComponent
          ),
      },
      {
        path: 'supply-request',
        canActivate: [kybVerifiedGuard],
        loadComponent: () =>
          import('./features/factory/supply-request/supply-request.component').then(
            (m) => m.SupplyRequestComponent
          ),
      },
      {
        path: 'requests',
        canActivate: [kybVerifiedGuard],
        loadComponent: () =>
          import('./features/factory/factory-requests/factory-requests.component').then(
            (m) => m.FactoryRequestsComponent
          ),
      },
      {
        path: 'requests/:requestId',
        canActivate: [kybVerifiedGuard],
        loadComponent: () =>
          import(
            './features/factory/factory-request-details/factory-request-details.component'
          ).then((m) => m.FactoryRequestDetailsComponent),
      },
      {
        path: 'suppliers/:farmId/scorecard',
        canActivate: [kybVerifiedGuard],
        loadComponent: () =>
          import(
            './features/factory/factory-supplier-scorecard/factory-supplier-scorecard.component'
          ).then((m) => m.FactorySupplierScorecardComponent),
      },
      {
        path: 'crop-request',
        canActivate: [kybVerifiedGuard],
        loadComponent: () =>
          import('./features/crop-request/crop-request.component').then(
            (m) => m.CropRequestComponent
          ),
      },
      {
        path: 'matches',
        canActivate: [kybVerifiedGuard],
        loadComponent: () =>
          import('./features/factory/factory-matches/factory-matches.component').then(
            (m) => m.FactoryMatchesComponent
          ),
      },
      {
        path: 'listings',
        canActivate: [kybVerifiedGuard],
        loadComponent: () =>
          import('./features/factory/factory-listings/factory-listings.component').then(
            (m) => m.FactoryListingsComponent
          ),
      },
      {
        path: 'agent-progress',
        canActivate: [kybVerifiedGuard],
        loadComponent: () =>
          import('./features/factory/agent-progress/agent-progress.component').then(
            (m) => m.AgentProgressComponent
          ),
      },
      {
        path: 'risk-report',
        canActivate: [kybVerifiedGuard],
        loadComponent: () =>
          import('./features/factory/risk-report/risk-report.component').then(
            (m) => m.RiskReportComponent
          ),
      },
      {
        path: 'contracts',
        canActivate: [kybVerifiedGuard],
        loadComponent: () =>
          import(
            './features/factory/factory-contracts/factory-contracts.component'
          ).then((m) => m.FactoryContractsComponent),
      },
      {
        path: 'contracts/:contractId',
        canActivate: [kybVerifiedGuard],
        loadComponent: () =>
          import(
            './features/factory/factory-contract-details/factory-contract-details.component'
          ).then((m) => m.FactoryContractDetailsComponent),
      },
      {
        path: 'wallet',
        canActivate: [kybVerifiedGuard],
        loadComponent: () =>
          import('./features/wallet/wallet-page.component').then(
            (m) => m.WalletPageComponent
          ),
      },
      {
        path: 'billing',
        canActivate: [kybVerifiedGuard],
        loadComponent: () =>
          import('./features/billing/billing-page.component').then(
            (m) => m.BillingPageComponent
          ),
      },
      {
        path: 'contract-signing',
        canActivate: [kybVerifiedGuard],
        loadComponent: () =>
          import('./features/factory/contract-signing/contract-signing.component').then(
            (m) => m.ContractSigningComponent
          ),
      },
      {
        path: 'messages',
        canActivate: [kybVerifiedGuard],
        loadComponent: () =>
          import('./features/factory/factory-messages/factory-messages.component').then(
            (m) => m.FactoryMessagesComponent
          ),
      },
      {
        path: 'notifications',
        canActivate: [kybVerifiedGuard],
        loadComponent: () =>
          import('./features/factory/factory-notifications/factory-notifications.component').then(
            (m) => m.FactoryNotificationsComponent
          ),
      },
      {
        path: 'negotiations',
        canActivate: [kybVerifiedGuard],
        loadComponent: () =>
          import('./shared/negotiations/party-negotiations-page.component').then(
            (m) => m.PartyNegotiationsPageComponent
          ),
      },
      {
        path: 'disputes',
        canActivate: [kybVerifiedGuard],
        loadComponent: () =>
          import('./shared/disputes/party-disputes-page.component').then(
            (m) => m.PartyDisputesPageComponent
          ),
      },
    ],
  },

  // Backward-compatible redirects
  {
    path: 'factory-dashboard',
    redirectTo: 'factory/dashboard',
    pathMatch: 'full',
  },
  { path: 'factory-profile', redirectTo: 'factory/profile', pathMatch: 'full' },
  {
    path: 'supply-request',
    redirectTo: 'factory/supply-request',
    pathMatch: 'full',
  },
  { path: 'factory-matches', redirectTo: 'factory/matches', pathMatch: 'full' },
  {
    path: 'agent-progress',
    redirectTo: 'factory/agent-progress',
    pathMatch: 'full',
  },
  { path: 'risk-report', redirectTo: 'factory/risk-report', pathMatch: 'full' },
  {
    path: 'contract-signing',
    redirectTo: 'factory/contract-signing',
    pathMatch: 'full',
  },
  {
    path: 'factory-messages',
    redirectTo: 'factory/messages',
    pathMatch: 'full',
  },
  {
    path: 'factory-notifications',
    redirectTo: 'factory/notifications',
    pathMatch: 'full',
  },

  // Admin (Admin only)
  {
    path: 'admin',
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent
      ),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin', 'SuperAdmin'] },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/admin-dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          ),
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
      {
        path: 'crop-requests',
        loadComponent: () =>
          import(
            './features/admin/admin-crop-requests/admin-crop-requests.component'
          ).then((m) => m.AdminCropRequestsComponent),
      },
      {
        path: 'disputes',
        loadComponent: () =>
          import('./features/admin/admin-disputes/admin-disputes.component').then(
            (m) => m.AdminDisputesComponent
          ),
      },
      {
        path: 'withdrawals',
        loadComponent: () =>
          import('./features/admin/admin-withdrawals/admin-withdrawals.component').then(
            (m) => m.AdminWithdrawalsComponent
          ),
      },
      {
        path: 'channel-messages',
        loadComponent: () =>
          import(
            './features/admin/admin-channel-messages/admin-channel-messages.component'
          ).then((m) => m.AdminChannelMessagesComponent),
      },
      {
        path: 'ai-runs',
        loadComponent: () =>
          import('./features/admin/admin-ai-runs/admin-ai-runs.component').then(
            (m) => m.AdminAiRunsComponent
          ),
      },
    ],
  },

  // Backward-compatible redirects
  { path: 'admin-dashboard', redirectTo: 'admin/dashboard', pathMatch: 'full' },
  { path: 'admin-users', redirectTo: 'admin/users', pathMatch: 'full' },
  { path: 'admin-contracts', redirectTo: 'admin/contracts', pathMatch: 'full' },
  {
    path: 'knowledge-base',
    redirectTo: 'admin/knowledge-base',
    pathMatch: 'full',
  },

  { path: '**', redirectTo: 'landing' },
];
