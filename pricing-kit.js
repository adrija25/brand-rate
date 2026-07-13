const raw = localStorage.getItem("brandRatePricingKitData");
if (!raw) {
  window.location.replace("index.html");
} else {
  const data = JSON.parse(raw);
  const config = {
    india:{price:499}, us:{price:9}, uk:{price:7}, canada:{price:12},
    australia:{price:12}, europe:{price:8}, global:{price:9}, other:{price:9}
  };
  const money = new Intl.NumberFormat(data.locale, {
    style:"currency", currency:data.currency, maximumFractionDigits:0
  });
  const fmt = n => money.format(n);
  const range = (a,b) => `${fmt(a)}–${fmt(b)}`;
  const round = n => {
    if (data.currency === "INR") return Math.max(500, Math.round(n/100)*100);
    if (n < 100) return Math.max(10, Math.round(n/5)*5);
    if (n < 1000) return Math.round(n/25)*25;
    return Math.round(n/50)*50;
  };

  document.getElementById("profile-summary").textContent =
    `${data.platform} · ${data.marketLabel} audience · ${data.nicheLabel} · ${data.followers.toLocaleString()} followers/subscribers · ${data.contentLabel}`;
  document.getElementById("min-rate").textContent = fmt(data.minimum);
  document.getElementById("target-rate").textContent = fmt(data.target);
  document.getElementById("premium-rate").textContent = fmt(data.premium);
  document.getElementById("method-note").textContent =
    `Prepared from the calculator result saved for this profile. Rates are directional negotiation estimates in ${data.currency}, not guaranteed market rates.`;

  const productPrice = money.format(config[data.market]?.price ?? 9);
  document.getElementById("unlock-copy").textContent =
    `${productPrice} one-time · deliverable rates, add-on guidance, packages and negotiation scripts`;

  /*
    SECURITY ARCHITECTURE:
    Preview mode never renders paid recommendations into the visible DOM.
    renderPaidKit() is reserved for a future verified payment session.
    A URL parameter is deliberately NOT accepted as proof of payment.
    The payment build must call a server-side verification endpoint before this function runs.
  */
  function renderPaidKit() {
    const deliverableFactors = data.platform === "YouTube"
      ? [["Short integration",.55],["Standard integration",.78],["Dedicated video",1]]
      : [["Story set",.45],["Static/carousel post",.72],["Reel / short-form video",1]];

    document.getElementById("deliverables").innerHTML = deliverableFactors.map(([name,factor]) =>
      `<div class="rate-row"><span>${name}</span><strong>${fmt(round(data.target*factor))}</strong></div>`
    ).join("");

    document.getElementById("usage-rate").textContent = range(data.usageLow,data.usageHigh);
    document.getElementById("exclusive-rate").textContent = range(data.exclusiveLow,data.exclusiveHigh);

    const packages = [
      ["Starter collaboration", round(data.target*.72), "One lighter-format sponsored deliverable"],
      ["Core campaign", data.target, `One ${data.contentLabel.toLowerCase()} at your target rate`],
      ["Campaign bundle", round(data.target*1.8), "Two coordinated sponsored deliverables; rights priced separately"]
    ];
    document.getElementById("packages").innerHTML = packages.map(([name,price,desc]) =>
      `<div class="rate-row"><span><strong>${name}</strong><br><span class="small">${desc}</span></span><strong>${fmt(price)}</strong></div>`
    ).join("");

    document.getElementById("rate-script").textContent =
      `Thanks for reaching out. For this scope, my rate starts at ${fmt(data.target)} for the sponsored content deliverable. If you can share the full brief, timeline, usage requirements and exclusivity terms, I can confirm the final quote.`;
    document.getElementById("budget-script").textContent =
      `Thanks for sharing the budget. My current target rate for this deliverable is ${fmt(data.target)}. If the budget is fixed, I’m happy to discuss a reduced scope rather than adding the full deliverables and rights at a lower fee.`;
    document.getElementById("usage-script").textContent =
      `My base content fee covers the agreed organic deliverable. Paid usage is licensed separately. For an initial 30-day paid usage period, my suggested add-on is ${range(data.usageLow,data.usageHigh)}, depending on placement and campaign scope.`;

    document.getElementById("preview-content").style.display = "none";
    document.querySelectorAll(".preview-content").forEach(el => el.style.display = "none");
    const paid = document.getElementById("paid-content");
    paid.style.display = "block";
    paid.setAttribute("aria-hidden", "false");
  }

  // Intentionally no preview unlock. renderPaidKit() must only be called after verified payment.
}