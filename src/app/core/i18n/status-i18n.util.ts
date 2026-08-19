/** Maps persisted English API enums to existing i18n keys. Storage stays English. */

export function adminWithdrawalStatusKey(status: string): string {
  switch (status) {
    case 'Processing':
      return 'admin.withdrawals.status.Processing';
    case 'Completed':
      return 'admin.withdrawals.status.Completed';
    case 'Failed':
      return 'admin.withdrawals.status.Failed';
    case 'Cancelled':
      return 'admin.withdrawals.status.Cancelled';
    default:
      return 'admin.withdrawals.status.Pending';
  }
}

export function walletMethodKey(method: string): string {
  if (method === 'BankTransfer') {
    return 'wallet.method.BankTransfer';
  }
  return 'wallet.method.BankTransfer';
}

export function channelMessageStatusKey(status: string): string {
  if (status === 'Failed') {
    return 'admin.channelMessages.status.Failed';
  }
  return 'admin.channelMessages.status.Logged';
}

export function walletWithdrawalStatusKey(status: string): string {
  switch (status) {
    case 'Processing':
      return 'wallet.withdrawalStatus.Processing';
    case 'Completed':
      return 'wallet.withdrawalStatus.Completed';
    case 'Failed':
      return 'wallet.withdrawalStatus.Failed';
    case 'Cancelled':
      return 'wallet.withdrawalStatus.Cancelled';
    default:
      return 'wallet.withdrawalStatus.Pending';
  }
}

export function walletLedgerTypeKey(type: string): string {
  switch (type) {
    case 'TopUp':
      return 'wallet.ledgerType.TopUp';
    case 'MilestoneHold':
      return 'wallet.ledgerType.MilestoneHold';
    case 'MilestoneReleaseToFarm':
      return 'wallet.ledgerType.MilestoneReleaseToFarm';
    case 'PlatformFee':
      return 'wallet.ledgerType.PlatformFee';
    case 'Withdrawal':
      return 'wallet.ledgerType.Withdrawal';
    case 'RefundToFactory':
      return 'wallet.ledgerType.RefundToFactory';
    case 'ContractDealHold':
      return 'wallet.ledgerType.ContractDealHold';
    default:
      return 'wallet.ledgerType.Adjustment';
  }
}

export function fulfillmentStatusLabelKey(status: string): string {
  switch (status) {
    case 'Shipped':
      return 'fulfillment.status.Shipped';
    case 'Received':
      return 'fulfillment.status.Received';
    case 'QualityChecked':
      return 'fulfillment.status.QualityChecked';
    case 'Fulfilled':
      return 'fulfillment.status.Fulfilled';
    case 'Voided':
      return 'fulfillment.status.Voided';
    case 'RejectedAtGate':
      return 'fulfillment.status.RejectedAtGate';
    default:
      return 'fulfillment.status.Planned';
  }
}

export function factoryMatchStatusLabelKey(status: string): string {
  const s = (status || '').toLowerCase();
  if (s === 'accepted') return 'factory.matches.statusAccepted';
  if (s === 'rejected') return 'factory.matches.statusRejected';
  if (s === 'countered') return 'factory.matches.statusCountered';
  if (s === 'selected') return 'factory.matches.statusSelected';
  return 'factory.matches.statusProposed';
}

export function factoryProgressRiskLabelKey(level: string): string {
  const s = (level || '').toLowerCase();
  if (s === 'low') return 'factory.progress.riskLow';
  if (s === 'high') return 'factory.progress.riskHigh';
  return 'factory.progress.riskMedium';
}

export function geographicScopeLabelKey(scope: string): string {
  const s = (scope || '').toLowerCase();
  if (s === 'nearby') return 'factory.supplyRequest.scopeNearby';
  if (s === 'nationwide') return 'factory.supplyRequest.scopeNationwide';
  return 'factory.supplyRequest.scopeExact';
}
