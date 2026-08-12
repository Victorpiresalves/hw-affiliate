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
const A = bloco('A'), B1 = bloco('B1'), B2 = bloco('B2'), C = bloco('C'), D = bloco('D');

// Contatos. ⚠️ Os do VENDEDOR são REAIS, tirados do material do próprio fornecedor (rodapé e bloco
// de garantia do Advertorial 3). É o único canal que resolve pedido, envio e reembolso — a compra
// acontece no site dele, não aqui, e mandar o leitor para nós nesse caso é mandá-lo para o vazio.
const SELLER = {
  email: 'support&#64;linfaflow.com',
  telSupport: '+1 (888) 811-1186', telSupportRaw: '+18888111186',
  telRefund: '+1 (800) 390-6035', telRefundRaw: '+18003906035',
};
// ⚠️ NÃO existe "a garantia", e por isso esta chave foi REMOVIDA. O vendedor publica TRÊS janelas
// diferentes, medidas nas páginas dele em 11/08/2026: 30 dias na página do produto, 60 na descrição
// do checkout, 90 no rodapé do checkout. A constante já foi `garantia: '60-day'` e saiu impressa no
// /contact — eu escolhi um dos três sem saber que havia três. Prazo de reembolso é termo material:
// afirmar o número errado é publicar uma condição de compra falsa. Se o vendedor unificar, ela
// volta; até lá a página manda conferir no checkout, que é onde o termo vincula.
// ⚠️ E-mail do PUBLISHER no próprio domínio. NÃO inventar endereço postal nem razão social: numa
// página de saúde, identidade fabricada é literalmente o padrão de deturpação que suspende conta —
// e é o único campo que alguém checaria. Vazio é ruim; falso é pior.
const PUBLISHER = { nome: 'National Health News', email: 'contact&#64;nationalhealthnews.blog' };

// ⚠️ O bloco F do kit vem com PLACEHOLDER LITERAL ("[RAZAO SOCIAL EXATA DO ANUNCIANTE]",
// "[ENDERECO POSTAL COMPLETO]", "[EMAIL@SEU-DOMINIO]") e foi ao ar assim nas 15 páginas. Aqui ele é
// preenchido na geração, e o `assertSemPlaceholder` no fim reprova a build se voltar a sobrar.
const F = bloco('F').replace(
  /This advertising page is published by <strong>\[[^\]]+\]<\/strong>, \[[^\]]+\]\. Questions about this page: <a href="mailto:\[[^\]]+\]"([^>]*)>\[[^\]]+\]<\/a>\./,
  `This advertising page is published by <strong>${PUBLISHER.nome}</strong>, an independent advertising publisher. Questions about this page &mdash; a correction, a privacy request or a press enquiry: <a href="mailto:${PUBLISHER.email}"$1>${PUBLISHER.email}</a>. We cannot help with an order: for a shipment, a return or a refund, contact the seller at <a href="mailto:${SELLER.email}"$1>${SELLER.email}</a> or ${SELLER.telSupport}.`);

