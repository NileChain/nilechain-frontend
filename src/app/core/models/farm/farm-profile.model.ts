export interface FarmProfile {

  farmId: string;

  name: string;

  location: string;

  governorate: string;

  sizeInFeddans: number;

  soilType: string;

  phone: string;

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
