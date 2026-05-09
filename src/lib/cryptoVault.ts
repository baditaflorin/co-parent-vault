import type { CalendarEvent, EncryptedVault, VaultIdentity, VaultState } from "./schemas";
import { CURRENT_SCHEMA_VERSION, EncryptedVaultSchema } from "./schemas";
import { base64ToBytes, bytesToBase64, bytesToText, textToBytes } from "./encoding";
import { vaultToYUpdate, yUpdateToVault } from "./yjsVault";

const KDF_ITERATIONS = 310_000;

type Sodium = typeof import("libsodium-wrappers");

async function sodiumReady(): Promise<Sodium> {
  const module = await import("libsodium-wrappers");
  const sodium = ("default" in module ? module.default : module) as Sodium;
  await sodium.ready;
  return sodium;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    textToBytes(passphrase).slice().buffer,
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: salt.slice().buffer,
      iterations: KDF_ITERATIONS
    },
    keyMaterial,
    256
  );
  return new Uint8Array(bits);
}

export async function generateVaultIdentity(): Promise<VaultIdentity> {
  const sodium = await sodiumReady();
  const pair = sodium.crypto_box_keypair();
  return {
    publicKey: bytesToBase64(pair.publicKey),
    privateKey: bytesToBase64(pair.privateKey)
  };
}

export async function encryptVault(vault: VaultState, passphrase: string): Promise<EncryptedVault> {
  if (passphrase.length < 12) {
    throw new Error("Use a passphrase of at least 12 characters.");
  }

  const sodium = await sodiumReady();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const nonce = crypto.getRandomValues(new Uint8Array(sodium.crypto_secretbox_NONCEBYTES));
  const key = await deriveKey(passphrase, salt);
  const update = vaultToYUpdate(vault);
  const ciphertext = sodium.crypto_secretbox_easy(update, nonce, key);

  return {
    format: "co-parent-vault.yjs.secretbox.v1",
    schemaVersion: CURRENT_SCHEMA_VERSION,
    kdf: {
      name: "PBKDF2-SHA256",
      iterations: KDF_ITERATIONS,
      salt: bytesToBase64(salt)
    },
    cipher: {
      name: "libsodium-secretbox",
      nonce: bytesToBase64(nonce),
      ciphertext: bytesToBase64(ciphertext)
    },
    metadata: {
      appVersion: __APP_VERSION__,
      sourceCommit: __COMMIT_SHA__,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      generatedAt: new Date().toISOString()
    },
    updatedAt: new Date().toISOString()
  };
}

export async function decryptVault(container: unknown, passphrase: string): Promise<VaultState> {
  const parsed = EncryptedVaultSchema.parse(container);
  const sodium = await sodiumReady();
  const salt = base64ToBytes(parsed.kdf.salt);
  const nonce = base64ToBytes(parsed.cipher.nonce);
  const ciphertext = base64ToBytes(parsed.cipher.ciphertext);
  const key = await deriveKey(passphrase, salt);
  const update = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);

  if (!update) {
    throw new Error("Unable to unlock this vault with that passphrase.");
  }

  return yUpdateToVault(update);
}

export async function sealEventInvite(
  event: CalendarEvent,
  recipientPublicKey: string
): Promise<string> {
  const sodium = await sodiumReady();
  const message = textToBytes(
    JSON.stringify({
      format: "co-parent-vault.age-like-event-invite.v1",
      event
    })
  );
  const sealed = sodium.crypto_box_seal(message, base64ToBytes(recipientPublicKey));
  return bytesToBase64(sealed);
}

export async function openEventInvite(
  sealedInvite: string,
  identity: VaultIdentity
): Promise<CalendarEvent> {
  const sodium = await sodiumReady();
  const opened = sodium.crypto_box_seal_open(
    base64ToBytes(sealedInvite.trim()),
    base64ToBytes(identity.publicKey),
    base64ToBytes(identity.privateKey)
  );

  if (!opened) {
    throw new Error("This invite was not encrypted for this vault key.");
  }

  const parsed = JSON.parse(bytesToText(opened)) as { format?: string; event?: CalendarEvent };
  if (parsed.format !== "co-parent-vault.age-like-event-invite.v1" || !parsed.event) {
    throw new Error("Unsupported invite format.");
  }

  return parsed.event;
}
