import {
  ContractAttachmentItem,
  ContractDocumentModel,
  ContractTimelineStep,
} from './models/contract-document.model';

export function buildContractTimeline(
  contract: ContractDocumentModel,
  options?: { viewedAt?: string | null }
): ContractTimelineStep[] {
  const status = (contract.status || '').toLowerCase();
  const isCancelled = status === 'cancelled' || status === 'rejected';
  const isSigned = status === 'signed' || status === 'active';
  const isPending = status === 'pendingsignature';
  const isDraft = status === 'draft';
  const hasBody = !!contract.generatedText?.trim();
  const viewedAt = options?.viewedAt ?? null;

  return [
    {
      id: 'created',
      labelKey: 'contractDoc.timelineCreated',
      icon: 'note_add',
      state: 'done',
      at: contract.createdAt,
    },
    {
      id: 'generated',
      labelKey: 'contractDoc.timelineGenerated',
      icon: 'smart_toy',
      state: hasBody || !isDraft ? 'done' : 'upcoming',
      at: hasBody || !isDraft ? contract.createdAt : null,
    },
    {
      id: 'factory',
      labelKey: 'contractDoc.timelineFactorySigned',
      icon: 'factory',
      state: isDraft ? 'upcoming' : 'done',
      at: isDraft ? null : contract.createdAt,
    },
    {
      id: 'viewed',
      labelKey: 'contractDoc.timelineFarmViewed',
      icon: 'visibility',
      state: viewedAt ? 'done' : isPending || isSigned || isCancelled ? 'current' : 'upcoming',
      at: viewedAt,
    },
    {
      id: 'farm',
      labelKey: 'contractDoc.timelineFarmSigned',
      icon: 'agriculture',
      state: isSigned
        ? 'done'
        : isCancelled
          ? 'rejected'
          : isPending
            ? 'current'
            : 'upcoming',
      at: isSigned ? contract.signedAt : null,
    },
    {
      id: 'completed',
      labelKey: 'contractDoc.timelineCompleted',
      icon: 'task_alt',
      state: isSigned ? 'done' : isCancelled ? 'rejected' : 'upcoming',
      at: isSigned ? contract.signedAt : null,
    },
  ];
}

export function defaultContractAttachments(): ContractAttachmentItem[] {
  return [
    {
      id: 'cert',
      name: 'Certificate.pdf',
      sizeLabel: '240 KB',
      typeLabel: 'PDF',
      icon: 'workspace_premium',
    },
    {
      id: 'delivery',
      name: 'Delivery Terms.pdf',
      sizeLabel: '180 KB',
      typeLabel: 'PDF',
      icon: 'local_shipping',
    },
    {
      id: 'quality',
      name: 'Quality Standards.pdf',
      sizeLabel: '312 KB',
      typeLabel: 'PDF',
      icon: 'verified',
    },
  ];
}
