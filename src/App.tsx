import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  Archive,
  CalendarDays,
  CircleDollarSign,
  Copy,
  Download,
  FileText,
  Github,
  HeartHandshake,
  KeyRound,
  Lock,
  Plus,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Trash2,
  Unlock,
  Upload
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { ExpenseReportRow } from "./features/analytics/duckdbReports";
import { exportEventsToIcs, importEventsFromIcs } from "./features/calendar/ics";
import { ocrReceipt } from "./features/expenses/receipt";
import { summarizeMessages } from "./features/llm/localLlm";
import {
  decryptVault,
  encryptVault,
  generateVaultIdentity,
  openEventInvite,
  sealEventInvite
} from "./lib/cryptoVault";
import { fileToDataUrl, sha256Hex } from "./lib/encoding";
import {
  dateInputValue,
  dateTimeLocalValue,
  downloadDataUrl,
  downloadText,
  formatCurrency,
  formatDate,
  formatDateTime,
  parseMoneyToCents
} from "./lib/format";
import {
  type CalendarEvent,
  type Child,
  createEmptyVault,
  type DocumentRecord,
  type EncryptedVault,
  type MessageRecord,
  touchVault,
  type VaultState
} from "./lib/schemas";
import { clearEncryptedVault, loadEncryptedVault, saveEncryptedVault } from "./lib/storage";

type Tab = "overview" | "calendar" | "expenses" | "messages" | "documents" | "privacy";
type Toast = { kind: "ok" | "error"; message: string } | null;

const tabs: Array<{ id: Tab; label: string; icon: typeof CalendarDays }> = [
  { id: "overview", label: "Overview", icon: ShieldCheck },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "expenses", label: "Expenses", icon: CircleDollarSign },
  { id: "messages", label: "Archive", icon: Archive },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "privacy", label: "Privacy", icon: KeyRound }
];

function formValue(form: FormData, key: string): string {
  return String(form.get(key) ?? "").trim();
}

function childName(children: Child[], childId: string): string {
  return children.find((child) => child.id === childId)?.name ?? "Child";
}

function firstChildId(vault: VaultState): string {
  return vault.children[0]?.id ?? "";
}

