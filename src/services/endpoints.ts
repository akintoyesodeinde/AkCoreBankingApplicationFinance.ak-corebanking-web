import { apiClient } from './api';
import type {
  AccountCategoryDto,
  AccountGroupDto,
  AccountTypeDto,
  ApproveTransferRequest,
  AuditLogDto,
  AuthResponseDto,
  BankGlMappingDto,
  BulkBatchDto,
  ChartOfAccountDto,
  CostCenterDto,
  CreateMultipleTransferRequest,
  CreateSingleTransferRequest,
  CurrencyDto,
  DashboardSummaryDto,
  DefaultAccountDto,
  FundTransferDto,
  GlPolicyDto,
  InitiateReversalRequest,
  JournalEntryDto,
  LoginRequest,
  MainCaptionDto,
  RegisterRequest,
  RejectTransferRequest,
  ReversalDto,
  SubCaptionDto,
  UnifiedAccountDto,
  UpsertAccountCategoryRequest,
  UpsertAccountGroupRequest,
  UpsertAccountTypeRequest,
  UpsertBankGlMappingRequest,
  UpsertChartOfAccountRequest,
  UpsertCostCenterRequest,
  UpsertCurrencyRequest,
  UpsertDefaultAccountRequest,
  UpsertGlPolicyRequest,
  UpsertMainCaptionRequest,
  UpsertSubCaptionRequest,
  UserProfileDto,
} from '../types/banking';

// 1. Auth
export const authApi = {
  login: (payload: LoginRequest) =>
    apiClient.post<AuthResponseDto>('/auth/login', payload).then((r) => r.data),
  register: (payload: RegisterRequest) =>
    apiClient.post<AuthResponseDto>('/auth/register', payload).then((r) => r.data),
  me: () => apiClient.get<UserProfileDto>('/auth/me').then((r) => r.data),
};

// 2. Dashboard
export const dashboardApi = {
  getSummary: () => apiClient.get<DashboardSummaryDto>('/dashboard/summary').then((r) => r.data),
};

// 3. Finance Setup
export const financeSetupApi = {
  // Account Groups
  getAccountGroups: () =>
    apiClient.get<AccountGroupDto[]>('/finance-setup/account-groups').then((r) => r.data),
  createAccountGroup: (payload: UpsertAccountGroupRequest) =>
    apiClient.post<AccountGroupDto>('/finance-setup/account-groups', payload).then((r) => r.data),
  updateAccountGroup: (id: number, payload: UpsertAccountGroupRequest) =>
    apiClient.put<AccountGroupDto>(`/finance-setup/account-groups/${id}`, payload).then((r) => r.data),
  deleteAccountGroup: (id: number) =>
    apiClient.delete(`/finance-setup/account-groups/${id}`).then((r) => r.data),

  // Account Categories
  getAccountCategories: () =>
    apiClient.get<AccountCategoryDto[]>('/finance-setup/account-categories').then((r) => r.data),
  createAccountCategory: (payload: UpsertAccountCategoryRequest) =>
    apiClient.post<AccountCategoryDto>('/finance-setup/account-categories', payload).then((r) => r.data),
  updateAccountCategory: (id: number, payload: UpsertAccountCategoryRequest) =>
    apiClient.put<AccountCategoryDto>(`/finance-setup/account-categories/${id}`, payload).then((r) => r.data),
  deleteAccountCategory: (id: number) =>
    apiClient.delete(`/finance-setup/account-categories/${id}`).then((r) => r.data),

  // Account Types
  getAccountTypes: () =>
    apiClient.get<AccountTypeDto[]>('/finance-setup/account-types').then((r) => r.data),
  createAccountType: (payload: UpsertAccountTypeRequest) =>
    apiClient.post<AccountTypeDto>('/finance-setup/account-types', payload).then((r) => r.data),
  updateAccountType: (id: number, payload: UpsertAccountTypeRequest) =>
    apiClient.put<AccountTypeDto>(`/finance-setup/account-types/${id}`, payload).then((r) => r.data),
  deleteAccountType: (id: number) =>
    apiClient.delete(`/finance-setup/account-types/${id}`).then((r) => r.data),

  // Cost Centers
  getCostCenters: () =>
    apiClient.get<CostCenterDto[]>('/finance-setup/cost-centers').then((r) => r.data),
  createCostCenter: (payload: UpsertCostCenterRequest) =>
    apiClient.post<CostCenterDto>('/finance-setup/cost-centers', payload).then((r) => r.data),
  updateCostCenter: (id: number, payload: UpsertCostCenterRequest) =>
    apiClient.put<CostCenterDto>(`/finance-setup/cost-centers/${id}`, payload).then((r) => r.data),
  deleteCostCenter: (id: number) =>
    apiClient.delete(`/finance-setup/cost-centers/${id}`).then((r) => r.data),

  // Currencies
  getCurrencies: () =>
    apiClient.get<CurrencyDto[]>('/finance-setup/currencies').then((r) => r.data),
  createCurrency: (payload: UpsertCurrencyRequest) =>
    apiClient.post<CurrencyDto>('/finance-setup/currencies', payload).then((r) => r.data),
  updateCurrency: (id: number, payload: UpsertCurrencyRequest) =>
    apiClient.put<CurrencyDto>(`/finance-setup/currencies/${id}`, payload).then((r) => r.data),
  deleteCurrency: (id: number) =>
    apiClient.delete(`/finance-setup/currencies/${id}`).then((r) => r.data),

  // GL Policies
  getGlPolicies: () =>
    apiClient.get<GlPolicyDto[]>('/finance-setup/gl-policies').then((r) => r.data),
  createGlPolicy: (payload: UpsertGlPolicyRequest) =>
    apiClient.post<GlPolicyDto>('/finance-setup/gl-policies', payload).then((r) => r.data),
  updateGlPolicy: (id: number, payload: UpsertGlPolicyRequest) =>
    apiClient.put<GlPolicyDto>(`/finance-setup/gl-policies/${id}`, payload).then((r) => r.data),
  deleteGlPolicy: (id: number) =>
    apiClient.delete(`/finance-setup/gl-policies/${id}`).then((r) => r.data),
};

