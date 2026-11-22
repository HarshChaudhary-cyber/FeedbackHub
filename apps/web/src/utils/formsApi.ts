import type {
  FeedbackForm,
  FeedbackFormSummary,
  CreateFeedbackFormDto,
  UpdateFeedbackFormDto,
  PublicFeedbackForm,
  PublicSubmissionDto,
  PublicSubmissionResult,
  UserCompanyItem,
} from '@feedbackhub/types';

export class FormsApiClient {
  private static async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    // If an active company slug is stored in localStorage, include it as dev header for local development
    const activeCompanySlug = localStorage.getItem('fh_active_company_slug');
    if (activeCompanySlug && !headers['x-dev-tenant-slug']) {
      headers['x-dev-tenant-slug'] = activeCompanySlug;
    }

    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message = body.message || body.error || `HTTP error ${res.status}`;
      throw new Error(message);
    }

    return body as T;
  }

  /**
   * Retrieves user's active companies to support tenant switching in the dashboard.
   */
  static async getMyCompanies(): Promise<UserCompanyItem[]> {
    return this.request<UserCompanyItem[]>('/api/v1/companies/me');
  }

  /**
   * Lists forms for the active tenant.
   */
  static async listForms(params?: {
    search?: string;
    status?: string;
    companySlug?: string;
  }): Promise<FeedbackFormSummary[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);

    const headers: Record<string, string> = {};
    if (params?.companySlug) {
      headers['x-dev-tenant-slug'] = params.companySlug;
    }

    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<FeedbackFormSummary[]>(`/api/v1/tenant/forms${qs}`, {
      method: 'GET',
      headers,
    });
  }

  /**
   * Gets a single form by ID for the tenant.
   */
  static async getForm(formId: string, companySlug?: string): Promise<FeedbackForm> {
    const headers: Record<string, string> = {};
    if (companySlug) headers['x-dev-tenant-slug'] = companySlug;

    return this.request<FeedbackForm>(`/api/v1/tenant/forms/${formId}`, {
      method: 'GET',
      headers,
    });
  }

  /**
   * Creates a new form for the tenant.
   */
  static async createForm(data: CreateFeedbackFormDto, companySlug?: string): Promise<FeedbackForm> {
    const headers: Record<string, string> = {};
    if (companySlug) headers['x-dev-tenant-slug'] = companySlug;

    return this.request<FeedbackForm>('/api/v1/tenant/forms', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
  }

  /**
   * Updates an existing form.
   */
  static async updateForm(
    formId: string,
    data: UpdateFeedbackFormDto,
    companySlug?: string
  ): Promise<FeedbackForm> {
    const headers: Record<string, string> = {};
    if (companySlug) headers['x-dev-tenant-slug'] = companySlug;

    return this.request<FeedbackForm>(`/api/v1/tenant/forms/${formId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
  }

  /**
   * Duplicates an existing form.
   */
  static async duplicateForm(formId: string, companySlug?: string): Promise<FeedbackForm> {
    const headers: Record<string, string> = {};
    if (companySlug) headers['x-dev-tenant-slug'] = companySlug;

    return this.request<FeedbackForm>(`/api/v1/tenant/forms/${formId}/duplicate`, {
      method: 'POST',
      headers,
    });
  }

  /**
   * Publishes a draft form.
   */
  static async publishForm(formId: string, companySlug?: string): Promise<FeedbackForm> {
    const headers: Record<string, string> = {};
    if (companySlug) headers['x-dev-tenant-slug'] = companySlug;

    return this.request<FeedbackForm>(`/api/v1/tenant/forms/${formId}/publish`, {
      method: 'POST',
      headers,
    });
  }

  /**
   * Unpublishes a form back to DRAFT.
   */
  static async unpublishForm(formId: string, companySlug?: string): Promise<FeedbackForm> {
    const headers: Record<string, string> = {};
    if (companySlug) headers['x-dev-tenant-slug'] = companySlug;

    return this.request<FeedbackForm>(`/api/v1/tenant/forms/${formId}/unpublish`, {
      method: 'POST',
      headers,
    });
  }

  /**
   * Archives a form.
   */
  static async archiveForm(formId: string, companySlug?: string): Promise<FeedbackForm> {
    const headers: Record<string, string> = {};
    if (companySlug) headers['x-dev-tenant-slug'] = companySlug;

    return this.request<FeedbackForm>(`/api/v1/tenant/forms/${formId}/archive`, {
      method: 'POST',
      headers,
    });
  }

  /**
   * Deletes a form permanently.
   */
  static async deleteForm(formId: string, companySlug?: string): Promise<{ success: boolean; message: string }> {
    const headers: Record<string, string> = {};
    if (companySlug) headers['x-dev-tenant-slug'] = companySlug;

    return this.request<{ success: boolean; message: string }>(`/api/v1/tenant/forms/${formId}`, {
      method: 'DELETE',
      headers,
    });
  }

  /**
   * Retrieves a preview representation of any form for authenticated managers.
   */
  static async getPreview(formId: string, companySlug?: string): Promise<PublicFeedbackForm> {
    const headers: Record<string, string> = {};
    if (companySlug) headers['x-dev-tenant-slug'] = companySlug;

    return this.request<PublicFeedbackForm>(`/api/v1/tenant/forms/${formId}/preview`, {
      method: 'GET',
      headers,
    });
  }

  /**
   * Unauthenticated: Retrieves a published form by slug for public respondents.
   */
  static async getPublicForm(slug: string): Promise<PublicFeedbackForm> {
    return this.request<PublicFeedbackForm>(`/api/v1/public/forms/${slug}`, {
      method: 'GET',
    });
  }

  /**
   * Unauthenticated: Submits feedback response to a published form.
   */
  static async submitPublicFeedback(
    slug: string,
    data: PublicSubmissionDto
  ): Promise<PublicSubmissionResult> {
    return this.request<PublicSubmissionResult>(`/api/v1/public/forms/${slug}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}
