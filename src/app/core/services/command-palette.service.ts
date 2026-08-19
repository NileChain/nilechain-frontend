import { Injectable, signal } from '@angular/core';

export interface CommandPaletteItem {
  id: string;
  labelKey: string;
  icon: string;
  link: string;
  roles: string[];
  keywords?: string[];
}

@Injectable({ providedIn: 'root' })
export class CommandPaletteService {
  readonly open = signal(false);
  readonly query = signal('');

  readonly items: CommandPaletteItem[] = [
    // Farm
    {
      id: 'farm-home',
      labelKey: 'nav.home',
      icon: 'home',
      link: '/farm/home',
      roles: ['Farm', 'Admin'],
      keywords: ['farm', 'home', 'رئيسية'],
    },
    {
      id: 'farm-dashboard',
      labelKey: 'nav.dashboard',
      icon: 'dashboard',
      link: '/farm/dashboard',
      roles: ['Farm', 'Admin'],
      keywords: ['farm', 'dashboard'],
    },
    {
      id: 'farm-profile',
      labelKey: 'nav.profile',
      icon: 'person',
      link: '/farm/profile',
      roles: ['Farm', 'Admin'],
      keywords: ['farm', 'profile'],
    },
    {
      id: 'farm-matches',
      labelKey: 'nav.matches',
      icon: 'handshake',
      link: '/farm/matches',
      roles: ['Farm', 'Admin'],
    },
    {
      id: 'farm-contracts',
      labelKey: 'nav.contracts',
      icon: 'description',
      link: '/farm/contracts',
      roles: ['Farm', 'Admin'],
    },
    {
      id: 'farm-negotiations',
      labelKey: 'nav.negotiations',
      icon: 'edit_note',
      link: '/farm/negotiations',
      roles: ['Farm', 'Admin'],
      keywords: ['negotiate', 'draft', 'changes', 'مفاوضات'],
    },
    {
      id: 'farm-disputes',
      labelKey: 'nav.disputes',
      icon: 'gavel',
      link: '/farm/disputes',
      roles: ['Farm', 'Admin'],
    },
    {
      id: 'farm-billing',
      labelKey: 'nav.billing',
      icon: 'workspace_premium',
      link: '/farm/billing',
      roles: ['Farm', 'Admin'],
      keywords: ['plan', 'quota', 'subscribe', 'اشتراك', 'باقة'],
    },
    {
      id: 'farm-messages',
      labelKey: 'nav.messages',
      icon: 'forum',
      link: '/farm/messages',
      roles: ['Farm', 'Admin'],
    },
    {
      id: 'farm-notifications',
      labelKey: 'nav.notifications',
      icon: 'notifications',
      link: '/farm/notifications',
      roles: ['Farm', 'Admin'],
    },
    // Factory
    {
      id: 'factory-home',
      labelKey: 'nav.home',
      icon: 'home',
      link: '/factory/home',
      roles: ['Factory', 'Admin'],
      keywords: ['factory', 'home', 'رئيسية'],
    },
    {
      id: 'factory-dashboard',
      labelKey: 'nav.dashboard',
      icon: 'dashboard',
      link: '/factory/dashboard',
      roles: ['Factory', 'Admin'],
      keywords: ['factory', 'dashboard'],
    },
    {
      id: 'factory-profile',
      labelKey: 'nav.profile',
      icon: 'factory',
      link: '/factory/profile',
      roles: ['Factory', 'Admin'],
    },
    {
      id: 'factory-supply',
      labelKey: 'nav.supplyRequest',
      icon: 'add_box',
      link: '/factory/supply-request',
      roles: ['Factory', 'Admin'],
    },
    {
      id: 'factory-matches',
      labelKey: 'nav.matches',
      icon: 'handshake',
      link: '/factory/matches',
      roles: ['Factory', 'Admin'],
    },
    {
      id: 'factory-agent',
      labelKey: 'nav.agentProgress',
      icon: 'smart_toy',
      link: '/factory/agent-progress',
      roles: ['Factory', 'Admin'],
    },
    {
      id: 'factory-risk',
      labelKey: 'nav.riskReport',
      icon: 'health_and_safety',
      link: '/factory/risk-report',
      roles: ['Factory', 'Admin'],
    },
    {
      id: 'factory-contracts',
      labelKey: 'nav.contracts',
      icon: 'description',
      link: '/factory/contracts',
      roles: ['Factory', 'Admin'],
    },
    {
      id: 'factory-negotiations',
      labelKey: 'nav.negotiations',
      icon: 'edit_note',
      link: '/factory/negotiations',
      roles: ['Factory', 'Admin'],
      keywords: ['negotiate', 'draft', 'changes', 'مفاوضات'],
    },
    {
      id: 'factory-disputes',
      labelKey: 'nav.disputes',
      icon: 'gavel',
      link: '/factory/disputes',
      roles: ['Factory', 'Admin'],
    },
    {
      id: 'factory-billing',
      labelKey: 'nav.billing',
      icon: 'workspace_premium',
      link: '/factory/billing',
      roles: ['Factory', 'Admin'],
      keywords: ['plan', 'quota', 'subscribe', 'اشتراك', 'باقة'],
    },
    {
      id: 'factory-messages',
      labelKey: 'nav.messages',
      icon: 'forum',
      link: '/factory/messages',
      roles: ['Factory', 'Admin'],
    },
    {
      id: 'factory-notifications',
      labelKey: 'nav.notifications',
      icon: 'notifications',
      link: '/factory/notifications',
      roles: ['Factory', 'Admin'],
    },
    // Admin
    {
      id: 'admin-dashboard',
      labelKey: 'nav.dashboard',
      icon: 'monitoring',
      link: '/admin/dashboard',
      roles: ['Admin'],
    },
    {
      id: 'admin-users',
      labelKey: 'nav.users',
      icon: 'group',
      link: '/admin/users',
      roles: ['Admin'],
    },
    {
      id: 'admin-contracts',
      labelKey: 'nav.contracts',
      icon: 'description',
      link: '/admin/contracts',
      roles: ['Admin'],
    },
    {
      id: 'admin-disputes',
      labelKey: 'nav.disputes',
      icon: 'gavel',
      link: '/admin/disputes',
      roles: ['Admin'],
    },
    {
      id: 'admin-withdrawals',
      labelKey: 'nav.withdrawals',
      icon: 'account_balance_wallet',
      link: '/admin/withdrawals',
      roles: ['Admin'],
    },
    {
      id: 'admin-channel-messages',
      labelKey: 'nav.channelMessages',
      icon: 'chat',
      link: '/admin/channel-messages',
      roles: ['Admin'],
    },
    {
      id: 'admin-ai-runs',
      labelKey: 'nav.aiRuns',
      icon: 'smart_toy',
      link: '/admin/ai-runs',
      roles: ['Admin'],
    },
    {
      id: 'admin-kb',
      labelKey: 'nav.knowledgeBase',
      icon: 'auto_stories',
      link: '/admin/knowledge-base',
      roles: ['Admin'],
    },
  ];

  openPalette(): void {
    this.query.set('');
    this.open.set(true);
    document.body.classList.add('overflow-hidden');
  }

  closePalette(): void {
    this.open.set(false);
    this.query.set('');
    document.body.classList.remove('overflow-hidden');
  }

  toggle(): void {
    if (this.open()) {
      this.closePalette();
    } else {
      this.openPalette();
    }
  }

  setQuery(value: string): void {
    this.query.set(value);
  }
}
