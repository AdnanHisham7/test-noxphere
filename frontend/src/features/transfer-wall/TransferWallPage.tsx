// src/features/transfer-wall/TransferWallPage.tsx
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { clsx } from 'clsx';
import {
  useGetTransferListingsQuery,
  useRequestTransferMutation,
  type TransferListing,
} from '../../store/api/transferApi';
import { Card, Badge, Button, Input, Modal, Skeleton, EmptyState, Avatar } from '../../components/ui';
import { RootState } from '../../store';
import { toast } from 'react-hot-toast';

const getRatingColor = (r: number) =>
  r >= 9 ? 'text-volt-400' : r >= 8 ? 'text-field-400' : r >= 7 ? 'text-ice-400' : 'text-slate-400';

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);

const TransferWallPage: React.FC = () => {
  const { isAuthenticated, user } = useSelector((s: RootState) => s.auth);
  const [selectedListing, setSelectedListing] = useState<TransferListing | null>(null);
  const [requestModal, setRequestModal] = useState(false);
  const [offeredPrice, setOfferedPrice] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [filterAge, setFilterAge] = useState('');

  const { data, isLoading, isError } = useGetTransferListingsQuery({
    search: search || undefined,
    position: filterPosition || undefined,
    ageGroup: filterAge || undefined,
    limit: 30,
  });
  const listings = data?.data ?? [];

  const [requestTransfer, { isLoading: submitting }] = useRequestTransferMutation();

  const handleRequestTransfer = () => {
    if (!isAuthenticated) {
      toast.error('Please log in as a Manager to submit transfer requests');
      return;
    }
    setOfferedPrice(selectedListing?.price.toString() ?? '');
    setMessage('');
    setRequestModal(true);
  };

  const handleSubmitRequest = async () => {
    if (!selectedListing) return;
    const price = parseFloat(offeredPrice);
    if (!price || price <= 0) {
      toast.error('Enter a valid offer amount');
      return;
    }
    try {
      await requestTransfer({ listingId: selectedListing.id, offeredPrice: price, message: message || undefined }).unwrap();
      toast.success('Transfer request submitted!');
      setRequestModal(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Couldn't submit request — try again");
    }
  };

  return (
    <div className="min-h-screen bg-pitch-950">
      {/* Public header */}
      <header className="bg-pitch-900 border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-volt-400 rounded flex items-center justify-center">
              <span className="font-display font-900 text-pitch-900 text-sm">FC</span>
            </div>
            <span className="font-display font-extrabold text-white uppercase tracking-widest text-sm hidden sm:block">Football Franchise</span>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="text-ice-400">↔</span>
            <span className="font-display font-bold text-white uppercase tracking-wide text-sm">Transfer Wall</span>
            <span className="pill-blue text-2xs ml-1">PUBLIC</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xs text-slate-500 hidden md:block">{data?.meta?.total ?? listings.length} players listed</span>
          {isAuthenticated ? (
            <a href="/dashboard" className="btn-secondary text-xs py-1.5 px-3">← Dashboard</a>
          ) : (
            <a href="/login" className="btn-primary text-xs py-1.5 px-4">Manager Login</a>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Hero banner */}
        <div className="relative overflow-hidden rounded-lg bg-pitch-800 border border-ice-400/15 p-6 sm:p-8">
          <div className="absolute inset-0 bg-ice-glow opacity-50" />
          <div className="relative z-10">
            <p className="section-title text-ice-400 mb-2">Open Market</p>
            <h1 className="font-display font-900 text-white text-3xl sm:text-4xl uppercase tracking-tight leading-none">
              Transfer Wall
            </h1>
            <p className="text-slate-400 text-sm mt-2 max-w-xl">
              Browse talented players available for transfer across football franchises. Managers can submit acquisition requests directly to the listing franchise.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-field-400 animate-pulse" />
                Live listings
              </div>
              <span className="text-slate-600 text-xs">Verified franchise players only</span>
              <span className="text-slate-600 text-xs">Secure manager-to-manager transfers</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <Input
              label="Search Player"
              placeholder="Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<span className="text-xs">🔍</span>}
            />
          </div>
          <div className="min-w-36">
            <label className="label">Position</label>
            <select className="input" value={filterPosition} onChange={(e) => setFilterPosition(e.target.value)}>
              <option value="">All Positions</option>
              {['Forward', 'Midfielder', 'Defender', 'Goalkeeper'].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="min-w-36">
            <label className="label">Age Group</label>
            <select className="input" value={filterAge} onChange={(e) => setFilterAge(e.target.value)}>
              <option value="">All Ages</option>
              {['U-13', 'U-15', 'U-17', 'U-19', 'U-21'].map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <Button variant="ghost" onClick={() => { setSearch(''); setFilterPosition(''); setFilterAge(''); }}>
            Clear
          </Button>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
          </div>
        )}

        {isError && <EmptyState icon="↔" title="Couldn't load the transfer wall" description="Please try again shortly." />}

        {/* Listings grid */}
        {!isLoading && listings.length === 0 && (
          <EmptyState icon="↔" title="No players found" description="Try adjusting your filters, or check back later for new listings." />
        )}
        {!isLoading && listings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="card border border-white/5 hover:border-ice-400/25 transition-all duration-200 cursor-pointer overflow-hidden group"
                onClick={() => setSelectedListing(listing)}
              >
                {/* Card header */}
                <div className="p-5 border-b border-white/5">
                  <div className="flex items-start gap-3">
                    <Avatar
                      name={`${listing.student?.firstName} ${listing.student?.lastName}`}
                      src={listing.student?.photo}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-display font-extrabold text-white text-lg leading-tight">
                            {listing.student?.firstName}<br />{listing.student?.lastName}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {listing.student?.position ?? '—'} · {listing.student?.ageGroup}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={clsx('font-display font-900 text-2xl tabular-nums', getRatingColor(listing.overallRating))}>
                            {listing.overallRating.toFixed(1)}
                          </p>
                          <p className="text-2xs text-slate-500">Rating</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick stats */}
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    {listing.student?.attendancePercentage !== undefined && (
                      <span className="stat-badge text-field-400">
                        ✓ {listing.student.attendancePercentage}% att
                      </span>
                    )}
                    <span className="stat-badge text-slate-400">
                      👁 {listing.viewCount} views
                    </span>
                    {listing.fromFranchise?.name && (
                      <span className="stat-badge text-slate-500">
                        {listing.fromFranchise.name.split(' ')[0]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Skills + note preview */}
                <div className="px-5 py-3">
                  {listing.skills.length > 0 && (
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {listing.skills.map((s) => (
                        <span key={s} className="pill-blue text-2xs">{s}</span>
                      ))}
                    </div>
                  )}
                  {listing.note && (
                    <p className="text-xs text-slate-500 line-clamp-2">{listing.note}</p>
                  )}
                </div>

                {/* Price + CTA */}
                <div className="px-5 py-4 bg-pitch-700/50 flex items-center justify-between">
                  <div>
                    <p className="text-2xs text-slate-500 uppercase tracking-wide">Transfer Fee</p>
                    <p className="font-display font-extrabold text-volt-400 text-lg">
                      {formatCurrency(listing.price, listing.currency)}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setSelectedListing(listing); }}
                    className="group-hover:border-ice-400/40 group-hover:text-ice-400"
                  >
                    View Profile
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Player Detail Modal */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedListing(null)} />
          <div className="relative card shadow-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
            {/* Header */}
            <div className="sticky top-0 bg-pitch-800 border-b border-white/5 p-5 flex items-start justify-between z-10">
              <div className="flex items-center gap-4">
                <Avatar
                  name={`${selectedListing.student?.firstName} ${selectedListing.student?.lastName}`}
                  src={selectedListing.student?.photo}
                  size="xl"
                />
                <div>
                  <p className="font-display font-900 text-white text-2xl uppercase">
                    {selectedListing.student?.firstName} {selectedListing.student?.lastName}
                  </p>
                  <p className="text-sm text-slate-400">
                    {selectedListing.student?.position ?? '—'} · {selectedListing.student?.ageGroup}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {selectedListing.fromFranchise?.name && (
                      <>
                        <span className="text-2xs text-slate-500">{selectedListing.fromFranchise.name}</span>
                        <span className="text-slate-700">·</span>
                      </>
                    )}
                    <span className="text-2xs text-slate-500">
                      Listed {new Date(selectedListing.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedListing(null)} className="btn-ghost p-1 text-slate-400 text-sm">✕</button>
            </div>

            <div className="p-5 space-y-6">
              {/* Overall rating + stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="card p-4 text-center">
                  <p className={clsx('font-display font-900 text-3xl', getRatingColor(selectedListing.overallRating))}>
                    {selectedListing.overallRating.toFixed(1)}
                  </p>
                  <p className="text-2xs text-slate-500 mt-1 uppercase tracking-wide">Overall</p>
                </div>
                <div className="card p-4 text-center">
                  <p className="font-display font-900 text-3xl text-field-400">
                    {selectedListing.student?.attendancePercentage !== undefined ? `${selectedListing.student.attendancePercentage}%` : '—'}
                  </p>
                  <p className="text-2xs text-slate-500 mt-1 uppercase tracking-wide">Attendance</p>
                </div>
                <div className="card p-4 text-center">
                  <p className="font-display font-900 text-3xl text-volt-400">{formatCurrency(selectedListing.price, selectedListing.currency)}</p>
                  <p className="text-2xs text-slate-500 mt-1 uppercase tracking-wide">Fee</p>
                </div>
              </div>

              {/* Skills */}
              {selectedListing.skills.length > 0 && (
                <div>
                  <p className="section-title mb-2">Key Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedListing.skills.map((s) => (
                      <span key={s} className="pill-blue">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Note */}
              {selectedListing.note && (
                <div>
                  <p className="section-title mb-2">Coach Note</p>
                  <div className="bg-pitch-700 border border-white/5 rounded p-4">
                    <p className="text-sm text-slate-300 leading-relaxed italic">"{selectedListing.note}"</p>
                  </div>
                </div>
              )}

              {/* Highlights */}
              {selectedListing.highlights.length > 0 && (
                <div>
                  <p className="section-title mb-2">Highlights</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedListing.highlights.map((h) => (
                      <span key={h} className="pill-yellow">{h}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="pt-2 flex gap-3">
                {user?.role === 'manager' || user?.role === 'super_admin' ? (
                  <Button className="flex-1" onClick={handleRequestTransfer}>
                    Submit Transfer Request
                  </Button>
                ) : (
                  <div className="flex-1 card p-4 text-center">
                    <p className="text-xs text-slate-500">
                      <a href="/login" className="text-volt-400 hover:underline">Login as Manager</a> to submit a transfer request
                    </p>
                  </div>
                )}
                <Button variant="secondary" onClick={() => setSelectedListing(null)}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Request Modal */}
      <Modal isOpen={requestModal} onClose={() => setRequestModal(false)} title="Submit Transfer Request" size="md">
        <div className="space-y-4">
          <div className="bg-pitch-700 rounded p-4">
            <p className="text-xs text-slate-400">Requesting transfer for:</p>
            <p className="font-display font-bold text-white mt-1">
              {selectedListing?.student?.firstName} {selectedListing?.student?.lastName}
            </p>
            <p className="text-xs text-slate-500">{selectedListing?.fromFranchise?.name}</p>
          </div>
          <Input
            label="Offered Amount (₹)"
            type="number"
            value={offeredPrice}
            onChange={(e) => setOfferedPrice(e.target.value)}
            placeholder={selectedListing?.price?.toString()}
          />
          <div className="space-y-1.5">
            <label className="label">Message to Selling Franchise</label>
            <textarea
              className="input min-h-24 resize-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Introduce your franchise and explain your interest..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" loading={submitting} onClick={handleSubmitRequest}>
              Submit Request
            </Button>
            <Button variant="secondary" onClick={() => setRequestModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-12 py-6 px-6 text-center">
        <p className="text-2xs text-slate-600">
          Football Franchise Platform · Transfer Wall is a public portal · All transfers are processed franchise-to-franchise
        </p>
      </footer>
    </div>
  );
};

export default TransferWallPage;
