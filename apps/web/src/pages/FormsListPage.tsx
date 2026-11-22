import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  FileText,
  Copy,
  Check,
  ExternalLink,
  Edit2,
  Eye,
  Trash2,
  Archive,
  RefreshCw,
  Layers,
  Building2,
  AlertCircle,
} from 'lucide-react';
import {
  Button,
  Input,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Alert,
  AlertDescription,
  Spinner,
} from '@feedbackhub/ui';
import { FormsApiClient } from '../utils/formsApi';
import type { FeedbackFormSummary, UserCompanyItem, FormStatus } from '@feedbackhub/types';

export const FormsListPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [companies, setCompanies] = useState<UserCompanyItem[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<UserCompanyItem | null>(null);
  const [forms, setForms] = useState<FeedbackFormSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | FormStatus>('ALL');

  // Copy feedback state: map of formId -> boolean
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});

  // Active action dialog
  const [actionDialog, setActionDialog] = useState<{
    type: 'delete' | 'archive' | 'unpublish';
    form: FeedbackFormSummary;
  } | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Load companies
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const userCompanies = await FormsApiClient.getMyCompanies();
        setCompanies(userCompanies);
        if (userCompanies.length > 0) {
          const storedSlug = localStorage.getItem('fh_active_company_slug');
          const current = userCompanies.find((c) => c.slug === storedSlug) || userCompanies[0];
          setSelectedCompany(current);
          localStorage.setItem('fh_active_company_slug', current.slug);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load user companies.';
        setError(msg);
      }
    };
    loadCompanies();
  }, []);

  // Fetch forms
  const loadForms = useCallback(async () => {
    if (!selectedCompany) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await FormsApiClient.listForms({
        search: searchQuery,
        status: statusFilter,
        companySlug: selectedCompany.slug,
      });
      setForms(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load feedback forms.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCompany, searchQuery, statusFilter]);

  useEffect(() => {
    if (selectedCompany) {
      loadForms();
    }
  }, [selectedCompany, loadForms]);

  // Copy shareable public link
  const handleCopyLink = (form: FeedbackFormSummary) => {
    const publicUrl = `${window.location.origin}/f/${form.slug}`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedMap((prev) => ({ ...prev, [form.id]: true }));
    setTimeout(() => {
      setCopiedMap((prev) => ({ ...prev, [form.id]: false }));
    }, 2000);
  };

  // Duplicate form
  const handleDuplicate = async (form: FeedbackFormSummary) => {
    if (!selectedCompany) return;
    try {
      const cloned = await FormsApiClient.duplicateForm(form.id, selectedCompany.slug);
      loadForms();
      navigate(`/dashboard/forms/${cloned.id}/edit`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to duplicate form.';
      setError(msg);
    }
  };

  // Perform destructive or state change actions
  const handleConfirmAction = async () => {
    if (!actionDialog || !selectedCompany) return;
    setIsActionLoading(true);
    try {
      if (actionDialog.type === 'delete') {
        await FormsApiClient.deleteForm(actionDialog.form.id, selectedCompany.slug);
      } else if (actionDialog.type === 'archive') {
        await FormsApiClient.archiveForm(actionDialog.form.id, selectedCompany.slug);
      } else if (actionDialog.type === 'unpublish') {
        await FormsApiClient.unpublishForm(actionDialog.form.id, selectedCompany.slug);
      }
      setActionDialog(null);
      loadForms();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Failed to ${actionDialog.type} form.`;
      setError(msg);
    } finally {
      setIsActionLoading(false);
    }
  };

  const renderStatusBadge = (status: FormStatus) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge variant="success">Published</Badge>;
      case 'DRAFT':
        return <Badge variant="warning">Draft</Badge>;
      case 'ARCHIVED':
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Top Banner / Breadcrumb */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/10 text-violet-600 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Feedback Forms</h1>
              <p className="text-sm text-slate-500">Manage, design, and collect insights across your organization.</p>
            </div>
          </div>

          {/* Company Switcher */}
          {companies.length > 0 && (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              <select
                aria-label="Active Company"
                value={selectedCompany?.id || ''}
                onChange={(e) => {
                  const comp = companies.find((c) => c.id === e.target.value);
                  if (comp) {
                    setSelectedCompany(comp);
                    localStorage.setItem('fh_active_company_slug', comp.slug);
                  }
                }}
                className="text-sm font-medium border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.role})
                  </option>
                ))}
              </select>

              <Button
                size="sm"
                className="gap-2"
                onClick={() => navigate('/dashboard/forms/new')}
              >
                <Plus className="w-4 h-4" />
                <span>Create Form</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {error && (
          <Alert variant="error" className="mb-6">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/60 rounded-xl max-w-md">
            {(['ALL', 'PUBLISHED', 'DRAFT', 'ARCHIVED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === tab
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'ALL' ? 'All Forms' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search forms by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Spinner size="lg" className="text-violet-600 mb-3" />
            <p className="text-sm text-slate-500">Loading feedback forms...</p>
          </div>
        ) : forms.length === 0 ? (
          <Card className="border-dashed border-2 py-16 text-center">
            <CardContent className="flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mb-4">
                <FileText className="w-7 h-7" />
              </div>
              <CardTitle className="text-lg font-bold text-slate-900 mb-1">
                {searchQuery || statusFilter !== 'ALL'
                  ? 'No matching forms found'
                  : 'No feedback forms created yet'}
              </CardTitle>
              <CardDescription className="max-w-md mb-6 text-sm">
                {searchQuery || statusFilter !== 'ALL'
                  ? 'Try adjusting your search terms or filters.'
                  : 'Start capturing valuable feedback from customers and employees in minutes.'}
              </CardDescription>
              {searchQuery || statusFilter !== 'ALL' ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                  }}
                >
                  Clear Filters
                </Button>
              ) : (
                <Button onClick={() => navigate('/dashboard/forms/new')} className="gap-2">
                  <Plus className="w-4 h-4" />
                  <span>Create Your First Form</span>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form) => (
              <Card
                key={form.id}
                className="group hover:shadow-md transition-all duration-200 border-slate-200 flex flex-col justify-between"
              >
                <div>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {renderStatusBadge(form.status)}
                          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                            {form.audienceType}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-lg leading-snug line-clamp-1 group-hover:text-violet-600 transition-colors">
                          {form.title}
                        </h3>
                        {form.internalName && (
                          <p className="text-xs text-slate-400 font-medium line-clamp-1">
                            Internal: {form.internalName}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-0">
                    {form.description ? (
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {form.description}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-400 italic">No description provided</p>
                    )}

                    <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-600">
                      <div>
                        <span className="block font-bold text-slate-900 text-base">
                          {form.questionCount}
                        </span>
                        <span>Questions</span>
                      </div>
                      <div>
                        <span className="block font-bold text-slate-900 text-base">
                          {form.responseCount}
                        </span>
                        <span>Responses</span>
                      </div>
                    </div>

                    {/* Public URL Box (if published) */}
                    {form.status === 'PUBLISHED' && (
                      <div className="flex items-center gap-2 p-2 bg-violet-50/60 border border-violet-100 rounded-lg text-xs">
                        <span className="truncate text-violet-700 font-mono font-medium flex-1">
                          /f/{form.slug}
                        </span>
                        <button
                          onClick={() => handleCopyLink(form)}
                          title="Copy public link"
                          className="p-1 rounded hover:bg-violet-200/60 text-violet-600 transition-colors flex items-center gap-1 font-semibold"
                        >
                          {copiedMap[form.id] ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-[10px] text-emerald-600">Copied!</span>
                            </>
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <a
                          href={`/f/${form.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open public form"
                          className="p-1 rounded hover:bg-violet-200/60 text-violet-600 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </CardContent>
                </div>

                {/* Card Footer Actions */}
                <div className="border-t border-slate-100 px-6 py-3 bg-slate-50/50 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/dashboard/forms/${form.id}/edit`)}
                      className="text-xs font-semibold gap-1.5 h-8 text-slate-700"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/dashboard/forms/${form.id}/preview`)}
                      className="text-xs font-semibold gap-1.5 h-8 text-slate-700"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Preview</span>
                    </Button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDuplicate(form)}
                      title="Duplicate Form"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    {form.status === 'PUBLISHED' ? (
                      <button
                        onClick={() => setActionDialog({ type: 'unpublish', form })}
                        title="Unpublish Form"
                        className="p-1.5 rounded-lg text-amber-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setActionDialog({ type: 'archive', form })}
                        title="Archive Form"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => setActionDialog({ type: 'delete', form })}
                      title="Delete Form"
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Action Confirmation Dialog */}
      {actionDialog && (
        <Dialog open={true} onOpenChange={() => setActionDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionDialog.type === 'delete' && 'Delete Feedback Form?'}
                {actionDialog.type === 'archive' && 'Archive Feedback Form?'}
                {actionDialog.type === 'unpublish' && 'Unpublish Feedback Form?'}
              </DialogTitle>
              <DialogDescription>
                {actionDialog.type === 'delete' && (
                  <>
                    Are you sure you want to permanently delete <strong>{actionDialog.form.title}</strong>? All
                    associated questions and recorded responses will be wiped. This action cannot be undone.
                  </>
                )}
                {actionDialog.type === 'archive' && (
                  <>
                    Archiving <strong>{actionDialog.form.title}</strong> will immediately close it and prevent new
                    feedback submissions.
                  </>
                )}
                {actionDialog.type === 'unpublish' && (
                  <>
                    Unpublishing <strong>{actionDialog.form.title}</strong> moves it back to draft status and closes
                    public access until published again.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setActionDialog(null)}>
                Cancel
              </Button>
              <Button
                variant={actionDialog.type === 'delete' ? 'destructive' : 'primary'}
                onClick={handleConfirmAction}
                disabled={isActionLoading}
              >
                {isActionLoading ? 'Processing...' : 'Confirm'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