// 4. Chart of Accounts & Unified Accounts
export const chartOfAccountsApi = {
  getChartOfAccounts: () =>
    apiClient.get<ChartOfAccountDto[]>('/chart-of-accounts').then((r) => r.data),
  createChartOfAccount: (payload: UpsertChartOfAccountRequest) =>
    apiClient.post<ChartOfAccountDto>('/chart-of-accounts', payload).then((r) => r.data),
  updateChartOfAccount: (id: number, payload: UpsertChartOfAccountRequest) =>
    apiClient.put<ChartOfAccountDto>(`/chart-of-accounts/${id}`, payload).then((r) => r.data),
  deleteChartOfAccount: (id: number) =>
    apiClient.delete(`/chart-of-accounts/${id}`).then((r) => r.data),

  getDefaultAccounts: () =>
    apiClient.get<DefaultAccountDto[]>('/chart-of-accounts/default-accounts').then((r) => r.data),
  createDefaultAccount: (payload: UpsertDefaultAccountRequest) =>
    apiClient.post<DefaultAccountDto>('/chart-of-accounts/default-accounts', payload).then((r) => r.data),
  updateDefaultAccount: (id: number, payload: UpsertDefaultAccountRequest) =>
    apiClient.put<DefaultAccountDto>(`/chart-of-accounts/default-accounts/${id}`, payload).then((r) => r.data),
  deleteDefaultAccount: (id: number) =>
    apiClient.delete(`/chart-of-accounts/default-accounts/${id}`).then((r) => r.data),

  getBankMappings: () =>
    apiClient.get<BankGlMappingDto[]>('/chart-of-accounts/bank-mappings').then((r) => r.data),
  createBankMapping: (payload: UpsertBankGlMappingRequest) =>
    apiClient.post<BankGlMappingDto>('/chart-of-accounts/bank-mappings', payload).then((r) => r.data),
  updateBankMapping: (id: number, payload: UpsertBankGlMappingRequest) =>
    apiClient.put<BankGlMappingDto>(`/chart-of-accounts/bank-mappings/${id}`, payload).then((r) => r.data),
  deleteBankMapping: (id: number) =>
    apiClient.delete(`/chart-of-accounts/bank-mappings/${id}`).then((r) => r.data),

  searchUnifiedAccounts: (params?: { search?: string; kind?: 'ALL' | 'CASA' | 'GL' }) =>
    apiClient
      .get<UnifiedAccountDto[]>('/accounts', {
        params: {
          search: params?.search || undefined,
          kind: params?.kind || 'ALL',
        },
      })
      .then((r) => r.data),
};

