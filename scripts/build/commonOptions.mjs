import { commonOpts, globPlugins, gitHashPlugin, gitRemotePlugin, fileIncludePlugin, watch } from "./common.mjs";

/**
 * @type {esbuild.BuildOptions}
 */
export const commonOptions = {
    ...commonOpts,
    entryPoints: ["browser/bluecord.ts"],
    globalName: "bleucord",
    format: "iife",
    external: ["plugins", "git-hash"],
    plugins: [
        globPlugins,
        gitHashPlugin,
        gitRemotePlugin,
        fileIncludePlugin
    ],
    target: ["esnext"],
    define: {
        IS_WEB: "true",
        IS_STANDALONE: "true",
        IS_DEV: JSON.stringify(watch)
    }
};




