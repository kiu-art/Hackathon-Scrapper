import puppeteer from "puppeteer";

const BASE_URL = "https://unstop.com/hackathons";

const scrapeUnstop = async (page, pageNumber) => {
  console.log(`Scraping Unstop page ${pageNumber}`);

  await page.waitForSelector("app-competition-listing", {
    timeout: 30000,
  });

  await new Promise((resolve) => setTimeout(resolve, 2000));

  const hackathons = await page.$$eval(
    "app-competition-listing",
    (cards) => {
      const clean = (value) => {
        if (!value) return null;

        return value.replace(/\s+/g, " ").trim();
      };

      const parseTeamSize = (value) => {
        if (!value) return null;

        if (/individual participation/i.test(value)) {
          return {
            min: 1,
            max: 1,
          };
        }

        const match = value.match(/(\d+)\s*-\s*(\d+)/);

        if (!match) return null;

        return {
          min: Number(match[1]),
          max: Number(match[2]),
        };
      };

      const parseFee = (value) => {
        if (!value) return null;

        const number = value.replace(/,/g, "").match(/\d+/);

        return number ? Number(number[0]) : null;
      };

      const parsePrize = (value) => {
        if (!value) return null;

        const match = value.match(
          /(?:Prizes worth\s*)?₹?\s*([\d,]+)/i
        );

        if (!match) return null;

        return Number(match[1].replace(/,/g, ""));
      };

      return cards
        .map((card) => {
          const linkElement = card.querySelector(
            'a[href*="/hackathons/"]'
          );

          if (!linkElement) return null;

          const lines = card.innerText
            ?.split("\n")
            .map(clean)
            .filter(Boolean);

          if (!lines || lines.length < 2) return null;

          const data = {
            title: lines[0],
            organizer: lines[1],
            link: linkElement.href,
            fee: null,
            teamSize: null,
            location: null,
            categories: [],
            eligibility: [],
            prize: null,
            status: null,
            postedDate: null,
          };

          let index = 2;

          if (
            lines[index] &&
            /^\d[\d,]*$/.test(lines[index]) &&
            lines[index + 1]?.toLowerCase() === "fee"
          ) {
            data.fee = parseFee(lines[index]);
            index += 2;
          }

          if (lines[index]) {
            const team = parseTeamSize(lines[index]);

            if (team) {
              data.teamSize = team;
              index++;

              if (lines[index]?.toLowerCase() === "members") {
                index++;
              }
            }
          }

          if (lines[index]) {
            const current = lines[index];

            if (/^(online|offline|hybrid)$/i.test(current)) {
              data.location = current;
              index++;
            } else if (
              !/^Prizes worth/i.test(current) &&
              !/^Posted /i.test(current) &&
              current !== "Expired" &&
              !/^\+\d+$/.test(current)
            ) {
              data.location = current;
              index++;
            }
          }

          const remaining = lines.slice(index);

          for (const value of remaining) {
            if (/^\+\d+$/.test(value)) continue;

            if (/Prizes worth/i.test(value)) {
              data.prize = parsePrize(value);
              continue;
            }

            if (/^Expired$/i.test(value)) {
              data.status = "Expired";
              continue;
            }

            if (/days?\s+left/i.test(value)) {
              data.status = value;
              continue;
            }

            if (/Register Now/i.test(value)) {
              data.status = "Register Now";
              continue;
            }

            if (/^Posted\s+/i.test(value)) {
              data.postedDate = value.replace(/^Posted\s+/i, "");
              continue;
            }

            const eligibilityKeywords = [
              "students",
              "undergraduate",
              "postgraduate",
              "school students",
              "working professionals",
              "everyone can apply",
              "individual participation",
            ];

            const isEligibility = eligibilityKeywords.some(
              (keyword) =>
                value.toLowerCase().includes(keyword)
            );

            if (isEligibility) {
              data.eligibility.push(value);
              continue;
            }

            data.categories.push(value);
          }

          return data;
        })
        .filter(Boolean);
    }
  );

  console.log(
    `Found ${hackathons.length} hackathons on page ${pageNumber}`
  );

  return hackathons;
};

const goToNextPage = async (
  page,
  currentPage,
  previousLinks
) => {
  return await page.evaluate(
    ({ currentPage, previousLinks }) => {
      const numbers = [
        ...document.querySelectorAll("li.num span.number"),
      ];

      let nextPage = numbers.find(
        (element) =>
          element.textContent.trim() ===
          String(currentPage + 1)
      );

      if (!nextPage) return false;

      nextPage.scrollIntoView({
        behavior: "instant",
        block: "center",
      });

      nextPage.click();

      return true;
    },
    {
      currentPage,
      previousLinks,
    }
  );
};

