import { KybKind } from '../farm/farm-profile.model';

export interface FactoryProfile {
  factoryId: string;
  name: string;
  location: string | null;
  governorate: string | null;
  latitude?: number | null;
  longitude?: number | null;
  industryType: string | null;
  phone: string | null;
  isVerified: boolean;
  averageRating: number;
  ratingCount: number;
  completionPercent: number;
  documents: FactoryDocument[];
}

export interface UpdateFactoryProfileRequest {
  name: string;
  location?: string | null;
  governorate?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  industryType?: string | null;
}

export interface FactoryDocument {
  documentId: string;
  name: string;
  fileUrl: string;
  size: string;
  fileType: string;
  kybKind?: KybKind | string;
}
