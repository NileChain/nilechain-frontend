export type DisputeStatus = 'Open' | 'UnderReview' | 'Resolved' | 'Rejected';
export type DisputeType =
  | 'QualityShortfall'
  | 'LateDelivery'
  | 'QuantityDispute'
  | 'Other';
export type DisputeParty = 'Farm' | 'Factory';
export type DisputeOutcomeFavor = 'None' | 'Farm' | 'Factory';

export interface DisputeEvidence {
  disputeEvidenceId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
}

export interface DisputeEvent {
  eventId: string;
  fromStatus: string | null;
  toStatus: string;
  actorUserId: string;
  note: string | null;
  createdAt: string;
}

export interface Dispute {
  disputeId: string;
  contractId: string;
  type: DisputeType | string;
  status: DisputeStatus | string;
  description: string;
  raisedByParty: DisputeParty | string;
  raisedByUserId: string;
  adminNote: string | null;
  outcomeFavor: DisputeOutcomeFavor | string;
  createdAt: string;
  underReviewAt: string | null;
  resolvedAt: string | null;
  rejectedAt: string | null;
  farmName: string | null;
  factoryName: string | null;
  fulfillmentFrozen: boolean;
  evidence: DisputeEvidence[];
  events: DisputeEvent[];
}

export interface DisputeList {
  page: number;
  pageSize: number;
  totalCount: number;
  items: Dispute[];
}

export interface AdminDisputeAction {
  adminNote?: string;
  outcomeFavor?: string;
}
