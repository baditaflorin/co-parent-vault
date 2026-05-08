import { del, get, set } from "idb-keyval";
import { EncryptedVault, EncryptedVaultSchema } from "./schemas";

const STORAGE_KEY = "co-parent-vault.encrypted-vault.v1";

export async function loadEncryptedVault(): Promise<EncryptedVault | null> {
  const value = await get<unknown>(STORAGE_KEY);
  if (!value) {
    return null;
  }
  return EncryptedVaultSchema.parse(value);
}

export async function saveEncryptedVault(vault: EncryptedVault): Promise<void> {
  await set(STORAGE_KEY, vault);
}

export async function clearEncryptedVault(): Promise<void> {
  await del(STORAGE_KEY);
}
