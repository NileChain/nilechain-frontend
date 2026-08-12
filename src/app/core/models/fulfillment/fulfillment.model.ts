export type FulfillmentStatus =
  | 'Planned'
  | 'Shipped'
  | 'Received'
  | 'QualityChecked'
  | 'Fulfilled'
  | 'RejectedAtGate'
  | 'Voided';

export interface FulfillmentEvent {
  eventId: string;
  fromStatus: string | null;
  toStatus: string;
  actorUserId: string;
  note: string | null;
  createdAt: string;
}

import { StructuredQualitySpecs } from '../factory/factory-dashboard.model';

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
  carrier?: string | null;
  trackingNumber?: string | null;
  shippedNotes?: string | null;
  acceptedQuantityTons?: number | null;
  discountPercent?: number;
  specsMet?: boolean | null;
  specsOutcomeNotes?: string | null;
  deliveryPoint?: string;
  freightPayer?: string;
  transitRisk?: string;
  contractedQuantityTons?: number | null;
  weighedQuantityTons?: number | null;
  weighbridgeTicketUrl?: string | null;
  rejectedAtGateAt?: string | null;
  gateRejectReason?: string | null;
  gateRejectNotes?: string | null;
  returnFreightBearer?: string | null;
  requestedQuality?: StructuredQualitySpecs | null;
  events: FulfillmentEvent[];
}

export interface ReceiveFulfillmentRequest {
  weighedQuantityTons: number;
  weighbridgeTicketUrl?: string | null;
}

export interface RejectAtGateRequest {
  reason: string;
  notes?: string | null;
}

export interface ShipFulfillmentRequest {
  carrier?: string | null;
  trackingNumber?: string | null;
  notes?: string | null;
}

export interface QualityCheckRequest {
  notes?: string | null;
  acceptedQuantityTons?: number | null;
  discountPercent?: number;
  specsMet?: boolean | null;
  specsOutcomeNotes?: string | null;
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
