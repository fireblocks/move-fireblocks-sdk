import { sha3_256 } from "js-sha3";

export function deriveAptosAddress(pubKeyHex: string): string {
  const clean = pubKeyHex.startsWith("0x") ? pubKeyHex.slice(2) : pubKeyHex;
  const pubBytes = Buffer.from(clean, "hex");
  const withScheme = Buffer.concat([pubBytes, Buffer.from([0x00])]);
  const authHex = sha3_256(withScheme);
  return `0x${authHex}`;
}
