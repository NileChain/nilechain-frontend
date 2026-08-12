export interface ContractIntegrity {
  anchorId: string;
  contractId: string;
  contentHash: string;
  shortHash: string;
  previousHash: string;
  chainIndex: number;
  txRef: string;
  status: string;
  anchoredAtUtc: string;
}

export type IntegrityVerifyOutcome =
  | 'Verified'
  | 'Superseded'
  | 'Tampered'
  | 'NotFound';

export interface ContractIntegrityVerify {
  outcome: IntegrityVerifyOutcome | string;
  contentHash: string;
  previousHash?: string | null;
  chainIndex?: number | null;
  txRef?: string | null;
  anchoredAtUtc?: string | null;
  status?: string | null;
  contractId?: string | null;
  farmName?: string | null;
  factoryName?: string | null;
  cropName?: string | null;
  signedAt?: string | null;
  currentContentMatches: boolean;
  honestyNote: string;
}
