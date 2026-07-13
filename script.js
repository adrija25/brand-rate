const form = document.getElementById("rate-form");
const results = document.getElementById("results");
const currencyConfig = {
  india: { currency: "INR", locale: "en-IN", pricingUnit: 1, paidPrice: 499 },
  us: { currency: "USD", locale: "en-US", pricingUnit: 83, paidPrice: 9 },
  uk: { currency: "GBP", locale: "en-GB", pricingUnit: 106, paidPrice: 7 },
  canada: { currency: "CAD", locale: "en-CA", pricingUnit: 61, paidPrice: 12 },
  australia: { currency: "AUD", locale: "en-AU", pricingUnit: 55, paidPrice: 12 },
  europe: { currency: "EUR", locale: "en-IE", pricingUnit: 90, paidPrice: 8 },
  global: { currency: "USD", locale: "en-US", pricingUnit: 83, paidPrice: 9 },
  other: { currency: "USD", locale: "en-US", pricingUnit: 83, paidPrice: 9 }
};

function getMoneyFormatter(market) {
  const config = currencyConfig[market];
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.currency,
    maximumFractionDigits: 0
  });
}

function toMarketCurrency(value, market) {
  return value / currencyConfig[market].pricingUnit;
}

function roundMarketRate(value, market) {
  const currency = currencyConfig[market].currency;
  if (currency === "INR") return roundRate(value);
  if (value < 100) return Math.max(10, Math.round(value / 5) * 5);
  if (value < 1000) return Math.round(value / 25) * 25;
  return Math.round(value / 50) * 50;
}

const platformFactor = {
  instagram: 1.00,
  tiktok: 0.95,
  youtube: 1.45
};

const contentFactor = {
  story: 0.50,
  post: 0.78,
  short: 1.20,
  integration: 1.80,
  dedicated: 3.10
};

const marketFactor = {
  india: 1.00,
  us: 2.80,
  uk: 2.30,
  canada: 2.10,
  australia: 2.15,
  europe: 1.80,
  global: 1.50,
  other: 1.15
};

const nicheFactor = {
  lifestyle: 1.00,
  beauty: 1.10,
  fashion: 1.05,
  fitness: 1.10,
  food: 1.00,
  travel: 1.10,
  gaming: 1.05,
  tech: 1.20,
  finance: 1.30,
  education: 1.10,
  parenting: 1.10,
  other: 1.00
};

// Broad India benchmark guardrails for the base deliverable.
// Market, platform, content and niche modifiers are applied afterwards.
const indiaFollowerGuardrails = [
  { followers: 1000, low: 1000, target: 1800, high: 3500 },
  { followers: 5000, low: 2000, target: 3500, high: 6500 },
  { followers: 10000, low: 3500, target: 6000, high: 10000 },
  { followers: 25000, low: 6000, target: 9000, high: 15000 },
  { followers: 50000, low: 9000, target: 14000, high: 24000 },
  { followers: 100000, low: 15000, target: 24000, high: 42000 },
  { followers: 250000, low: 30000, target: 50000, high: 90000 },
  { followers: 500000, low: 50000, target: 85000, high: 150000 },
  { followers: 1000000, low: 90000, target: 150000, high: 275000 }
];

function interpolateLog(followers, key) {
  const points = indiaFollowerGuardrails;
  if (followers <= points[0].followers) {
    return points[0][key] * Math.max(0.55, Math.pow(followers / points[0].followers, 0.35));
  }
  if (followers >= points[points.length - 1].followers) {
    return points[points.length - 1][key] * Math.pow(followers / points[points.length - 1].followers, 0.45);
  }

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (followers >= a.followers && followers <= b.followers) {
      const x = Math.log(followers);
      const x1 = Math.log(a.followers);
      const x2 = Math.log(b.followers);
      const t = (x - x1) / (x2 - x1);
      return a[key] + (b[key] - a[key]) * t;
    }
  }
}

function engagementModifier(rate) {
  if (rate < 1.5) return 0.88;
  if (rate < 3) return 1.00;
  if (rate < 5) return 1.10;
  if (rate < 8) return 1.20;
  return 1.28;
}

function performanceModifier(views, followers) {
  const ratio = views / followers;
  if (ratio < 0.10) return 0.82;
  if (ratio < 0.20) return 0.92;
  if (ratio < 0.35) return 1.00;
  if (ratio < 0.50) return 1.10;
  if (ratio < 0.75) return 1.20;
  return 1.30;
}

