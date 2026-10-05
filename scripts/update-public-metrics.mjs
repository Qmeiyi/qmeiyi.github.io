import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { chromium } from "@playwright/test";

const metricsPath = new URL("../src/data/public-metrics.json", import.meta.url);
const feishuImagePath = fileURLToPath(new URL("../src/assets/projects/tutorials/dataflow-feishu-tutorial.png", import.meta.url));
const bilibiliImagePath = fileURLToPath(new URL("../src/assets/projects/tutorials/dataflow-bilibili-tutorial.png", import.meta.url));
const metrics = JSON.parse(await readFile(metricsPath, "utf8"));
const updatedSources = [];
const execFileAsync = promisify(execFile);

const desktopUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const mobileUA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1";

async function fetchWithRetry(url, options = {}, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, { ...options, signal: AbortSignal.timeout(25_000) });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 900));
    }
  }
  throw lastError;
}

async function curlText(url, headers = {}) {
  const args = ["--fail", "--silent", "--show-error", "--location", "--max-time", "35"];
  for (const [name, value] of Object.entries(headers)) args.push("--header", `${name}: ${value}`);
  args.push(String(url));
  const { stdout } = await execFileAsync("curl", args, { maxBuffer: 16 * 1024 * 1024 });
  return stdout;
}

async function refreshGitHub() {
  const repositories = { dataflow: "OpenDCAI/DataFlow", dataflex: "OpenDCAI/DataFlex", datamind: "OpenDCAI/DataMind" };
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "qmeiyi.github.io metrics updater" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  metrics.github = Object.fromEntries(await Promise.all(Object.entries(repositories).map(async ([key, repository]) => {
    const data = JSON.parse(await curlText(`https://api.github.com/repos/${repository}`, headers));
    if (!Number.isInteger(data.stargazers_count)) throw new Error(`Missing star count for ${repository}`);
    return [key, data.stargazers_count];
  })));
  updatedSources.push("GitHub");
}

async function refreshScholar() {
  const headers = { "User-Agent": desktopUA, "Accept-Language": "en-US,en;q=0.9" };
  const html = await curlText("https://scholar.google.com/citations?user=8g78CmwAAAAJ&hl=en", headers);
  const values = [...html.matchAll(/class="gsc_rsb_std">([\d,]+)/g)].map((match) => Number(match[1].replaceAll(",", "")));
  if (values.length < 3) throw new Error("Google Scholar metrics were not found");
  metrics.scholar = { citations: values[0], hIndex: values[2] };
  updatedSources.push("Google Scholar");
}

async function refreshXiaohongshu() {
  const response = await fetchWithRetry("https://xhslink.cn/o/84v0uHax500", { redirect: "follow", headers: { "User-Agent": mobileUA, "Accept-Language": "zh-CN,zh;q=0.9" } });
  const html = await response.text();
  const match = html.match(/"fans":"([\d,]+)"/);
  if (!match) throw new Error("Xiaohongshu follower count was not found");
  metrics.xiaohongshu.followers = Number(match[1].replaceAll(",", ""));
  updatedSources.push("Xiaohongshu");
}

async function refreshBilibili() {
  const buvid = crypto.randomUUID().replaceAll("-", "").toUpperCase();
  const url = new URL("https://api.bilibili.com/x/polymer/web-space/seasons_archives_list");
  url.search = new URLSearchParams({ mid: "3546929239689711", season_id: "6761326", sort_reverse: "false", page_num: "1", page_size: "100", ts: String(Date.now()) });
  const response = await fetchWithRetry(url, { headers: { "User-Agent": desktopUA, Referer: "https://space.bilibili.com/3546929239689711/lists/6761326?type=season", Origin: "https://space.bilibili.com", Accept: "application/json, text/plain, */*", Cookie: `buvid3=${buvid}infoc; b_nut=${Math.floor(Date.now() / 1000)}` } });
  const payload = await response.json();
  if (payload.code !== 0 || !Array.isArray(payload.data?.archives)) throw new Error(`Bilibili API returned ${payload.code}`);
  const archives = payload.data.archives;
  metrics.tutorials.bilibiliVideos = Number(payload.data.meta?.total ?? archives.length);
  metrics.tutorials.bilibiliViews = archives.reduce((sum, item) => sum + Number(item.stat?.view ?? 0), 0);
  updatedSources.push("Bilibili");
  return archives;
}

