import { Router } from '@angular/router';

const CONTRACT_MARKER = /#contract:[0-9a-fA-F-]{36}#\s*/g;

export function stripNotificationMarker(message: string | null | undefined): string {
  return (message ?? '').replace(CONTRACT_MARKER, '').trim();
}

export function notificationTargetUrl(
  n: {
    link?: string | null;
    type?: string | null;
    relatedEntityType?: string | null;
    relatedEntityId?: string | null;
    message?: string | null;
  },
  role: 'farm' | 'factory'
): string {
  const portal = role === 'factory' ? 'factory' : 'farm';
  const type = (n.type ?? '').toLowerCase();
  const rel = (n.relatedEntityType ?? '').toLowerCase();
  const id = n.relatedEntityId ? String(n.relatedEntityId) : null;

  const marker = n.message?.match(/#contract:([0-9a-fA-F-]{36})#/);
  const contractFromBody = marker?.[1] ?? null;
  const entityId = id || contractFromBody;
  const computed = computedPath(portal, type, rel, entityId) ?? `/${portal}/notifications`;
  const link = (n.link ?? '').trim();
  if (entityId) {
    return computed;
  }
  if (link && !/\/notifications\/?$/.test(link)) {
    return link;
  }
  return computed;
}

function computedPath(
  portal: string,
  type: string,
  rel: string,
  entityId: string | null
): string | null {
  if (rel === 'contract' || type.includes('contract') || type.includes('fulfillment') || type.includes('payment')) {
    return entityId ? `/${portal}/contracts/${entityId}` : `/${portal}/contracts`;
  }
  if (rel === 'conversation' || type.includes('message')) {
    return entityId ? `/${portal}/messages?matchId=${entityId}` : `/${portal}/messages`;
  }
  if (rel === 'match' || type.includes('match')) {
    return entityId
      ? portal === 'factory'
        ? `/factory/matches?matchId=${entityId}`
        : `/farm/matches?matchId=${entityId}`
      : `/${portal}/matches`;
  }
  if (rel === 'dispute' || type.includes('dispute')) {
    return entityId ? `/${portal}/disputes?disputeId=${entityId}` : `/${portal}/disputes`;
  }
  if (rel === 'croprequest' || type.includes('crop')) {
    return `/${portal}/crop-request`;
  }
  if (rel === 'wallet' || type.includes('wallet') || type.includes('escrow')) {
    return entityId ? `/${portal}/contracts/${entityId}` : `/${portal}/wallet`;
  }
  if (rel === 'profile' || type.includes('cert')) {
    return portal === 'farm' ? '/farm/profile' : '/factory/profile';
  }
  if (type.includes('risk') || type.includes('weather') || type.includes('priceshift')) {
    if (entityId) {
      return `/${portal}/contracts/${entityId}`;
    }
    return portal === 'factory' ? '/factory/risk-report' : '/farm/contracts';
  }
  return null;
}

export function navigateNotificationLink(
  router: Router,
  url: string | null | undefined
): void {
  if (!url) {
    return;
  }
  void router.navigateByUrl(router.parseUrl(url));
}
