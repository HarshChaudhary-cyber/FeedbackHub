import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FormsController } from '../forms.controller';
import { FormsService } from '../forms.service';
import type { FeedbackFormSummary, FeedbackForm, PublicFeedbackForm } from '@feedbackhub/types';

describe('FormsController', () => {
  let controller: FormsController;
  let service: FormsService;

  const companyId = 'comp-1111-2222-3333-444455556666';
  const userId = 'user-1111-2222-3333-444455556666';

  beforeEach(() => {
    service = {
      listForms: vi.fn().mockResolvedValue([
        { id: 'f-1', companyId, title: 'Form 1', status: 'DRAFT', questionCount: 2, responseCount: 0 },
      ] as FeedbackFormSummary[]),
      getForm: vi.fn().mockResolvedValue({ id: 'f-1', companyId, title: 'Form 1' } as FeedbackForm),
      createForm: vi.fn().mockResolvedValue({ id: 'f-2', companyId, title: 'New Form' } as FeedbackForm),
      updateForm: vi.fn().mockResolvedValue({ id: 'f-1', companyId, title: 'Updated' } as FeedbackForm),
      duplicateForm: vi.fn().mockResolvedValue({ id: 'f-copy', companyId, title: 'Copy' } as FeedbackForm),
      publishForm: vi.fn().mockResolvedValue({ id: 'f-1', companyId, status: 'PUBLISHED' } as FeedbackForm),
      unpublishForm: vi.fn().mockResolvedValue({ id: 'f-1', companyId, status: 'DRAFT' } as FeedbackForm),
      archiveForm: vi.fn().mockResolvedValue({ id: 'f-1', companyId, status: 'ARCHIVED' } as FeedbackForm),
      deleteForm: vi.fn().mockResolvedValue({ success: true, message: 'Deleted' }),
      getPreview: vi.fn().mockResolvedValue({ id: 'f-1', title: 'Preview' } as PublicFeedbackForm),
    } as unknown as FormsService;

    controller = new FormsController(service);
  });

  it('lists forms delegating to service with tenant companyId', async () => {
    const res = await controller.listForms(companyId, 'search-term', 'DRAFT');
    expect(service.listForms).toHaveBeenCalledWith(companyId, { search: 'search-term', status: 'DRAFT' });
    expect(res).toHaveLength(1);
  });

  it('creates form delegating to service', async () => {
    const dto = { title: 'New Form' };
    const res = await controller.createForm(companyId, userId, dto);
    expect(service.createForm).toHaveBeenCalledWith(companyId, userId, dto);
    expect(res.id).toBe('f-2');
  });

  it('gets form delegating to service', async () => {
    const res = await controller.getForm(companyId, 'f-1');
    expect(service.getForm).toHaveBeenCalledWith(companyId, 'f-1');
    expect(res.title).toBe('Form 1');
  });

  it('updates form delegating to service', async () => {
    const res = await controller.updateForm(companyId, 'f-1', { title: 'Updated' });
    expect(service.updateForm).toHaveBeenCalledWith(companyId, 'f-1', { title: 'Updated' });
    expect(res.title).toBe('Updated');
  });

  it('duplicates form delegating to service', async () => {
    const res = await controller.duplicateForm(companyId, 'f-1');
    expect(service.duplicateForm).toHaveBeenCalledWith(companyId, 'f-1');
    expect(res.id).toBe('f-copy');
  });

  it('publishes and unpublishes form delegating to service', async () => {
    await controller.publishForm(companyId, 'f-1');
    expect(service.publishForm).toHaveBeenCalledWith(companyId, 'f-1');

    await controller.unpublishForm(companyId, 'f-1');
    expect(service.unpublishForm).toHaveBeenCalledWith(companyId, 'f-1');
  });

  it('archives and deletes form delegating to service', async () => {
    await controller.archiveForm(companyId, 'f-1');
    expect(service.archiveForm).toHaveBeenCalledWith(companyId, 'f-1');

    const res = await controller.deleteForm(companyId, 'f-1');
    expect(service.deleteForm).toHaveBeenCalledWith(companyId, 'f-1');
    expect(res.success).toBe(true);
  });

  it('previews form delegating to service', async () => {
    const res = await controller.getPreview(companyId, 'f-1');
    expect(service.getPreview).toHaveBeenCalledWith(companyId, 'f-1');
    expect(res.title).toBe('Preview');
  });
});
