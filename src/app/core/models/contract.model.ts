export type ContractStatus = 'Draft' | 'PendingSignature' | 'Signed' | 'Cancelled';

export interface Contract {
  contractId: string;
  matchId: string;
  generatedText: string | null;
  pdfUrl: string | null;
  status: ContractStatus;
  createdAt: string;
  signedAt: string | null;
}
