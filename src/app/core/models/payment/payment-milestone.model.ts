export type PaymentMilestoneStatus =
  | 'Pending'
  | 'MarkedPaid'
  | 'Completed'
  | 'Failed'
  | 'Refunded'
  | 'Voided';

export interface PaymentMilestoneEvent {
  eventId: string;
  fromStatus: string | null;
  toStatus: string;
  actorUserId: string;
  note: string | null;
  createdAt: string;
}

export interface PaymentMilestone {
  transactionId: string;
  sequence: number;
  key: string;
  label: string;
  percent: number;
  amount: number;
  status: PaymentMilestoneStatus | string;
  paidAt: string | null;
  receivedAt: string | null;
  voidedAt: string | null;
  createdAt: string;
  events: PaymentMilestoneEvent[];
}

export interface PaymentMilestoneSchedule {
  contractId: string;
  contractTotal: number | null;
  contractTotalUnavailable: boolean;
  contractTotalUnavailableReason: string | null;
  disclaimer: string;
  scheduleGeneration: number | null;
  isVoided: boolean;
  milestones: PaymentMilestone[];
}
