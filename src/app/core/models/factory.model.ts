export interface FactoryProfile {
  factoryId: string;
  name: string;
  location: string;
  governorate: string;
  industryType: string;
  phone: string;
  isVerified: boolean;
  averageRating: number;
  ratingCount: number;
  completionPercent: number;
}

export interface UpdateFactoryProfileRequest {
  name: string;
  location: string;
  governorate: string;
  industryType: string;
}
