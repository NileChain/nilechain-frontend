export interface UpdateFarmProfileRequest {
  name: string;
  location: string;
  governorate: string;
  sizeInFeddans: number;
  soilType?: number | null;
}
