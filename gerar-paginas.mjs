// Constrói as 4 landing pages da LinfaFlow em versão que passa na política do Google.
//
// ⚠️ POR QUE NÃO É REMENDO DA PÁGINA DO FORNECEDOR. Medido no HTML servido: 36 ocorrências
// proibidas em 34 mil caracteres de texto — e não são adjetivos, é a ESPINHA do argumento:
// "reduced or completely eliminated their diuretic medications", "canceled the vein procedures
// their doctor had recommended", "chronic venous insufficiency", "Over 90% report... within the
// first week", "Top MD" (9x), "Vascular Drowning Syndrome" (3x), teoria da conspiração (4x) e
// até "topical cream" — que contradiz o próprio produto (é gota sublingual). Find/replace sobre
// isso deixa a página incoerente e ainda por cima não-conforme. O corpo aqui é escrito do zero
// a partir do que SOBREVIVEU às duas revisões adversariais; as IMAGENS do fornecedor são
// reusadas (elas não têm problema de política).
//
// O que muda entre as 4 páginas é SÓ o primeiro bloco — que é exatamente o teste que o dono
// pediu (congruência busca → anúncio → página).
import fs from 'node:fs';
import path from 'node:path';

const rsas = JSON.parse(fs.readFileSync('rsa_final.json', 'utf8'));
const kit = JSON.parse(fs.readFileSync('v2_kit-conformidade.json', 'utf8'));
const bloco = (p) => (kit.blocos_html || []).find((b) => b.nome.startsWith(p))?.html ?? '';
const A = bloco('A'), B1 = bloco('B1'), B2 = bloco('B2'), C = bloco('C'), D = bloco('D'), F = bloco('F');

const SLUG = { tornozelos: 'ankle-swelling', retencao: 'water-retention', rosto: 'puffy-face', suplemento: 'lymphatic-support' };
const CHECKOUT = 'https://cc.linfaflow.com/dtcnew/checkout.php?hid=b2lkPW9mZl8wMDQyMzQ2JmFpZD1hZmZfMjkxNDkxOA%3D%3D&affid=aff_2914918';
const IMGS = fs.readdirSync('base/assets').filter((f) => /\.webp$/i.test(f)).sort();
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ⚠️ TODO CTA leva data-pdc-aff-param="subid": é o carimbo que o tracking.js usa para decorar
// o link com o visitor_id. Sem ele a venda volta pelo postback do H&W sem casar a sessão, e a
// conversão nunca chega ao Google Ads.
const cta = (rotulo) => `${B2}
<p style="text-align:center;margin:0 0 30px"><a class="cta" data-pdc-aff-param="subid" href="${CHECKOUT}"
 style="display:inline-block;background:#1c7a4a;color:#fff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-weight:700;font-size:19px;padding:16px 30px;border-radius:6px">${esc(rotulo)}</a></p>`;

const CSS = `*{box-sizing:border-box}body{margin:0;background:#fff;color:#1a1a1a;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.7}
.wrap{max-width:680px;margin:0 auto;padding:0 20px}
.topbar{background:#12354d;color:#fff;padding:12px 0;font-family:Arial,Helvetica,sans-serif}
.masthead{font-weight:800;letter-spacing:.5px;font-size:18px}.masthead span{font-weight:400;opacity:.85}
h1{font-size:32px;line-height:1.25;margin:22px 0 0}
h2{font-family:Arial,Helvetica,sans-serif;font-size:23px;line-height:1.3;margin:34px 0 10px}
h3{font-family:Arial,Helvetica,sans-serif;font-size:18px;margin:20px 0 6px}
img{max-width:100%;height:auto;border-radius:6px;display:block}
figure{margin:18px 0}
.byline{font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#666;margin-top:10px}
.ing{display:flex;gap:14px;align-items:flex-start;margin:16px 0;padding-bottom:14px;border-bottom:1px solid #eee}
.ing img{width:92px;flex:0 0 92px}
.ing p{margin:4px 0 0;font-size:16px}
.faq dt{font-family:Arial,Helvetica,sans-serif;font-weight:700;margin-top:16px}
.faq dd{margin:4px 0 0}
footer{margin-top:40px;padding:24px 0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#444}
footer a{color:#12354d}
@media(max-width:600px){h1{font-size:26px}body{font-size:17px}}`;

