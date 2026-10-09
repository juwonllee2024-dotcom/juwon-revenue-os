import type {Customer} from '../domain/schema';

export const escapeHtml = (value: string): string =>
  value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    };
    return entities[character];
  });

export const renderBeautyLanding = (customer: Customer): string => {
  const name = escapeHtml(customer.businessName);
  const booking = customer.bookingUrl ? escapeHtml(customer.bookingUrl) : '#contact';
  const services = customer.services
    .map((service) => `<li><strong>${escapeHtml(service)}</strong><span>맞춤 상담 후 진행합니다.</span></li>`)
    .join('');

  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${name}</title><meta name="description" content="${name}의 프리미엄 뷰티·웰니스 케어"><link rel="stylesheet" href="styles.css"></head>
<body><header><a class="brand" href="#top">${name}</a><a class="button small" href="${booking}">예약하기</a></header>
<main id="top"><section class="hero"><p class="eyebrow">BEAUTY · WELLNESS</p><h1>당신의 자연스러운 빛을<br>더 선명하게.</h1><p>${escapeHtml(customer.tone)} 경험을 제공하는 ${escapeHtml(customer.niche)} 전문 스튜디오입니다.</p><a class="button" href="${booking}">지금 예약하기</a></section>
<section><p class="eyebrow">SIGNATURE CARE</p><h2>서비스</h2><ul class="services">${services}</ul></section>
<section class="proof"><p class="eyebrow">CLIENT PROOF</p><h2>고객 후기</h2><blockquote>“상담부터 마무리까지 세심했고, 제가 원했던 변화를 정확히 이해해 주셨어요.”</blockquote><p class="notice">데모 후기입니다. 실제 공개 전 고객의 검증된 후기로 교체됩니다.</p></section>
<section id="contact" class="contact"><p class="eyebrow">RESERVATION</p><h2>오늘, 나를 위한 시간을 예약하세요.</h2><p>${escapeHtml(customer.contact)}</p><a class="button" href="${booking}">예약하기</a></section></main>
<footer><span>${name}</span><span>개인정보 처리 안내 · 고객 정보는 예약 상담 목적으로만 사용됩니다.</span></footer></body></html>`;
};

export const beautyLandingCss = `:root{--ink:#171411;--paper:#f7f3ed;--gold:#c8a76b;--line:#d9d0c4}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font-family:Arial,"Noto Sans KR",sans-serif}header{position:sticky;top:0;display:flex;justify-content:space-between;align-items:center;padding:20px 6vw;background:#f7f3ede8;backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}.brand{color:inherit;text-decoration:none;font-weight:800;letter-spacing:.02em}main,footer{max-width:1180px;margin:auto}section{padding:96px 6vw;border-bottom:1px solid var(--line)}.hero{min-height:72vh;display:flex;flex-direction:column;justify-content:center}.eyebrow{font-size:12px;letter-spacing:.22em;color:#785f35;font-weight:700}h1{font-family:Georgia,serif;font-size:clamp(48px,8vw,108px);line-height:.96;margin:22px 0;letter-spacing:-.05em}h2{font-family:Georgia,serif;font-size:clamp(38px,5vw,68px);margin:16px 0 36px}.hero>p:not(.eyebrow){max-width:620px;font-size:20px;line-height:1.7}.button{display:inline-flex;width:max-content;margin-top:24px;padding:16px 24px;background:var(--ink);color:white;text-decoration:none;border-radius:999px;font-weight:700}.button.small{margin:0;padding:10px 16px}.services{list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}.services li{padding:26px;border:1px solid var(--line);border-radius:18px;display:grid;gap:10px}.services span,.notice{color:#665f57;font-size:14px}.proof blockquote{font-family:Georgia,serif;font-size:clamp(28px,4vw,52px);line-height:1.3;margin:0;max-width:900px}.contact{text-align:center}.contact .button{margin-left:auto;margin-right:auto}footer{padding:36px 6vw;display:flex;justify-content:space-between;gap:20px;font-size:12px;color:#665f57}@media(max-width:640px){section{padding:68px 24px}header{padding:16px 24px}footer{flex-direction:column}}`;
