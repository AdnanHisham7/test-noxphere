// src/components/layout/TopBar.tsx
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { Building2, ChevronDown, Check, Bell, Repeat2 } from 'lucide-react';
import { markAllRead } from '../../store/slices/notificationSlice';
import { setActiveFranchise } from '../../store/slices/uiSlice';
import { Avatar } from '../ui';
import { useState } from 'react';
import clsx from 'clsx';
import { RootState } from '../../store';
import { useCurrentFranchiseId } from '../../hooks/useCurrentFranchiseId';
import { useGetFranchiseByIdQuery, useGetFranchisesQuery } from '../../store/api/franchiseApi';
import { useTransferWallEnabled } from '../../hooks/useTransferWallEnabled';

const FranchiseSwitcher: React.FC = () => {
  const dispatch = useDispatch();
  const currentFranchiseId = useCurrentFranchiseId();
  const [open, setOpen] = useState(false);

  // Resolve the current franchise's academy, then list sibling franchises
  // under that same academy so a manager/coach can switch between them.
  const { data: currentFranchise } = useGetFranchiseByIdQuery(currentFranchiseId ?? '', {
    skip: !currentFranchiseId,
  });
  const { data: franchises } = useGetFranchisesQuery(
    currentFranchise ? { academyId: currentFranchise.academyId, isActive: true } : undefined,
    { skip: !currentFranchise },
  );

  if (!currentFranchiseId) {
    return (
      <div className="hidden sm:flex items-center gap-2 bg-pitch-800 border border-white/10 rounded px-3 py-1.5">
        <Building2 size={13} className="text-volt-400" />
        <span className="text-xs text-slate-400 font-medium">No franchise selected</span>
      </div>
    );
  }

  return (
    <div className="relative hidden sm:block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 bg-pitch-800 border border-white/10 rounded px-3 py-1.5 hover:border-white/20 transition-colors"
      >
        <Building2 size={13} className="text-volt-400" />
        <span className="text-xs text-slate-300 font-medium max-w-40 truncate">
          {currentFranchise?.name ?? 'Loading…'}
        </span>
        <ChevronDown size={12} className="text-slate-600" />
      </button>

      {open && franchises && franchises.length > 0 && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-11 w-64 card shadow-panel z-50 animate-slide-up py-1.5">
            <p className="px-3 py-1.5 section-title">Switch franchise</p>
            {franchises.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  dispatch(setActiveFranchise(f.id));
                  setOpen(false);
                }}
                className={clsx(
                  'w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-white/4 transition-colors',
                  f.id === currentFranchiseId ? 'text-volt-400 font-semibold' : 'text-slate-300',
                )}
              >
                <span className="truncate">{f.name}</span>
                {f.id === currentFranchiseId && <Check size={13} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const TopBar: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((s: RootState) => s.auth);
  const { unreadCount, items: notifications } = useSelector((s: RootState) => s.notifications);
  const [notifOpen, setNotifOpen] = useState(false);
  const transferWallEnabled = useTransferWallEnabled();
  const showTransferWallLink = user?.role === 'manager' && transferWallEnabled;

  return (
    <header className="h-16 bg-pitch-900/80 backdrop-blur-sm border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left: Franchise selector / breadcrumb */}
      <div className="flex items-center gap-4">
        {user?.role !== 'super_admin' && <FranchiseSwitcher />}
      </div>

      {/* Right: Notifications + Profile */}
      <div className="flex items-center gap-3">
        {/* Transfer Wall quick link — manager only, and only while the
            academy hasn't disabled it */}
        {showTransferWallLink && (
          <Link
            to="/transfer-wall"
            className="hidden md:flex items-center gap-1.5 text-xs text-ice-400 border border-ice-400/20 rounded px-3 py-1.5 hover:bg-ice-400/8 transition-colors"
          >
            <Repeat2 size={13} />
            <span className="uppercase tracking-wide font-semibold">Transfer Wall</span>
          </Link>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative w-9 h-9 flex items-center justify-center rounded bg-pitch-800 border border-white/10 text-slate-400 hover:text-white hover:border-white/15 transition-colors"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-ember-500 rounded-full text-2xs text-white font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-12 w-80 card shadow-panel z-50 animate-slide-up">
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <span className="section-title">Alerts</span>
                <button
                  onClick={() => dispatch(markAllRead())}
                  className="text-2xs text-volt-400 hover:underline"
                >
                  Mark all read
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-center text-slate-500 text-sm py-8">No notifications</p>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div key={n.id} className={clsx('p-4 border-b border-white/4 hover:bg-white/3', !n.isRead && 'bg-volt-400/4')}>
                      <p className="text-xs font-semibold text-white">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-2xs text-slate-600 mt-1">{n.createdAt}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 border-t border-white/5">
                <Link to="/notifications" className="block text-center text-xs text-volt-400 hover:underline" onClick={() => setNotifOpen(false)}>
                  View all alerts
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <Avatar name={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`} src={user?.avatar} size="sm" />
      </div>
    </header>
  );
};