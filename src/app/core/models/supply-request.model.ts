export type SupplyRequestStatus = 'draft' | 'active' | 'matched' | 'pending-approval';

export interface CreateSupplyRequestPayload {
	cropType: string;
	quantity: number;
	targetPrice: number;
	deliveryDate: string;
	qualitySpecs?: string;
	governorates: string[];
}

export interface SupplyRequestDto {
	id: string;
	cropType: string;
	quantity: number;
	targetPrice: number;
	deliveryDate: string;
	qualitySpecs?: string;
	governorates: string[];
	status: SupplyRequestStatus;
	matchesCount: number;
	createdAt: string;
}
