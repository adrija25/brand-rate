const form = document.getElementById("rate-form");
const results = document.getElementById("results");
const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const platformFactor = { instagram: 1, tiktok: 0.9, youtube: 1.55 };
const contentFactor = { story: 0.45, post: 0.8, short: 1.2, integration: 1.75, dedicated: 3.2 };
const marketFactor = { india: 1, us: 2.9, uk: 2.35, canada: 2.2, australia: 2.25, europe: 1.9, global: 1.55, other: 1.15 };

function roundRate(value) {
  if (value < 5000) return Math.max(500, Math.round(value / 100) * 100);
  return Math.round(value / 500) * 500;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const platform = document.getElementById("platform").value;
  const market = document.getElementById("market").value;
  const followers = Number(document.getElementById("followers").value);
  const views = Number(document.getElementById("views").value);
  const engagementInput = document.getElementById("engagement").value;
  const engagement = engagementInput === "" ? 3 : Number(engagementInput);
  const content = document.getElementById("content").value;

  if (!followers || !views || followers < 1 || views < 1 || engagement < 0 || engagement > 100) return;

  const audienceBase = followers * 0.18;
  const performanceBase = views * 0.72;
  const engagementFactor = Math.min(1.65, Math.max(0.75, 1 + ((engagement - 3) * 0.08)));
  const rawTarget = Math.max(1000, (audienceBase * 0.35 + performanceBase * 0.65) * platformFactor[platform] * contentFactor[content] * engagementFactor * marketFactor[market]);

  const target = roundRate(rawTarget);
  const minimum = roundRate(target * 0.72);
  const premium = roundRate(target * 1.5);
  const usageAddon = roundRate(target * 0.30);
  const exclusiveAddon = roundRate(target * 0.25);
  const usageTotal = target + usageAddon;
  const exclusiveTotal = target + exclusiveAddon;

  document.getElementById("minimum").textContent = money.format(minimum);
  document.getElementById("target").textContent = money.format(target);
  document.getElementById("premium").textContent = money.format(premium);
  document.getElementById("usage-base").textContent = money.format(target);
  document.getElementById("usage-addon").textContent = money.format(usageAddon);
  document.getElementById("usage-total").textContent = money.format(usageTotal);
  document.getElementById("exclusive-base").textContent = money.format(target);
  document.getElementById("exclusive-addon").textContent = money.format(exclusiveAddon);
  document.getElementById("exclusive-total").textContent = money.format(exclusiveTotal);
  document.getElementById("result-note").textContent =
    views > followers * 0.5
      ? "Your average reach is strong relative to your audience size. Performance can support a stronger negotiation position."
      : "Use this as a starting point and strengthen your quote with audience fit, conversion evidence and past campaign results.";

  results.classList.remove("hidden");
  results.scrollIntoView({ behavior: "smooth", block: "start" });
});

document.getElementById("upgrade-button").addEventListener("click", () => {
  alert("The ₹499 payment and automatic PDF delivery flow will be connected in the payment phase. This preview does not collect money.");
});

document.getElementById("year").textContent = new Date().getFullYear();