const scrapeAllUnstop = async (maxPages = 100) => {
  let browser;

  const allHackathons = [];

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
        "AppleWebKit/537.36 (KHTML, like Gecko) " +
        "Chrome/140.0.0.0 Safari/537.36"
    );

    await page.setViewport({
      width: 1366,
      height: 768,
    });

    console.log("Opening Unstop...");

    await page.goto(BASE_URL, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    await page.waitForSelector(
      "app-competition-listing",
      {
        timeout: 30000,
      }
    );

    await new Promise((resolve) =>
      setTimeout(resolve, 3000)
    );

    for (
      let pageNumber = 1;
      pageNumber <= maxPages;
      pageNumber++
    ) {
      console.log(`\n==============================`);
      console.log(`PAGE ${pageNumber}`);
      console.log(`==============================`);

      const hackathons = await scrapeUnstop(
        page,
        pageNumber
      );

      if (hackathons.length === 0) {
        console.log("No hackathons found. Stopping.");
        break;
      }

      allHackathons.push(...hackathons);

      console.log(
        `Total collected: ${allHackathons.length}`
      );

      if (pageNumber === maxPages) {
        break;
      }

      const previousLinks = hackathons.map(
        (hackathon) => hackathon.link
      );

      const clicked = await goToNextPage(
        page,
        pageNumber,
        previousLinks
      );

      if (!clicked) {
        console.log("No next page found.");
        break;
      }

      console.log(
        `Clicked page ${pageNumber + 1}`
      );

      try {
        await page.waitForFunction(
          (previousLinks) => {
            const cards = document.querySelectorAll(
              "app-competition-listing"
            );

            if (!cards.length) return false;

            const currentLinks = [...cards].map(
              (card) => {
                const link = card.querySelector(
                  'a[href*="/hackathons/"]'
                );

                return link?.href || "";
              }
            );

            return (
              JSON.stringify(currentLinks) !==
              JSON.stringify(previousLinks)
            );
          },
          {
            timeout: 30000,
          },
          previousLinks
        );
      } catch (error) {
        console.log(
          "Hackathons did not change."
        );

        console.log(
          "Stopping to avoid duplicate data."
        );

        break;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, 1000)
      );
    }

    const uniqueHackathons = [
      ...new Map(
        allHackathons.map((hackathon) => [
          hackathon.link,
          hackathon,
        ])
      ).values(),
    ];

    console.log("\n================================");
    console.log("SCRAPING FINISHED");
    console.log("================================");

    console.log(
      `Total scraped: ${allHackathons.length}`
    );

    console.log(
      `Unique hackathons: ${uniqueHackathons.length}`
    );

    return {
      count: uniqueHackathons.length,
      pagesScraped: Math.min(
        maxPages,
        Math.ceil(allHackathons.length / 18)
      ),
      hackathons: uniqueHackathons,
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};