// Âncoras exigidas pelos sitelinks de CADA ad group. Âncora morta = sitelink que rola pro topo
// e vira clique pago sem destino próprio.
const ANCORAS_MECANISMO = ['why-movement', 'lymph-basics', 'no-pump', 'how-lymph-moves'];
const ANCORAS_RITUAL = ['faq', 'daily-ritual', 'the-ritual', 'compare'];

const BOTANICOS = [
  ['Cleavers (aerial parts)', 'Traditionally called the &ldquo;lymphatic broom&rdquo; in Western herbalism &mdash; a traditional name, not a description of what it does in the body.'],
  ['Red clover blossom', 'A traditional botanical long used in Western herbal practice.'],
  ['Stillingia root', 'A root used in traditional Western herbal formulations.'],
  ['Prickly ash bark', 'A bark with a long history of traditional use.'],
];

fs.rmSync('dist', { recursive: true, force: true });
const resumo = [];

for (const rsa of rsas) {
  const slug = SLUG[rsa.chave];
  const pb = rsa.primeiro_bloco;
  const ancoras = (rsa.sitelinks || []).map((s) => String(s.ancora).replace('#', ''));
  const idMecanismo = ancoras.find((a) => ANCORAS_MECANISMO.includes(a)) || 'why-movement';
  const idRitual = ancoras.find((a) => ANCORAS_RITUAL.includes(a)) || 'the-ritual';

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(pb.title_tag)}</title>
<meta name="description" content="${esc(pb.subheadline).slice(0, 155)}">
<meta name="robots" content="noindex">
<style>${CSS}</style>
</head>
<body>
${A}
<header class="topbar"><div class="wrap"><div class="masthead">National Health <span>News</span></div></div></header>

<div class="wrap">
  <h1>${esc(pb.h1)}</h1>
  <p class="byline">Sponsored content produced by the advertiser &middot; Advertisement</p>
  <p style="font-size:20px;line-height:1.6;color:#333">${esc(pb.subheadline)}</p>
</div>

<div class="wrap">
${B1}
${D}
<p id="pdc-nao-substitui" style="max-width:680px;margin:12px auto;padding:10px 12px;border-left:3px solid #c9a94f;background:#fffdf6;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.55;color:#1a1a1a;">${esc(pb.nao_substitui)}</p>
</div>

