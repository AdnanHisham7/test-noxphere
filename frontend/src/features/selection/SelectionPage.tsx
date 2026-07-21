// src/features/selection/SelectionPage.tsx
import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Target } from 'lucide-react';
import { Button, Badge, Avatar, Skeleton, EmptyState } from '../../components/ui';
import { toast } from 'react-hot-toast';
import { useCurrentFranchiseId } from '../../hooks/useCurrentFranchiseId';
import {
  useGetSelectionListQuery,
  useUpdateSelectionStatusMutation,
  useNotifySelectionMutation,
  type SelectionCandidate,
} from '../../store/api/selectionApi';

const phases = [
  { id: 'phase1', label: 'Phase 1 — Initial Trial' },
  { id: 'phase2', label: 'Phase 2 — Deep Evaluation' },
  { id: 'final', label: 'Final Selection' },
];

const statusConfig: Record<string, { label: string; variant: 'green' | 'blue' | 'yellow' | 'red' | 'gray' }> = {
  selected: { label: 'Selected', variant: 'green' },
  shortlisted: { label: 'Shortlisted', variant: 'blue' },
  on_hold: { label: 'On Hold', variant: 'yellow' },
  not_selected: { label: 'Not Selected', variant: 'red' },
  released: { label: 'Released', variant: 'red' },
  pending: { label: 'Pending', variant: 'gray' },
};

const STATUS_ACTIONS: SelectionCandidate['status'][] = ['selected', 'shortlisted', 'on_hold', 'not_selected'];

