import { describe, expect, it } from "vitest";
import { createEmptyVault } from "./schemas";
import { vaultToYUpdate, yUpdateToVault } from "./yjsVault";

describe("Yjs vault snapshots", () => {
  it("round trips a vault state", () => {
    const vault = createEmptyVault({
      householdName: "Rivera family",
      parentName: "Alex",
      childName: "Sam",
      identity: { publicKey: "public", privateKey: "private" }
    });

    const restored = yUpdateToVault(vaultToYUpdate(vault));

    expect(restored.householdName).toBe("Rivera family");
    expect(restored.children[0].name).toBe("Sam");
  });
});
