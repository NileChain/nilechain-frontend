import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { AppTopBarComponent } from '../../../shared/components/app-top-bar/app-top-bar.component';
import { UiErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { AdminService } from '../../../core/services/admin/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateService } from '../../../core/services/translate.service';

interface KbDoc {
  documentId?: string;
  title: string;
  meta: string;
  category: string;
  date: string;
  status: string;
}

@Component({
  selector: 'app-knowledge-base',
  standalone: true,
  imports: [
    TranslatePipe,
    AppTopBarComponent,
    UiErrorStateComponent,
    FormsModule,
    DatePipe,
  ],
  templateUrl: './knowledge-base.component.html',
})
export class KnowledgeBaseComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(TranslateService);

  readonly categories = [
    { key: 'quality', icon: 'verified', count: 0 },
    { key: 'contract', icon: 'contract', count: 0 },
    { key: 'science', icon: 'science', count: 0 },
  ];

  readonly documents = signal<KbDoc[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly uploading = signal(false);
  selectedFiles: FileList | null = null;
  uploadCategory = 'quality';
  uploadTitle = '';

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.adminService
      .getRagDocuments()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (docs) => {
          this.documents.set(
            docs.map((d) => ({
              documentId: d.documentId,
              title: d.title,
              meta: d.filePath?.split(/[\\/]/).pop() ?? 'file',
              category: (d.category ?? 'quality').toLowerCase(),
              date: d.uploadedAt,
              status: d.status ?? 'indexed',
            }))
          );
          this.refreshCategoryCounts();
        },
        error: () => {
          this.documents.set([]);
          this.loadError.set(
            this.i18n.instant('admin.knowledgeBase.loadFailed')
          );
        },
      });
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFiles = input.files;
  }

  upload(): void {
    const file = this.selectedFiles?.item(0);
    if (!file) {
      this.toast.error(this.i18n.instant('admin.knowledgeBase.uploadFormats'));
      return;
    }

    this.uploading.set(true);
    this.adminService
      .uploadRagDocument(
        file,
        this.uploadCategory,
        this.uploadTitle || file.name
      )
      .pipe(finalize(() => this.uploading.set(false)))
      .subscribe({
        next: () => {
          this.toast.success(
            this.i18n.instant('admin.knowledgeBase.uploadSuccess')
          );
          this.selectedFiles = null;
          this.uploadTitle = '';
          this.loadDocuments();
        },
        error: () =>
          this.toast.error(
            this.i18n.instant('admin.knowledgeBase.uploadFailed')
          ),
      });
  }

  private refreshCategoryCounts(): void {
    for (const cat of this.categories) {
      cat.count = this.documents().filter((d) => d.category === cat.key).length;
    }
  }
}
