import React, { useState } from 'react';
import {
  TrendingUp,
  MessageSquare,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart3,
  Search,
  Filter,
} from 'lucide-react';
import { Badge, Progress, Avatar } from '@feedbackhub/ui';

export const ProductDashboardPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'customer' | 'employee'>('all');

  const demoItems = [
    {
      id: 'item-1',
      author: 'Illustrative Customer Response',
      role: 'Sample NPS Submission',
      source: 'customer',
      rating: '5/5 ★',
      sentiment: 'Promoter',
      text: 'Sample response: Navigation through the survey was straightforward and responsive on mobile devices.',
      time: '12m ago',
      category: 'Product Experience',
      status: 'Resolved',
    },
    {
      id: 'item-2',
      author: 'Illustrative Employee Response',
      role: 'Sample Pulse Submission',
      source: 'employee',
      rating: 'NPS 9',
      sentiment: 'Promoter',
      text: 'Sample response: Weekly retrospective check-ins help our team identify blockers early in sprint planning.',
      time: '1h ago',
      category: 'Engineering Culture',
      status: 'Reviewed',
    },
    {
      id: 'item-3',
      author: 'Illustrative Feature Request',
      role: 'Sample Triage Item',
      source: 'customer',
      rating: '4/5 ★',
      sentiment: 'Passive',
      text: 'Sample response: Would like to see scheduled automated CSV exports in future dashboard updates.',
      time: '3h ago',
      category: 'Feature Request',
      status: 'In Progress',
    },
  ];

  const filteredItems = demoItems.filter(
    (item) => activeTab === 'all' || item.source === activeTab
  );

  return (
    <div className="relative mx-auto w-full max-w-6xl rounded-[24px] border border-border/80 bg-surface-card p-3 sm:p-5 shadow-soft-lg">
      {/* Demo Watermark & Window Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 px-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="h-3 w-3 rounded-full bg-semantic-error/70" />
            <span className="h-3 w-3 rounded-full bg-semantic-warning/70" />
            <span className="h-3 w-3 rounded-full bg-semantic-success/70" />
          </div>
          <span className="text-xs font-mono text-content-muted ml-2">
            https://acme.feedbackhub.com/dashboard
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[11px] font-mono text-brand-primary border-brand-primary/30 bg-brand-primary/5">
            <Sparkles className="h-3 w-3 mr-1" />
            Demo Workspace Preview
          </Badge>
        </div>
      </div>

      {/* Mock Workspace Content */}
      <div className="p-2 sm:p-4 space-y-5">
        {/* Workspace Sub-header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar name="Acme Corp" size="sm" className="bg-brand-primary text-white text-xs font-bold" />
            <div>
              <h4 className="text-sm sm:text-base font-bold text-content-main leading-tight">
                Acme Technologies Hub
              </h4>
              <p className="text-xs text-content-secondary">
                Company Portal &bull; Multi-Tenant Workspace
              </p>
            </div>
          </div>

          {/* Search bar mockup */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-content-muted" />
              <input
                type="text"
                readOnly
                placeholder="Search feedback..."
                className="h-8 w-44 sm:w-56 rounded-xl border border-border bg-surface-main pl-8 pr-3 text-xs text-content-main placeholder:text-content-muted focus:outline-none"
              />
            </div>
            <button
              type="button"
              className="flex h-8 items-center gap-1.5 rounded-xl border border-border bg-surface-main px-2.5 text-xs font-medium text-content-secondary hover:text-content-main"
            >
              <Filter className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-[16px] border border-border bg-surface-main p-3.5">
            <div className="flex items-center justify-between text-xs text-content-secondary">
              <span>Total Responses</span>
              <MessageSquare className="h-4 w-4 text-brand-primary" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-bold text-content-main">
              1,284
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-semantic-success font-medium">
              <TrendingUp className="h-3 w-3" />
              <span>+18.4% this month</span>
            </div>
          </div>

          <div className="rounded-[16px] border border-border bg-surface-main p-3.5">
            <div className="flex items-center justify-between text-xs text-content-secondary">
              <span>CSAT Rating</span>
              <BarChart3 className="h-4 w-4 text-brand-sky" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-bold text-content-main">
              94.2%
            </div>
            <div className="mt-1 text-[11px] text-content-secondary">
              Avg score 4.8 / 5.0 (420 reviews)
            </div>
          </div>

          <div className="rounded-[16px] border border-border bg-surface-main p-3.5">
            <div className="flex items-center justify-between text-xs text-content-secondary">
              <span>Employee Pulse</span>
              <Users className="h-4 w-4 text-brand-teal" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-bold text-content-main">
              88.0%
            </div>
            <div className="mt-1 text-[11px] text-content-secondary">
              eNPS score: +58 (Safe anonymity)
            </div>
          </div>

          <div className="rounded-[16px] border border-border bg-surface-main p-3.5">
            <div className="flex items-center justify-between text-xs text-content-secondary">
              <span>Resolution Rate</span>
              <CheckCircle2 className="h-4 w-4 text-brand-secondary" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-bold text-content-main">
              92.5%
            </div>
            <div className="mt-1 text-[11px] text-semantic-success font-medium">
              32 closed this week
            </div>
          </div>
        </div>

        {/* Breakdown Row: Rating Distribution + Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Rating Breakdown */}
          <div className="rounded-[16px] border border-border bg-surface-main p-4 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-content-main">
              Sentiment Distribution
            </h5>
            <div className="space-y-2.5 pt-1 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between text-content-secondary">
                  <span>Promoters (9-10)</span>
                  <span className="font-semibold text-content-main">74%</span>
                </div>
                <Progress value={74} variant="success" size="sm" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-content-secondary">
                  <span>Passives (7-8)</span>
                  <span className="font-semibold text-content-main">18%</span>
                </div>
                <Progress value={18} variant="warning" size="sm" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-content-secondary">
                  <span>Detractors (0-6)</span>
                  <span className="font-semibold text-content-main">8%</span>
                </div>
                <Progress value={8} variant="error" size="sm" />
              </div>
            </div>

            <div className="border-t border-border pt-3 mt-3">
              <div className="flex items-center justify-between text-xs text-content-secondary">
                <span>Active Channels:</span>
                <span className="font-semibold text-brand-primary">Web, Slack, Link</span>
              </div>
            </div>
          </div>

          {/* Interactive Recent Feedback Feed */}
          <div className="lg:col-span-2 rounded-[16px] border border-border bg-surface-main p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
              <h5 className="text-xs font-bold uppercase tracking-wider text-content-main">
                Live Feedback Queue
              </h5>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-surface-card p-1 rounded-xl border border-border text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-2.5 py-0.5 rounded-lg font-medium transition-colors ${
                    activeTab === 'all'
                      ? 'bg-brand-primary text-white font-semibold'
                      : 'text-content-secondary hover:text-content-main'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('customer')}
                  className={`px-2.5 py-0.5 rounded-lg font-medium transition-colors ${
                    activeTab === 'customer'
                      ? 'bg-brand-primary text-white font-semibold'
                      : 'text-content-secondary hover:text-content-main'
                  }`}
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('employee')}
                  className={`px-2.5 py-0.5 rounded-lg font-medium transition-colors ${
                    activeTab === 'employee'
                      ? 'bg-brand-primary text-white font-semibold'
                      : 'text-content-secondary hover:text-content-main'
                  }`}
                >
                  Employee
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2.5 pt-1">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-border bg-surface-card p-3 space-y-1.5 shadow-soft-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-content-main">
                        {item.author}
                      </span>
                      <span className="text-[11px] text-content-muted">
                        &bull; {item.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant={item.sentiment === 'Promoter' ? 'success' : 'warning'}
                        className="text-[10px] px-2 py-0.5"
                      >
                        {item.rating}
                      </Badge>
                      <span className="flex items-center text-[10px] text-content-muted">
                        <Clock className="h-3 w-3 mr-0.5" />
                        {item.time}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-content-secondary leading-relaxed">
                    {item.text}
                  </p>
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-brand-primary font-medium">
                      #{item.category}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
