// @ts-nocheck
import * as __fd_glob_10 from "../src/content/docs/getting-started/installation.mdx?collection=docs"
import * as __fd_glob_9 from "../src/content/docs/features/suggestions.mdx?collection=docs"
import * as __fd_glob_8 from "../src/content/docs/features/interview-copilot.mdx?collection=docs"
import * as __fd_glob_7 from "../src/content/docs/features/brain-memory.mdx?collection=docs"
import * as __fd_glob_6 from "../src/content/docs/features/action-menu.mdx?collection=docs"
import * as __fd_glob_5 from "../src/content/docs/shortcuts.mdx?collection=docs"
import * as __fd_glob_4 from "../src/content/docs/index.mdx?collection=docs"
import * as __fd_glob_3 from "../src/content/docs/architecture.mdx?collection=docs"
import { default as __fd_glob_2 } from "../src/content/docs/getting-started/meta.json?collection=docs"
import { default as __fd_glob_1 } from "../src/content/docs/features/meta.json?collection=docs"
import { default as __fd_glob_0 } from "../src/content/docs/meta.json?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const docs = await create.docs("docs", "src/content/docs", {"meta.json": __fd_glob_0, "features/meta.json": __fd_glob_1, "getting-started/meta.json": __fd_glob_2, }, {"architecture.mdx": __fd_glob_3, "index.mdx": __fd_glob_4, "shortcuts.mdx": __fd_glob_5, "features/action-menu.mdx": __fd_glob_6, "features/brain-memory.mdx": __fd_glob_7, "features/interview-copilot.mdx": __fd_glob_8, "features/suggestions.mdx": __fd_glob_9, "getting-started/installation.mdx": __fd_glob_10, });