import { ContractDocumentModel } from './models/contract-document.model';
import {
  detectDocumentDir,
  displayText,
  extractPaymentTermsHint,
} from './contract-text.util';

/** Minimal shared shape for farm/factory contract API DTOs. */
export interface ContractApiLike {
  contractId: string;
  matchId?: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string | null;
  signedAt?: string | null;
  factorySigned?: boolean | null;
  farmSigned?: boolean | null;
  factorySignedAt?: string | null;
  farmSignedAt?: string | null;
  factoryName?: string | null;
  farmName?: string | null;
  factoryLocation?: string | null;
  farmLocation?: string | null;
  cropName?: string | null;
  quantityTons: number;
  pricePerTon?: number | null;
  deliveryDate?: string | null;
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
  matchScore?: number | null;
  riskScore?: number | null;
  farmUserId?: string | null;
  factoryUserId?: string | null;
  canUnwindSigned?: boolean;
  integrity?: ContractDocumentModel['integrity'];
}

/**
 * Maps portal contract DTOs into the shared deed document model.
 * Does not invent commercial or legal values.
 */
export function toContractDocumentModel(
  c: ContractApiLike,
  options?: { version?: string; title?: string | null }
): ContractDocumentModel {
  const generatedText = c.generatedText ?? null;
  return {
    contractId: c.contractId,
    matchId: c.matchId ?? null,
    title: options?.title ?? undefined,
    status: c.status,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt ?? c.signedAt ?? c.createdAt,
    signedAt: c.signedAt,
    factorySigned: c.factorySigned ?? false,
    farmSigned: c.farmSigned ?? false,
    factorySignedAt: c.factorySignedAt ?? null,
    farmSignedAt: c.farmSignedAt ?? null,
    factoryName: displayText(c.factoryName, '—'),
    farmName: displayText(c.farmName, '—'),
    factoryLocation: displayText(c.factoryLocation, ''),
    farmLocation: displayText(c.farmLocation, ''),
    cropName: displayText(c.cropName, '—'),
    quantityTons: c.quantityTons,
    unit: 'MT',
    pricePerTon: c.pricePerTon,
    deliveryDate: c.deliveryDate,
    startsAt: c.startsAt ?? null,
    endsAt: c.endsAt ?? null,
    hasPendingDateAmendment: !!c.hasPendingDateAmendment,
    pendingStartsAt: c.pendingStartsAt ?? null,
    pendingEndsAt: c.pendingEndsAt ?? null,
    dateAmendmentProposedByUserId: c.dateAmendmentProposedByUserId ?? null,
    deliveryLocation: displayText(
      c.deliveryLocation ?? c.factoryLocation,
      ''
    ),
    qualityRequirements: c.qualityRequirements?.trim() || null,
    paymentTerms: extractPaymentTermsHint(generatedText),
    generatedText,
    pdfUrl: c.pdfUrl,
    version: options?.version ?? '1.0',
    matchScore: c.matchScore,
    riskScore: c.riskScore,
    farmUserId: c.farmUserId ?? null,
    factoryUserId: c.factoryUserId ?? null,
    canUnwindSigned: !!c.canUnwindSigned,
    integrity: c.integrity ?? null,
  };
}

export function documentDirForContract(
  model: Pick<ContractDocumentModel, 'generatedText'>
): 'rtl' | 'ltr' {
  return detectDocumentDir(model.generatedText);
}

/** Human-facing contract number NC-YYYY-XXXXXXXX from GUID + year. */
export function formatContractNumber(
  contractId: string,
  createdAt?: string | null
): string {
  const year = createdAt ? new Date(createdAt).getFullYear() : new Date().getFullYear();
  const short = (contractId || '').replace(/-/g, '').slice(0, 8).toUpperCase();
  return short ? `NC-${year}-${short}` : '—';
}
