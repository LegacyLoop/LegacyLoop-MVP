import type { OperationName } from "./types";

export interface Adapter {
  readonly provider: string;
  readonly enabled: boolean;
  readonly operations: ReadonlyArray<OperationName>;
  call(
    operation: OperationName,
    params: Record<string, unknown>,
  ): Promise<unknown>;
}

export function envPresent(...keys: ReadonlyArray<string>): boolean {
  return keys.every(
    (k) => typeof process.env[k] === "string" && process.env[k]!.length > 0,
  );
}
