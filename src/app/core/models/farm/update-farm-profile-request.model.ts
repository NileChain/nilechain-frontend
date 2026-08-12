export interface UpdateFarmProfileRequest {
  name: string;
  location: string;
  governorate: string;
  latitude?: number | null;
  longitude?: number | null;
  sizeInFeddans: number;
  soilType?: number | null;
  description?: string | null;
  bankName?: string | null;
  accountHolderName?: string | null;
  bankAccountNumber?: string | null;
  iban?: string | null;
}
