﻿#!/usr/bin/node
/*
 * bluecord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/


import esbuild from "esbuild";
import { zip } from "fflate";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { readFile } from "fs/promises";
import { join, resolve } from "path";

// wtf is this assert syntax
import PackageJSON from "../../package.json" assert { type: "json" };
import { commonOptions } from "./commonOptions.mjs";

await Promise.all(
    [
        esbuild.build({
            ...commonOptions,
            outfile: "dist/browser.js",
            footer: { js: "//# sourceURL=VencordWeb" },
        }),
        esbuild.build({
            ...commonOptions,
            outfile: "dist/bluecord.user.js",
            banner: {
                js: readFileSync("browser/userscript.meta.js", "utf-8").replace("%version%", `${PackageJSON.version}.${new Date().getTime()}`)
            },
            footer: {
                // UserScripts get wrapped in an iife, so define bluecord prop on window that returns our local
                js: "Object.defineProperty(window,'bluecord',{get:()=>bluecord});"
            },
        })
    ]
);

async function buildPluginZip(target, files, shouldZip) {
    const entries = {
        "dist/bluecord.js": readFileSync("dist/browser.js"),
        ...Object.fromEntries(await Promise.all(files.map(async f => [
            (f.startsWith("manifest") ? "manifest.json" : f),
            await readFile(join("browser", f))
        ]))),
    };

    if (shouldZip) {
        zip(entries, {}, (err, data) => {
            if (err) {
                console.error(err);
                process.exitCode = 1;
            } else {
                writeFileSync("dist/" + target, data);
                console.info("Extension written to dist/" + target);
            }
        });
    } else {
        if (existsSync(target))
            rmSync(target, { recursive: true });
        for (const entry in entries) {
            const destination = "dist/" + target + "/" + entry;
            const parentDirectory = resolve(destination, "..");
            mkdirSync(parentDirectory, { recursive: true });
            writeFileSync(destination, entries[entry]);
        }
        console.info("Unpacked Extension written to dist/" + target);
    }
}

await buildPluginZip("extension-v3.zip", ["modifyResponseHeaders.json", "content.js", "manifestv3.json"], true);
await buildPluginZip("extension-v2.zip", ["background.js", "content.js", "manifestv2.json"], true);
await buildPluginZip("extension-v2-unpacked", ["background.js", "content.js", "manifestv2.json"], false);