const SLUG = { tornozelos: 'ankle-swelling', retencao: 'water-retention', rosto: 'puffy-face', suplemento: 'lymphatic-support', marca: 'linfaflow' };
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
 const slugBase = SLUG[rsa.chave];
 // ⚠️ Um braço por URL, todos sob o MESMO primeiro segmento de path: o tracking-resolve casa
 // slug = 1º segmento, então /ankle-swelling/a/ resolve o mesmo funil que o controle. Braço em
 // slug separado (/ankle-swelling-a/) exigiria linha nova em pressell_deployments e o A/B
 // nasceria medindo em funis diferentes.
 const bracos = [
   { sufixo: '', pb: rsa.primeiro_bloco, rotulo: 'controle' },
   ...(rsa.variantes_primeiro_bloco || []).map((v, i) => ({ sufixo: ['a', 'b'][i], pb: { ...rsa.primeiro_bloco, h1: v.h1, subheadline: v.subheadline }, rotulo: v.rotulo })),
 ];
 for (const braco of bracos) {
  const slug = braco.sufixo ? slugBase + '/' + braco.sufixo : slugBase;
  const pb = braco.pb;
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
  <p>This page describes a dietary supplement made of four traditional botanicals, taken as one to two droppers under the tongue, once or twice daily. It is an advertisement. It is not medical advice, and it does not describe a treatment for any condition.</p>

  <h2 id="${idMecanismo}">How lymph actually moves</h2>
  <figure><img src="./assets/${IMGS[1] || IMGS[0]}" alt="Illustration of fluid movement"></figure>
  <p>Blood has a central pump: the heart. Lymph does not. Lymphatic vessels have their own small muscular walls that contract, and beyond that the system relies on ordinary things &mdash; walking, breathing, the squeeze of muscles as you move &mdash; to keep fluid moving along.</p>
  <p>That is the whole reason movement, elevation and hydration are the standard advice you have already heard. This product is not a replacement for any of it. It is a botanical supplement intended to be part of a daily routine.</p>

  <h2 id="botanicals">The four botanicals</h2>
  ${BOTANICOS.map(([n, d], i) => `<div class="ing"><img src="./assets/${IMGS[(i + 2) % IMGS.length]}" alt="${esc(n)}"><div><h3>${n}</h3><p>${d}</p></div></div>`).join('\n  ')}
  <p style="font-size:15px;color:#555">The full ingredient list and amounts are shown on the product label on the seller&rsquo;s website.</p>

  <h2 id="${idRitual}">The daily routine</h2>
  <p>One to two droppers (1&ndash;2 mL) under the tongue, once or twice daily, as the seller instructs. It takes about thirty seconds and does not need to be taken with food. There is nothing to swallow and nothing to prepare.</p>
  <p>People choose a liquid for simple reasons: it is quick, it is easy to remember, and it is easier for some people than capsules. Whether you keep using it is a matter of whether the routine fits your morning.</p>

  ${cta('See the Full Ingredient List')}

  <h2>What this is &mdash; and what it is not</h2>
  <p><strong>It is</strong> a dietary supplement of four traditional botanicals, sold by the manufacturer on its own website.</p>
  <p><strong>It is not</strong> a medicine, and it is not a substitute for compression garments, manual lymphatic drainage, prescribed medication, or advice from your own healthcare provider. If you already use any of those, keep using them and talk to your provider before adding anything new &mdash; particularly if you take diuretics, blood thinners or blood sugar medication.</p>

  <h2 id="faq">Common questions</h2>
  <dl class="faq">
    <dt>How is it taken?</dt><dd>One to two droppers under the tongue in the morning.</dd>
    <dt>What does it taste like?</dt><dd>It is a herbal liquid with a plant-forward taste. Most people take it with water.</dd>
    <dt>Can I take it with my current medication?</dt><dd>Ask your doctor or pharmacist first, especially with diuretics, anticoagulants or blood sugar medication. That is the honest answer and the only one we will give.</dd>
    <dt>How long does a bottle last?</dt><dd>The seller lists 59 servings of 1 mL per container, so how long a bottle lasts depends on whether you take one or two droppers, once or twice a day.</dd>
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
  resumo.push({ slug, rotulo: braco.rotulo, kb: Math.round(Buffer.byteLength(html) / 1024), sobrou, ancorasFaltando, ctas: (html.match(/data-pdc-aff-param/g) || []).length });
 }
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
<p>This site is an independent advertising publisher. Pages here are <strong>sponsored advertisements</strong>, not editorial reporting and not medical advice. We earn a commission when a reader buys through a link on our pages.</p>

<h2 style="font-size:20px;margin-top:26px">About an order, a shipment or a refund</h2>
<p>We do not sell, ship or process payments, and we cannot see order information. Purchases are completed on the seller&rsquo;s own website, and the seller&rsquo;s support is the only channel that can help with an order.</p>
<p style="background:#f7f7f7;border-left:3px solid #12354d;padding:12px 14px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.8">
  <strong>Linfaflow customer support</strong><br>
  Email: <a href="mailto:${SELLER.email}">${SELLER.email}</a><br>
  Phone: <a href="tel:${SELLER.telSupportRaw}">${SELLER.telSupport}</a><br>
  Refunds and cancellations: <a href="tel:${SELLER.telRefundRaw}">${SELLER.telRefund}</a>
</p>
<p style="font-size:15px;color:#555">The refund policy and the terms that apply to your purchase are the ones published on the seller&rsquo;s checkout page &mdash; and it is worth reading them <em>there</em>, at the moment you buy. On 11 August 2026 the seller&rsquo;s own pages carried <strong>three different refund windows</strong>: 30 days on the product page, 60 days in the checkout description and 90 days in the checkout footer.</p>

<h2 style="font-size:20px;margin-top:26px">About a health question</h2>
<p>We cannot answer questions about your health. Talk to your doctor or pharmacist &mdash; especially before combining any supplement with diuretics, anticoagulants or blood sugar medication.</p>

<h2 style="font-size:20px;margin-top:26px">About the advertising on this site</h2>
<p>For questions about the advertising published here &mdash; a request to correct something on a page, a privacy request, or a press enquiry &mdash; write to us:</p>
<p id="pdc-contact-email" style="font-family:Arial,Helvetica,sans-serif;font-size:17px">
  <a href="mailto:${PUBLISHER.email}">${PUBLISHER.email}</a>
</p>
<p style="font-size:15px;color:#555">We answer advertising and privacy enquiries only. We cannot look up an order, issue a refund or give medical advice &mdash; use the seller&rsquo;s support above, or speak to a healthcare professional.</p>
`));

// ⚠️ O rodapé do bloco F linka /about e /affiliate-disclosure. Elas NÃO existiam e as 15 páginas
// no ar levavam a 404 — rodapé que promete e entrega 404 é o sinal de "site inacabado" que o
// revisor de saúde procura. Criar a página é mais barato que tirar o link.
fs.writeFileSync('dist/about.html', legal('About Us', `
<p><strong>${PUBLISHER.nome}</strong> is an independent advertising publisher. Every page on this site is a <strong>sponsored advertisement</strong> for a consumer wellness product. Nothing here is editorial reporting, and nothing here is medical advice.</p>