const exportCsv = (rows: SelectionCandidate[]) => {
  const header = ['Name', 'Position', 'Age Group', 'Rating', 'Coach Vote', 'Status', 'Coach Note'];
  const lines = rows.map((r) =>
    [r.name, r.position, r.ageGroup, r.rating, r.coachVote, r.status, `"${(r.coachNote ?? '').replace(/"/g, '""')}"`].join(','),
  );
  const csv = [header.join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `selection-list-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const SelectionPage: React.FC = () => {
  const franchiseId = useCurrentFranchiseId();
  const [activePhase, setActivePhase] = useState(0);
  const [selectedPlayer, setSelectedPlayer] = useState<SelectionCandidate | null>(null);

  const { data: candidates, isLoading, isError } = useGetSelectionListQuery(
    { franchiseId: franchiseId ?? '', phase: phases[activePhase].id },
    { skip: !franchiseId },
  );
  const [updateStatus] = useUpdateSelectionStatusMutation();
  const [notifyAll, { isLoading: notifying }] = useNotifySelectionMutation();

  const list = candidates ?? [];

  const handleUpdate = async (id: string, status: SelectionCandidate['status']) => {
    try {
      await updateStatus({ id, status, phase: phases[activePhase].id }).unwrap();
      toast.success('Status updated');
    } catch {
      toast.error("Couldn't update status — try again");
    }
  };

  const handleNotifyAll = async () => {
    if (!franchiseId) return;
    try {
      const res = await notifyAll({ franchiseId, phase: phases[activePhase].id }).unwrap();
      toast.success(`Notified ${res.notified} guardian${res.notified === 1 ? '' : 's'}`);
    } catch {
      toast.error("Couldn't send notifications — try again");
    }
  };

  const counts = {
    selected: list.filter((s) => s.status === 'selected').length,
    shortlisted: list.filter((s) => s.status === 'shortlisted').length,
    on_hold: list.filter((s) => s.status === 'on_hold').length,
    not_selected: list.filter((s) => s.status === 'not_selected' || s.status === 'released').length,
  };

  if (!franchiseId) {
    return (
      <EmptyState
        icon={<Target size={28} />}
        title="No franchise selected"
        description="Select a franchise from the top bar to manage selection."
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="section-title mb-1">Process</p>
          <h1 className="font-display font-extrabold text-white text-2xl uppercase tracking-tight">Selection Tracker</h1>
          <p className="text-sm text-slate-500 mt-0.5">{list.length} players in evaluation</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<span>📨</span>} loading={notifying} onClick={handleNotifyAll}>
            Notify All
          </Button>
          <Button size="sm" icon={<span>⬇</span>} disabled={list.length === 0} onClick={() => exportCsv(list)}>
            Export List
          </Button>
        </div>
      </div>

      {/* Phase tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {phases.map((phase, i) => (
          <button
            key={phase.id}
            onClick={() => setActivePhase(i)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded border text-xs font-display font-bold uppercase tracking-wide transition-all',
              activePhase === i
                ? 'bg-volt-400 text-pitch-900 border-volt-400'
                : 'bg-transparent border-white/10 text-slate-500 hover:text-white hover:border-white/20'
            )}
          >
            <span className={clsx('w-4 h-4 rounded-full border text-2xs flex items-center justify-center font-900',
              activePhase === i ? 'border-pitch-900 text-pitch-900' : 'border-slate-600 text-slate-600'
            )}>{i + 1}</span>
            <span className="hidden sm:inline">{phase.label}</span>
            <span className="sm:hidden">Phase {i + 1}</span>
          </button>
        ))}
      </div>

      {/* Status summary strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { key: 'selected', label: 'Selected', color: 'text-field-400', border: 'border-field-400/20' },
          { key: 'shortlisted', label: 'Shortlisted', color: 'text-ice-400', border: 'border-ice-400/20' },
          { key: 'on_hold', label: 'On Hold', color: 'text-volt-400', border: 'border-volt-400/20' },
          { key: 'not_selected', label: 'Not Selected', color: 'text-ember-400', border: 'border-ember-400/20' },
        ].map((s) => (
          <div key={s.key} className={clsx('card p-3 text-center border', s.border)}>
            <p className={clsx('font-display font-900 text-2xl', s.color)}>
              {counts[s.key as keyof typeof counts]}
            </p>
            <p className="text-2xs text-slate-500 uppercase tracking-wide mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      )}

      {isError && <EmptyState title="Couldn't load the selection list" description="Please try again shortly." />}

      {!isLoading && list.length === 0 && (
        <EmptyState
          icon={<Target size={28} />}
          title="No players in this phase yet"
          description="Players appear here once added to your franchise roster."
        />
      )}

      {/* Selection table */}
      {!isLoading && list.length > 0 && (
        <div className="card overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-pitch-700/30">
                <th className="text-left px-5 py-3 section-title">Player</th>
                <th className="text-center px-5 py-3 section-title hidden sm:table-cell">Rating</th>
                <th className="text-center px-5 py-3 section-title hidden md:table-cell">Coach Vote</th>
                <th className="text-left px-5 py-3 section-title hidden lg:table-cell">Coach Note</th>
                <th className="text-center px-5 py-3 section-title">Status</th>
                <th className="px-5 py-3 section-title text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((player, i) => {
                const cfg = statusConfig[player.status] ?? statusConfig.pending;
                return (
                  <tr
                    key={player.id}
                    className={clsx(
                      'border-b border-white/4 hover:bg-white/2 transition-colors',
                      i % 2 === 0 ? '' : 'bg-white/1'
                    )}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={player.name} src={player.photo} size="sm" />
                        <div>
                          <p className="text-sm font-semibold text-white">{player.name}</p>
                          <p className="text-2xs text-slate-500">{player.position} · {player.ageGroup}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="font-display font-extrabold text-volt-400 text-lg">{player.rating}</span>
                    </td>
                    <td className="px-5 py-4 text-center hidden md:table-cell">
                      <span className={clsx(
                        'text-xs font-semibold',
                        player.coachVote === 'Recommended' ? 'text-field-400'
                          : player.coachVote === 'Not Recommended' ? 'text-ember-400'
                          : 'text-volt-400'
                      )}>
                        {player.coachVote}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <p className="text-xs text-slate-500 italic max-w-xs truncate">
                        {player.coachNote ? `"${player.coachNote}"` : "—"}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {STATUS_ACTIONS.map((s) => (
                          <button
                            key={s}
                            onClick={() => handleUpdate(player.id, s)}
                            className={clsx(
                              'w-2 h-2 rounded-full transition-all border',
                              player.status === s
                                ? s === 'selected' ? 'bg-field-400 border-field-400'
                                  : s === 'shortlisted' ? 'bg-ice-400 border-ice-400'
                                  : s === 'on_hold' ? 'bg-volt-400 border-volt-400'
                                  : 'bg-ember-400 border-ember-400'
                                : 'bg-transparent border-slate-700 hover:border-slate-500'
                            )}
                            title={`Set ${s.replace('_', ' ')}`}
                          />
                        ))}
                        <button
                          onClick={() => setSelectedPlayer(player)}
                          className="ml-2 text-xs text-volt-400 hover:underline"
                        >
                          Details →
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Finalize selection */}
      {activePhase === 2 && list.length > 0 && (
        <div className="card p-5 border border-volt-400/15 bg-volt-400/3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-display font-bold text-white uppercase">Ready to Finalize Selection?</p>
              <p className="text-xs text-slate-500 mt-1">
                {counts.selected} selected · {counts.shortlisted} shortlisted · {counts.not_selected} released
              </p>
            </div>
            <Button loading={notifying} onClick={handleNotifyAll}>
              Notify All Players
            </Button>
          </div>
        </div>
      )}

      {/* Player detail modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedPlayer(null)} />
          <div className="relative card shadow-panel w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Avatar name={selectedPlayer.name} src={selectedPlayer.photo} size="lg" />
                <div>
                  <p className="font-display font-bold text-white text-lg uppercase">{selectedPlayer.name}</p>
                  <p className="text-xs text-slate-500">{selectedPlayer.position} · {selectedPlayer.ageGroup}</p>
                </div>
              </div>
              <button onClick={() => setSelectedPlayer(null)} className="text-slate-500 hover:text-white text-sm">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="card p-3 text-center">
                  <p className="font-display font-900 text-2xl text-volt-400">{selectedPlayer.rating}</p>
                  <p className="text-2xs text-slate-500 mt-0.5 uppercase tracking-wide">Rating</p>
                </div>
                <div className="card p-3 text-center">
                  <p className={clsx('text-sm font-bold',
                    selectedPlayer.coachVote === 'Recommended' ? 'text-field-400'
                      : selectedPlayer.coachVote === 'Not Recommended' ? 'text-ember-400'
                      : 'text-volt-400'
                  )}>{selectedPlayer.coachVote}</p>
                  <p className="text-2xs text-slate-500 mt-0.5 uppercase tracking-wide">Coach Vote</p>
                </div>
              </div>
              <div>
                <p className="section-title mb-2">Coach Note</p>
                <div className="bg-pitch-700 rounded p-3 border-l-2 border-volt-400">
                  <p className="text-sm text-slate-300 italic">
                    {selectedPlayer.coachNote ? `"${selectedPlayer.coachNote}"` : "No note yet"}
                  </p>
                </div>
              </div>
              <div>
                <p className="section-title mb-2">Update Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_ACTIONS.map((s) => {
                    const cfg = statusConfig[s];
                    const isActive = selectedPlayer.status === s;
                    return (
                      <button
                        key={s}
                        onClick={() => { handleUpdate(selectedPlayer.id, s); setSelectedPlayer(null); }}
                        className={clsx(
                          'py-2 px-3 rounded border text-xs font-bold uppercase tracking-wide transition-all',
                          isActive
                            ? `border-current ${cfg.variant === 'green' ? 'text-field-400 bg-field-400/10' : cfg.variant === 'blue' ? 'text-ice-400 bg-ice-400/10' : cfg.variant === 'yellow' ? 'text-volt-400 bg-volt-400/10' : 'text-ember-400 bg-ember-400/10'}`
                            : 'border-white/10 text-slate-500 hover:text-white hover:border-white/20'
                        )}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectionPage;
