// lib/sylvia/tools/types.ts
//
// Sylvia operational tools · shared input/output shapes
// CMD-SYLVIA-TOOL-FILE-READ V20 v2.1 R29 P63 · 2026-05-15
//
// Forward-compat: P64 file-write + P65 bash add FileWriteInput/Output
// and BashInput/Output here. Single types module · cross-tool clarity.

export interface FileReadInput {
  path: string;
  encoding?: "utf-8" | "base64";
}

export type FileReadOutcome = "ok" | "deny" | "error";

export interface FileReadOutput {
  outcome: FileReadOutcome;
  content?: string;
  bytesRead?: number;
  credentialsRedacted?: number;
  reason?: string;
}
