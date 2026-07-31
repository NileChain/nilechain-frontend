export interface FactoryProfile {
  factoryId: string;
  name: string;
  location: string | null;
  governorate: string | null;
  industryType: string | null;
  phone: string | null;
  isVerified: boolean;
  averageRating: number;
  ratingCount: number;
  completionPercent: number;
}

export interface UpdateFactoryProfileRequest {
  name: string;
  location?: string | null;
  governorate?: string | null;
  industryType?: string | null;
}
