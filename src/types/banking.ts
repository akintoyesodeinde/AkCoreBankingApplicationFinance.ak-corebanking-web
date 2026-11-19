// =============================================================================
// Ak Core Banking Application — Domain & API Type Definitions
// =============================================================================

export type UserRole = 'FinanceAdmin' | 'TellerMaker' | 'SupervisorChecker' | 'Auditor' | string;

export interface UserProfileDto {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  branchCode: string;
  branchName: string;
  companyCode: string;
  department: string;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: UserProfileDto;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: string;
  branchCode: string;
  department: string;
}

// -----------------------------------------------------------------------------
// Finance Setup
// -----------------------------------------------------------------------------
export interface AccountGroupDto {
  id: number;
  code: string;
  description: string;
  categoryType: string;
  isActive: boolean;
  createdAt: string;
}

export interface UpsertAccountGroupRequest {
  code: string;
  description: string;
  categoryType: string;
  isActive: boolean;
}

export interface AccountCategoryDto {
  id: number;
  descriptions: string;
  accountGroupId: number;
  accountGroupName: string;
  isActive: boolean;
}

export interface UpsertAccountCategoryRequest {
  descriptions: string;
  accountGroupId: number;
  isActive: boolean;
}

export interface AccountTypeDto {
  id: number;
  description: string;
  accountCategoryId: number;
  accountCategoryName: string;
  subCaptionId: number | null;
  subCaptionName: string | null;
  active: boolean;
}

export interface UpsertAccountTypeRequest {
  description: string;
  accountCategoryId: number;
  subCaptionId: number | null;
  active: boolean;
}

export interface CostCenterDto {
  id: number;
  code: string;
  department: string;
  branchCode: string;
  managerName: string;
  isActive: boolean;
}

export interface UpsertCostCenterRequest {
  code: string;
  department: string;
  branchCode: string;
  managerName: string;
  isActive: boolean;
}

export interface CurrencyDto {
  id: number;
  currCode: string;
  currName: string;
  currSymbol: string;
  exchangeRateToNgn: number;
  isBaseCurrency: boolean;
  isActive: boolean;
}

export interface UpsertCurrencyRequest {
  currCode: string;
  currName: string;
  currSymbol: string;
  exchangeRateToNgn: number;
  isBaseCurrency: boolean;
  isActive: boolean;
}

export interface GlPolicyDto {
  id: number;
  glLength: number;
  companyCodeLength: number;
  branchCodeLength: number;
  productCodeLength: number;
  currencyCodeLength: number;
  enforceBalancedPosting: boolean;
  requireMakerChecker: boolean;
  makerCheckerThreshold: number;
}

export interface UpsertGlPolicyRequest {
  glLength: number;
  companyCodeLength: number;
  branchCodeLength: number;
  productCodeLength: number;
  currencyCodeLength: number;
  enforceBalancedPosting: boolean;
  requireMakerChecker: boolean;
  makerCheckerThreshold: number;
}

// -----------------------------------------------------------------------------
// Captions
// -----------------------------------------------------------------------------
export interface MainCaptionDto {
  id: number;
  code: string;
  description: string;
  accountCategoryId: number;
  accountCategoryName: string;
  statementType: string;
  displayOrder: number;
  isActive: boolean;
}

export interface UpsertMainCaptionRequest {
  code: string;
  description: string;
  accountCategoryId: number;
  statementType: string;
  displayOrder: number;
  isActive: boolean;
}

export interface SubCaptionDto {
  id: number;
  code: string;
  accountSubName: string;
  mainCaptionId: number;
  mainCaptionName: string;
  currency: string;
  accountStatus: string;
  isActive: boolean;
}

export interface UpsertSubCaptionRequest {
  code: string;
  accountSubName: string;
  mainCaptionId: number;
  currency: string;
  accountStatus: string;
  isActive: boolean;
}

// -----------------------------------------------------------------------------
// Chart of Accounts & Unified Accounts
// -----------------------------------------------------------------------------
export interface ChartOfAccountDto {
  id: number;
  accountId: string;
  accountName: string;
  accountTypeId: number;
  accountTypeName: string;
  accountGroupId: number;
  accountGroupName: string;
  accountCategoryId: number;
  accountCategoryName: string;
  branchCode: string;
  currCode: string;
  costCenterCode: string;
  balance: number;
  accountStatus: string;
  createdBy: string;
  dateCreated: string;
}

export interface UpsertChartOfAccountRequest {
  accountId: string;
  accountName: string;
  accountTypeId: number;
  accountGroupId: number;
  accountCategoryId: number;
  branchCode: string;
  currCode: string;
  costCenterCode: string;
  balance: number;
  accountStatus: string;
}