const scrapeHackathonDetails = async (url, existingBrowser = null) => {
  let browser = existingBrowser;
  let shouldCloseBrowser = false;
  let page;

  try {
    if (!browser) {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-blink-features=AutomationControlled",
        ],
      });
      shouldCloseBrowser = true;
    }

    page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
    );

    await page.setViewport({ width: 1366, height: 768 });

    // 1. Intercept Unstop's internal API payload
    let apiData = null;
    page.on("response", async (response) => {
      const resUrl = response.url();
      if (
        (resUrl.includes("/api/public/competition") ||
          resUrl.includes("/api/public/opportunity")) &&
        response.status() === 200
      ) {
        try {
          const json = await response.json();
          const target = json?.data || json?.competition || json;
          if (target) {
            apiData = target;
          }
        } catch (_) {}
      }
    });

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const extracted = await page.evaluate((apiData) => {
      const cleanInline = (t) => (t ? t.replace(/[ \t]+/g, " ").trim() : "");

      // --- DATE PARSER ---
      const parseUnstopDate = (dateStr) => {
        if (!dateStr) return null;
        let text = cleanInline(dateStr);

        if (text.includes("-->")) {
          text = text.split("-->")[1].trim();
        } else if (text.includes("->")) {
          text = text.split("->")[1].trim();
        }

        const daysMatch = text.match(/(\d+)\s*days?\s*left/i);
        if (daysMatch) {
          const future = new Date(Date.now() + parseInt(daysMatch[1], 10) * 86400000);
          future.setHours(23, 59, 59, 999);
          return future.toISOString();
        }

        const hoursMatch = text.match(/(\d+)\s*(?:hours?|hrs?)\s*left/i);
        if (hoursMatch) {
          const future = new Date(Date.now() + parseInt(hoursMatch[1], 10) * 3600000);
          return future.toISOString();
        }

        text = text.replace(/(\b[A-Za-z]{3,9}\s+)(\d{2})\b/, "$120$2");
        text = text.replace(/(\b\d{1,2}\s+[A-Za-z]{3,9}\s+)(\d{2})\b/, "$120$2");
        text = text.replace(/IST/i, "GMT+0530").trim();

        const match = text.match(
          /(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}(?:,?\s+\d{1,2}:\d{2}(?:\s*[AP]M)?)?(?:\s*GMT[+-]\d{4})?)/i
        );

        if (match) {
          const parsed = new Date(match[1]);
          if (!isNaN(parsed.getTime())) return parsed.toISOString();
        }

        const direct = new Date(text);
        if (!isNaN(direct.getTime())) return direct.toISOString();

        return null;
      };

      // --- PRIZE PARSER ---
      const parseTotalPrize = (bodyText, api) => {
        // Priority 1: Check internal API properties
        if (api) {
          const directApiPrize =
            api.prizes_worth ||
            api.total_prize ||
            api.total_prize_money ||
            api.cash_prize;

          if (typeof directApiPrize === "number" && directApiPrize > 0) {
            return directApiPrize;
          }
          if (typeof directApiPrize === "string") {
            const num = Number(directApiPrize.replace(/,/g, "").match(/\d+/)?.[0]);
            if (num) return num;
          }
        }

        // Priority 2: Regex across full page text
        // Handles "Prizes worth ₹ 1,50,000", "Total Cash Prize: ₹ 50,000", "Prize Pool: ₹ 2,00,000"
        const prizeRegex =
          /(?:Prizes?\s+worth|Total\s+Cash\s+Prize|Cash\s+Prize|Total\s+Prize(?:\s+Pool)?|Prize\s+Money|Prizes?)\s*[:\-]?\s*₹?\s*([\d,]+)/i;

        const match = bodyText.match(prizeRegex);
        if (match && match[1]) {
          const parsed = Number(match[1].replace(/,/g, ""));
          if (!isNaN(parsed) && parsed > 0) {
            return parsed;
          }
        }

        // Priority 3: Target dedicated prize container if present
        const prizeElement = document.querySelector(
          ".prize, .prizes, [class*='prize_money'], [class*='prizes-worth']"
        );
        if (prizeElement) {
          const elementText = cleanInline(prizeElement.innerText);
          const elemMatch = elementText.match(/₹?\s*([\d,]+)/);
          if (elemMatch && elemMatch[1]) {
            const parsed = Number(elemMatch[1].replace(/,/g, ""));
            if (!isNaN(parsed) && parsed > 0) return parsed;
          }
        }

        return null;
      };

      // Strip non-content nodes
      const elementsToRemove = document.querySelectorAll(
        "script, style, noscript, nav, footer, app-header, app-footer, .header, .footer"
      );
      elementsToRemove.forEach((el) => el.remove());

      const rawBody = document.body.innerText || "";

      // 1. Extract Total Cash Prize
      const totalPrize = parseTotalPrize(rawBody, apiData);

      // 2. Extract Deadline
      let deadlineISO = null;
      if (apiData?.regn_end_date || apiData?.end_date) {
        deadlineISO = parseUnstopDate(apiData.regn_end_date || apiData.end_date);
      }

      if (!deadlineISO) {
        const deadlineMatch = rawBody.match(
          /(?:Application Deadline|Registration Deadline|Ends on|Closes in|-->)\s*[:\-]?\s*([^\n•]{3,40})/i
        );
        deadlineISO = parseUnstopDate(deadlineMatch ? deadlineMatch[1] : rawBody);
      }

      // 3. Extract Full Page Description
      const rawLines = rawBody.split("\n");
      const filteredLines = [];

      for (const line of rawLines) {
        const cleaned = cleanInline(line);
        if (cleaned.length < 15) continue;
        if (/^(home|internships|jobs|competitions|prep zone|reviews|faqs & discussions)$/i.test(cleaned)) continue;
        filteredLines.push(cleaned);
      }

      const fullContentText = filteredLines.join("\n").slice(0, 4000);

      // 4. Tech Stack Extraction
      const knownTech = [
        "React", "Node.js", "Python", "Machine Learning", "Artificial Intelligence", "AI",
        "GenAI", "Solidity", "Blockchain", "Docker", "Kubernetes", "AWS", "Flutter",
        "Android", "iOS", "Next.js", "Express", "MongoDB", "PostgreSQL",
        "C++", "Java", "TensorFlow", "PyTorch", "TypeScript", "DevOps", "Web3"
      ];

      const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const detectedTech = knownTech.filter((tech) => {
        const escaped = escapeRegex(tech);
        const regex = new RegExp(`(?:^|[^a-zA-Z0-9_])${escaped}(?=[^a-zA-Z0-9_]|$)`, "i");
        return regex.test(rawBody);
      });

      return {
        prize: totalPrize,
        deadlineISO,
        techStack: detectedTech,
        fullDescription: fullContentText,
      };
    }, apiData);

    const deadlineDate = extracted.deadlineISO ? new Date(extracted.deadlineISO) : null;

    const contextText = `Technologies: ${extracted.techStack.join(", ")}\n\nDetails:\n${extracted.fullDescription}`.trim();

    return {
      link: url,
      prize: extracted.prize, // e.g. 150000
      currentDeadline: deadlineDate,
      techStack: extracted.techStack,
      contextText,
    };
  } catch (error) {
    console.error(`[Scraper Error on ${url}]:`, error.message);
    return null;
  } finally {
    if (page) await page.close().catch(() => {});
    if (shouldCloseBrowser && browser) await browser.close().catch(() => {});
  }
};

export {
  scrapeUnstop,
  scrapeAllUnstop,
  scrapeHackathonDetails,
};
