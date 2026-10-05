import { chunkImport } from "./chunks.ts";
import type {
  ImportBatch,
  ImportCounts,
  ImportPreview,
  ImportProgress,
  NormalizedImportRow,
  Column,
  ColumnMapping,
  ImportDecision,
} from "./types.ts";
import type { MutationResult } from "../types.ts";
export type BeginImportInput = {
  filename: string;
  byte_count: number;
  row_count: number;
  source_digest: string;
  columns: Column[];
  mapping: ColumnMapping;
  requestId: string;
};
export type DecisionInput = {
  rowNumber: number;
  decision: ImportDecision;
  targetBusinessId: string | null;
  targetContactId: string | null;
};
export type ImportState =
  | { kind: "select" | "mapping" }
  | { kind: "preview"; batchId: string; blockingErrors: number }
  | { kind: "importing"; batchId: string; requestId: string }
  | { kind: "complete"; batchId: string; counts: ImportCounts }
  | { kind: "cancelled"; batchId: string }
  | {
      kind: "failed";
      batchId: string | null;
      message: string;
      checkpoint: ImportState;
    };
export type ImportEvent =
  | { type: "SELECT" }
  | { type: "PREVIEW"; batchId: string; blockingErrors: number }
  | { type: "PUBLISH"; requestId: string }
  | { type: "COMMITTED"; batchId: string; counts: ImportCounts }
  | { type: "FAIL"; message: string }
  | { type: "RESUME" }
  | { type: "CANCEL"; batchId: string; confirmed: boolean };
export function reduceImportState(
  state: ImportState,
  event: ImportEvent,
): ImportState {
  if (event.type === "SELECT") return { kind: "mapping" };
  if (event.type === "PREVIEW") {
    if (
      state.kind === "complete" ||
      state.kind === "importing" ||
      state.kind === "cancelled"
    )
      return state;
    return {
      kind: "preview",
      batchId: event.batchId,
      blockingErrors: event.blockingErrors,
    };
  }
  if (event.type === "PUBLISH")
    return state.kind === "preview" && state.blockingErrors === 0
      ? {
          kind: "importing",
          batchId: state.batchId,
          requestId: event.requestId,
        }
      : state;
  if (event.type === "COMMITTED")
    return state.kind === "importing" && state.batchId === event.batchId
      ? { kind: "complete", batchId: state.batchId, counts: event.counts }
      : state;
  if (event.type === "FAIL")
    return {
      kind: "failed",
      batchId: "batchId" in state ? state.batchId : null,
      message: event.message,
      checkpoint: state.kind === "failed" ? state.checkpoint : state,
    };
  if (event.type === "RESUME")
    return state.kind === "failed" ? state.checkpoint : state;
  if (event.type === "CANCEL")
    return event.confirmed &&
      "batchId" in state &&
      state.batchId === event.batchId
      ? { kind: "cancelled", batchId: event.batchId }
      : state;
  return state;
}
export type ImportDependencies = {
  beginImport: (
    input: BeginImportInput,
  ) => Promise<MutationResult<ImportBatch>>;
  stageImportChunk: (input: {
    batchId: string;
    rows: { rowNumber: number; source: string[] }[];
  }) => Promise<MutationResult<ImportProgress>>;
  previewImport: (id: string, page?: number) => Promise<ImportPreview>;
  setImportDecisions: (
    id: string,
    decisions: DecisionInput[],
  ) => Promise<MutationResult<ImportPreview>>;
  commitImport: (
    id: string,
    requestId: string,
  ) => Promise<MutationResult<ImportCounts>>;
  cancelImport: (id: string) => Promise<MutationResult<ImportBatch>>;
  getImport: (id: string) => Promise<ImportProgress>;
};
export function createImportController(dependencies: ImportDependencies) {
  return {
    ...dependencies,
    async stageAll(
      batchId: string,
      rows: NormalizedImportRow[],
      checkpoint: (n: number) => void,
    ) {
      let progress = await dependencies.getImport(batchId);
      if (progress.batch.state !== "staging") return progress;
      for (const chunk of chunkImport(rows)) {
        const result = await dependencies.stageImportChunk({
          batchId,
          rows: chunk.map((r) => ({
            rowNumber: r.rowNumber,
            source: r.source,
          })),
        });
        if (!result.ok) throw new Error(result.message);
        progress = result.value;
        checkpoint(progress.staged);
      }
      return progress;
    },
  };
}
