/** @vitest-environment jsdom */
/* eslint-disable @typescript-eslint/no-explicit-any */
import '../test-setup';
import React, { act } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { FormBuilderPage } from '../pages/FormBuilderPage';
import { FormsApiClient } from '../utils/formsApi';

vi.mock('../utils/formsApi', () => ({
  FormsApiClient: {
    getForm: vi.fn(),
    createForm: vi.fn(),
    updateForm: vi.fn(),
    publishForm: vi.fn(),
    unpublishForm: vi.fn(),
  },
}));

describe('FormBuilderPage Component', () => {
  const mockForm = {
    id: 'form-123',
    companyId: 'comp-1',
    internalName: 'Internal Q4',
    title: 'Customer Satisfaction Survey',
    slug: 'customer-satisfaction-survey',
    description: 'Help us improve',
    welcomeMessage: 'Welcome to the survey',
    thankYouMessage: 'Thanks for participating',
    audienceType: 'CUSTOMER' as const,
    anonymityMode: 'ANONYMOUS_ONLY' as const,
    status: 'DRAFT' as const,
    allowMultipleSubmissions: false,
    themeSettings: null,
    publishedAt: null,
    closedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: [
      {
        id: 'q-1',
        formId: 'form-123',
        questionType: 'SHORT_TEXT' as const,
        title: 'What is your primary feedback?',
        placeholder: 'Enter feedback...',
        isRequired: true,
        orderIndex: 0,
        options: [],
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (FormsApiClient.getForm as any).mockResolvedValue(mockForm);
    (FormsApiClient.updateForm as any).mockResolvedValue(mockForm);
    (FormsApiClient.publishForm as any).mockResolvedValue({
      ...mockForm,
      status: 'PUBLISHED',
      publishedAt: new Date().toISOString(),
    });
  });

  it('renders builder layout and loads form details', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/dashboard/forms/form-123/edit']}>
          <Routes>
            <Route path="/dashboard/forms/:id/edit" element={<FormBuilderPage />} />
          </Routes>
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Customer Satisfaction Survey')).toBeTruthy();
      expect(screen.getByDisplayValue('What is your primary feedback?')).toBeTruthy();
      expect(screen.getByText(/Structure/i)).toBeTruthy();
      expect(screen.getByText(/Live Question Preview/i)).toBeTruthy();
      expect(screen.getByText(/Audience & Privacy/i)).toBeTruthy();
    });
  });

  it('adds a new question when type button is clicked', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/dashboard/forms/form-123/edit']}>
          <Routes>
            <Route path="/dashboard/forms/:id/edit" element={<FormBuilderPage />} />
          </Routes>
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('What is your primary feedback?')).toBeTruthy();
    });

    // Click "Rating" to add a rating question
    const addRatingBtn = screen.getByRole('button', { name: /^Rating$/i });
    await act(async () => {
      fireEvent.click(addRatingBtn);
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('How would you rate your overall experience?')).toBeTruthy();
      expect(screen.getByText('Minimum Rating')).toBeTruthy();
      expect(screen.getByText('Maximum Rating')).toBeTruthy();
    });
  });

  it('saves form changes when Save Draft button is clicked', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/dashboard/forms/form-123/edit']}>
          <Routes>
            <Route path="/dashboard/forms/:id/edit" element={<FormBuilderPage />} />
          </Routes>
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Customer Satisfaction Survey')).toBeTruthy();
    });

    const saveBtn = screen.getByRole('button', { name: /Save Draft/i });
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    await waitFor(() => {
      expect(FormsApiClient.updateForm).toHaveBeenCalledWith(
        'form-123',
        expect.objectContaining({
          title: 'Customer Satisfaction Survey',
        })
      );
    });
  });

  it('publishes form when Publish Form button is clicked', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/dashboard/forms/form-123/edit']}>
          <Routes>
            <Route path="/dashboard/forms/:id/edit" element={<FormBuilderPage />} />
          </Routes>
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Customer Satisfaction Survey')).toBeTruthy();
    });

    const publishBtn = screen.getByRole('button', { name: /Publish Form/i });
    await act(async () => {
      fireEvent.click(publishBtn);
    });

    await waitFor(() => {
      expect(FormsApiClient.publishForm).toHaveBeenCalledWith('form-123');
      expect(screen.getByText(/Form published successfully/i)).toBeTruthy();
    });
  });
});
