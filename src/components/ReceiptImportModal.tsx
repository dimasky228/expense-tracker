"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { markInsightsStale } from "@/src/lib/insights-cache";
import UpgradeButton from "@/src/components/UpgradeButton";

const FREE_LIMIT = 5;

const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Groceries",
  "Transport",
  "Housing",
  "Entertainment",
  "Shopping",
  "Health",
  "Utilities",
  "Subscriptions",
  "Education",
  "Travel",
  "Other",
];
const INCOME_CATEGORIES = ["Salary", "Freelance", "Investment", "Other"];

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".pdf"];
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
]);

type Confidence = "high" | "medium" | "low";
type TransactionType = "expense" | "income";

type ReceiptData = {
  merchant_name: string;
  date: string;
  total: number;
  currency: string;
  category: string;
  type: TransactionType;
  confidence: Confidence;
  items?: { name: string; quantity: number; price: number }[];
  raw_text?: string;
};

type ReceiptItem = {
  id: string;
  file: File;
  previewUrl: string | null;
  status: "pending" | "processing" | "done" | "error";
  error?: string;
  data?: ReceiptData;
  // editable overrides
  merchant: string;
  date: string;
  amount: string;
  category: string;
  type: TransactionType;
  account: string;
  skip: boolean;
};

type Step = "idle" | "processing" | "review" | "saving" | "done";

