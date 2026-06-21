import { runItemDraftCli } from "../src/lib/itemDraft/runItemDraftPipeline";

await runItemDraftCli().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
