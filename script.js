const form = document.getElementById("rate-form");
const results = document.getElementById("results");
const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

const platformConfig = {
  instagram: { reachWeight: 1.00, tierWeight: 1.00 },
  tiktok: { reachWeight: 0.95, tierWeight: 0.90 },
  youtube: { reachWeight: 1.45, tierWeight: 1.55 }
};

const contentFactor = {
  story: 0.50,
  post: 0.80,
  short: 1.20,
  integration: 1.80,
  dedicated: 3.10
};

const marketCPM = {
  india: [250, 650],
  us: [900, 2200],
  uk: [750, 1800],
  canada: [700, 1650],
  australia: [700, 1700],
  europe: [550, 1400],
  global: [450, 1150],
  other: [300, 800]
};

const marketFloorFactor = {
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

function getTier(followers) {
  if (followers < 10000) return { name: "Nano creator", floor: 1500 };
  if (followers < 50000) return { name: "Micro creator", floor: 5000 };
  if (followers < 100000) return { name: "Mid-tier creator", floor: 10000 };
  if (followers < 500000) return { name: "Established creator", floor: 25000 };
  return { name: "Macro creator", floor: 75000 };
}

function roundRate(value) {
  if (value < 5000) return Math.max(500, Math.round(value / 100) * 100);
  if (value < 25000) return Math.round(value / 500) * 500;
  return Math.round(value / 1000) * 1000;
}

function engagementModifier(rate) {
  if (rate < 1.5) return 0.85;
  if (rate < 3) return 1.00;
  if (rate < 5) return 1.12;
  if (rate < 8) return 1.25;
  return 1.35;
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

  const platformData = platformConfig[platform];
  const tier = getTier(followers);
  const [lowCPM, highCPM] = marketCPM[market];

  const reachLow = (views / 1000) * lowCPM * platformData.reachWeight;
  const reachHigh = (views / 1000) * highCPM * platformData.reachWeight;
  const reachMid = (reachLow + reachHigh) / 2;

  const tierAnchor =
    tier.floor *
    marketFloorFactor[market] *
    platformData.tierWeight;

  // Hybrid model: performance/reach is the main anchor, while creator tier
  // supplies a floor and established-audience value.
  const hybridBase = (reachMid * 0.65) + (tierAnchor * 0.35);

  const adjustedTarget =
    hybridBase *
    contentFactor[content] *
    engagementModifier(engagement) *
    nicheFactor[niche];

  const target = roundRate(Math.max(adjustedTarget, tierAnchor * contentFactor[content] * 0.75));
  const minimum = roundRate(target * 0.75);
  const premium = roundRate(target * 1.50);

  const usageLow = roundRate(target * 0.30);
  const usageHigh = roundRate(target * 0.50);
  const exclusiveLow = roundRate(target * 0.25);
  const exclusiveHigh = roundRate(target * 0.50);

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

  const reachRatio = views / followers;
  let performanceNote = "Your estimate blends expected reach with a creator-tier pricing floor.";
  if (reachRatio >= 0.5) {
    performanceNote = "Your reach is strong relative to your audience size, so performance has meaningful weight in this estimate.";
  } else if (reachRatio < 0.15) {
    performanceNote = "Your recent reach is modest relative to audience size, so the creator-tier floor helps prevent a single low-performance period from dominating the estimate.";
  }

  document.getElementById("result-note").textContent =
    `${tier.name}. ${performanceNote}`;

  results.classList.remove("hidden");
  results.scrollIntoView({ behavior: "smooth", block: "start" });
});

document.getElementById("upgrade-button").addEventListener("click", () => {
  alert("The ₹499 Creator Pricing Kit checkout and automatic delivery flow will be connected after V3 benchmark testing. No payment is collected on this preview build.");
});

document.getElementById("year").textContent = new Date().getFullYear();
