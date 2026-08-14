import { ContractIntegrity } from '../integrity/contract-integrity.model';

export interface FarmContract {
  contractId: string;
  matchId: string;
  factoryName: string;
  factoryLocation: string | null;
  farmName?: string | null;
  cropName: string;
  quantityTons: number;
  pricePerTon: number | null;
  deliveryDate: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  hasPendingDateAmendment?: boolean;
  pendingStartsAt?: string | null;
  pendingEndsAt?: string | null;
  dateAmendmentProposedByUserId?: string | null;
  deliveryLocation?: string | null;
  qualityRequirements?: string | null;
  generatedText?: string | null;
  pdfUrl?: string | null;
  status: string;
  createdAt: string;
  signedAt: string | null;
  factorySigned?: boolean;
  farmSigned?: boolean;
  factorySignedAt?: string | null;
  farmSignedAt?: string | null;
  updatedAt?: string | null;
  matchScore?: number | null;
  riskScore?: number | null;
  integrity?: ContractIntegrity | null;
  farmUserId?: string | null;
  factoryUserId?: string | null;
  canUnwindSigned?: boolean;
  lastRevision?: import('../../../shared/contracts/contract-diff.util').ContractRevisionView | null;
}
