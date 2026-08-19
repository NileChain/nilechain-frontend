import { UiDatePipe } from '../../../core/pipes/ui-date.pipe';
import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { Review } from '../../../core/models/review/review.model';
import { ReviewService } from '../../../core/services/review/review.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateService } from '../../../core/services/translate.service';
import { UiLoaderComponent } from '../../ui/loader/loader.component';

@Component({
  selector: 'app-contract-review-panel',
  standalone: true,
  imports: [
    UiDatePipe, TranslatePipe, FormsModule, UiLoaderComponent],
  templateUrl: './contract-review-panel.component.html',
})
export class ContractReviewPanelComponent implements OnChanges {
  private readonly reviewsApi = inject(ReviewService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);

  @Input({ required: true }) contractId!: string;
  @Input() targetUserId: string | null = null;
  @Input() canWrite = false;

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly items = signal<Review[]>([]);
  rating = 5;
  comment = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contractId'] && this.contractId) {
      this.load();
    }
  }

  get alreadyReviewed(): boolean {
    const me = this.auth.currentUser()?.id;
    if (!me) {
      return false;
    }
    return this.items().some((r) => r.reviewerId === me);
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.reviewsApi
      .listForContract(this.contractId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (rows) => this.items.set(rows ?? []),
        error: () =>
          this.loadError.set(this.i18n.instant('reviews.loadFailed')),
      });
  }

  submit(): void {
    if (!this.canWrite || this.alreadyReviewed || this.submitting()) {
      return;
    }
    const targetId = this.targetUserId;
    if (!targetId) {
      this.toast.error(this.i18n.instant('reviews.targetMissing'));
      return;
    }
    this.submitting.set(true);
    this.reviewsApi
      .create({
        contractId: this.contractId,
        targetId,
        rating: this.rating,
        comment: this.comment.trim() || null,
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.toast.success(this.i18n.instant('reviews.submitted'));
          this.comment = '';
          this.load();
        },
        error: (err: HttpErrorResponse) =>
          this.toast.error(
            err?.error?.message ?? this.i18n.instant('reviews.submitFailed')
          ),
      });
  }
}