function App() {
  const queryClient = useQueryClient();
  const encryptedQuery = useQuery({ queryKey: ["encrypted-vault"], queryFn: loadEncryptedVault });
  const [vault, setVault] = useState<VaultState | null>(null);
  const [passphrase, setPassphrase] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [toast, setToast] = useState<Toast>(null);
  const [saveStatus, setSaveStatus] = useState("Locked");

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timeout = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!vault || !passphrase) {
      return;
    }

    setSaveStatus("Saving");
    const timeout = window.setTimeout(() => {
      encryptVault(vault, passphrase)
        .then(async (container) => {
          await saveEncryptedVault(container);
          queryClient.setQueryData(["encrypted-vault"], container);
          setSaveStatus("Saved");
        })
        .catch((error: unknown) => {
          setSaveStatus("Save failed");
          setToast({
            kind: "error",
            message: error instanceof Error ? error.message : "Save failed"
          });
        });
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [vault, passphrase, queryClient]);

  function notify(kind: "ok" | "error", message: string) {
    setToast({ kind, message });
  }

  function updateVault(updater: (current: VaultState) => VaultState) {
    setVault((current) => (current ? touchVault(updater(current)) : current));
  }

  async function handleCreate(input: {
    householdName: string;
    parentName: string;
    coParentName?: string;
    childName?: string;
    passphrase: string;
  }) {
    const identity = await generateVaultIdentity();
    const nextVault = createEmptyVault({ ...input, identity });
    const encrypted = await encryptVault(nextVault, input.passphrase);
    await saveEncryptedVault(encrypted);
    queryClient.setQueryData(["encrypted-vault"], encrypted);
    setPassphrase(input.passphrase);
    setVault(nextVault);
    setSaveStatus("Saved");
    notify("ok", "Vault created.");
  }

  async function handleUnlock(inputPassphrase: string) {
    if (!encryptedQuery.data) {
      throw new Error("No local vault exists yet.");
    }
    const unlocked = await decryptVault(encryptedQuery.data, inputPassphrase);
    setPassphrase(inputPassphrase);
    setVault(unlocked);
    setSaveStatus("Saved");
    notify("ok", "Vault unlocked.");
  }

  async function handleImportLocked(file: File, inputPassphrase: string) {
    const imported = JSON.parse(await file.text()) as EncryptedVault;
    const unlocked = await decryptVault(imported, inputPassphrase);
    await saveEncryptedVault(imported);
    queryClient.setQueryData(["encrypted-vault"], imported);
    setPassphrase(inputPassphrase);
    setVault(unlocked);
    setSaveStatus("Saved");
    notify("ok", "Encrypted vault imported.");
  }

  if (encryptedQuery.isLoading) {
    return <LoadingScreen />;
  }

  if (!vault) {
    return (
      <VaultGate
        hasVault={Boolean(encryptedQuery.data)}
        onCreate={handleCreate}
        onUnlock={handleUnlock}
        onImport={handleImportLocked}
        notify={notify}
        toast={toast}
      />
    );
  }

  return (
    <div className="min-h-screen text-ink">
      <header className="border-b border-line bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-sea">
              Encrypted local-first workspace
            </p>
            <h1 className="text-2xl font-bold tracking-normal">{vault.householdName}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a className="btn-secondary" href={__REPO_URL__} target="_blank" rel="noreferrer">
              <Github size={18} aria-hidden /> GitHub
            </a>
            <a className="btn-secondary" href={__PAYPAL_URL__} target="_blank" rel="noreferrer">
              <HeartHandshake size={18} aria-hidden /> PayPal
            </a>
            <span className="pill">v{__APP_VERSION__}</span>
            <span className="pill">commit {__COMMIT_SHA__}</span>
            <span className="pill">{saveStatus}</span>
            <button
              className="btn-secondary"
              type="button"
              onClick={() => {
                setVault(null);
                setPassphrase("");
                setSaveStatus("Locked");
              }}
            >
              <Lock size={18} aria-hidden /> Lock
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[220px_1fr]">
        <nav className="panel h-fit p-2" aria-label="Workspace">
          <div className="grid grid-cols-2 gap-1 lg:grid-cols-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`flex min-h-11 items-center gap-2 rounded-md px-3 text-left text-sm font-semibold ${
                    activeTab === tab.id ? "bg-sea text-white" : "hover:bg-slate-50"
                  }`}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={18} aria-hidden />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        <section className="min-w-0">
          {activeTab === "overview" && <Overview vault={vault} updateVault={updateVault} />}
          {activeTab === "calendar" && (
            <CalendarView vault={vault} updateVault={updateVault} notify={notify} />
          )}
          {activeTab === "expenses" && (
            <ExpenseView vault={vault} updateVault={updateVault} notify={notify} />
          )}
          {activeTab === "messages" && (
            <MessagesView vault={vault} updateVault={updateVault} notify={notify} />
          )}
          {activeTab === "documents" && (
            <DocumentsView vault={vault} updateVault={updateVault} notify={notify} />
          )}
          {activeTab === "privacy" && (
            <PrivacyView
              vault={vault}
              passphrase={passphrase}
              setVault={setVault}
              setPassphrase={setPassphrase}
              notify={notify}
              queryClient={queryClient}
            />
          )}
        </section>
      </main>
      <ToastView toast={toast} />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="panel max-w-md p-6 text-center">
        <ShieldCheck className="mx-auto mb-3 text-sea" size={32} aria-hidden />
        <p className="font-semibold">Loading local vault state</p>
      </div>
    </div>
  );
}

function VaultGate(props: {
  hasVault: boolean;
  onCreate: (input: {
    householdName: string;
    parentName: string;
    coParentName?: string;
    childName?: string;
    passphrase: string;
  }) => Promise<void>;
  onUnlock: (passphrase: string) => Promise<void>;
  onImport: (file: File, passphrase: string) => Promise<void>;
  notify: (kind: "ok" | "error", message: string) => void;
  toast: Toast;
}) {
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      props.notify("error", error instanceof Error ? error.message : "Vault action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-8">
      <div className="grid w-full max-w-5xl gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="panel p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-sea">co-parent-vault</p>
              <h1 className="text-3xl font-bold tracking-normal">
                {props.hasVault ? "Unlock household vault" : "Create household vault"}
              </h1>
            </div>
            <ShieldCheck className="text-sea" size={34} aria-hidden />
          </div>

          {props.hasVault ? (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                void run(() => props.onUnlock(formValue(form, "passphrase")));
              }}
            >
              <label className="block space-y-1">
                <span className="label">Passphrase</span>
                <input
                  className="field"
                  name="passphrase"
                  type="password"
                  minLength={12}
                  required
                />
              </label>
              <button className="btn-primary w-full" type="submit" disabled={busy}>
                <Unlock size={18} aria-hidden /> Unlock
              </button>
            </form>
          ) : (
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                const passphrase = formValue(form, "passphrase");
                const confirm = formValue(form, "confirm");
                if (passphrase !== confirm) {
                  props.notify("error", "Passphrases do not match.");
                  return;
                }
                void run(() =>
                  props.onCreate({
                    householdName: formValue(form, "householdName"),
                    parentName: formValue(form, "parentName"),
                    coParentName: formValue(form, "coParentName"),
                    childName: formValue(form, "childName"),
                    passphrase
                  })
                );
              }}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1">
                  <span className="label">Household</span>
                  <input
                    className="field"
                    name="householdName"
                    placeholder="Rivera family"
                    required
                  />
                </label>
                <label className="block space-y-1">
                  <span className="label">Your name</span>
                  <input className="field" name="parentName" placeholder="Alex" required />
                </label>
                <label className="block space-y-1">
                  <span className="label">Co-parent</span>
                  <input className="field" name="coParentName" placeholder="Jordan" />
                </label>
                <label className="block space-y-1">
                  <span className="label">Child</span>
                  <input className="field" name="childName" placeholder="Sam" />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1">
                  <span className="label">Passphrase</span>
                  <input
                    className="field"
                    name="passphrase"
                    type="password"
                    minLength={12}
                    required
                  />
                </label>
                <label className="block space-y-1">
                  <span className="label">Confirm</span>
                  <input className="field" name="confirm" type="password" minLength={12} required />
                </label>
              </div>
              <button className="btn-primary" type="submit" disabled={busy}>
                <KeyRound size={18} aria-hidden /> Create encrypted vault
              </button>
            </form>
          )}
        </section>

        <aside className="panel p-6">
          <div className="mb-4 flex items-center gap-2">
            <Upload className="text-clay" size={20} aria-hidden />
            <h2 className="text-lg font-bold">Import encrypted export</h2>
          </div>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const file = form.get("vaultFile");
              if (!(file instanceof File) || file.size === 0) {
                props.notify("error", "Choose an encrypted vault export.");
                return;
              }
              void run(() => props.onImport(file, formValue(form, "importPassphrase")));
            }}
          >
            <input className="field" name="vaultFile" type="file" accept="application/json,.json" />
            <input
              className="field"
              name="importPassphrase"
              type="password"
              minLength={12}
              placeholder="Export passphrase"
            />
            <button className="btn-secondary w-full" type="submit" disabled={busy}>
              <Upload size={18} aria-hidden /> Import
            </button>
          </form>
          <div className="mt-5 space-y-2 text-sm text-slate-700">
            <p>Repo: {__REPO_URL__}</p>
            <p>Support: {__PAYPAL_URL__}</p>
            <p>
              Version {__APP_VERSION__}, commit {__COMMIT_SHA__}
            </p>
          </div>
        </aside>
      </div>
      <ToastView toast={props.toast} />
    </div>
  );
}

function Overview(props: {
  vault: VaultState;
  updateVault: (updater: (current: VaultState) => VaultState) => void;
}) {
  const openExpenses = props.vault.expenses.filter((expense) => expense.status === "open");
  const totalOpen = openExpenses.reduce((sum, expense) => sum + expense.amountCents, 0);
  const nextEvents = [...props.vault.events]
    .filter((event) => new Date(event.end).getTime() >= Date.now())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Children" value={props.vault.children.length.toString()} />
        <Metric label="Events" value={props.vault.events.length.toString()} />
        <Metric label="Open expenses" value={formatCurrency(totalOpen)} />
        <Metric label="Archive records" value={props.vault.messages.length.toString()} />
      </div>

      <section className="panel p-5">
        <h2 className="mb-4 text-lg font-bold">Children</h2>
        <form
          className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const name = formValue(form, "childName");
            if (!name) {
              return;
            }
            props.updateVault((current) => ({
              ...current,
              children: [
                ...current.children,
                { id: crypto.randomUUID(), name, color: formValue(form, "color") || "#0f766e" }
              ]
            }));
            event.currentTarget.reset();
          }}
        >
          <input className="field" name="childName" placeholder="Add child" />
          <div className="flex gap-2">
            <input
              className="h-10 w-12 rounded-md border border-line"
              name="color"
              type="color"
              defaultValue="#0f766e"
            />
            <button className="btn-primary" type="submit">
              <Plus size={18} aria-hidden /> Add
            </button>
          </div>
        </form>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {props.vault.children.map((child) => (
            <div className="rounded-md border border-line p-3" key={child.id}>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: child.color }} />
                <span className="font-semibold">{child.name}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="mb-4 text-lg font-bold">Next calendar items</h2>
        <div className="grid gap-2">
          {nextEvents.length === 0 ? (
            <p className="text-sm text-slate-600">No upcoming events.</p>
          ) : (
            nextEvents.map((event) => (
              <div className="rounded-md border border-line p-3" key={event.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong>{event.title}</strong>
                  <span className="text-sm text-slate-600">{formatDateTime(event.start)}</span>
                </div>
                <p className="text-sm text-slate-600">
                  {childName(props.vault.children, event.childId)}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function Metric(props: { label: string; value: string }) {
  return (
    <div className="panel p-4">
      <p className="label">{props.label}</p>
      <p className="mt-2 text-2xl font-bold">{props.value}</p>
    </div>
  );
}

function CalendarView(props: {
  vault: VaultState;
  updateVault: (updater: (current: VaultState) => VaultState) => void;
  notify: (kind: "ok" | "error", message: string) => void;
}) {
  const [recipientKey, setRecipientKey] = useState("");
  const [sealedInvite, setSealedInvite] = useState("");
  const [inviteImport, setInviteImport] = useState("");

  async function createInvite(event: CalendarEvent) {
    try {
      const invite = await sealEventInvite(event, recipientKey);
      setSealedInvite(invite);
      await navigator.clipboard?.writeText(invite);
      props.notify("ok", "Encrypted invite copied.");
    } catch (error) {
      props.notify("error", error instanceof Error ? error.message : "Invite failed");
    }
  }

  async function importInvite() {
    try {
      const event = await openEventInvite(inviteImport, props.vault.identity);
      const now = new Date().toISOString();
      props.updateVault((current) => ({
        ...current,
        events: [
          ...current.events,
          { ...event, id: crypto.randomUUID(), createdAt: now, updatedAt: now }
        ]
      }));
      setInviteImport("");
      props.notify("ok", "Event invite imported.");
    } catch (error) {
      props.notify("error", error instanceof Error ? error.message : "Invite import failed");
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="panel p-5">
        <h2 className="mb-4 text-lg font-bold">New event</h2>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const now = new Date().toISOString();
            props.updateVault((current) => ({
              ...current,
              events: [
                ...current.events,
                {
                  id: crypto.randomUUID(),
                  childId: formValue(form, "childId") || firstChildId(current),
                  title: formValue(form, "title"),
                  start: new Date(formValue(form, "start")).toISOString(),
                  end: new Date(formValue(form, "end")).toISOString(),
                  location: formValue(form, "location"),
                  notes: formValue(form, "notes"),
                  createdAt: now,
                  updatedAt: now
                }
              ]
            }));
            event.currentTarget.reset();
          }}
        >
          <ChildSelect children={props.vault.children} />
          <input
            className="field"
            name="title"
            placeholder="Exchange, appointment, school meeting"
            required
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="field"
              name="start"
              type="datetime-local"
              defaultValue={dateTimeLocalValue()}
              required
            />
            <input
              className="field"
              name="end"
              type="datetime-local"
              defaultValue={dateTimeLocalValue(new Date(Date.now() + 60 * 60 * 1000))}
              required
            />
          </div>
          <input className="field" name="location" placeholder="Location" />
          <textarea className="field min-h-24" name="notes" placeholder="Notes" />
          <button className="btn-primary" type="submit">
            <Plus size={18} aria-hidden /> Add event
          </button>
        </form>
      </section>

      <section className="panel p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Calendar</h2>
          <div className="flex flex-wrap gap-2">
            <button
              className="btn-secondary"
              type="button"
              onClick={() =>
                downloadText(
                  "co-parent-vault.ics",
                  exportEventsToIcs(props.vault.events, props.vault.children),
                  "text/calendar"
                )
              }
            >
              <Download size={18} aria-hidden /> ICS
            </button>
            <label className="btn-secondary cursor-pointer">
              <Upload size={18} aria-hidden /> Import ICS
              <input
                className="sr-only"
                type="file"
                accept=".ics,text/calendar"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  if (!file) {
                    return;
                  }
                  file
                    .text()
                    .then((text) => importEventsFromIcs(text, firstChildId(props.vault)))
                    .then((events) => {
                      props.updateVault((current) => ({
                        ...current,
                        events: [...current.events, ...events]
                      }));
                      props.notify("ok", `${events.length} events imported.`);
                    })
                    .catch((error: unknown) =>
                      props.notify(
                        "error",
                        error instanceof Error ? error.message : "ICS import failed"
                      )
                    );
                }}
              />
            </label>
          </div>
        </div>

        <div className="mb-4 grid gap-2">
          <input
            className="field"
            value={recipientKey}
            onChange={(event) => setRecipientKey(event.target.value)}
            placeholder="Recipient public key for encrypted event invites"
          />
          <textarea
            className="field min-h-20"
            value={inviteImport}
            onChange={(event) => setInviteImport(event.target.value)}
            placeholder="Paste encrypted invite"
          />
          <button className="btn-secondary w-fit" type="button" onClick={() => void importInvite()}>
            <Upload size={18} aria-hidden /> Open invite
          </button>
          {sealedInvite && <textarea className="field min-h-20" readOnly value={sealedInvite} />}
        </div>

        <RecordList
          empty="No events yet."
          items={[...props.vault.events].sort(
            (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
          )}
          render={(event) => (
            <div className="rounded-md border border-line p-3" key={event.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <strong>{event.title}</strong>
                  <p className="text-sm text-slate-600">
                    {childName(props.vault.children, event.childId)} · {formatDateTime(event.start)}
                  </p>
                  {event.location && <p className="text-sm text-slate-600">{event.location}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => void createInvite(event)}
                  >
                    <KeyRound size={18} aria-hidden /> Invite
                  </button>
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() =>
                      props.updateVault((current) => ({
                        ...current,
                        events: current.events.filter((item) => item.id !== event.id)
                      }))
                    }
                  >
                    <Trash2 size={18} aria-hidden />
                  </button>
                </div>
              </div>
            </div>
          )}
        />
      </section>
    </div>
  );
}

function ExpenseView(props: {
  vault: VaultState;
  updateVault: (updater: (current: VaultState) => VaultState) => void;
  notify: (kind: "ok" | "error", message: string) => void;
}) {
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(dateInputValue());
  const [receiptText, setReceiptText] = useState("");
  const [receiptName, setReceiptName] = useState("");
  const [ocrStatus, setOcrStatus] = useState("");
  const [report, setReport] = useState<ExpenseReportRow[]>([]);

  const balances = useMemo(() => {
    const map = new Map<string, number>();
    for (const expense of props.vault.expenses.filter((item) => item.status === "open")) {
      const half = Math.round(expense.amountCents / 2);
      map.set(expense.paidBy, (map.get(expense.paidBy) ?? 0) + half);
      map.set(expense.splitWith, (map.get(expense.splitWith) ?? 0) - half);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [props.vault.expenses]);

  async function runReport() {
    try {
      const { buildExpenseReport } = await import("./features/analytics/duckdbReports");
      setReport(await buildExpenseReport(props.vault.expenses));
      props.notify("ok", "DuckDB report updated.");
    } catch (error) {
      props.notify("error", error instanceof Error ? error.message : "Report failed");
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="panel p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold">New expense</h2>
          <label className="btn-secondary cursor-pointer">
            <ReceiptText size={18} aria-hidden /> OCR
            <input
              className="sr-only"
              type="file"
              accept="image/*,.pdf"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (!file) {
                  return;
                }
                setOcrStatus("Starting OCR");
                setReceiptName(file.name);
                ocrReceipt(file, setOcrStatus)
                  .then((parsed) => {
                    setMerchant(parsed.merchant);
                    setAmount((parsed.amountCents / 100).toFixed(2));
                    setExpenseDate(parsed.date);
                    setReceiptText(parsed.rawText);
                    props.notify("ok", "Receipt parsed.");
                  })
                  .catch((error: unknown) =>
                    props.notify(
                      "error",
                      error instanceof Error ? error.message : "Receipt OCR failed"
                    )
                  )
                  .finally(() => setOcrStatus(""));
              }}
            />
          </label>
        </div>
        {ocrStatus && (
          <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 p-2 text-sm">
            {ocrStatus}
          </p>
        )}
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const now = new Date().toISOString();
            props.updateVault((current) => ({
              ...current,
              expenses: [
                ...current.expenses,
                {
                  id: crypto.randomUUID(),
                  childId: formValue(form, "childId") || firstChildId(current),
                  merchant,
                  amountCents: parseMoneyToCents(amount),
                  currency: "USD",
                  date: expenseDate,
                  category: formValue(form, "category") || "childcare",
                  paidBy: formValue(form, "paidBy") || current.parentName,
                  splitWith: formValue(form, "splitWith") || current.coParentName || "Co-parent",
                  status: "open",
                  receiptText,
                  receiptName,
                  notes: formValue(form, "notes"),
                  createdAt: now
                }
              ]
            }));
            setMerchant("");
            setAmount("");
            setReceiptText("");
            setReceiptName("");
            event.currentTarget.reset();
          }}
        >
          <ChildSelect children={props.vault.children} />
          <input
            className="field"
            value={merchant}
            onChange={(event) => setMerchant(event.target.value)}
            placeholder="Merchant"
            required
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="field"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Amount"
              required
            />
            <input
              className="field"
              value={expenseDate}
              onChange={(event) => setExpenseDate(event.target.value)}
              type="date"
              required
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <select className="field" name="category" defaultValue="medical">
              <option value="medical">Medical</option>
              <option value="school">School</option>
              <option value="childcare">Childcare</option>
              <option value="travel">Travel</option>
              <option value="activity">Activity</option>
              <option value="other">Other</option>
            </select>
            <select className="field" name="paidBy" defaultValue={props.vault.parentName}>
              <option>{props.vault.parentName}</option>
              <option>{props.vault.coParentName || "Co-parent"}</option>
            </select>
          </div>
          <input
            className="field"
            name="splitWith"
            placeholder={`Split with ${props.vault.coParentName || "Co-parent"}`}
          />
          <textarea className="field min-h-20" name="notes" placeholder="Notes" />
          <button className="btn-primary" type="submit">
            <Plus size={18} aria-hidden /> Add expense
          </button>
        </form>
      </section>

      <section className="panel p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Expenses</h2>
          <button className="btn-secondary" type="button" onClick={() => void runReport()}>
            <Sparkles size={18} aria-hidden /> DuckDB report
          </button>
        </div>

        {balances.length > 0 && (
          <div className="mb-4 grid gap-2 sm:grid-cols-2">
            {balances.map(([name, cents]) => (
              <div className="rounded-md border border-line p-3" key={name}>
                <p className="label">{name}</p>
                <p className={`text-xl font-bold ${cents >= 0 ? "text-sea" : "text-berry"}`}>
                  {formatCurrency(cents)}
                </p>
              </div>
            ))}
          </div>
        )}

        {report.length > 0 && (
          <div className="mb-4 rounded-md border border-line p-3">
            <h3 className="mb-2 font-bold">Category report</h3>
            <div className="grid gap-2">
              {report.map((row) => (
                <div className="flex justify-between gap-3 text-sm" key={row.category}>
                  <span>
                    {row.category} ({row.count})
                  </span>
                  <strong>{formatCurrency(row.totalCents)}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        <RecordList
          empty="No expenses yet."
          items={[...props.vault.expenses].sort((a, b) => b.date.localeCompare(a.date))}
          render={(expense) => (
            <div className="rounded-md border border-line p-3" key={expense.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <strong>{expense.merchant}</strong>
                  <p className="text-sm text-slate-600">
                    {childName(props.vault.children, expense.childId)} · {formatDate(expense.date)}{" "}
                    · {expense.category}
                  </p>
                  {expense.receiptName && (
                    <p className="text-xs text-slate-500">Receipt: {expense.receiptName}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">
                    {formatCurrency(expense.amountCents, expense.currency)}
                  </span>
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() =>
                      props.updateVault((current) => ({
                        ...current,
                        expenses: current.expenses.map((item) =>
                          item.id === expense.id
                            ? { ...item, status: item.status === "open" ? "settled" : "open" }
                            : item
                        )
                      }))
                    }
                  >
                    {expense.status}
                  </button>
                </div>
              </div>
            </div>
          )}
        />
      </section>
    </div>
  );
}

function MessagesView(props: {
  vault: VaultState;
  updateVault: (updater: (current: VaultState) => VaultState) => void;
  notify: (kind: "ok" | "error", message: string) => void;
}) {
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);

  async function runSummary() {
    setBusy(true);
    try {
      const nextSummary = await summarizeMessages({
        endpoint: props.vault.llm?.endpoint || "http://127.0.0.1:11434/api/generate",
        model: props.vault.llm?.model || "llama3.2",
        messages: props.vault.messages
      });
      setSummary(nextSummary);
      props.notify("ok", "Local summary generated.");
    } catch (error) {
      props.notify("error", error instanceof Error ? error.message : "Local LLM failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="panel p-5">
        <h2 className="mb-4 text-lg font-bold">New archive record</h2>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const now = new Date().toISOString();
            props.updateVault((current) => ({
              ...current,
              messages: [
                ...current.messages,
                {
                  id: crypto.randomUUID(),
                  childId: formValue(form, "childId") || firstChildId(current),
                  counterpart:
                    formValue(form, "counterpart") || current.coParentName || "Co-parent",
                  occurredAt: new Date(formValue(form, "occurredAt")).toISOString(),
                  channel: formValue(form, "channel") as MessageRecord["channel"],
                  subject: formValue(form, "subject"),
                  body: formValue(form, "body"),
                  tags: formValue(form, "tags")
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                  createdAt: now
                }
              ]
            }));
            event.currentTarget.reset();
          }}
        >
          <ChildSelect children={props.vault.children} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="field"
              name="counterpart"
              placeholder={props.vault.coParentName || "Co-parent"}
            />
            <input
              className="field"
              name="occurredAt"
              type="datetime-local"
              defaultValue={dateTimeLocalValue()}
              required
            />
          </div>
          <select className="field" name="channel" defaultValue="email">
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="app">App</option>
            <option value="call">Call</option>
            <option value="in_person">In person</option>
            <option value="other">Other</option>
          </select>
          <input className="field" name="subject" placeholder="Subject" />
          <textarea className="field min-h-32" name="body" placeholder="Record text" required />
          <input className="field" name="tags" placeholder="medical, reimbursement, exchange" />
          <button className="btn-primary" type="submit">
            <Plus size={18} aria-hidden /> Archive
          </button>
        </form>
      </section>

      <section className="panel p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Communication archive</h2>
          <button
            className="btn-secondary"
            type="button"
            onClick={() => void runSummary()}
            disabled={busy || props.vault.messages.length === 0}
          >
            <Sparkles size={18} aria-hidden /> Summarize locally
          </button>
        </div>
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          <input
            className="field"
            value={props.vault.llm?.endpoint ?? ""}
            onChange={(event) =>
              props.updateVault((current) => ({
                ...current,
                llm: { endpoint: event.target.value, model: current.llm?.model || "llama3.2" }
              }))
            }
          />
          <input
            className="field"
            value={props.vault.llm?.model ?? ""}
            onChange={(event) =>
              props.updateVault((current) => ({
                ...current,
                llm: {
                  endpoint: current.llm?.endpoint || "http://127.0.0.1:11434/api/generate",
                  model: event.target.value
                }
              }))
            }
          />
        </div>
        {summary && (
          <pre className="mb-4 whitespace-pre-wrap rounded-md border border-line bg-slate-50 p-3 text-sm">
            {summary}
          </pre>
        )}
        <RecordList
          empty="No archive records yet."
          items={[...props.vault.messages].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))}
          render={(message) => (
            <div className="rounded-md border border-line p-3" key={message.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <strong>{message.subject || message.channel}</strong>
                  <p className="text-sm text-slate-600">
                    {childName(props.vault.children, message.childId)} ·{" "}
                    {formatDateTime(message.occurredAt)} · {message.counterpart}
                  </p>
                </div>
                <span className="pill">{message.channel}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{message.body}</p>
            </div>
          )}
        />
      </section>
    </div>
  );
}

function DocumentsView(props: {
  vault: VaultState;
  updateVault: (updater: (current: VaultState) => VaultState) => void;
  notify: (kind: "ok" | "error", message: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="panel p-5">
        <h2 className="mb-4 text-lg font-bold">Store document</h2>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            if (!file) {
              props.notify("error", "Choose a document.");
              return;
            }
            Promise.all([fileToDataUrl(file), sha256Hex(file)])
              .then(([dataUrl, sha256]) => {
                const now = new Date().toISOString();
                const record: DocumentRecord = {
                  id: crypto.randomUUID(),
                  childId: formValue(form, "childId") || firstChildId(props.vault),
                  name: formValue(form, "name") || file.name,
                  kind: formValue(form, "kind") as DocumentRecord["kind"],
                  fileName: file.name,
                  mimeType: file.type || "application/octet-stream",
                  size: file.size,
                  sha256,
                  dataUrl,
                  notes: formValue(form, "notes"),
                  createdAt: now
                };
                props.updateVault((current) => ({
                  ...current,
                  documents: [...current.documents, record]
                }));
                setFile(null);
                event.currentTarget.reset();
                props.notify("ok", "Document stored.");
              })
              .catch((error: unknown) =>
                props.notify("error", error instanceof Error ? error.message : "Document failed")
              );
          }}
        >
          <ChildSelect children={props.vault.children} />
          <input className="field" name="name" placeholder="Document name" />
          <select className="field" name="kind" defaultValue="medical">
            <option value="medical">Medical</option>
            <option value="school">School</option>
            <option value="travel">Travel</option>
            <option value="legal">Legal</option>
            <option value="identity">Identity</option>
            <option value="other">Other</option>
          </select>
          <input
            className="field"
            type="file"
            onChange={(event) => setFile(event.currentTarget.files?.[0] ?? null)}
          />
          <textarea className="field min-h-24" name="notes" placeholder="Notes" />
          <button className="btn-primary" type="submit">
            <Upload size={18} aria-hidden /> Store
          </button>
        </form>
      </section>

      <section className="panel p-5">
        <h2 className="mb-4 text-lg font-bold">Documents</h2>
        <RecordList
          empty="No documents yet."
          items={[...props.vault.documents].sort((a, b) => b.createdAt.localeCompare(a.createdAt))}
          render={(document) => (
            <div className="rounded-md border border-line p-3" key={document.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <strong>{document.name}</strong>
                  <p className="text-sm text-slate-600">
                    {childName(props.vault.children, document.childId)} · {document.kind} ·{" "}
                    {Math.round(document.size / 1024)} KB
                  </p>
                  <p className="break-all text-xs text-slate-500">sha256 {document.sha256}</p>
                </div>
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={() => downloadDataUrl(document.fileName, document.dataUrl)}
                >
                  <Download size={18} aria-hidden />
                </button>
              </div>
            </div>
          )}
        />
      </section>
    </div>
  );
}

function PrivacyView(props: {
  vault: VaultState;
  passphrase: string;
  setVault: (vault: VaultState | null) => void;
  setPassphrase: (passphrase: string) => void;
  notify: (kind: "ok" | "error", message: string) => void;
  queryClient: QueryClient;
}) {
  const [importPassphrase, setImportPassphrase] = useState("");

  async function exportVault() {
    const encrypted = await encryptVault(props.vault, props.passphrase);
    downloadText(
      `co-parent-vault-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(encrypted, null, 2)
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <section className="panel p-5">
        <h2 className="mb-4 text-lg font-bold">Vault key</h2>
        <textarea className="field min-h-32" readOnly value={props.vault.identity.publicKey} />
        <button
          className="btn-secondary mt-3"
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(props.vault.identity.publicKey);
            props.notify("ok", "Public key copied.");
          }}
        >
          <Copy size={18} aria-hidden /> Copy public key
        </button>
      </section>

      <section className="panel p-5">
        <h2 className="mb-4 text-lg font-bold">Encrypted export</h2>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" type="button" onClick={() => void exportVault()}>
            <Download size={18} aria-hidden /> Export vault
          </button>
          <label className="btn-secondary cursor-pointer">
            <Upload size={18} aria-hidden /> Import vault
            <input
              className="sr-only"
              type="file"
              accept="application/json,.json"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (!file) {
                  return;
                }
                file
                  .text()
                  .then((text) =>
                    decryptVault(JSON.parse(text), importPassphrase || props.passphrase)
                  )
                  .then(async (nextVault) => {
                    const encrypted = await encryptVault(
                      nextVault,
                      importPassphrase || props.passphrase
                    );
                    await saveEncryptedVault(encrypted);
                    props.queryClient.setQueryData(["encrypted-vault"], encrypted);
                    props.setPassphrase(importPassphrase || props.passphrase);
                    props.setVault(nextVault);
                    props.notify("ok", "Vault import complete.");
                  })
                  .catch((error: unknown) =>
                    props.notify(
                      "error",
                      error instanceof Error ? error.message : "Vault import failed"
                    )
                  );
              }}
            />
          </label>
        </div>
        <input
          className="field mt-3"
          type="password"
          value={importPassphrase}
          onChange={(event) => setImportPassphrase(event.target.value)}
          placeholder="Import passphrase, if different"
        />
      </section>

      <section className="panel p-5 xl:col-span-2">
        <h2 className="mb-4 text-lg font-bold">Local reset</h2>
        <button
          className="btn-danger"
          type="button"
          onClick={() => {
            if (!window.confirm("Delete the local encrypted vault from this browser?")) {
              return;
            }
            clearEncryptedVault()
              .then(() => {
                props.queryClient.setQueryData(["encrypted-vault"], null);
                props.setVault(null);
                props.setPassphrase("");
              })
              .catch((error: unknown) =>
                props.notify("error", error instanceof Error ? error.message : "Reset failed")
              );
          }}
        >
          <Trash2 size={18} aria-hidden /> Delete local vault
        </button>
      </section>
    </div>
  );
}

function ChildSelect(props: { children: Child[] }) {
  return (
    <select
      className="field"
      name="childId"
      defaultValue={props.children[0]?.id ?? ""}
      required={props.children.length > 0}
    >
      {props.children.length === 0 ? (
        <option value="">No child added</option>
      ) : (
        props.children.map((child) => (
          <option value={child.id} key={child.id}>
            {child.name}
          </option>
        ))
      )}
    </select>
  );
}

function RecordList<T>(props: { items: T[]; empty: string; render: (item: T) => ReactNode }) {
  if (props.items.length === 0) {
    return (
      <p className="rounded-md border border-line bg-slate-50 p-3 text-sm text-slate-600">
        {props.empty}
      </p>
    );
  }
  return <div className="grid gap-2">{props.items.map(props.render)}</div>;
}

function ToastView(props: { toast: Toast }) {
  if (!props.toast) {
    return null;
  }
  return (
    <div
      className={`fixed bottom-4 right-4 z-50 max-w-sm rounded-md px-4 py-3 text-sm font-semibold shadow-soft ${
        props.toast.kind === "ok" ? "bg-sea text-white" : "bg-berry text-white"
      }`}
      role="status"
    >
      {props.toast.message}
    </div>
  );
}

export default App;
