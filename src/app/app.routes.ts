import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'landing', pathMatch: 'full' },
  {
    path: 'landing',
    loadComponent: () =>
      import('./features/landing/landing.component').then(
        (m) => m.LandingComponent
      ),
  },
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
    path: 'factory-dashboard',
    loadComponent: () =>
      import(
        './features/factory/factory-dashboard/factory-dashboard.component'
      ).then((m) => m.FactoryDashboardComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Factory', 'Admin'] },
  },
  { path: '**', redirectTo: 'landing' },
];
