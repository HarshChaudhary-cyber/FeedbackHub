/** @vitest-environment jsdom */
/* eslint-disable @typescript-eslint/no-explicit-any */
import '../test-setup';
import React, { act } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FormsListPage } from '../pages/FormsListPage';
import { FormsApiClient } from '../utils/formsApi';

vi.mock('../utils/formsApi', () => ({
  FormsApiClient: {
    getMyCompanies: vi.fn(),
    listForms: vi.fn(),
    duplicateForm: vi.fn(),
    deleteForm: vi.fn(),
    archiveForm: vi.fn(),
    unpublishForm: vi.fn(),
  },
}));

describe('FormsListPage Component', () => {
  const mockCompanies = [
    {
      id: 'comp-1',
      name: 'Acme Corp',
      slug: 'acme',
      role: 'OWNER',
      status: 'ACTIVE',
      joinedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  ];

  const mockForms = [
    {
      id: 'form-1',
      companyId: 'comp-1',
      title: 'Customer NPS Survey',
      slug: 'customer-nps-survey',
      description: 'Quarterly NPS survey for active customers',
      audienceType: 'CUSTOMER' as const,
      anonymityMode: 'ANONYMOUS_ONLY' as const,
      status: 'PUBLISHED' as const,
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questionCount: 3,
      responseCount: 12,
    },
    {
      id: 'form-2',
      companyId: 'comp-1',
      title: 'Employee Feedback Draft',
      slug: 'employee-feedback-draft',
      description: 'Internal pulse survey',
      audienceType: 'EMPLOYEE' as const,
      anonymityMode: 'ANONYMOUS_ONLY' as const,
      status: 'DRAFT' as const,
      publishedAt: null,
      updatedAt: new Date().toISOString(),
      questionCount: 5,
      responseCount: 0,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (FormsApiClient.getMyCompanies as any).mockResolvedValue(mockCompanies);
    (FormsApiClient.listForms as any).mockResolvedValue(mockForms);

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  it('renders header, company switcher, and loaded forms', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <FormsListPage />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Feedback Forms')).toBeTruthy();
      expect(screen.getByText('Customer NPS Survey')).toBeTruthy();
      expect(screen.getByText('Employee Feedback Draft')).toBeTruthy();
    });

    // Check status badges
    expect(screen.getAllByText('Published').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Draft').length).toBeGreaterThan(0);

    // Check counts
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('filters forms by search input and status tabs', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <FormsListPage />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Customer NPS Survey')).toBeTruthy();
    });

    const searchInput = screen.getByPlaceholderText(/Search forms by title/i);
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'NPS' } });
    });

    expect(FormsApiClient.listForms).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'NPS' })
    );

    // Click Draft tab
    const draftTab = screen.getByRole('button', { name: /^Draft$/i });
    await act(async () => {
      fireEvent.click(draftTab);
    });

    expect(FormsApiClient.listForms).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'DRAFT' })
    );
  });

  it('copies public form URL to clipboard when copy button is clicked', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <FormsListPage />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('/f/customer-nps-survey')).toBeTruthy();
    });

    const copyBtn = screen.getByTitle('Copy public link');
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('/f/customer-nps-survey')
    );
  });

  it('displays empty state when no forms are returned', async () => {
    (FormsApiClient.listForms as any).mockResolvedValue([]);

    await act(async () => {
      render(
        <MemoryRouter>
          <FormsListPage />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/No feedback forms created yet/i)).toBeTruthy();
      expect(screen.getByText(/Create Your First Form/i)).toBeTruthy();
    });
  });
});