function roundRate(value) {
  if (value < 5000) return Math.max(500, Math.round(value / 100) * 100);
  if (value < 25000) return Math.round(value / 500) * 500;
  return Math.round(value / 1000) * 1000;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const platform = document.getElementById("platform").value;
  const market = document.getElementById("market").value;
  const niche = document.getElementById("niche").value;
  const followers = Number(document.getElementById("followers").value);
  const views = Number(document.getElementById("views").value);
  const engagementInput = document.getElementById("engagement").value;
  const engagement = engagementInput === "" ? 3 : Number(engagementInput);
  const content = document.getElementById("content").value;

  if (!followers || !views || followers < 1 || views < 1 || engagement < 0 || engagement > 100) return;

  const money = getMoneyFormatter(market);
  const marketCurrency = currencyConfig[market];

  const followerLow = interpolateLog(followers, "low");
  const followerTarget = interpolateLog(followers, "target");
  const followerHigh = interpolateLog(followers, "high");

  const perf = performanceModifier(views, followers);
  const engagementMod = engagementModifier(engagement);
  const commonModifier =
    marketFactor[market] *
    platformFactor[platform] *
    contentFactor[content] *
    nicheFactor[niche];

  // Smooth follower anchor + bounded performance adjustment.
  // Performance and engagement can move the target meaningfully without
  // creating abrupt jumps at arbitrary follower thresholds.
  const targetRaw = followerTarget * commonModifier * perf * engagementMod;

  // Benchmark guardrails stop the target from drifting implausibly far from
  // the broad follower/deliverable band while preserving performance effects.
  const lowerGuard = followerLow * commonModifier * 0.90;
  const upperGuard = followerHigh * commonModifier * 1.10;
  const guardedTarget = Math.min(upperGuard, Math.max(lowerGuard, targetRaw));

  // The engine keeps one benchmark-normalised internal scale, then expresses
  // the result in the selected audience market's native pricing currency.
  // pricingUnit values are product calibration constants, not live FX rates.
  const target = roundMarketRate(toMarketCurrency(guardedTarget, market), market);
  const minimum = roundMarketRate(
    toMarketCurrency(Math.max(followerLow * commonModifier, guardedTarget * 0.72), market),
    market
  );
  const premium = roundMarketRate(
    toMarketCurrency(Math.min(followerHigh * commonModifier * 1.15, guardedTarget * 1.55), market),
    market
  );

  const usageLow = roundMarketRate(target * 0.30, market);
  const usageHigh = roundMarketRate(target * 0.50, market);
  const exclusiveLow = roundMarketRate(target * 0.25, market);
  const exclusiveHigh = roundMarketRate(target * 0.50, market);

  document.getElementById("minimum").textContent = money.format(minimum);
  document.getElementById("target").textContent = money.format(target);
  document.getElementById("premium").textContent = money.format(premium);

  document.getElementById("usage-base").textContent = money.format(target);
  document.getElementById("usage-addon").textContent =
    `${money.format(usageLow)}–${money.format(usageHigh)}`;
  document.getElementById("usage-total").textContent =
    `${money.format(target + usageLow)}–${money.format(target + usageHigh)}`;

  document.getElementById("exclusive-base").textContent = money.format(target);
  document.getElementById("exclusive-addon").textContent =
    `${money.format(exclusiveLow)}–${money.format(exclusiveHigh)}`;
  document.getElementById("exclusive-total").textContent =
    `${money.format(target + exclusiveLow)}–${money.format(target + exclusiveHigh)}`;

  const ratio = views / followers;
  let note = "Your estimate uses a smooth audience-size anchor and broad benchmark guardrails.";
  if (ratio >= 0.50) {
    note = "Your reach is strong relative to audience size, so performance moves your estimate upward within the benchmark range.";
  } else if (ratio < 0.15) {
    note = "Your recent reach is modest relative to audience size, so performance lowers the estimate without creating an abrupt tier penalty.";
  }

  document.getElementById("result-note").textContent =
    `${note} Rates are shown in ${marketCurrency.currency}, based on your selected audience market.`;


  const pricingKitData = {
    generatedAt: new Date().toISOString(),
    platform,
    market,
    marketLabel: document.getElementById("market").selectedOptions[0].text,
    niche,
    nicheLabel: document.getElementById("niche").selectedOptions[0].text,
    followers,
    views,
    engagement,
    content,
    contentLabel: document.getElementById("content-type").selectedOptions[0].text,
    currency: marketCurrency.currency,
    locale: marketCurrency.locale,
    minimum,
    target,
    premium,
    usageLow,
    usageHigh,
    exclusiveLow,
    exclusiveHigh,
    note
  };
  localStorage.setItem("brandRatePricingKitData", JSON.stringify(pricingKitData));

  document.getElementById("upgrade-price").textContent =
    money.format(marketCurrency.paidPrice);
  document.getElementById("upgrade-button").dataset.market = market;

  results.classList.remove("hidden");
  results.scrollIntoView({ behavior: "smooth", block: "start" });
});

document.getElementById("upgrade-button").addEventListener("click", () => {
  const data = localStorage.getItem("brandRatePricingKitData");
  if (!data) {
    alert("Calculate your brand rate first so we can personalise your Creator Pricing Kit.");
    return;
  }
  window.location.href = "pricing-kit.html?mode=preview";
});

document.getElementById("year").textContent = new Date().getFullYear();
