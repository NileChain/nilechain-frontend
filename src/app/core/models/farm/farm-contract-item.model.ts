export interface FarmContractItem {
  contractId: string;
  matchId: string;
  factoryName: string;
  factoryLocation: string | null;
  cropName: string;
  quantityTons: number;
  pricePerTon: number | null;
  deliveryDate: string | null;
  status: string;
  createdAt: string;
  signedAt: string | null;
}
