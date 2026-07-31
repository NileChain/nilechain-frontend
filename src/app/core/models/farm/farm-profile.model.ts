export interface FarmProfile {
  farmId: string;
  name: string;
  location: string | null;
  governorate: string | null;
  sizeInFeddans: number | null;
  soilType: string | null;
  phone: string | null;
  isVerified: boolean;
  completionPercent: number;
  cropTypes: CropType[];
  documents: FarmDocument[];
}

export interface CropType {
  cropTypeId: string;
  name: string;
}

export interface FarmDocument {
  documentId: string;
  name: string;
  fileUrl: string;
  size: string;
  fileType: string;
}
