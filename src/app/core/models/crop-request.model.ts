export type CropRequestStatus = 'Pending' | 'Approved' | 'Rejected';

export interface CropRequest {
  cropRequestId: string;
  requestedByUserId: string;
  name: string;
  category: string | null;
  description: string | null;
  status: CropRequestStatus | string;
  adminNotes: string | null;
  reviewedByUserId: string | null;
  approvedCropTypeId: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface CreateCropRequestPayload {
  name: string;
  category?: string | null;
  description?: string | null;
}

export interface ReviewCropRequestPayload {
  name?: string | null;
  category?: string | null;
  description?: string | null;
  adminNotes?: string | null;
}
