import { defineConfig } from "vite";

export default defineConfig({
	build: {
		rollupOptions: {
			external: [
				"electron",
				"better-sqlite3",
				"playwright",
				"playwright-core",
				"user-agents",
				"cheerio",
				"axios",
				"p-queue",
				"node-cron",
				"path",
				"fs",
				"os",
				"url",
				"child_process",
			],
		},
	},
});
