import { ContractIntegrity } from '../../../core/models/integrity/contract-integrity.model';

export type ContractDocStatus =
  | 'Draft'
  | 'PendingSignature'
  | 'PendingFarmSignature'
  | 'PendingFactorySignature'
  | 'Signed'
  | 'Cancelled'
  | string;

export interface ContractDocumentModel {
  contractId: string;
  matchId?: string | null;
  title?: string | null;
  status: ContractDocStatus;
  createdAt: string;
  updatedAt?: string | null;
  signedAt?: string | null;
  factorySigned?: boolean;
  farmSigned?: boolean;
  factorySignedAt?: string | null;
  farmSignedAt?: string | null;
  factoryName: string;
  farmName: string;
  factoryLocation?: string | null;
  farmLocation?: string | null;
  cropName: string;
  quantityTons: number;
  /** Display unit — contracts are stored in metric tons. */
  unit?: string | null;
  pricePerTon?: number | null;
  deliveryDate?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  hasPendingDateAmendment?: boolean;
  pendingStartsAt?: string | null;
  pendingEndsAt?: string | null;
  dateAmendmentProposedByUserId?: string | null;
  deliveryLocation?: string | null;
  /** Human-readable quality summary from supply request — omit when unknown. */
  qualityRequirements?: string | null;
  /** Payment terms extracted from generated text or structured data — never invented. */
  paymentTerms?: string | null;
  generatedText?: string | null;
  pdfUrl?: string | null;
  version?: string | null;
  matchScore?: number | null;
  riskScore?: number | null;
  farmUserId?: string | null;
  factoryUserId?: string | null;
  canUnwindSigned?: boolean;
  integrity?: ContractIntegrity | null;
}

export type TimelineStepState = 'done' | 'current' | 'upcoming' | 'rejected';

export interface ContractTimelineStep {
  id: string;
  labelKey: string;
  icon: string;
  state: TimelineStepState;
  at?: string | null;
}

export interface ContractAttachmentItem {
  id: string;
  name: string;
  sizeLabel: string;
  typeLabel: string;
  icon?: string;
  url?: string;
  kind?: string;
  canDelete?: boolean;
}

/** API DTO from GET/POST /api/{portal}/contracts/{id}/attachments */
export interface ContractAttachmentDto {
  attachmentId: string;
  contractId: string;
  kind: string;
  fileName: string;
  fileUrl: string;
  contentType: string;
  fileSize: number;
  uploadedByUserId: string;
  createdAt: string;
}