function chromeExecutable() {
  return [process.env.PLAYWRIGHT_CHROME_PATH, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable"].filter(Boolean).find((path) => existsSync(path));
}

async function refreshFeishuAndImages(archives) {
  const executablePath = chromeExecutable();
  if (!executablePath) throw new Error("Google Chrome is not available for tutorial snapshots");
  const browser = await chromium.launch({ headless: true, executablePath });
  try {
    const feishuPage = await browser.newPage({ viewport: { width: 1440, height: 1000 }, userAgent: desktopUA });
    await feishuPage.goto("https://wcny4qa9krto.feishu.cn/wiki/I9tbw2qnBi0lEakmmAGclTysnFd?from=from_copylink", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await feishuPage.waitForFunction(() => document.body.innerText.includes("DataFlow 系列图文教程"), null, { timeout: 30_000 });
    await feishuPage.waitForTimeout(8_000);
    const lines = (await feishuPage.locator("body").innerText()).split("\n").map((line) => line.trim()).filter(Boolean);
    const modifiedLine = lines.findIndex((line, index) => /修改/.test(line) && /^\d[\d,]*$/.test(lines[index + 1] ?? "") && /^\d[\d,]*$/.test(lines[index + 2] ?? ""));
    if (modifiedLine >= 0) {
      metrics.tutorials.feishuVisitors = Number(lines[modifiedLine + 1].replaceAll(",", ""));
      metrics.tutorials.feishuViews = Number(lines[modifiedLine + 2].replaceAll(",", ""));
      updatedSources.push("Feishu");
    }
    await feishuPage.screenshot({ path: feishuImagePath, fullPage: false });
    await feishuPage.close();

    if (archives?.length) {
      const items = [archives[0], archives[1] ?? archives[0], [...archives].sort((a, b) => Number(b.stat?.view ?? 0) - Number(a.stat?.view ?? 0))[0]];
      const bilibiliPage = await browser.newPage({ viewport: { width: 1440, height: 900 }, extraHTTPHeaders: { Referer: "https://www.bilibili.com/" } });
      const cards = items.map((item) => `<article class="card"><img class="thumb" src="${String(item.pic).replace("http://", "https://")}"><div class="body"><div class="video-title">${item.title}</div><div class="views">▶ ${Number(item.stat?.view ?? 0).toLocaleString("en-US")} 播放</div></div></article>`).join("");
      await bilibiliPage.setContent(`<!doctype html><html><head><style>*{box-sizing:border-box}body{margin:0;background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC',sans-serif;color:#18191c}.panel{width:1440px;height:820px;background:linear-gradient(150deg,#fff 0%,#fff 58%,#fff2f6 100%);padding:56px 64px}.head{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:34px}.brand{font-weight:800;font-size:24px;color:#fb7299;letter-spacing:.02em}.title{font-size:38px;font-weight:780;margin:12px 0 10px}.desc{font-size:18px;color:#61666d;max-width:900px}.metrics{display:flex;gap:12px}.metric{border:1px solid #ffd2df;background:#fff7fa;color:#c63d68;border-radius:999px;padding:12px 18px;font-size:18px;font-weight:700}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}.card{overflow:hidden;border-radius:18px;background:#fff;border:1px solid #e5e9ef;box-shadow:0 16px 40px rgba(33,38,45,.08)}.thumb{width:100%;height:265px;object-fit:cover;display:block;background:#e9edf2}.body{padding:20px 22px 22px}.video-title{font-size:20px;font-weight:700;line-height:1.45;min-height:58px}.views{margin-top:14px;color:#9499a0;font-size:16px}.foot{display:flex;align-items:center;justify-content:space-between;margin-top:30px;color:#61666d;font-size:17px}.cta{color:#fb7299;font-weight:700}</style></head><body><section class="panel"><div class="head"><div><div class="brand">哔哩哔哩 · DataFlow 视频教程</div><h1 class="title">大模型数据准备，零基础 DataFlow 代码实战</h1><p class="desc">从功能讲解、环境配置到代码运行，覆盖数据准备、质量评估、动态训练与多模态处理。</p></div><div class="metrics"><span class="metric">${metrics.tutorials.bilibiliVideos} 期</span><span class="metric">${metrics.tutorials.bilibiliViews.toLocaleString("en-US")} 次播放</span></div></div><div class="grid">${cards}</div><div class="foot"><span>OpenDCAI · 系列视频课程</span><span class="cta">前往 B 站观看完整合集 →</span></div></section></body></html>`, { waitUntil: "networkidle" });
      await bilibiliPage.waitForTimeout(1_500);
      await bilibiliPage.locator(".panel").screenshot({ path: bilibiliImagePath });
      await bilibiliPage.close();
    }
  } finally {
    await browser.close();
  }
}

async function attempt(name, task) {
  try { return await task(); }
  catch (error) { console.warn(`[metrics] ${name} refresh failed; keeping the last successful value: ${error.message}`); return undefined; }
}

await attempt("GitHub", refreshGitHub);
await attempt("Google Scholar", refreshScholar);
await attempt("Xiaohongshu", refreshXiaohongshu);
const archives = await attempt("Bilibili", refreshBilibili);
await attempt("Feishu/tutorial snapshots", () => refreshFeishuAndImages(archives));
metrics.updatedAt = new Date().toISOString();
await writeFile(metricsPath, `${JSON.stringify(metrics, null, 2)}\n`);
console.log(`[metrics] refreshed: ${updatedSources.join(", ") || "fallback values only"}`);
