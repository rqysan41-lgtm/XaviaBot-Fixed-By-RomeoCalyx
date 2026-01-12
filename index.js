import { readFileSync, writeFileSync, existsSync, statSync } from "fs";
import { spawn, execSync } from "child_process";
import semver from "semver";
import axios from "axios";

import {} from "dotenv/config";
import logger from "./core/var/modules/logger.js";
import { loadPlugins } from "./core/var/modules/installDep.js";

import {
    isGlitch,
    isReplit,
    isGitHub,
} from "./core/var/modules/environments.get.js";

import express from "express";

console.clear();

// ===== Render memory fix =====
process.env.NODE_OPTIONS = "--max-old-space-size=512";

// ===== Express server for UptimeRobot ping =====
const app = express();
app.get("/", (req, res) => res.send("Bot is alive 🚀"));
app.listen(process.env.PORT || 3000, () => {
    logger.custom("Express server running for UptimeRobot ping", "PING");
});

// ===== Install Node on old Repls =====
function upNodeReplit() {
    return new Promise((resolve) => {
        execSync(
            "npm i --save-dev node@16 && npm config set prefix=$(pwd)/node_modules/node && export PATH=$(pwd)/node_modules/node/bin:$PATH"
        );
        resolve();
    });
}

(async () => {
    if (process.version.slice(1).split(".")[0] < 16) {
        if (isReplit) {
            try {
                logger.warn("Installing Node.js v16 for Repl.it...");
                await upNodeReplit();
                if (process.version.slice(1).split(".")[0] < 16)
                    throw new Error("Failed to install Node.js v16.");
            } catch (err) {
                logger.error(err);
                process.exit(0);
            }
        }
        logger.error(
            "Xavia requires Node 16 or higher. Please update your version of Node."
        );
        process.exit(0);
    }

    if (isGlitch) {
        const WATCH_FILE = { restart: { include: ["\\.json"] }, throttle: 3000 };
        if (!existsSync(process.cwd() + "/watch.json") ||
            !statSync(process.cwd() + "/watch.json").isFile()
        ) {
            logger.warn("Glitch environment detected. Creating watch.json...");
            writeFileSync(process.cwd() + "/watch.json",
                JSON.stringify(WATCH_FILE, null, 2));
            execSync("refresh");
        }
    }

    if (isGitHub) logger.warn("Running on GitHub is not recommended.");
})();

// ================= CHECK UPDATE =================
async function checkUpdate() {
    logger.custom("Checking for updates...", "UPDATE");
    try {
        const res = await axios.get(
            "https://raw.githubusercontent.com/XaviaTeam/XaviaBot/main/package.json"
        );
        const { version } = res.data;
        const currentVersion = JSON.parse(readFileSync("./package.json")).version;
        if (semver.lt(currentVersion, version)) {
            logger.warn(`New version available: ${version}`);
            logger.warn(`Current version: ${currentVersion}`);
        } else {
            logger.custom("No updates available.", "UPDATE");
        }
    } catch (err) {
        logger.error("Failed to check for updates.");
    }
}

// ================= CHILD HANDLER =================
const _1_MINUTE = 60000;
let restartCount = 0;

// حد الذاكرة للبوت
const MAX_MEMORY_MB = 450;

async function main() {
    await checkUpdate();
    await loadPlugins();

    const child = spawn(
        "node",
        [
            "--trace-warnings",
            "--experimental-import-meta-resolve",
            "--expose-gc",
            "--max-old-space-size=512",
            "core/_build.js",
        ],
        {
            cwd: process.cwd(),
            stdio: "inherit",
            env: process.env,
        }
    );

    child.on("close", async (code) => {
        handleRestartCount();

        // إعادة تشغيل دائمة بدون حد
        if (code !== 0) {
            console.log();
            logger.error(`Process stopped with code ${code}`);
            logger.warn("Restarting...");
            await new Promise((r) => setTimeout(r, 2000));
            main();
        } else {
            console.log();
            logger.error("XaviaBot has stopped, press Ctrl + C to exit.");
        }
    });
}

function handleRestartCount() {
    restartCount++;
    setTimeout(() => { restartCount--; }, _1_MINUTE);
}

// ================= MEMORY WATCHER =================
setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024;

    if (used > MAX_MEMORY_MB) {
        logger.warn(`High memory usage: ${used.toFixed(0)} MB, restarting...`);
        process.exit(1);
    }

    if (global.gc) global.gc();
}, 60 * 1000);

// ================= ERROR SAFETY =================
process.on("uncaughtException", (err) => {
    logger.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled Rejection:", reason);
});

main();
