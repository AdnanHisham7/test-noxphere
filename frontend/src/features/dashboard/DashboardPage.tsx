// src/features/dashboard/DashboardPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart,
  Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import { clsx } from 'clsx';
import { formatDistanceToNowStrict } from 'date-fns';
import { Shirt, LayoutDashboard, CheckCircle2,
  CreditCard,
  Star, } from 'lucide-react';
import { StatCard, Skeleton, Avatar, EmptyState } from '../../components/ui';
import { useCurrentFranchiseId } from '../../hooks/useCurrentFranchiseId';
import {
  useGetDashboardStatsQuery,
  useGetAttendanceTrendQuery,
  useGetSkillRadarQuery,
  useGetTeamHealthQuery,
  useGetTopPerformersQuery,
  useGetRecentActivityQuery,
} from '../../store/api/dashboardApi';

// ─── Custom tooltip ──────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-pitch-800 border border-white/10 rounded px-3 py-2 text-xs">
      <p className="text-slate-400">{label}</p>
      <p className="text-volt-400 font-bold">{payload[0].value}%</p>
    </div>
  );
};

const formatCurrency = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n.toLocaleString('en-IN')}`;

const DashboardPage: React.FC = () => {
  const franchiseId = useCurrentFranchiseId();
  const skip = !franchiseId;

  const { data: stats, isLoading: statsLoading } = useGetDashboardStatsQuery(
    { franchiseId: franchiseId ?? '' }, { skip },
  );
  const { data: attendanceTrend, isLoading: trendLoading } = useGetAttendanceTrendQuery(
    { franchiseId: franchiseId ?? '', days: 7 }, { skip },
  );
  const { data: radarData, isLoading: radarLoading } = useGetSkillRadarQuery(
    { franchiseId: franchiseId ?? '' }, { skip },
  );
  const { data: teamHealth, isLoading: teamsLoading } = useGetTeamHealthQuery(
    { franchiseId: franchiseId ?? '' }, { skip },
  );
  const { data: topPerformers, isLoading: performersLoading } = useGetTopPerformersQuery(
    { franchiseId: franchiseId ?? '', limit: 5 }, { skip },
  );
  const { data: recentActivity, isLoading: activityLoading } = useGetRecentActivityQuery(
    { franchiseId: franchiseId ?? '', limit: 8 }, { skip },
  );

  if (!franchiseId) {
    return (
      <EmptyState
        icon={<LayoutDashboard size={28} />}
        title="No franchise selected"
        description="Select a franchise from the top bar to see its dashboard."
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="section-title mb-1">Overview</p>
          <h1 className="font-display font-extrabold text-white text-2xl uppercase tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-field-400 bg-field-400/10 border border-field-400/20 rounded px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-field-400 animate-pulse-volt" />
            Franchise Active
          </span>
        </div>
      </div>

      {/* KPI Stats Row */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Students"
            value={stats?.totalStudents ?? 0}
            sublabel={`${stats?.pendingEnrollment ?? 0} pending enrollment`}
            icon={<Shirt className="h-5 w-5" />}
            accent="volt"
          />

          <StatCard
            label="Avg Attendance"
            value={`${stats?.avgAttendance ?? 0}%`}
            sublabel="This week"
            icon={<CheckCircle2 className="h-5 w-5" />}
            accent="field"
          />

          <StatCard
            label="Fees Collected"
            value={formatCurrency(stats?.feesCollected ?? 0)}
            sublabel={`${formatCurrency(stats?.feesOutstanding ?? 0)} outstanding`}
            icon={<CreditCard className="h-5 w-5" />}
            accent="ice"
          />

          <StatCard
            label="Avg Rating"
            value={stats?.avgRating ?? 0}
            sublabel="Out of 10.0"
            icon={<Star className="h-5 w-5" />}
            accent="ember"
          />
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Attendance trend chart */}
        <div className="lg:col-span-2 card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="section-title">Attendance Trend</p>
              <p className="text-xs text-slate-500 mt-0.5">Last 7 days — all teams</p>
            </div>
            <span className="text-volt-400 font-display font-extrabold text-xl">
              {stats?.avgAttendance ?? 0}%
            </span>
          </div>
          {trendLoading ? (
            <Skeleton className="h-40 rounded" />
          ) : !attendanceTrend?.length || attendanceTrend.every((d) => d.rate === 0) ? (
            <EmptyState title="No attendance recorded yet" description="Mark attendance to see the trend here." />
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={attendanceTrend}>
                <defs>
                  <linearGradient id="voltGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ccff00" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ccff00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone" dataKey="rate"
                  stroke="#ccff00" strokeWidth={2}
                  fill="url(#voltGrad)"
                  dot={{ fill: '#ccff00', strokeWidth: 0, r: 3 }}
                  activeDot={{ fill: '#ccff00', r: 5, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Franchise skill radar */}
        <div className="card p-5 space-y-4">
          <div>
            <p className="section-title">Franchise Avg Skills</p>
            <p className="text-xs text-slate-500 mt-0.5">All players aggregate</p>
          </div>
          {radarLoading ? (
            <Skeleton className="h-44 rounded" />
          ) : !radarData?.length ? (
            <EmptyState title="No performance data yet" description="Log a session to populate skill averages." />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: '#64748b', fontSize: 10 }} />
                <Radar dataKey="avg" stroke="#ccff00" fill="#ccff00" fillOpacity={0.08} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Team Health + Top Performers + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Team health */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="section-title">Team Health</p>
            <Link to="/teams" className="text-xs text-volt-400 hover:underline">View all →</Link>
          </div>
          {teamsLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded" />)}</div>
          ) : !teamHealth?.length ? (
            <EmptyState title="No teams yet" description="Create a team to track its health here." />
          ) : (
            <div className="space-y-3">
              {teamHealth.map((team) => (
                <div key={team.name} className="flex items-center gap-3 p-3 bg-pitch-700 rounded">
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center text-xs font-display font-extrabold text-pitch-900 flex-shrink-0"
                    style={{ backgroundColor: team.attendance > 90 ? '#00e676' : team.attendance > 80 ? '#ccff00' : '#ff6b35' }}
                  >
                    {team.name.replace('Team ', '').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-white">{team.name}</p>
                      <span className="text-2xs text-slate-500">{team.students} players</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-2xs text-slate-500">Att: <span className="text-volt-400 font-semibold">{team.attendance}%</span></span>
                      <span className="text-2xs text-slate-500">Perf: <span className="text-ice-400 font-semibold">{team.performance}</span></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top performers */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="section-title">Top Performers</p>
            <Link to="/students" className="text-xs text-volt-400 hover:underline">Full rankings →</Link>
          </div>
          {performersLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}</div>
          ) : !topPerformers?.length ? (
            <EmptyState title="No ratings yet" description="Log performance scores to rank players." />
          ) : (
            <div className="space-y-3">
              {topPerformers.map((player, i) => (
                <div key={player.id} className="flex items-center gap-3">
                  <span className={clsx(
                    'font-display font-900 text-sm w-5 text-center',
                    i === 0 ? 'text-volt-400' : i === 1 ? 'text-slate-300' : 'text-slate-500'
                  )}>
                    {i + 1}
                  </span>
                  <Avatar name={player.name} src={player.avatar} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{player.name}</p>
                    <p className="text-2xs text-slate-500">{player.team} · {player.position}</p>
                  </div>
                  <span className="font-display font-extrabold text-volt-400 text-sm">{player.rating}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity feed */}
        <div className="card p-5 space-y-4">
          <p className="section-title">Live Activity</p>
          {activityLoading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}</div>
          ) : !recentActivity?.length ? (
            <EmptyState title="No recent activity" description="Actions across the franchise will show up here." />
          ) : (
            <div className="space-y-0">
              {recentActivity.map((item, i) => (
                <div key={item.id} className={clsx('flex gap-3 py-3', i < recentActivity.length - 1 && 'border-b border-white/4')}>
                  <div className="w-7 h-7 rounded bg-pitch-700 flex items-center justify-center text-sm flex-shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300 leading-tight">{item.message}</p>
                    <p className="text-2xs text-slate-600 mt-1">
                      {formatDistanceToNowStrict(new Date(item.time), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Mark Attendance', icon: '✓', to: '/attendance', color: 'border-field-400/20 hover:border-field-400/40 hover:bg-field-400/5' },
          { label: 'Log Performance', icon: '📈', to: '/performance', color: 'border-ice-400/20 hover:border-ice-400/40 hover:bg-ice-400/5' },
          { label: 'Collect Fee', icon: '💳', to: '/fees', color: 'border-volt-400/20 hover:border-volt-400/40 hover:bg-volt-400/5' },
          { label: 'Transfer Wall', icon: '↔', to: '/transfer-wall', color: 'border-ember-400/20 hover:border-ember-400/40 hover:bg-ember-400/5' },
        ].map((action) => (
          <Link
            key={action.label}
            to={action.to}
            className={clsx(
              'card p-4 flex items-center gap-3 border transition-all duration-150',
              action.color
            )}
          >
            <span className="text-xl">{action.icon}</span>
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;