// 5. Captions
export const captionsApi = {
  getMainCaptions: () =>
    apiClient.get<MainCaptionDto[]>('/captions/main').then((r) => r.data),
  createMainCaption: (payload: UpsertMainCaptionRequest) =>
    apiClient.post<MainCaptionDto>('/captions/main', payload).then((r) => r.data),
  updateMainCaption: (id: number, payload: UpsertMainCaptionRequest) =>
    apiClient.put<MainCaptionDto>(`/captions/main/${id}`, payload).then((r) => r.data),
  deleteMainCaption: (id: number) =>
    apiClient.delete(`/captions/main/${id}`).then((r) => r.data),

  getSubCaptions: () =>
    apiClient.get<SubCaptionDto[]>('/captions/sub').then((r) => r.data),
  createSubCaption: (payload: UpsertSubCaptionRequest) =>
    apiClient.post<SubCaptionDto>('/captions/sub', payload).then((r) => r.data),
  updateSubCaption: (id: number, payload: UpsertSubCaptionRequest) =>
    apiClient.put<SubCaptionDto>(`/captions/sub/${id}`, payload).then((r) => r.data),
  deleteSubCaption: (id: number) =>
    apiClient.delete(`/captions/sub/${id}`).then((r) => r.data),
};

// 6. Fund Transfers
export const fundTransfersApi = {
  list: (status?: string) =>
    apiClient
      .get<FundTransferDto[]>('/fund-transfers', {
        params: status && status !== 'ALL' ? { status } : undefined,
      })
      .then((r) => r.data),
  createSingle: (payload: CreateSingleTransferRequest, idempotencyKey: string) =>
    apiClient
      .post<FundTransferDto>('/fund-transfers/single', payload, {
        headers: { 'Idempotency-Key': idempotencyKey },
      })
      .then((r) => r.data),
  createMultiple: (payload: CreateMultipleTransferRequest, idempotencyKey: string) =>
    apiClient
      .post<FundTransferDto | FundTransferDto[]>('/fund-transfers/multiple', payload, {
        headers: { 'Idempotency-Key': idempotencyKey },
      })
      .then((r) => r.data),
  approve: (id: number, payload: ApproveTransferRequest) =>
    apiClient.post<FundTransferDto>(`/fund-transfers/${id}/approve`, payload).then((r) => r.data),
  reject: (id: number, payload: RejectTransferRequest) =>
    apiClient.post<FundTransferDto>(`/fund-transfers/${id}/reject`, payload).then((r) => r.data),
};

// 7. Bulk Uploads
export const bulkUploadsApi = {
  downloadTemplate: async () => {
    const response = await apiClient.get<Blob>('/bulk-uploads/template', {
      responseType: 'blob',
    });
    return response.data;
  },
  list: () => apiClient.get<BulkBatchDto[]>('/bulk-uploads').then((r) => r.data),
  upload: (file: File, debitAccountNo: string, narration: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('debitAccountNo', debitAccountNo);
    formData.append('narration', narration);
    return apiClient.post<BulkBatchDto>('/bulk-uploads/upload', formData).then((r) => r.data);
  },
  approve: (batchRef: string) =>
    apiClient
      .post<BulkBatchDto>('/bulk-uploads/approve', null, { params: { batchRef } })
      .then((r) => r.data),
};

// 8. Reversals
export const reversalsApi = {
  list: () => apiClient.get<ReversalDto[]>('/reversals').then((r) => r.data),
  initiate: (payload: InitiateReversalRequest) =>
    apiClient.post<ReversalDto>('/reversals/initiate', payload).then((r) => r.data),
  approve: (id: number) =>
    apiClient.post<ReversalDto>(`/reversals/${id}/approve`).then((r) => r.data),
};

// 9. Journals & Audit Logs
export const ledgerApi = {
  getJournals: () => apiClient.get<JournalEntryDto[]>('/journals').then((r) => r.data),
  getAuditLogs: () => apiClient.get<AuditLogDto[]>('/audit-logs').then((r) => r.data),
};
