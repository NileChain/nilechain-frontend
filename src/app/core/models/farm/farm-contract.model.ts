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
  deliveryLocation?: string | null;
  generatedText?: string | null;
  pdfUrl?: string | null;
  status: string;
  createdAt: string;
  signedAt: string | null;
  updatedAt?: string | null;
  matchScore?: number | null;
  riskScore?: number | null;
}
