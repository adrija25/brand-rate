const params = new URLSearchParams(location.search);
const accessToken = params.get("access");
let kitId = params.get("kit");
let data;

const statusEl = () => document.getElementById("checkout-status");
const setStatus = (m) => { const el=statusEl(); if(el) el.textContent=m; };

async function getJson(url, options){const r=await fetch(url,options);const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"Request failed");return d;}

async function ensureKit(){
  if(accessToken){const d=await getJson(`/api/access/${encodeURIComponent(accessToken)}`);kitId=d.kitId;return {payload:d.payload,paid:true};}
  if(kitId){const d=await getJson(`/api/kits/${encodeURIComponent(kitId)}`);return {payload:d.payload,paid:d.status==="paid"};}
  const raw=localStorage.getItem("brandRatePricingKitData"); if(!raw) throw new Error("No pricing kit found. Calculate your rate first.");
  const payload=JSON.parse(raw); const d=await getJson("/api/kits",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({payload})});
  kitId=d.kitId; history.replaceState(null,"",`pricing-kit.html?kit=${encodeURIComponent(kitId)}`); return {payload,paid:false};
}

function render(data, paid){
  const config={india:{price:499},us:{price:9},uk:{price:7},canada:{price:12},australia:{price:12},europe:{price:8},global:{price:9},other:{price:9}};
  const money=new Intl.NumberFormat(data.locale,{style:"currency",currency:data.currency,maximumFractionDigits:0}); const fmt=n=>money.format(n); const range=(a,b)=>`${fmt(a)}–${fmt(b)}`;
  const round=n=>data.currency==="INR"?Math.max(500,Math.round(n/100)*100):n<100?Math.max(10,Math.round(n/5)*5):n<1000?Math.round(n/25)*25:Math.round(n/50)*50;
  document.getElementById("profile-summary").textContent=`${data.platform} · ${data.marketLabel} audience · ${data.nicheLabel} · ${data.followers.toLocaleString()} followers/subscribers · ${data.contentLabel}`;
  document.getElementById("min-rate").textContent=fmt(data.minimum);document.getElementById("target-rate").textContent=fmt(data.target);document.getElementById("premium-rate").textContent=fmt(data.premium);
  document.getElementById("method-note").textContent=`Prepared from the calculator result saved for this profile. Rates are directional negotiation estimates in ${data.currency}, not guaranteed market rates.`;
  document.getElementById("unlock-copy").textContent=`${money.format(config[data.market]?.price??9)} one-time · deliverable rates, add-on guidance, packages and negotiation scripts`;
  if(!paid)return;
  const factors=data.platform==="YouTube"?[["Short integration",.55],["Standard integration",.78],["Dedicated video",1]]:[["Story set",.45],["Static/carousel post",.72],["Reel / short-form video",1]];
  document.getElementById("deliverables").innerHTML=factors.map(([n,f])=>`<div class="rate-row"><span>${n}</span><strong>${fmt(round(data.target*f))}</strong></div>`).join("");
  document.getElementById("usage-rate").textContent=range(data.usageLow,data.usageHigh);document.getElementById("exclusive-rate").textContent=range(data.exclusiveLow,data.exclusiveHigh);
  const packs=[["Starter collaboration",round(data.target*.72),"One lighter-format sponsored deliverable"],["Core campaign",data.target,`One ${data.contentLabel.toLowerCase()} at your target rate`],["Campaign bundle",round(data.target*1.8),"Two coordinated sponsored deliverables; rights priced separately"]];
  document.getElementById("packages").innerHTML=packs.map(([n,v,d])=>`<div class="rate-row"><span><strong>${n}</strong><br><span class="small">${d}</span></span><strong>${fmt(v)}</strong></div>`).join("");
  document.getElementById("rate-script").textContent=`Thanks for reaching out. For this scope, my rate starts at ${fmt(data.target)} for the sponsored content deliverable. If you can share the full brief, timeline, usage requirements and exclusivity terms, I can confirm the final quote.`;
  document.getElementById("budget-script").textContent=`Thanks for sharing the budget. My current target rate for this deliverable is ${fmt(data.target)}. If the budget is fixed, I’m happy to discuss a reduced scope rather than adding the full deliverables and rights at a lower fee.`;
  document.getElementById("usage-script").textContent=`My base content fee covers the agreed organic deliverable. Paid usage is licensed separately. For an initial 30-day paid usage period, my suggested add-on is ${range(data.usageLow,data.usageHigh)}, depending on placement and campaign scope.`;
  document.querySelectorAll(".preview-content").forEach(el=>el.style.display="none"); const el=document.getElementById("paid-content");el.style.display="block";el.setAttribute("aria-hidden","false");
}

async function startRazorpay(){
  const email=document.getElementById("buyer-email").value.trim(); if(!email){setStatus("Enter your email before payment.");return;} setStatus("Preparing secure Razorpay checkout…");
  try{const order=await getJson("/api/payments/razorpay/create",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({kitId,email})});
    new Razorpay({key:order.keyId,amount:order.amount,currency:order.currency,name:"Brand Rate",description:"Creator Pricing Kit",image:"/brand-rate-icon.svg",order_id:order.orderId,prefill:{email},theme:{color:"#7257ff"},handler:async response=>{setStatus("Verifying payment…");const d=await getJson("/api/payments/razorpay/verify",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({kitId,...response})});location.href=`pricing-kit.html?access=${encodeURIComponent(d.accessToken)}`;}}).open();
  }catch(e){setStatus(e.message)}
}

async function startPayPal(){
  const email=document.getElementById("buyer-email").value.trim(); if(!email){setStatus("Enter your email before payment.");return;} setStatus("Preparing PayPal…");
  try{const d=await getJson("/api/payments/paypal/create",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({kitId,email})});
    const sdk=document.createElement("script");sdk.src=`https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(d.clientId)}&currency=USD&components=buttons`;sdk.onload=()=>{document.getElementById("paypal-checkout-zone").innerHTML="";paypal.Buttons({createOrder:()=>d.orderId,onApprove:async({orderID})=>{setStatus("Verifying PayPal payment…");const out=await getJson("/api/payments/paypal/capture",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({kitId,orderId:orderID})});location.href=`pricing-kit.html?access=${encodeURIComponent(out.accessToken)}`;},onError:e=>setStatus(e.message||"PayPal checkout failed")}).render("#paypal-checkout-zone")};document.head.appendChild(sdk);
  }catch(e){setStatus(e.message)}
}

(async()=>{try{const kit=await ensureKit();data=kit.payload;render(data,kit.paid&&!!accessToken);document.getElementById("razorpay-checkout")?.addEventListener("click",startRazorpay);document.getElementById("paypal-start")?.addEventListener("click",startPayPal);}catch(e){alert(e.message);location.href="index.html"}})();
