import { Injectable } from '@angular/core';
import { Observable, delay, map, of, throwError } from 'rxjs';
import {
	CreateSupplyRequestPayload,
	SupplyRequestDto,
	SupplyRequestStatus,
} from '../models/supply-request.model';

@Injectable({ providedIn: 'root' })
export class SupplyRequestService {
	private readonly storageKey = 'nilechain.factory.supplyRequests';

	listRequests(): Observable<SupplyRequestDto[]> {
		return of(this.readAll()).pipe(
			map((rows) =>
				[...rows].sort(
					(a: SupplyRequestDto, b: SupplyRequestDto) =>
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				)
			),
			delay(350)
		);
	}

	createRequest(payload: CreateSupplyRequestPayload): Observable<SupplyRequestDto> {
		if (!payload.cropType || payload.quantity <= 0 || payload.targetPrice <= 0 || !payload.deliveryDate) {
			return throwError(() => new Error('Invalid supply request payload'));
		}

		const next: SupplyRequestDto = {
			id: `REQ-${Date.now().toString().slice(-6)}`,
			cropType: payload.cropType,
			quantity: payload.quantity,
			targetPrice: payload.targetPrice,
			deliveryDate: payload.deliveryDate,
			qualitySpecs: payload.qualitySpecs,
			governorates: payload.governorates,
			status: this.pickInitialStatus(payload.quantity),
			matchesCount: this.estimateMatches(payload.governorates.length),
			createdAt: new Date().toISOString(),
		};

		const all = this.readAll();
		all.unshift(next);
		localStorage.setItem(this.storageKey, JSON.stringify(all));

		return of(next).pipe(delay(550));
	}

	private readAll(): SupplyRequestDto[] {
		const raw = localStorage.getItem(this.storageKey);

		if (!raw) {
			const seeded = this.seedRequests();
			localStorage.setItem(this.storageKey, JSON.stringify(seeded));
			return seeded;
		}

		try {
			const parsed = JSON.parse(raw) as SupplyRequestDto[];
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			localStorage.removeItem(this.storageKey);
			return this.seedRequests();
		}
	}

	private estimateMatches(governoratesCount: number): number {
		return Math.max(2, Math.min(14, governoratesCount * 3));
	}

	private pickInitialStatus(quantity: number): SupplyRequestStatus {
		if (quantity > 600) {
			return 'pending-approval';
		}

		return 'active';
	}

	private seedRequests(): SupplyRequestDto[] {
		return [
			{
				id: 'REQ-4022',
				cropType: 'wheat',
				quantity: 500,
				targetPrice: 12000,
				deliveryDate: '2026-08-15',
				qualitySpecs: 'Moisture <= 12%',
				governorates: ['beheira', 'giza'],
				status: 'active',
				matchesCount: 8,
				createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
			},
			{
				id: 'REQ-4019',
				cropType: 'cotton',
				quantity: 250,
				targetPrice: 9800,
				deliveryDate: '2026-08-18',
				qualitySpecs: 'Premium fiber quality',
				governorates: ['alex'],
				status: 'matched',
				matchesCount: 11,
				createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
			},
			{
				id: 'REQ-3988',
				cropType: 'corn',
				quantity: 100,
				targetPrice: 7600,
				deliveryDate: '2026-08-22',
				governorates: ['minya'],
				status: 'draft',
				matchesCount: 3,
				createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
			},
			{
				id: 'REQ-3942',
				cropType: 'rice',
				quantity: 1200,
				targetPrice: 13200,
				deliveryDate: '2026-08-29',
				governorates: ['cairo', 'giza', 'beheira'],
				status: 'pending-approval',
				matchesCount: 5,
				createdAt: new Date(Date.now() - 86400000 * 16).toISOString(),
			},
		];
	}
}
