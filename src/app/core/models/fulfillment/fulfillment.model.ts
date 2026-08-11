export type FulfillmentStatus =
  | 'Planned'
  | 'Shipped'
  | 'Received'
  | 'QualityChecked'
  | 'Fulfilled'
  | 'Voided';

export interface FulfillmentEvent {
  eventId: string;
  fromStatus: string | null;
  toStatus: string;
  actorUserId: string;
  note: string | null;
  createdAt: string;
}

export interface Fulfillment {
  fulfillmentId: string;
  contractId: string;
  status: FulfillmentStatus | string;
  plannedShipDate: string | null;
  shippedAt: string | null;
  receivedAt: string | null;
  qualityCheckedAt: string | null;
  fulfilledAt: string | null;
  voidedAt: string | null;
  qualityNotes: string | null;
  events: FulfillmentEvent[];
}

export interface QualityCheckRequest {
  notes?: string | null;
}

export interface StuckFulfillment {
  fulfillmentId: string;
  contractId: string;
  status: string;
  plannedShipDate: string | null;
  farmName: string | null;
  factoryName: string | null;
  createdAt: string;
}

export interface StuckFulfillmentList {
  items: StuckFulfillment[];
  totalCount: number;
  page: number;
  pageSize: number;
}
