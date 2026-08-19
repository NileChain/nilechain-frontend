export type PaymentMilestoneStatus =
  | 'Pending'
  | 'MarkedPaid'
  | 'EscrowHeld'
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

export interface EscrowTransaction {
  escrowTransactionId: string;
  contractId: string;
  transactionId: string;
  milestoneAmountEgp: number;
  platformFeePercent: number;
  platformFeeEgp: number;
  totalChargedEgp: number;
  farmNetEgp: number;
  currency: string;
  status: string;
  gateway: string;
  heldAt?: string | null;
  releasedAt?: string | null;
  refundedAt?: string | null;
  releaseReason?: string | null;
  refundReason?: string | null;
  createdAt: string;
}

export interface MockEscrowSession {
  escrowTransactionId: string;
  contractId: string;
  transactionId: string;
  milestoneLabel: string;
  milestoneAmountEgp: number;
  platformFeePercent: number;
  platformFeeEgp: number;
  totalChargedEgp: number;
  farmNetEgp: number;
  currency: string;
  status: string;
  gateway: string;
  checkoutUrl?: string | null;
  simulatorAvailable?: boolean;
  disclaimer: string;
}

export interface PaymentMilestone {
  transactionId: string;
  sequence: number;
  key: string;
  label: string;
  percent: number;
  amount: number;
  status: PaymentMilestoneStatus | string;
  dueDate?: string | null;
  isOverdue?: boolean;
  paidAt: string | null;
  receivedAt: string | null;
  voidedAt: string | null;
  createdAt: string;
  receiptUrl?: string | null;
  receiptFileName?: string | null;
  receiptUploadedAt?: string | null;
  activeEscrowTransactionId?: string | null;
  escrowStatus?: string | null;
  platformFeeEgp?: number | null;
  totalChargedEgp?: number | null;
  farmNetEgp?: number | null;
  events: PaymentMilestoneEvent[];
}

export interface PaymentMilestoneSchedule {
  contractId: string;
  contractTotal: number | null;
  contractTotalUnavailable: boolean;
  contractTotalUnavailableReason: string | null;
  disclaimer: string;
  mockGatewayEnabled?: boolean;
  gatewayEnabled?: boolean;
  walletEnabled?: boolean;
  platformFeePercent?: number;
  farmPayoutDetails?: FarmPayoutDetails | null;
  scheduleGeneration: number | null;
  isVoided: boolean;
  paymentsFrozenByDispute?: boolean;
  milestones: PaymentMilestone[];
  escrows?: EscrowTransaction[];
}

export interface FarmPayoutDetails {
  bankName?: string | null;
  accountHolderName?: string | null;
  accountMasked?: string | null;
  iban?: string | null;
}