<h2 style="font-size:20px;margin-top:26px">How this site makes money</h2>
<p>We are paid a commission by the seller when a reader buys through a link on one of our pages. That commission never changes the price you pay, and it does not come out of your order.</p>
<p>We do not manufacture, sell, ship or process payment for any product described here. The seller operates its own website and checkout, and the seller alone is responsible for the product, the order, shipping, returns and refunds.</p>

<h2 style="font-size:20px;margin-top:26px">What we do not do</h2>
<p>We do not diagnose, treat or give advice about any medical condition. Statements about dietary supplements on this site have not been evaluated by the Food and Drug Administration, and the products described are not intended to diagnose, treat, cure or prevent any disease. Talk to your own doctor or pharmacist before starting any supplement &mdash; especially alongside diuretics, anticoagulants or blood sugar medication.</p>

<h2 style="font-size:20px;margin-top:26px">Reaching us</h2>
<p>Advertising, correction and privacy enquiries: <a href="mailto:${PUBLISHER.email}">${PUBLISHER.email}</a>.</p>
<p>Anything to do with an order, a shipment or a refund goes to the seller, not to us &mdash; the details are on the <a href="/contact">Contact</a> page.</p>`));

fs.writeFileSync('dist/affiliate-disclosure.html', legal('Advertising &amp; Affiliate Disclosure', `
<p>This disclosure is made in line with the United States Federal Trade Commission&rsquo;s guidance on endorsements and on the disclosure of material connections in advertising (16 CFR Part 255).</p>

<h2 style="font-size:20px;margin-top:26px">Every page here is an advertisement</h2>
<p>The pages on this site are <strong>paid advertising content</strong>. They are written to promote a product. They are not journalism, not an independent review and not a medical recommendation, and they should not be read as one.</p>

<h2 style="font-size:20px;margin-top:26px">We have a financial relationship with the seller</h2>
<p>We participate in affiliate programmes. When you click a link or button on one of our pages and complete a purchase on the seller&rsquo;s website, <strong>we are paid a commission</strong>. This is a material connection: we have a financial interest in you buying the product.</p>
<p>The commission is paid by the seller out of its own margin. It does not increase the price you pay and it is not added to your order.</p>

<h2 style="font-size:20px;margin-top:26px">What we do not control</h2>
<p>We are not the manufacturer and not the seller. Price, availability, product claims on the seller&rsquo;s own website, shipping, the refund policy and the terms of your purchase are all set by the seller and shown on the seller&rsquo;s checkout page. Those terms, not ours, apply to what you buy.</p>

<h2 style="font-size:20px;margin-top:26px">About results</h2>
<p>Individual experiences vary, and any experience described on this site is that of one person and is not a promise of a result for anyone else. Statements about dietary supplements here have not been evaluated by the Food and Drug Administration, and the products are not intended to diagnose, treat, cure or prevent any disease.</p>

<p>Questions about this disclosure: <a href="mailto:${PUBLISHER.email}">${PUBLISHER.email}</a>.</p>`));

fs.writeFileSync('dist/404.html', legal('Page Not Found', `
<p>The page you asked for is not here. This site publishes a small number of sponsored advertising pages.</p>
<p><a href="/">Go to the home page</a></p>`));

// ⚠️ Guarda de build: placeholder é o defeito que NÃO se anuncia — a página sobe, responde 200 e
// exibe "[ENDERECO POSTAL COMPLETO]" para o revisor. Reprova a geração inteira em vez de avisar.
const PLACEHOLDER = /SEU-DOMINIO|RAZAO SOCIAL|ENDERECO POSTAL|preencher com e-mail|\[EMAIL@/;
const comPlaceholder = [];
(function varrer(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) varrer(p);
    else if (e.name.endsWith('.html') && PLACEHOLDER.test(fs.readFileSync(p, 'utf8'))) comPlaceholder.push(p);
  }
})('dist');

console.log('PAGINAS:');
for (const r of resumo) console.log(`  /${r.slug}/  ${r.kb} KB · CTAs rastreados: ${r.ctas} · proibidos: ${r.sobrou.length ? r.sobrou.join(', ') : 'nenhum'} · ancoras faltando: ${r.ancorasFaltando.length ? r.ancorasFaltando.join(', ') : 'nenhuma'}`);
console.log('legais: index, privacy, terms, contact, about, affiliate-disclosure, 404');
if (comPlaceholder.length) {
  console.error('\nBUILD REPROVADA — placeholder nao preenchido em:\n  ' + comPlaceholder.join('\n  '));
  process.exit(1);
}
console.log('contato: publisher ' + PUBLISHER.email + ' · vendedor ' + SELLER.email + ' / ' + SELLER.telSupport);
