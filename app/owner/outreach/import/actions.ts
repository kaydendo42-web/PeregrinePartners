"use server";
import { requireOwner } from "@/lib/owner/access";
import { rpcMutation } from "@/lib/crm/mutations";
import { parseUuid, parseVersion } from "@/lib/crm/validation";
import {
  validateBegin,
  importProgress,
  validateSourceRows,
} from "@/lib/crm/import/server";
import type {
  BeginImportInput,
  DecisionInput,
} from "@/lib/crm/import/controller";
import type {
  ImportBatch,
  ImportProgress,
  ImportPreview,
  ImportCounts,
} from "@/lib/crm/import/types";
export async function beginImport(input: BeginImportInput) {
  return rpcMutation<ImportBatch>(
    "crm_begin_import",
    input.requestId,
    () => ({ p_input: validateBegin(input).payload }),
    false,
  );
}
export async function stageImportChunk(input: {
  batchId: string;
  rows: { rowNumber: number; source: string[] }[];
}) {
  const progress = await importProgress(input.batchId);
  return rpcMutation<ImportProgress>(
    "crm_stage_import",
    null,
    () => ({
      p_batch: parseUuid(input.batchId),
      p_rows: validateSourceRows(input.rows, progress),
    }),
    false,
  );
}
export async function previewImport(
  batchId: string,
  page = 1,
): Promise<ImportPreview> {
  const { client, context } = await requireOwner();
  if (page < 1 || page > 100) throw new Error("Choose a valid preview page.");
  const { data, error } = await client.rpc("crm_preview_import", {
    p_workspace: context.workspaceId,
    p_batch: parseUuid(batchId),
    p_page: parseVersion(page),
  });
  if (error) throw new Error("Could not load the import preview.");
  return data as ImportPreview;
}
export async function setImportDecisions(
  batchId: string,
  decisions: DecisionInput[],
) {
  return rpcMutation<ImportPreview>(
    "crm_decide_import",
    null,
    () => {
      if (!Array.isArray(decisions) || decisions.length > 100)
        throw new Error("Choose at most 100 row decisions at a time.");
      return {
        p_batch: parseUuid(batchId),
        p_decisions: decisions.map((d) => ({
          rowNumber: parseVersion(d.rowNumber),
          decision: d.decision,
          targetBusinessId: d.targetBusinessId
            ? parseUuid(d.targetBusinessId)
            : null,
          targetContactId: d.targetContactId
            ? parseUuid(d.targetContactId)
            : null,
          targetSourceRow:
            d.targetSourceRow == null ? null : parseVersion(d.targetSourceRow),
        })),
      };
    },
    false,
  );
}
export async function commitImport(batchId: string, requestId: string) {
  return rpcMutation<ImportCounts>("crm_commit_import", requestId, () => ({
    p_batch: parseUuid(batchId),
  }));
}
export async function cancelImport(batchId: string) {
  return rpcMutation<ImportBatch>(
    "crm_cancel_import",
    null,
    () => ({ p_batch: parseUuid(batchId) }),
    false,
  );
}
export async function getImport(batchId: string) {
  return importProgress(batchId);
}