export interface DefaultAccountDto {
  id: number;
  code: string;
  accountRole: string;
  accountId: string;
  accountName: string;
  description: string;
}

export interface UpsertDefaultAccountRequest {
  code: string;
  accountRole: string;
  accountId: string;
  accountName: string;
  description: string;
}

export interface BankGlMappingDto {
  id: number;
  bankCode: string;
  bankName: string;
  glAccountId: string;
  glAccountName: string;
  settlementAccountNo: string;
  branchName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
}

export interface UpsertBankGlMappingRequest {
  bankCode: string;
  bankName: string;
  glAccountId: string;
  glAccountName: string;
  settlementAccountNo: string;
  branchName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
}

export interface UnifiedAccountDto {
  accountNumber: string;
  accountName: string;
  accountKind: 'CASA' | 'GL' | string;
  currency: string;
  availableBalance: number;
  ledgerBalance: number;
  overdraftLimit: number;
  postNoDebit: boolean;
  postNoCredit: boolean;
  branchCode: string;
  status: string;
}

// -----------------------------------------------------------------------------
// Transfers, Bulk Uploads, Reversals, Journals, Dashboard, Audit Logs
// -----------------------------------------------------------------------------
export type OperationTypeCode = 1 | 2 | 3 | 4;

export interface CreateSingleTransferRequest {
  debitAccountNo: string;
  creditAccountNo: string;
  amount: number;
  currency: string;
  operationType: OperationTypeCode;
  narration: string;
  valueDate: string | null;
  chequeNo: string | null;
}

export interface MultipleCreditLineRequest {
  creditAccountNo: string;
  amount: number;
  narration: string;
  chequeNo: string | null;
}

export interface CreateMultipleTransferRequest {
  debitAccountNo: string;
  debitNarration: string;
  valueDate: string | null;
  currency: string;
  creditLines: MultipleCreditLineRequest[];
}

export interface ApproveTransferRequest {
  remarks: string | null;
}

export interface RejectTransferRequest {
  reason: string;
}

export interface FundTransferDto {
  id: number;
  reference: string;
  batchReference: string | null;
  transferType: string;
  operationType: string;
  debitAccountNo: string;
  debitAccountName: string;
  creditAccountNo: string;
  creditAccountName: string;
  amount: number;
  currency: string;
  narration: string;
  valueDate: string;
  postDate: string;
  status: string;
  createdBy: string;
  createdAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  journalReference: string | null;
}

export interface BulkBatchItemDto {
  id: number;
  rowNumber: number;
  creditAccountNo: string;
  creditAccountName: string;
  amount: number;
  narration: string;
  chequeNo: string | null;
  isValid: boolean;
  validationMessage: string;
}

export interface BulkBatchDto {
  id: number;
  batchRef: string;
  debitAccountNo: string;
  debitAccountName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  totalAmount: number;
  status: string;
  uploadedBy: string;
  uploadedAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
  items: BulkBatchItemDto[];
}

export interface InitiateReversalRequest {
  originalTransferId: number;
  reason: string;
}

export interface ReversalDto {
  id: number;
  reversalReference: string;
  originalTransferId: number;
  originalReference: string;
  debitAccountNo: string;
  creditAccountNo: string;
  amount: number;
  reason: string;
  status: string;
  requestedBy: string;
  requestedAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
  contraJournalReference: string | null;
}

export interface JournalLineDto {
  id: number;
  accountNo: string;
  accountName: string;
  accountKind: string;
  debitAmount: number;
  creditAmount: number;
  narration: string;
}

export interface JournalEntryDto {
  id: number;
  journalReference: string;
  sourceReference: string;
  transactionType: string;
  postDate: string;
  valueDate: string;
  totalDebit: number;
  totalCredit: number;
  currency: string;
  postedBy: string;
  approvedBy: string;
  status: string;
  lines: JournalLineDto[];
}

export interface AuditLogDto {
  id: number;
  action: string;
  entityName: string;
  entityId: string;
  performedBy: string;
  userRole: string;
  branchCode: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export interface DashboardSummaryDto {
  totalCasaAccounts: number;
  totalGlAccounts: number;
  totalCustomerDeposits: number;
  totalGlAssets: number;
  totalGlLiabilities: number;
  totalDebitsPosted: number;
  totalCreditsPosted: number;
  isTrialBalanceBalanced: boolean;
  pendingApprovalsCount: number;
  pendingReversalsCount: number;
  todayTransactionsCount: number;
  recentJournals: JournalEntryDto[];
  pendingTransfers: FundTransferDto[];
}
