// src/features/fees/FeesPage.tsx
import React, { useState } from "react";
import { clsx } from "clsx";
import { Wallet, Plus, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { Card, Badge, Button, Input, Modal, Skeleton, EmptyState } from "../../components/ui";
import { useCurrentFranchiseId } from "../../hooks/useCurrentFranchiseId";
import {
  useListFeesQuery,
  useCreateFeeMutation,
  useRecordPaymentMutation,
  type CreateFeeBody,
} from "../../store/api/adminFeesApi";
import { useGetStudentsQuery } from "../../store/api/studentsApi";

const STATUS_VARIANT: Record<string, "green" | "red" | "yellow" | "gray"> = {
  paid: "green",
  overdue: "red",
  partial: "yellow",
  pending: "gray",
  refunded: "gray",
};

const FeesPage: React.FC = () => {
  const franchiseId = useCurrentFranchiseId();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [studentFilter, setStudentFilter] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);
  const [payTarget, setPayTarget] = useState<{ feeId: string; installmentNumber: number; amount: number } | null>(null);

  const { data: fees, isLoading, isError } = useListFeesQuery(
    { franchiseId: franchiseId ?? "", studentId: studentFilter || undefined },
    { skip: !franchiseId },
  );
  const { data: studentsResult } = useGetStudentsQuery(
    { franchiseId: franchiseId ?? "", limit: 200 },
    { skip: !franchiseId },
  );
  const students = studentsResult?.items ?? [];

  const [createFee, { isLoading: creating }] = useCreateFeeMutation();

  const visible = (fees ?? []).filter((f) => !statusFilter || f.overallStatus === statusFilter);

  if (!franchiseId) {
    return (
      <EmptyState
        icon={<Wallet size={28} />}
        title="No franchise selected"
        description="Select a franchise from the top bar to manage fees."
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white uppercase tracking-wide">Fees</h1>
          <p className="text-sm text-slate-400 mt-1">Schedule and track collection across every player</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select value={studentFilter} onChange={(e) => setStudentFilter(e.target.value)} className="input !w-auto">
            <option value="">All players</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}></option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input !w-auto">
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
          <Button icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>
            Schedule a fee
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      )}

      {isError && <EmptyState title="Couldn't load fees" description="Please try again shortly." />}

      {visible.length === 0 && !isLoading && (
        <EmptyState
          icon={<Wallet size={28} />}
          title="No fee records yet"
          description="Schedule a fee for a player to start tracking collection."
          action={<Button onClick={() => setShowCreate(true)}>Schedule a fee</Button>}
        />
      )}

      <div className="space-y-4">
        {visible.map((fee) => (
          <Card key={fee._id} className="p-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-display font-bold text-white uppercase tracking-wide">
                  {fee.studentId?.firstName} {fee.studentId?.lastName}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5 capitalize">
                  {fee.feeType.replace("_", " ")} · ₹{fee.finalAmount.toLocaleString("en-IN")}
                </p>
              </div>
              <Badge variant={STATUS_VARIANT[fee.overallStatus] ?? "gray"}>{fee.overallStatus}</Badge>
            </div>
            <div className="mt-4 space-y-2">
              {fee.installments.map((inst) => (
                <div
                  key={inst.installmentNumber}
                  className="flex items-center justify-between text-sm bg-white/[0.03] rounded-lg px-3 py-2.5"
                >
                  <span className="text-slate-400">
                    Installment {inst.installmentNumber} · due {new Date(inst.dueDate).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-mono">
                      ₹{inst.paidAmount.toLocaleString("en-IN")} / ₹{inst.amount.toLocaleString("en-IN")}
                    </span>
                    <Badge variant={STATUS_VARIANT[inst.status] ?? "gray"}>{inst.status}</Badge>
                    {inst.status !== "paid" && (
                      <button
                        onClick={() =>
                          setPayTarget({
                            feeId: fee._id,
                            installmentNumber: inst.installmentNumber,
                            amount: inst.amount - inst.paidAmount,
                          })
                        }
                        className="text-xs text-volt-400 hover:text-volt-300 transition-colors"
                      >
                        Record payment
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {showCreate && (
        <CreateFeeModal
          franchiseId={franchiseId}
          onClose={() => setShowCreate(false)}
          creating={creating}
          onCreate={async (body) => {
            try {
              await createFee(body).unwrap();
              toast.success("Fee scheduled");
              setShowCreate(false);
            } catch (err: any) {
              toast.error(err?.data?.message || "Couldn't schedule fee — try again");
            }
          }}
        />
      )}
      {payTarget && <RecordPaymentModal target={payTarget} onClose={() => setPayTarget(null)} />}
    </div>
  );
};

const emptyInstallment = () => ({ amount: "", dueDate: "" });

const CreateFeeModal: React.FC<{
  franchiseId: string;
  onClose: () => void;
  onCreate: (body: CreateFeeBody) => void;
  creating: boolean;
}> = ({ franchiseId, onClose, onCreate, creating }) => {
  const { data: studentsResult } = useGetStudentsQuery(
    { franchiseId, limit: 200 },
    { skip: !franchiseId },
  );
  const students = studentsResult?.items ?? [];

  const [studentId, setStudentId] = useState("");
  const [feeType, setFeeType] = useState<CreateFeeBody["feeType"]>("one_time");
  const [totalAmount, setTotalAmount] = useState("");
  const [discount, setDiscount] = useState("");
  const [notes, setNotes] = useState("");
  const [installments, setInstallments] = useState([emptyInstallment()]);

  // Keep the installment count in sync with the chosen fee type: one_time
  // and early_bird are always a single payment, installment plans can have
  // as many as the manager schedules.
  const setFeeTypeAndAdjust = (type: CreateFeeBody["feeType"]) => {
    setFeeType(type);
    if (type !== "installment") setInstallments([emptyInstallment()]);
  };

  const addInstallment = () => setInstallments((prev) => [...prev, emptyInstallment()]);
  const removeInstallment = (i: number) => setInstallments((prev) => prev.filter((_, idx) => idx !== i));
  const updateInstallment = (i: number, field: "amount" | "dueDate", value: string) => {
    setInstallments((prev) => prev.map((inst, idx) => (idx === i ? { ...inst, [field]: value } : inst)));
  };

  // Auto-split the total evenly across the current installments whenever
  // asked, so the manager doesn't have to do the maths — they can still
  // fine-tune each amount afterwards.
  const splitEvenly = () => {
    const total = parseFloat(totalAmount);
    if (!total || installments.length === 0) return;
    const each = Math.floor((total / installments.length) * 100) / 100;
    const remainder = Math.round((total - each * installments.length) * 100) / 100;
    setInstallments((prev) =>
      prev.map((inst, i) => ({ ...inst, amount: (i === prev.length - 1 ? each + remainder : each).toString() })),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      toast.error("Select a player");
      return;
    }
    const total = parseFloat(totalAmount);
    if (!total || total <= 0) {
      toast.error("Enter a valid total amount");
      return;
    }
    if (installments.some((i) => !i.amount || !i.dueDate)) {
      toast.error("Fill in an amount and due date for every installment");
      return;
    }
    const installmentTotal = installments.reduce((sum, i) => sum + parseFloat(i.amount || "0"), 0);
    const finalAmount = total - (parseFloat(discount) || 0);
    if (Math.abs(installmentTotal - finalAmount) > 0.5) {
      toast.error(`Installments (₹${installmentTotal.toFixed(2)}) must add up to the total minus discount (₹${finalAmount.toFixed(2)})`);
      return;
    }

    onCreate({
      studentId,
      franchiseId,
      feeType,
      totalAmount: total,
      discount: parseFloat(discount) || undefined,
      notes: notes || undefined,
      installments: installments.map((inst, i) => ({
        installmentNumber: i + 1,
        amount: parseFloat(inst.amount),
        dueDate: new Date(inst.dueDate).toISOString(),
      })),
    });
  };

  return (
    <Modal isOpen onClose={onClose} title="Schedule a fee" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Player</label>
          <select className="input" value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
            <option value="">Select a player…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.firstName} {s.lastName} · {s.ageGroup}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Fee type</label>
          <div className="flex gap-2">
            {(["one_time", "installment", "early_bird"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFeeTypeAndAdjust(t)}
                className={clsx(
                  "flex-1 px-3 py-2 rounded border text-xs font-semibold uppercase tracking-wide transition-colors",
                  feeType === t ? "bg-volt-400 text-pitch-900 border-volt-400" : "border-white/10 text-slate-400 hover:border-white/25",
                )}
              >
                {t === "one_time" ? "One-time" : t === "installment" ? "Installment plan" : "Early bird"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Total amount (₹)" type="number" min={1} value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} required />
          <Input label="Discount (₹, optional)" type="number" min={0} value={discount} onChange={(e) => setDiscount(e.target.value)} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label !mb-0">
              {feeType === "installment" ? "Installments" : "Payment due"}
            </label>
            <div className="flex gap-3">
              {totalAmount && (
                <button type="button" onClick={splitEvenly} className="text-2xs text-volt-400 hover:underline">
                  Split evenly
                </button>
              )}
              {feeType === "installment" && (
                <button type="button" onClick={addInstallment} className="text-2xs text-ice-400 hover:underline">
                  + Add installment
                </button>
              )}
            </div>
          </div>
          <div className="space-y-2">
            {installments.map((inst, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-2xs text-slate-500 w-5">{i + 1}.</span>
                <input
                  type="number"
                  min={1}
                  placeholder="Amount"
                  value={inst.amount}
                  onChange={(e) => updateInstallment(i, "amount", e.target.value)}
                  className="input flex-1"
                  required
                />
                <input
                  type="date"
                  value={inst.dueDate}
                  onChange={(e) => updateInstallment(i, "dueDate", e.target.value)}
                  className="input flex-1"
                  required
                />
                {feeType === "installment" && installments.length > 1 && (
                  <button type="button" onClick={() => removeInstallment(i)} className="text-slate-500 hover:text-ember-400 px-1">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Notes (optional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="input w-full resize-none" placeholder="e.g. Term 1 fee — scholarship applied" />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" className="flex-1" loading={creating}>Schedule fee</Button>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
};

const RecordPaymentModal: React.FC<{
  target: { feeId: string; installmentNumber: number; amount: number };
  onClose: () => void;
}> = ({ target, onClose }) => {
  const [recordPayment, { isLoading }] = useRecordPaymentMutation();
  const [amount, setAmount] = useState(String(target.amount));
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await recordPayment({
        feeId: target.feeId,
        installmentNumber: target.installmentNumber,
        amount: Number(amount),
        paymentMethod,
      }).unwrap();
      toast.success("Payment recorded");
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Couldn't record payment — try again");
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Record payment" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Amount (₹)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <div>
          <label className="label">Payment method</label>
          <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
            <option value="bank_transfer">Bank transfer</option>
          </select>
        </div>
        <Button type="submit" loading={isLoading} className="w-full">
          Record payment
        </Button>
      </form>
    </Modal>
  );
};

export default FeesPage;