<div class="wrap">
  <figure><img src="./assets/${IMGS[0]}" alt="Legs and feet at the end of the day"></figure>

  <h2 id="how-it-works">What this page is about</h2>
  <p>By late afternoon, shoes feel tighter than they did at breakfast. Socks leave a line that is still there an hour after you take them off. Rings that slid on easily in the morning have to be worked off at night. If that is your day, you are not imagining it, and you are not alone.</p>
  <p>This page describes a dietary supplement made of four traditional botanicals, taken as two drops under the tongue each morning. It is an advertisement. It is not medical advice, and it does not describe a treatment for any condition.</p>

  <h2 id="${idMecanismo}">How lymph actually moves</h2>
  <figure><img src="./assets/${IMGS[1] || IMGS[0]}" alt="Illustration of fluid movement"></figure>
  <p>Blood has a central pump: the heart. Lymph does not. Lymphatic vessels have their own small muscular walls that contract, and beyond that the system relies on ordinary things &mdash; walking, breathing, the squeeze of muscles as you move &mdash; to keep fluid moving along.</p>
  <p>That is the whole reason movement, elevation and hydration are the standard advice you have already heard. This product is not a replacement for any of it. It is a botanical supplement intended to be part of a daily routine.</p>

  <h2 id="botanicals">The four botanicals</h2>
  ${BOTANICOS.map(([n, d], i) => `<div class="ing"><img src="./assets/${IMGS[(i + 2) % IMGS.length]}" alt="${esc(n)}"><div><h3>${n}</h3><p>${d}</p></div></div>`).join('\n  ')}
  <p style="font-size:15px;color:#555">The full ingredient list and amounts are shown on the product label on the seller&rsquo;s website.</p>

  <h2 id="${idRitual}">The daily routine</h2>
  <p>Two drops under the tongue, once in the morning. It takes about thirty seconds and does not need to be taken with food. There is nothing to swallow and nothing to prepare.</p>
  <p>People choose a liquid for simple reasons: it is quick, it is easy to remember, and it is easier for some people than capsules. Whether you keep using it is a matter of whether the routine fits your morning.</p>

  ${cta('See the Full Ingredient List')}

  <h2>What this is &mdash; and what it is not</h2>
  <p><strong>It is</strong> a dietary supplement of four traditional botanicals, sold by the manufacturer on its own website.</p>
  <p><strong>It is not</strong> a medicine, and it is not a substitute for compression garments, manual lymphatic drainage, prescribed medication, or advice from your own healthcare provider. If you already use any of those, keep using them and talk to your provider before adding anything new &mdash; particularly if you take diuretics, blood thinners or blood sugar medication.</p>

  <h2 id="faq">Common questions</h2>
  <dl class="faq">
    <dt>How is it taken?</dt><dd>Two drops under the tongue in the morning.</dd>
    <dt>What does it taste like?</dt><dd>It is a herbal liquid with a plant-forward taste. Most people take it with water.</dd>
    <dt>Can I take it with my current medication?</dt><dd>Ask your doctor or pharmacist first, especially with diuretics, anticoagulants or blood sugar medication. That is the honest answer and the only one we will give.</dd>
    <dt>How long does a bottle last?</dt><dd>At two drops a day, the seller states the supply length on the product page.</dd>
    <dt>What about returns?</dt><dd>The seller&rsquo;s refund policy and terms are on its own checkout page, and they are the terms that apply.</dd>
  </dl>

  <h2 id="compare">Where a daily routine fits</h2>
  <p>Compression garments, professional lymphatic massage and the advice of your own clinician each do something a supplement does not do. This is a botanical product for daily use, and it is meant to sit alongside what you already do &mdash; not to replace it.</p>

  ${cta('Go to the Official Product Page')}
${C}
</div>

<footer><div class="wrap">
${F}
<p style="margin-top:14px"><a href="/privacy">Privacy Policy</a> &middot; <a href="/terms">Terms of Use</a> &middot; <a href="/contact">Contact</a></p>
</div></footer>
</body>
</html>`;

  const dir = path.join('dist', slug);
  fs.mkdirSync(path.join(dir, 'assets'), { recursive: true });
  for (const a of fs.readdirSync('base/assets')) fs.copyFileSync(path.join('base/assets', a), path.join(dir, 'assets', a));
  fs.writeFileSync(path.join(dir, 'index.html'), html);

  // Conferência final: nada proibido, e todas as âncoras dos sitelinks têm que EXISTIR.
  const PROIBIDO = ['Top MD', 'Andy Salazar', 'Vascular Drowning', 'edema', 'miracle', 'no pump of its own',
    'Beyond Compression', 'beyond compression', 'Stop Buying', 'Circulation Spark', 'Deep Pathway',
    'venous insufficiency', 'eliminated their diuretic', 'canceled the vein', 'topical cream', '$150',
    'labs look normal', 'no test measures', 'Master Health Research', 'cure', 'guarantee'];
  const sobrou = PROIBIDO.filter((p) => html.toLowerCase().includes(p.toLowerCase()));
  const ancorasFaltando = ancoras.filter((a) => !html.includes(`id="${a}"`));
  resumo.push({ slug, kb: Math.round(Buffer.byteLength(html) / 1024), sobrou, ancorasFaltando, ctas: (html.match(/data-pdc-aff-param/g) || []).length });
}

// Páginas legais + raiz. Sem elas o rodapé linka pra 404 e o revisor vê site inacabado.
const legal = (titulo, corpo, tituloCompleto) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${tituloCompleto || (titulo + " | National Health News")}</title>
<meta name="robots" content="noindex"><style>${CSS}</style></head><body>
<header class="topbar"><div class="wrap"><div class="masthead">National Health <span>News</span></div></div></header>
<div class="wrap"><h1>${titulo}</h1>${corpo}
<p style="margin-top:26px"><a href="/">Home</a></p></div></body></html>`;

