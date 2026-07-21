// src/features/finance/FinancePage.tsx
import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { clsx } from "clsx";
import { DollarSign } from "lucide-react";
import { StatCard, Skeleton, EmptyState, Badge } from "../../components/ui";
import { academyApi } from "../../store/api/academyApi";
import {
  useGetFinanceOverviewQuery,
  useGetRevenueByMonthQuery,
  useGetRevenueByAcademyQuery,
  useGetOverdueInvoicesQuery,
  useGetRecentTransactionsQuery,
} from "../../store/api/financeApi";

const formatCurrency = (n: number) =>
  n >= 10000000 ? `₹${(n / 10000000).toFixed(2)}Cr` : n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n.toLocaleString("en-IN")}`;

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-pitch-800 border border-white/10 rounded px-3 py-2 text-xs">
      <p className="text-slate-400">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.fill }} className="font-bold">
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

const FinancePage: React.FC = () => {
  const [academyId, setAcademyId] = useState("");
  const { data: academiesResult } = academyApi.useGetAcademiesQuery({ isActive: true, limit: 100 });
  const academies = academiesResult?.data ?? [];

  const params = academyId ? { academyId } : undefined;
  const { data: overview, isLoading: overviewLoading } = useGetFinanceOverviewQuery(params);
  const { data: monthly, isLoading: monthlyLoading } = useGetRevenueByMonthQuery(params);
  const { data: byAcademy, isLoading: byAcademyLoading } = useGetRevenueByAcademyQuery();
  const { data: overdue, isLoading: overdueLoading } = useGetOverdueInvoicesQuery(params);
  const { data: transactions, isLoading: txLoading } = useGetRecentTransactionsQuery(params);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="section-title mb-1">Platform</p>
          <h1 className="font-display font-extrabold text-white text-2xl uppercase tracking-tight">Finance</h1>
          <p className="text-sm text-slate-500 mt-0.5">Revenue and collections across all academies</p>
        </div>
        <select className="input !w-auto" value={academyId} onChange={(e) => setAcademyId(e.target.value)}>
          <option value="">All Academies</option>
          {academies.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {/* KPI row */}
      {overviewLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Revenue" value={formatCurrency(overview?.totalRevenue ?? 0)} sublabel={`${overview?.totalInvoices ?? 0} invoices`} icon="💰" accent="volt" />
          <StatCard label="Collected" value={formatCurrency(overview?.totalCollected ?? 0)} sublabel={`${overview?.collectionRate ?? 0}% collection rate`} icon="✓" accent="field" />
          <StatCard label="Outstanding" value={formatCurrency(overview?.totalOutstanding ?? 0)} sublabel="Pending collection" icon="⏳" accent="ice" />
          <StatCard label="Overdue" value={overview?.overdueCount ?? 0} sublabel={formatCurrency(overview?.overdueAmount ?? 0)} icon="⚠" accent="ember" />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5 space-y-4">
          <p className="section-title">Revenue vs Collected — Last 6 Months</p>
          {monthlyLoading ? (
            <Skeleton className="h-52 rounded" />
          ) : !monthly?.length || monthly.every((m) => m.revenue === 0) ? (
            <EmptyState title="No fee records yet" description="Revenue will appear once fees are created." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthly}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="revenue" name="Revenue" fill="#334155" radius={[3, 3, 0, 0]} />
                <Bar dataKey="collected" name="Collected" fill="#ccff00" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5 space-y-4">
          <p className="section-title">By Academy</p>
          {byAcademyLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded" />)}</div>
          ) : !byAcademy?.length ? (
            <EmptyState title="No academies yet" />
          ) : (
            <div className="space-y-3">
              {byAcademy.map((a) => (
                <div key={a.academyId} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{a.academyName}</p>
                    <p className="text-2xs text-slate-500">{a.studentCount} students</p>
                  </div>
                  <span className="font-display font-bold text-volt-400 text-sm flex-shrink-0">{formatCurrency(a.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Overdue + Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5 space-y-4">
          <p className="section-title">Overdue Invoices</p>
          {overdueLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}</div>
          ) : !overdue?.data.length ? (
            <EmptyState title="No overdue invoices" description="All payments are up to date." />
          ) : (
            <div className="space-y-2">
              {overdue.data.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-2 border-b border-white/4">
                  <span className="text-sm text-slate-300">{inv.student}</span>
                  <div className="text-right">
                    <span className="font-display font-bold text-ember-400 text-sm">{formatCurrency(inv.outstanding)}</span>
                    <Badge variant="red" size="sm">Overdue</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5 space-y-4">
          <p className="section-title">Recent Transactions</p>
          {txLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}</div>
          ) : !transactions?.length ? (
            <EmptyState title="No transactions yet" description="Payments will appear here as they're recorded." />
          ) : (
            <div className="space-y-2">
              {transactions.map((tx, i) => (
                <div key={`${tx.feeId}-${i}`} className="flex items-center justify-between py-2 border-b border-white/4">
                  <div>
                    <p className="text-sm text-slate-300">{tx.student}</p>
                    <p className="text-2xs text-slate-500">
                      {new Date(tx.paidAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      {tx.method ? ` · ${tx.method}` : ""}
                    </p>
                  </div>
                  <span className="font-display font-bold text-field-400 text-sm">{formatCurrency(tx.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancePage;
