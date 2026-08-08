export interface UpdateFarmProfileRequest {
  name: string;
  location: string;
  governorate: string;
  latitude?: number | null;
  longitude?: number | null;
  sizeInFeddans: number;
  soilType?: number | null;
}