fs.writeFileSync('dist/index.html', legal('National Health News', `
<p>This site publishes <strong>sponsored advertising content</strong> about consumer wellness products. Every page here is an advertisement, not editorial reporting and not medical advice.</p>
<p>We earn a commission when a reader buys through a link on our pages. That commission never changes the price you pay.</p>
<p style="font-size:14px;color:#555">These statements have not been evaluated by the Food and Drug Administration. Products discussed are not intended to diagnose, treat, cure, or prevent any disease. Talk to a healthcare professional before starting any supplement.</p>
<p><a href="/privacy">Privacy Policy</a> &middot; <a href="/terms">Terms of Use</a> &middot; <a href="/contact">Contact</a></p>`, 'National Health News'));

fs.writeFileSync('dist/privacy.html', legal('Privacy Policy', `
<p>We collect limited technical information when you visit: pages viewed, referring source, approximate location derived from IP address, and identifiers passed by advertising platforms in the page address. We use it to measure which advertisements work.</p>
<p>We use cookies and similar storage for that measurement, including analytics and advertising measurement tools. We do not sell personal information.</p>
<p>If you are a resident of California, Colorado, Connecticut, Virginia or another US state with privacy legislation, you may request access to or deletion of your information, and you may opt out of the sharing of personal information for cross-context behavioural advertising. Write to us using the address on the Contact page.</p>
<p>Purchases are completed on the seller&rsquo;s own website. The seller&rsquo;s privacy policy governs any information you provide at checkout.</p>`));

fs.writeFileSync('dist/terms.html', legal('Terms of Use', `
<p>The content on this site is advertising. It is provided for general information only and is not medical advice, diagnosis or treatment. Always seek the advice of your physician or another qualified health provider with any questions about a medical condition.</p>
<p>We are an independent advertising publisher. We are not the manufacturer or the seller of any product described here, and we earn a commission on purchases made through our links.</p>
<p>Statements about dietary supplements on this site have not been evaluated by the Food and Drug Administration. Products described are not intended to diagnose, treat, cure or prevent any disease. Individual experiences vary.</p>
<p>Product prices, availability, refund terms and guarantees are set by the seller and are shown on the seller&rsquo;s checkout page. Those terms, not ours, apply to your purchase.</p>`));

fs.writeFileSync('dist/contact.html', legal('Contact', `
<p>This site is an advertising publisher. For questions about the content of an advertisement on this site, write to the address below.</p>
<p><strong>Email:</strong> <span id="pdc-contact-email">[PREENCHER: e-mail real de contato]</span></p>
<p><strong>Postal address:</strong> <span>[PREENCHER: endereço postal real]</span></p>
<p>For questions about an <strong>order, shipping, refund or the product itself</strong>, contact the seller directly through the support details on its own website. We do not process orders and cannot access order information.</p>`));

fs.writeFileSync('dist/404.html', legal('Page Not Found', `
<p>The page you asked for is not here. This site publishes a small number of sponsored advertising pages.</p>
<p><a href="/">Go to the home page</a></p>`));

console.log('PAGINAS:');
for (const r of resumo) console.log(`  /${r.slug}/  ${r.kb} KB · CTAs rastreados: ${r.ctas} · proibidos: ${r.sobrou.length ? r.sobrou.join(', ') : 'nenhum'} · ancoras faltando: ${r.ancorasFaltando.length ? r.ancorasFaltando.join(', ') : 'nenhuma'}`);
console.log('legais: index.html, privacy.html, terms.html, contact.html');
