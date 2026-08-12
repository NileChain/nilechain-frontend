export interface FarmPublicDocumentDto {
  documentId: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
}

export interface FarmPublicRatingSummaryDto {
  averageRating: number;
  ratingCount: number;
}

export interface FarmPublicProfileDto {
  farmId: string;
  name: string;
  governorate: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  sizeInFeddans: number | null;
  description?: string | null;
  isVerified: boolean;
  riskScore: number | null;
  riskLevel: string;
  ownerDisplayName: string;
  cropTypes: string[];
  certifications?: string[];
  imageUrls?: string[];
  documents: FarmPublicDocumentDto[];
  rating: FarmPublicRatingSummaryDto;
}