function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  const map: Record<Confidence, { label: string; cls: string }> = {
    high: { label: "High confidence", cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
    medium: { label: "Medium confidence", cls: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
    low: { label: "Low — please verify", cls: "text-red-400 bg-red-400/10 border-red-400/20" },
  };
  const { label, cls } = map[confidence];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function filePreviewUrl(file: File): string | null {
  if (file.type === "image/heic") return null; // browser can't render HEIC
  if (file.type.startsWith("image/")) return URL.createObjectURL(file);
  return null; // PDF — show icon
}

export default function ReceiptImportModal({
  isPro,
  scansUsed,
}: {
  isPro: boolean;
  scansUsed: number;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const atLimit = !isPro && scansUsed >= FREE_LIMIT;

  function reset() {
    setStep("idle");
    setReceipts([]);
    setDragOver(false);
    setLimitReached(false);
    setSaveError("");
    setProcessedCount(0);
    setTotalCount(0);
    setSavedCount(0);
  }

  function handleClose() {
    if (step === "processing" || step === "saving") return;
    setOpen(false);
    setTimeout(reset, 200);
  }

  function validateFile(file: File): string | null {
    if (!ALLOWED_MIME.has(file.type)) {
      return `${file.name}: unsupported type. Use JPG, PNG, WebP, HEIC, or PDF.`;
    }
    if (file.size > 10 * 1024 * 1024) {
      return `${file.name}: too large (max 10 MB).`;
    }
    return null;
  }

  function addFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    const newItems: ReceiptItem[] = arr
      .filter((f) => !validateFile(f))
      .map((f) => ({
        id: `${f.name}-${f.lastModified}-${Math.random()}`,
        file: f,
        previewUrl: filePreviewUrl(f),
        status: "pending",
        data: undefined,
        merchant: "",
        date: new Date().toISOString().split("T")[0],
        amount: "",
        category: "Other",
        type: "expense",
        account: "",
        skip: false,
      }));

    if (newItems.length === 0) return;
    setReceipts((prev) => [...prev, ...newItems]);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }

  const updateReceipt = useCallback((id: string, patch: Partial<ReceiptItem>) => {
    setReceipts((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  async function processAll(items: ReceiptItem[]) {
    setStep("processing");
    setTotalCount(items.length);
    setProcessedCount(0);

    const updated = [...items];

    for (let i = 0; i < updated.length; i++) {
      const item = updated[i];
      setReceipts((prev) =>
        prev.map((r) => (r.id === item.id ? { ...r, status: "processing" } : r))
      );

      const body = new FormData();
      body.append("file", item.file);

      try {
        const res = await fetch("/api/import/receipt", { method: "POST", body });
        const json = (await res.json()) as ReceiptData & { error?: string; code?: string };

        if (!res.ok) {
          if (json.code === "LIMIT_REACHED") {
            setLimitReached(true);
            // mark remaining as errored
            updated.slice(i).forEach((r) => {
              setReceipts((prev) =>
                prev.map((x) =>
                  x.id === r.id ? { ...x, status: "error", error: "Scan limit reached" } : x
                )
              );
            });
            break;
          }
          updated[i] = { ...item, status: "error", error: json.error ?? "Processing failed" };
          setReceipts((prev) =>
            prev.map((r) => (r.id === item.id ? updated[i] : r))
          );
        } else {
          const today = new Date().toISOString().split("T")[0];
          updated[i] = {
            ...item,
            status: "done",
            data: json,
            merchant: json.merchant_name ?? "",
            date: json.date ?? today,
            amount: json.total != null ? String(json.total) : "",
            category: json.category ?? "Other",
            type: json.type ?? "expense",
          };
          setReceipts((prev) =>
            prev.map((r) => (r.id === item.id ? updated[i] : r))
          );
        }
      } catch {
        updated[i] = { ...item, status: "error", error: "Network error" };
        setReceipts((prev) =>
          prev.map((r) => (r.id === item.id ? updated[i] : r))
        );
      }

      setProcessedCount(i + 1);
    }

    setStep("review");
  }

  async function handleSave() {
    setStep("saving");
    setSaveError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaveError("Not authenticated"); setStep("review"); return; }

    const toSave = receipts.filter(
      (r) => !r.skip && r.status === "done" && r.amount && parseFloat(r.amount) > 0
    );

    if (toSave.length === 0) {
      setStep("done");
      setTimeout(() => { setOpen(false); setTimeout(reset, 200); router.refresh(); }, 1800);
      return;
    }

    const rows = toSave.map((r) => ({
      user_id: user.id,
      amount: parseFloat(r.amount),
      type: r.type,
      category: r.category,
      description: r.merchant || r.file.name,
      date: r.date,
      account: r.account.trim() || null,
      original_description: null,
      import_hash: null,
    }));

    const { error } = await supabase.from("transactions").insert(rows);
    if (error) {
      setSaveError(error.message);
      setStep("review");
      return;
    }

    markInsightsStale();
    setSavedCount(toSave.length);
    setStep("done");
    setTimeout(() => { setOpen(false); setTimeout(reset, 200); router.refresh(); }, 1800);
  }

  const doneCount = receipts.filter((r) => r.status === "done").length;
  const errorCount = receipts.filter((r) => r.status === "error").length;
  const wide = step === "review" || step === "saving";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
        </svg>
        Scan receipt
        {!isPro && (
          <span className="text-xs text-zinc-500">
            {scansUsed}/{FREE_LIMIT}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
          onClick={handleClose}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full overflow-y-auto rounded-t-2xl border border-zinc-700/50 bg-zinc-900 p-5 sm:rounded-2xl sm:p-6 ${
              wide
                ? "max-h-[95dvh] sm:max-w-3xl"
                : "max-h-[92dvh] sm:max-h-none sm:max-w-md"
            }`}
          >
            {/* ── Idle ── */}
            {step === "idle" && (
              <div>
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-zinc-50">Scan receipt</h2>
                  <button onClick={handleClose} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300">
                    <CloseIcon />
                  </button>
                </div>

                {atLimit ? (
                  <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-5 text-center">
                    <p className="text-sm font-semibold text-zinc-100">Monthly scan limit reached</p>
                    <p className="mt-2 text-sm text-zinc-400">
                      You&apos;ve used {FREE_LIMIT} of {FREE_LIMIT} free receipt scans this month.
                      Upgrade to Pro for unlimited scans.
                    </p>
                    <div className="mt-4 flex justify-center">
                      <UpgradeButton variant="inline" />
                    </div>
                  </div>
                ) : (
                  <>
                    {!isPro && (
                      <p className="mb-4 text-xs text-zinc-500">
                        {FREE_LIMIT - scansUsed} of {FREE_LIMIT} free scans remaining this month
                      </p>
                    )}

                    {/* Drop zone */}
                    <div
                      onDrop={handleDrop}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onClick={() => fileInputRef.current?.click()}
                      className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                        dragOver
                          ? "border-cyan-400 bg-cyan-400/5"
                          : "border-zinc-700 hover:border-zinc-500"
                      }`}
                    >
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                        </svg>
                      </div>
                      <p className="mt-3 text-sm font-medium text-zinc-300">
                        Drop receipts here, or{" "}
                        <span className="text-cyan-400">browse</span>
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Paper receipts · PDF invoices · Screenshots
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-600">
                        JPG, PNG, WebP, HEIC, PDF · max 10 MB each
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={ALLOWED_EXTENSIONS.join(",")}
                        multiple
                        className="hidden"
                        onChange={(e) => { if (e.target.files) addFiles(e.target.files); }}
                      />
                    </div>

                    {/* Camera button (mobile) */}
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 py-3 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200 sm:hidden"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                      </svg>
                      Take photo with camera
                    </button>
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => { if (e.target.files) addFiles(e.target.files); }}
                    />

                    {/* Queued files */}
                    {receipts.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {receipts.map((r) => (
                          <div key={r.id} className="flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-800/50 px-3 py-2.5">
                            {r.previewUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={r.previewUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-700 text-zinc-400">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                </svg>
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-zinc-200">{r.file.name}</p>
                              <p className="text-xs text-zinc-500">{(r.file.size / 1024).toFixed(0)} KB</p>
                            </div>
                            <button
                              onClick={() => setReceipts((prev) => prev.filter((x) => x.id !== r.id))}
                              className="shrink-0 text-zinc-500 hover:text-zinc-300"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => processAll(receipts)}
                      disabled={receipts.length === 0}
                      className="mt-4 w-full rounded-xl bg-cyan-400 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {receipts.length === 0
                        ? "Upload receipts to continue"
                        : `Scan ${receipts.length} receipt${receipts.length !== 1 ? "s" : ""} with AI`}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ── Processing ── */}
            {step === "processing" && (
              <div className="py-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-400">
                  <Spinner />
                </div>
                <h3 className="mt-4 text-base font-semibold text-zinc-50">
                  AI is reading your receipts…
                </h3>
                <p className="mt-2 text-sm text-zinc-400">
                  Processing {processedCount + 1} of {totalCount}
                </p>

                {/* Per-file progress */}
                <div className="mt-6 space-y-2 text-left">
                  {receipts.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-800/50 px-3 py-2.5">
                      <div className="shrink-0">
                        {r.status === "processing" && <span className="text-cyan-400"><Spinner /></span>}
                        {r.status === "done" && (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5 text-emerald-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        )}
                        {r.status === "error" && (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5 text-red-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                        )}
                        {r.status === "pending" && <span className="block h-5 w-5 rounded-full border-2 border-zinc-700" />}
                      </div>
                      <p className="truncate text-sm text-zinc-300">{r.file.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Review ── */}
            {(step === "review" || step === "saving") && (
              <div>
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-50">Review receipts</h2>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {doneCount} extracted
                      {errorCount > 0 && `, ${errorCount} failed`}
                      {limitReached && " · scan limit reached"}
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={step === "saving"}
                    className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-50"
                  >
                    <CloseIcon />
                  </button>
                </div>

                {limitReached && (
                  <div className="mb-4 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4">
                    <p className="text-sm font-semibold text-zinc-100">Scan limit reached</p>
                    <p className="mt-1 text-xs text-zinc-400">
                      Some receipts couldn&apos;t be processed. Upgrade to Pro for unlimited scans.
                    </p>
                    <div className="mt-3">
                      <UpgradeButton variant="inline" />
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {receipts.map((r) => (
                    <ReceiptCard
                      key={r.id}
                      item={r}
                      onUpdate={(patch) => updateReceipt(r.id, patch)}
                      disabled={step === "saving"}
                    />
                  ))}
                </div>

                {saveError && (
                  <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {saveError}
                  </p>
                )}

                <div className="mt-5 flex gap-3">
                  <button
                    onClick={handleClose}
                    disabled={step === "saving"}
                    className="flex-1 rounded-xl border border-zinc-700 py-3 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-50 disabled:opacity-50"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={step === "saving" || doneCount === 0}
                    className="flex-1 rounded-xl bg-cyan-400 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {step === "saving" ? (
                      <span className="flex items-center justify-center gap-2">
                        <Spinner /> Saving…
                      </span>
                    ) : (
                      `Save ${receipts.filter((r) => !r.skip && r.status === "done").length} transaction${receipts.filter((r) => !r.skip && r.status === "done").length !== 1 ? "s" : ""}`
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ── Done ── */}
            {step === "done" && (
              <div className="py-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-7 w-7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-zinc-50">Saved!</h3>
                <p className="mt-2 text-sm text-zinc-400">
                  {savedCount} transaction{savedCount !== 1 ? "s" : ""} added from receipts.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ReceiptCard({
  item,
  onUpdate,
  disabled,
}: {
  item: ReceiptItem;
  onUpdate: (patch: Partial<ReceiptItem>) => void;
  disabled: boolean;
}) {
  const [showItems, setShowItems] = useState(false);
  const categories =
    item.type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  if (item.status === "error") {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 shrink-0 text-red-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-200">{item.file.name}</p>
            <p className="text-xs text-red-400">{item.error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (item.status !== "done") return null;

  return (
    <div className={`rounded-xl border bg-zinc-800/50 p-4 transition-opacity ${item.skip ? "border-zinc-800 opacity-50" : "border-zinc-700"}`}>
      {/* Header: thumbnail + filename + confidence + skip */}
      <div className="mb-4 flex items-start gap-3">
        {item.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.previewUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-zinc-700 text-zinc-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-200">{item.file.name}</p>
          {item.data?.raw_text && (
            <p className="mt-0.5 truncate text-xs text-zinc-500">{item.data.raw_text}</p>
          )}
          {item.data?.confidence && (
            <div className="mt-1.5">
              <ConfidenceBadge confidence={item.data.confidence} />
            </div>
          )}
        </div>
        <button
          onClick={() => onUpdate({ skip: !item.skip })}
          disabled={disabled}
          className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
            item.skip
              ? "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
              : "text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
          }`}
        >
          {item.skip ? "Undo skip" : "Skip"}
        </button>
      </div>

      {!item.skip && (
        <div className="grid grid-cols-2 gap-3">
          {/* Merchant */}
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-medium text-zinc-400">Merchant</label>
            <input
              type="text"
              value={item.merchant}
              onChange={(e) => onUpdate({ merchant: e.target.value })}
              disabled={disabled}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 placeholder-zinc-500 focus:border-cyan-400 focus:outline-none disabled:opacity-60"
            />
          </div>

          {/* Date */}
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Date</label>
            <input
              type="date"
              value={item.date}
              onChange={(e) => onUpdate({ date: e.target.value })}
              disabled={disabled}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 focus:border-cyan-400 focus:outline-none disabled:opacity-60"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">
              Amount {item.data?.currency && <span className="text-zinc-600">({item.data.currency})</span>}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={item.amount}
              onChange={(e) => onUpdate({ amount: e.target.value })}
              disabled={disabled}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 focus:border-cyan-400 focus:outline-none disabled:opacity-60"
            />
          </div>

          {/* Type */}
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Type</label>
            <div className="flex rounded-lg border border-zinc-700 bg-zinc-900 p-0.5">
              {(["expense", "income"] as TransactionType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => onUpdate({ type: t, category: t === "expense" ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0] })}
                  disabled={disabled}
                  className={`flex-1 rounded-md py-1.5 text-xs font-medium capitalize transition-colors ${
                    item.type === t
                      ? "bg-zinc-700 text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Category</label>
            <select
              value={item.category}
              onChange={(e) => onUpdate({ category: e.target.value })}
              disabled={disabled}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 focus:border-cyan-400 focus:outline-none disabled:opacity-60"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Account */}
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-medium text-zinc-400">
              Account <span className="font-normal text-zinc-600">(optional)</span>
            </label>
            <input
              type="text"
              value={item.account}
              onChange={(e) => onUpdate({ account: e.target.value })}
              disabled={disabled}
              placeholder="e.g. Chase Checking"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 placeholder-zinc-500 focus:border-cyan-400 focus:outline-none disabled:opacity-60"
            />
          </div>

          {/* Line items (collapsible) */}
          {item.data?.items && item.data.items.length > 0 && (
            <div className="col-span-2">
              <button
                onClick={() => setShowItems((v) => !v)}
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`h-3.5 w-3.5 transition-transform ${showItems ? "rotate-90" : ""}`}
                >
                  <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
                {item.data.items.length} line item{item.data.items.length !== 1 ? "s" : ""} detected
              </button>
              {showItems && (
                <div className="mt-2 space-y-1 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                  {item.data.items.map((li, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 text-xs text-zinc-400">
                      <span className="flex-1 truncate">{li.quantity > 1 && `${li.quantity}× `}{li.name}</span>
                      <span className="shrink-0 font-medium text-zinc-300">${li.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
