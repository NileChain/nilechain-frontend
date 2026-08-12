export interface FarmProfile {
  farmId: string;
  name: string;
  location: string | null;
  governorate: string | null;
  latitude?: number | null;
  longitude?: number | null;
  sizeInFeddans: number | null;
  soilType: string | null;
  phone: string | null;
  description: string | null;
  bankName?: string | null;
  accountHolderName?: string | null;
  bankAccountMasked?: string | null;
  iban?: string | null;
  isVerified: boolean;
  completionPercent: number;
  cropTypes: FarmCropListing[];
  certifications: FarmCertification[];
  documents: FarmDocument[];
  images: FarmImage[];
}

/** Catalog crop type (from /crop-types). */
export interface CropType {
  cropTypeId: string;
  name: string;
}

/** Farm-linked crop with commercial availability. */
export interface FarmCropListing {
  cropTypeId: string;
  name: string;
  availableQuantityTons: number | null;
  availableFrom: string | null;
  availableTo: string | null;
  minPricePerTon: number | null;
  isPublished: boolean;
}

export interface FarmCropCommercialPayload {
  availableQuantityTons?: number | null;
  availableFrom?: string | null;
  availableTo?: string | null;
  minPricePerTon?: number | null;
  isPublished?: boolean | null;
}

export interface FarmCertification {
  certificationId: string;
  name: string;
  issuedAt: string;
  expiresAt: string | null;
  isExpired: boolean;
}

export interface CertificationCatalogItem {
  certificationId: string;
  name: string;
}

export interface FarmDocument {
  documentId: string;
  name: string;
  fileUrl: string;
  size: string;
  fileType: string;
}

export interface FarmImage {
  imageId: string;
  fileName: string;
  fileUrl: string;
  sortOrder: number;
}
