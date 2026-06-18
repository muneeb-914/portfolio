const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const target = path.resolve(__dirname, "../outputs/index.html");
const outDir = path.resolve(__dirname, "verification");

fs.mkdirSync(outDir, { recursive: true });

const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
];

(async () => {
  const launchOptions = { headless: true };
  if (process.env.BROWSER_EXE) {
    launchOptions.executablePath = process.env.BROWSER_EXE;
  }

  const browser = await chromium.launch(launchOptions);
  const issues = [];

  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) {
        issues.push(`${viewport.name} console ${message.type()}: ${message.text()}`);
      }
    });
    page.on("pageerror", (error) => {
      issues.push(`${viewport.name} page error: ${error.message}`);
    });

    await page.goto(`file://${target.replace(/\\/g, "/")}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(900);
    await page.screenshot({
      path: path.join(outDir, `${viewport.name}-top.png`),
      fullPage: false,
    });

    const state = await page.evaluate(() => {
      const hero = document.querySelector(".hero");
      const intro = document.querySelector(".intro-band");
      const nav = document.querySelector("[data-nav]");
      const heroRect = hero.getBoundingClientRect();
      const introRect = intro.getBoundingClientRect();
      const visibleText = document.body.innerText;
      const bg = getComputedStyle(document.querySelector(".hero-bg")).backgroundImage;

      return {
        title: document.title,
        heroHeight: Math.round(heroRect.height),
        introTop: Math.round(introRect.top),
        navMode: getComputedStyle(nav).position,
        hasHeroImage: bg.includes("hero-data-agents.png"),
        bodyTextLength: visibleText.length,
      };
    });

    console.log(`${viewport.name}: ${JSON.stringify(state)}`);

    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y <= scrollHeight; y += Math.floor(viewport.height * 0.72)) {
      await page.evaluate((nextY) => window.scrollTo(0, nextY), y);
      await page.waitForTimeout(90);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(120);

    await page.screenshot({
      path: path.join(outDir, `${viewport.name}.png`),
      fullPage: true,
    });

    await page.click('[data-filter="agents"]');
    const agentCounts = await page.evaluate(() => {
      const expected = Array.from(document.querySelectorAll("[data-category]")).filter((card) =>
        card.dataset.category.split(" ").includes("agents")
      ).length;
      const visible = Array.from(document.querySelectorAll("[data-category]")).filter(
        (card) => !card.classList.contains("is-hidden")
      ).length;
      return { expected, visible };
    });
    if (agentCounts.visible !== agentCounts.expected) {
      issues.push(
        `${viewport.name} project filter expected ${agentCounts.expected} cards, got ${agentCounts.visible}`
      );
    }

    if (viewport.name === "mobile") {
      await page.click("[data-nav-toggle]");
      const navOpen = await page.evaluate(() => document.querySelector("[data-nav]").classList.contains("open"));
      if (!navOpen) {
        issues.push("mobile nav did not open");
      }
      await page.click('[data-nav] a[href="#projects"]');
      const navClosed = await page.evaluate(() => !document.querySelector("[data-nav]").classList.contains("open"));
      if (!navClosed) {
        issues.push("mobile nav did not close after link click");
      }
    }

    await page.close();
  }

  await browser.close();

  if (issues.length) {
    console.error(issues.join("\n"));
    process.exitCode = 1;
  }
})();
