import { z } from "zod";

export const CURRENT_SCHEMA_VERSION = 1;

export const ChildSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  color: z.string(),
  notes: z.string().optional()
});

export const CalendarEventSchema = z.object({
  id: z.string(),
  childId: z.string(),
  title: z.string().min(1),
  start: z.string(),
  end: z.string(),
  location: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const ExpenseSchema = z.object({
  id: z.string(),
  childId: z.string(),
  merchant: z.string().min(1),
  amountCents: z.number().int().nonnegative(),
  currency: z.string().min(3).max(3),
  date: z.string(),
  category: z.string(),
  paidBy: z.string(),
  splitWith: z.string(),
  status: z.enum(["open", "settled", "disputed"]),
  receiptText: z.string().optional(),
  receiptName: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string()
});

export const MessageRecordSchema = z.object({
  id: z.string(),
  childId: z.string(),
  counterpart: z.string().min(1),
  occurredAt: z.string(),
  channel: z.enum(["email", "sms", "app", "call", "in_person", "other"]),
  subject: z.string().optional(),
  body: z.string().min(1),
  tags: z.array(z.string()),
  createdAt: z.string()
});

export const DocumentRecordSchema = z.object({
  id: z.string(),
  childId: z.string(),
  name: z.string().min(1),
  kind: z.enum(["medical", "school", "travel", "legal", "identity", "other"]),
  fileName: z.string(),
  mimeType: z.string(),
  size: z.number().int().nonnegative(),
  sha256: z.string(),
  dataUrl: z.string(),
  notes: z.string().optional(),
  createdAt: z.string()
});

export const VaultIdentitySchema = z.object({
  publicKey: z.string(),
  privateKey: z.string()
});

export const LocalLlmSettingsSchema = z.object({
  endpoint: z.string(),
  model: z.string()
});

export const VaultStateSchema = z.object({
  schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
  vaultId: z.string(),
  householdName: z.string().min(1),
  parentName: z.string().min(1),
  coParentName: z.string().optional(),
  identity: VaultIdentitySchema,
  children: z.array(ChildSchema),
  events: z.array(CalendarEventSchema),
  expenses: z.array(ExpenseSchema),
  messages: z.array(MessageRecordSchema),
  documents: z.array(DocumentRecordSchema),
  llm: LocalLlmSettingsSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const EncryptedVaultSchema = z.object({
  format: z.literal("co-parent-vault.yjs.secretbox.v1"),
  schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
  kdf: z.object({
    name: z.literal("PBKDF2-SHA256"),
    iterations: z.number().int().positive(),
    salt: z.string()
  }),
  cipher: z.object({
    name: z.literal("libsodium-secretbox"),
    nonce: z.string(),
    ciphertext: z.string()
  }),
  updatedAt: z.string()
});

export type Child = z.infer<typeof ChildSchema>;
export type CalendarEvent = z.infer<typeof CalendarEventSchema>;
export type Expense = z.infer<typeof ExpenseSchema>;
export type MessageRecord = z.infer<typeof MessageRecordSchema>;
export type DocumentRecord = z.infer<typeof DocumentRecordSchema>;
export type VaultIdentity = z.infer<typeof VaultIdentitySchema>;
export type VaultState = z.infer<typeof VaultStateSchema>;
export type EncryptedVault = z.infer<typeof EncryptedVaultSchema>;

export function createEmptyVault(input: {
  householdName: string;
  parentName: string;
  coParentName?: string;
  childName?: string;
  identity: VaultIdentity;
}): VaultState {
  const now = new Date().toISOString();
  const children = input.childName?.trim()
    ? [
        {
          id: crypto.randomUUID(),
          name: input.childName.trim(),
          color: "#0f766e"
        }
      ]
    : [];

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    vaultId: crypto.randomUUID(),
    householdName: input.householdName.trim(),
    parentName: input.parentName.trim(),
    coParentName: input.coParentName?.trim(),
    identity: input.identity,
    children,
    events: [],
    expenses: [],
    messages: [],
    documents: [],
    llm: {
      endpoint: "http://127.0.0.1:11434/api/generate",
      model: "llama3.2"
    },
    createdAt: now,
    updatedAt: now
  };
}

export function touchVault(vault: VaultState): VaultState {
  return { ...vault, updatedAt: new Date().toISOString() };
}
