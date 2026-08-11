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
  const factorySigned = !!contract.factorySigned;
  const farmSigned = !!contract.farmSigned;
  const isFullySigned =
    status === 'signed' || status === 'active' || (factorySigned && farmSigned);
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
      state: hasBody ? 'done' : 'upcoming',
      at: hasBody ? contract.createdAt : null,
    },
    {
      id: 'factory',
      labelKey: 'contractDoc.timelineFactorySigned',
      icon: 'factory',
      state: factorySigned
        ? 'done'
        : isCancelled
          ? 'rejected'
          : farmSigned
            ? 'current'
            : hasBody
              ? 'current'
              : 'upcoming',
      at: contract.factorySignedAt ?? null,
    },
    {
      id: 'viewed',
      labelKey: 'contractDoc.timelineFarmViewed',
      icon: 'visibility',
      state: viewedAt
        ? 'done'
        : factorySigned && !farmSigned
          ? 'current'
          : 'upcoming',
      at: viewedAt,
    },
    {
      id: 'farm',
      labelKey: 'contractDoc.timelineFarmSigned',
      icon: 'agriculture',
      state: farmSigned
        ? 'done'
        : isCancelled
          ? 'rejected'
          : factorySigned
            ? 'current'
            : 'upcoming',
      at: contract.farmSignedAt ?? null,
    },
    {
      id: 'completed',
      labelKey: 'contractDoc.timelineCompleted',
      icon: 'task_alt',
      state: isFullySigned ? 'done' : isCancelled ? 'rejected' : 'upcoming',
      at: isFullySigned ? contract.signedAt : null,
    },
  ];
}

export function defaultContractAttachments(): ContractAttachmentItem[] {
  // No placeholder PDFs — only show attachments when real files exist.
  return [];
}
