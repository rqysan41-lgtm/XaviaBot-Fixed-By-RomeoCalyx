import { readFileSync, writeFileSync, existsSync, statSync } from "fs";
import { spawn } from "child_process";
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

console.clear();

// Node check for Replit (لا نلمس ملفات البوت)
async function checkNode() {
    if (process.version.slice(1).split(".")[0] < 16) {
        if (isReplit) {
            try {
                logger.warn("Installing Node.js v16 for Repl.it...");
                const { execSync } = await import("child_process");
                execSync(
                    "npm i --save-dev node@16 && npm config set prefix=$(pwd)/node_modules/node && export PATH=$(pwd)/node_modules/node/bin:$PATH"
                );
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
}

// Glitch setup
function checkGlitch() {
    if (isGlitch) {
        const WATCH_FILE = {
            restart: { include: ["\\.json"] },
            throttle: 3000,
        };

        if (
            !existsSync(process.cwd() + "/watch.json") ||
            !statSync(process.cwd() + "/watch.json").isFile()
        ) {
            logger.warn("Glitch environment detected. Creating watch.json...");
            writeFileSync(
                process.cwd() + "/watch.json",
                JSON.stringify(WATCH_FILE, null, 2)
            );
        }
    }
}

// GitHub warning
function checkGitHub() {
    if (isGitHub) {
        logger.warn("Running on GitHub is not recommended.");
    }
}

// Check updates
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

// تشغيل البوت دائمًا بدون توقف
async function startBot() {
    await loadPlugins();
    await checkUpdate();

    const child = spawn(
        "node",
        ["--trace-warnings", "--experimental-import-meta-resolve", "--expose-gc", "core/_build.js"],
        { cwd: process.cwd(), stdio: "inherit", env: process.env }
    );

    child.on("close", async (code) => {
        if (code !== 0) logger.error(`Bot exited with code ${code}`);
        else logger.warn("Bot stopped normally.");

        logger.warn("Restarting bot in 2 seconds...");
        setTimeout(startBot, 2000); // إعادة التشغيل دائمًا
    });

    child.on("error", (err) => {
        logger.error("Failed to start bot:", err);
        setTimeout(startBot, 2000);
    });
}

// Main
(async () => {
    await checkNode();
    checkGlitch();
    checkGitHub();

    logger.custom("Launcher started. Bot will run 24/7.", "BOOT");
    startBot();
})();
