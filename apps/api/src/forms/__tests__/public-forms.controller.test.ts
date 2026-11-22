import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PublicFormsController } from '../public-forms.controller';
import { FormsService } from '../forms.service';
import type { Request } from 'express';
import type { PublicFeedbackForm, PublicSubmissionResult } from '@feedbackhub/types';

describe('PublicFormsController', () => {
  let controller: PublicFormsController;
  let service: FormsService;

  beforeEach(() => {
    service = {
      getPublicFormBySlug: vi.fn().mockResolvedValue({
        id: 'f-pub',
        slug: 'acme-feedback',
        title: 'Acme Feedback',
        questions: [],
      } as unknown as PublicFeedbackForm),
      submitPublicFeedback: vi.fn().mockResolvedValue({
        success: true,
        submissionToken: 'sub_123',
        submittedAt: new Date().toISOString(),
        message: 'Thank you!',
      } as PublicSubmissionResult),
    } as unknown as FormsService;

    controller = new PublicFormsController(service);
  });

  it('retrieves public form by slug', async () => {
    const res = await controller.getPublicForm('acme-feedback');
    expect(service.getPublicFormBySlug).toHaveBeenCalledWith('acme-feedback');
    expect(res.title).toBe('Acme Feedback');
  });

  it('submits feedback extracting client IP', async () => {
    const mockReq = {
      headers: {},
      ip: '10.0.0.5',
      socket: { remoteAddress: '10.0.0.5' },
    } as unknown as Request;

    const payload = {
      isAnonymous: true,
      answers: [{ questionId: '11111111-2222-3333-4444-555566667777', textValue: 'Great!' }],
    };

    const res = await controller.submitFeedback('acme-feedback', payload, mockReq);
    expect(service.submitPublicFeedback).toHaveBeenCalledWith('acme-feedback', payload, '10.0.0.5');
    expect(res.success).toBe(true);
    expect(res.submissionToken).toBe('sub_123');
  });
});
