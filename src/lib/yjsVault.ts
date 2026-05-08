import * as Y from "yjs";
import { VaultState, VaultStateSchema } from "./schemas";

const ROOT_MAP = "vault";
const STATE_KEY = "state";

export function vaultToYUpdate(vault: VaultState): Uint8Array {
  const doc = new Y.Doc();
  doc.getMap(ROOT_MAP).set(STATE_KEY, vault);
  return Y.encodeStateAsUpdate(doc);
}

export function yUpdateToVault(update: Uint8Array): VaultState {
  const doc = new Y.Doc();
  Y.applyUpdate(doc, update);
  const state = doc.getMap(ROOT_MAP).get(STATE_KEY);
  return VaultStateSchema.parse(state);
}
