export type FactoryMatchRiskLevel = 'low' | 'medium' | 'high';

export interface FactoryMatchItemDto {
	id: string;
	name: string;
	location: string;
	cropType: string;
	quantityTons: number;
	matchScore: number;
	riskScore: number;
	riskLevel: FactoryMatchRiskLevel;
	verified: boolean;
	featured: boolean;
	latitude: number;
	longitude: number;
}
