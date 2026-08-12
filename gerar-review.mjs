// Página de REVIEW da LinfaFlow — o destino do ad group de MARCA.
//
// ⚠️ POR QUE ELA EXISTE. Medido no Google Ads em 11/08: o grupo "Marca (LinfaFlow)" é o ÚNICO
// que dá clique (2 de 3 cliques da campanha, 67% de CTR, R$ 4,76 de R$ 4,92 gastos) — e cai numa
// página que se chama "What Is In It, and How It Is Used", ou seja DESCREVE o produto. Quem digita
// o nome da marca já conhece o produto e quer um VEREDITO. É a única incongruência do funil que
// já está recebendo tráfego pago.
//
// ⚠️ POR QUE ELA NÃO É A REVIEW DO MERCADO. O melhor molde do acervo é o "Audizen Review"
// (elementor_templates b748e9e4, competitor_days_active=286, provado em 2 nichos). Copiei dele o
// ESQUELETO — 10 seções que respondem uma busca cada — e joguei fora o miolo: as reviews de 1
// estrela assinadas por "Emily S. · Verified Purchase", as 15 estrelinhas e a persona de revisor.
// Isso não é escrúpulo: 16 CFR Part 465 (vigente 21/10/2024) trata review de quem não existe ou
// não usou o produto como ato enganoso, com multa civil POR OCORRÊNCIA, e a subcategoria
// "Misleading representation" do Google barra página paga que se apresenta como avaliação
// independente. Ninguém aqui testou o produto, então a página diz isso, em cima, com todas as
// letras — e vira uma review de VERIFICAÇÃO, que é o que dá para escrever de verdade.
//
// ⚠️ E É POR ISSO QUE ELA CONVERTE O QUE O MERCADO NÃO CONVERTE. Medido em `competitor_offers`:
// 162 anúncios de review de marca em nutra, e relato de usuário aparece em 4 (2%). Todo mundo
// promete "honest review" e entrega elogio. O que esta página entrega e nenhuma outra entrega é
// o que eu de fato CONFERI no site do vendedor hoje — renovação automática, três janelas de
// reembolso diferentes e duas escadas de preço. Isso é verificável, é útil e é o "contra" real
// que o formato exige para não ser anúncio disfarçado.
//
// ⚠️ OS BLOCOS DE CONFORMIDADE SÃO LIDOS DA PÁGINA NO AR, não do kit. O `v2_kit-conformidade.json`
// não está versionado neste repo (o `gerar-paginas.mjs` não roda sem ele), então a fonte da
// verdade aqui é `linfaflow/index.html`, que ESTÁ versionado e é exatamente o que o Google já
// revisou. Copiar dali garante que a review nasce com o mesmo kit aprovado, byte a byte.
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'linfaflow/index.html';
const DESTINO = 'linfaflow/review';
const fonte = fs.readFileSync(BASE, 'utf8');

// Extrai um bloco pelo id, equilibrando a tag de abertura/fechamento. Regex de "<div...</div>"
// pegaria o primeiro fechamento e cortaria o bloco no meio — os blocos do kit têm div aninhada.
function blocoPorId(html, id) {
  const marca = `id="${id}"`;
  const i = html.indexOf(marca);
  if (i < 0) throw new Error(`bloco ${id} não existe em ${BASE} — o kit mudou, conferir antes de publicar`);
  const ini = html.lastIndexOf('<', i);
  const tag = html.slice(ini + 1, html.indexOf(' ', ini));
  let d = 0, j = ini;
  for (;;) {
    const a = html.indexOf(`<${tag}`, j), b = html.indexOf(`</${tag}>`, j);
    if (b < 0) throw new Error(`bloco ${id} não fecha`);
    if (a >= 0 && a < b) { d++; j = a + 1; } else { d--; j = b + 1; if (d === 0) return html.slice(ini, b + tag.length + 3); }
  }
}

const A_LABEL   = blocoPorId(fonte, 'pdc-ad-label');
const B1        = blocoPorId(fonte, 'pdc-affiliate-disclosure');
const D_SAUDE   = blocoPorId(fonte, 'pdc-health-notice');
const D_NAOSUB  = blocoPorId(fonte, 'pdc-nao-substitui');
const DSHEA     = blocoPorId(fonte, 'pdc-dshea');
const F_RODAPE  = blocoPorId(fonte, 'pdc-publisher');
const CSS       = /<style>([\s\S]*?)<\/style>/.exec(fonte)[1];
const CHECKOUT  = /href="(https:\/\/cc\.linfaflow\.com[^"]+)"/.exec(fonte)[1].replace(/&amp;/g, '&');

// ⚠️ O rótulo de anúncio do kit diz que a página "is not ... an independent product review". Numa
// página TITULADA "reviews" isso leria como contradição, então aqui a frase é COMPLETADA em vez de
// removida: não é uma review independente, é uma review patrocinada de um afiliado que ganha
// comissão. Remover a frase seria a única leitura errada das duas.
const A = A_LABEL.replace(
  'or an independent product review.',
  'or an <em>independent</em> product review. It is a sponsored review written by an affiliate that is paid a commission on sales.');
if (A === A_LABEL) throw new Error('a frase do rótulo A mudou — conferir antes de publicar');

// ⚠️ Disclosure IMEDIATAMENTE acima de CADA CTA, nunca só do primeiro, e o carimbo
// data-pdc-aff-param="subid" em todos: é ele que leva o visitor_id ao checkout, e sem ele a venda
// volta pelo postback do H&W sem casar a sessão e a conversão nunca chega ao Google Ads.
const cta = (rotulo) => `
<p style="max-width:680px;margin:0 auto 6px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#333;text-align:center;">
  Paid link &mdash; we earn a commission if you buy through it. It does not change your price.
</p>
<p style="text-align:center;margin:0 0 30px"><a class="cta" data-pdc-aff-param="subid" href="${CHECKOUT}"
 style="display:inline-block;background:#1c7a4a;color:#fff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-weight:700;font-size:19px;padding:16px 30px;border-radius:6px">${rotulo}</a></p>`;

const caixa = (titulo, corpo, cor = '#12354d') => `
<div style="max-width:680px;margin:20px auto;padding:14px 16px;background:#f7f7f7;border-left:4px solid ${cor};font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65">
  <strong style="display:block;margin-bottom:6px">${titulo}</strong>${corpo}
</div>`;

const CONFERIDO = '11 August 2026';

// ⚠️ BLOCO G — método e NÃO-USO, acima da dobra. É o que separa esta página de uma review falsa:
// declara o que foi feito (abrir as páginas do vendedor e comparar) e o que NÃO foi feito (usar o
// produto). Sem ele, o gênero "review" promete uma experiência que não existe.
const G_METODO = `
<div id="pdc-metodo" style="max-width:680px;margin:14px auto;padding:12px 14px;border:1px solid #b9c6d0;background:#f4f8fb;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#1a1a1a;">
  <strong>How this page was put together, and what it is not.</strong><br>
  <strong>We have not used this product, and nobody on this page claims to have used it.</strong> There
  is no tester, no trial and no personal experience here. What we did instead is check what the seller
  publishes: the product page, the checkout, the stated ingredients, the prices, the billing terms and
  the refund policy &mdash; read on ${CONFERIDO} and quoted below. Where the seller&rsquo;s own pages
  disagree with each other, we say so and we tell you where to look before you pay.<br><br>
  <strong>This is not an independent review site.</strong> It is advertising published by National
  Health News, which is paid a commission when a reader buys through a link here. We have no way to
  verify the seller&rsquo;s claims about what the product does, and we do not repeat them as facts.
</div>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>LinfaFlow Reviews | Label, Price, Billing and Refund Terms</title>
<meta name="description" content="What the LinfaFlow seller publishes about the drops: stated ingredients, price, the automatic 30-day renewal, and three different refund windows. Advertisement.">
<meta name="robots" content="noindex">
<style>${CSS}
.chk{max-width:680px;margin:0 auto}
.chk table{width:100%;border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;font-size:15px}
.chk th,.chk td{border:1px solid #ddd;padding:9px 10px;text-align:left;vertical-align:top}
.chk th{background:#f0f4f7;font-size:14px}
.pc{display:flex;gap:18px;flex-wrap:wrap;max-width:680px;margin:0 auto}
.pc>div{flex:1 1 280px;border:1px solid #ddd;padding:14px 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65}
.pc h3{margin:0 0 8px;font-size:17px}
.pc ul{margin:0;padding-left:20px}.pc li{margin:6px 0}
</style>
</head>
<body>
${A}
<header class="topbar"><div class="wrap"><div class="masthead">National Health <span>News</span></div></div></header>

<div class="wrap">
<h1>LinfaFlow Reviews: What Is on the Label, What It Costs, and What to Check Before You Buy</h1>
<p class="byline">Advertisement &middot; Written by National Health News, an affiliate paid on sales &middot; Seller&rsquo;s pages checked ${CONFERIDO}</p>

${G_METODO}
${B1}
${D_SAUDE}

<h2>The short answer</h2>
<p>LinfaFlow is a herbal liquid supplement sold directly by its maker in the United States. It is taken by
mouth, it is marketed for people who feel puffy or heavy in the legs, ankles and hands, and it is sold only
on the seller&rsquo;s own website &mdash; not in shops and not through a marketplace.</p>
<p>Three things are worth knowing before you enter a card, and none of them are obvious on the sales page:</p>
<ul>
  <li><strong>The default order can be a subscription.</strong> The seller&rsquo;s own page states that
      subscription orders renew automatically every 30 days until cancelled, and that the charge on your
      statement will read as the package name &mdash; for example &ldquo;Buy one&rdquo; &mdash; not as a
      subscription.</li>
  <li><strong>The refund window is published three different ways</strong> across the seller&rsquo;s own
      pages. We show all three below.</li>
  <li><strong>There are two different price ladders</strong> for the same product, depending on which of
      the seller&rsquo;s pages you arrive on.</li>
</ul>
<p>None of that makes it a scam, and we found nothing suggesting it is one. It does mean the terms deserve
thirty seconds of reading, which is what the rest of this page is for.</p>

${cta('See the Official Product Page')}

<h2 id="botanicals">What the seller says is in it</h2>
<p>On its product page the seller names four botanicals and describes each one in its own words. We are
quoting the seller here, not endorsing the description:</p>
<div class="chk"><table>
  <tr><th style="width:34%">Named on the product page</th><th>The seller&rsquo;s own description</th></tr>
  <tr><td>Cleavers, aerial parts</td><td>&ldquo;Encourages lymph flow and gentle cleansing&rdquo;</td></tr>
  <tr><td>Red clover blossom extract</td><td>&ldquo;Promotes healthy circulation and clear skin&rdquo;</td></tr>
  <tr><td>Prickly ash bark</td><td>&ldquo;Boosts energy and supports microcirculation&rdquo;</td></tr>
  <tr><td>Stillingia root</td><td>&ldquo;Aids gentle detox and natural drainage&rdquo;</td></tr>
</table></div>
<p style="font-size:15px;color:#555;margin-top:10px">These are traditional herbal ingredients. Descriptions
like the ones above are the seller&rsquo;s marketing language, not a summary of clinical evidence, and we
have not verified any of them.</p>

${caixa('Read the label before you buy &mdash; and read it on the bottle',
`The seller does not publish how much of each botanical is in a serving. It also publishes a
&ldquo;Supplement Facts&rdquo; panel on the same site whose ingredient list does <strong>not</strong> match
the four botanicals named in the product description. We asked the seller to clarify which panel is current
and will update this page with the answer.<br><br>
Until then, the only reliable version is the label on the bottle you receive. <strong>If you take
prescription medication &mdash; particularly a diuretic, a blood thinner, or medication for blood pressure,
blood sugar or the thyroid &mdash; show that label to your pharmacist before your first dose.</strong> That
advice is worth following with any supplement, and it matters more when the published ingredient list is
unclear.`, '#c9a94f')}

<h2 id="the-ritual">How the seller says it is taken</h2>
<p>The instruction published on the official product page is <strong>one to two droppers (1&ndash;2 mL),
once or twice daily</strong>, either under the tongue or stirred into water, tea or juice. The same page
lists a serving as 1 mL and states 59 servings per container, which puts a bottle at roughly a month at the
lower end of that range and about two weeks at the higher end.</p>
<p>Follow the directions printed on the bottle you receive. If they differ from what is on the website, the
bottle is the one that counts.</p>

<h2>What it costs, and the part people miss</h2>
<p>Prices differ depending on which of the seller&rsquo;s pages you land on, so the figures below are what
each page showed on ${CONFERIDO}. Check the total on the payment screen before you confirm &mdash; that is
the only number that binds.</p>
<div class="chk"><table>
  <tr><th>Where</th><th>What it showed</th></tr>
  <tr><td>Official store page</td><td>1 bottle $29.99 &middot; 3 bottles $59.99 &middot; 5 bottles $89.99,
      with higher &ldquo;compare at&rdquo; prices shown alongside. A payment plan of $77 per month for six
      months is offered on larger orders.</td></tr>
  <tr><td>Direct checkout page</td><td>A different ladder, with multi-bottle packages priced up to $297 and
      a separate shipping and tracking charge of $9.95.</td></tr>
</table></div>

${caixa('The billing term to read twice',
`The seller&rsquo;s page states: &ldquo;Subscription orders renew automatically every 30 days until
cancelled. The package name (e.g. &lsquo;Buy one&rsquo;, &lsquo;Buy 2 Get 1 FREE&rsquo;) will appear on your
statement.&rdquo; The checkout also carries a line saying an order is a one-time purchase with no recurring
charge &mdash; so the two are not saying the same thing.<br><br>
<strong>Before you confirm, check whether the option you selected is the one-time purchase or the
subscription, and keep the confirmation e-mail.</strong> A charge that appears on a statement under a
package name rather than the word &ldquo;subscription&rdquo; is easy to miss for several months. The seller
publishes a cancellation page and states that you can cancel at any time.`, '#b03a2e')}

<h2>Refunds: the seller publishes three different windows</h2>
<p>This is the clearest example of why it is worth reading the seller&rsquo;s own pages rather than a
summary of them. On ${CONFERIDO}, three of the seller&rsquo;s pages carried three different figures:</p>
<div class="chk"><table>
  <tr><th style="width:34%">Where it appears</th><th>What it says</th></tr>
  <tr><td>Official product page</td><td>30-day money-back guarantee</td></tr>
  <tr><td>Checkout page description</td><td>60 days money-back guarantee</td></tr>
  <tr><td>Checkout page footer</td><td>90-day guarantee &mdash; returns or replacement within 90 days of purchase</td></tr>
</table></div>
<p><strong>Treat the shortest one as the safe assumption</strong> and confirm the window in writing before
you buy, or at the latest in your order confirmation. If you intend to rely on the refund, do not rely on a
figure you read on a page you cannot produce later.</p>

${cta('Check the Current Terms on the Official Site')}

<h2>Where it is worth it, and where it is not</h2>
<div class="pc">
  <div>
    <h3>Points in its favour</h3>
    <ul>
      <li>Sold directly by the maker, so there is one party responsible for the order, the shipping and the refund.</li>
      <li>The seller states it is bottled in the United States in GMP-certified facilities and third-party tested for purity and potency.</li>
      <li>A liquid taken once a day is an easy routine to keep, which is not a small thing &mdash; a supplement you stop taking does nothing at all.</li>
      <li>The seller states the formula is free from alcohol, sugar, gluten and additives.</li>
      <li>There is a published refund policy and a published cancellation page.</li>
    </ul>
  </div>
  <div>
    <h3>Points against, and they are real</h3>
    <ul>
      <li><strong>The published ingredient information is inconsistent</strong>, and the amount of each botanical per serving is not published at all.</li>
      <li><strong>Automatic renewal every 30 days</strong>, appearing on the statement under the package name rather than as a subscription.</li>
      <li><strong>Three different refund windows</strong> on the seller&rsquo;s own pages.</li>
      <li>Two different price ladders for the same product.</li>
      <li>Not available in shops, so there is no way to buy one bottle in person to try.</li>
      <li>Traditional herbal use is not clinical evidence, and the seller publishes none.</li>
    </ul>
  </div>
</div>

<h2 id="how-lymph-moves">A word on what this is and is not for</h2>
<p>Puffiness and heaviness in the legs and ankles at the end of a long day, after a flight, after a salty
meal or in hot weather is common and usually settles. Persistent swelling is a different matter and has
causes that a supplement does not address.</p>
${D_NAOSUB}
<p>Nothing about this product replaces compression garments, manual lymphatic drainage, prescribed
medication, or the advice of your own clinician. If you already use any of those, keep using them.</p>

<h2 id="faq">Questions people actually ask</h2>
<dl class="faq">
  <dt>Is LinfaFlow a scam?</dt>
  <dd>We found no sign of one. It is a real product, sold by a company that publishes a refund policy, a
      cancellation page and a support phone number, and it ships. The problems we found are about clarity
      of terms, not about whether the product exists &mdash; and they are listed above so that you can judge
      for yourself.</dd>

  <dt>Does it work?</dt>
  <dd>We cannot tell you that, and we would not trust a page that did. Nobody here has used it, the
      published ingredient information does not agree with itself, and the seller publishes no clinical
      evidence. What we can tell you is exactly what it contains according to the seller, what it costs and
      how the refund works &mdash; which is what makes the decision yours rather than ours.</dd>

  <dt>Is it a subscription?</dt>
  <dd>It can be. The seller&rsquo;s page states that subscription orders renew automatically every 30 days
      until cancelled, and that the charge appears under the package name. Check which option is selected
      before you confirm the order.</dd>

  <dt>How long does a bottle last?</dt>
  <dd>The seller lists 59 servings of 1 mL per container. At one dropper a day that is close to two months;
      at two droppers twice a day it is about two weeks. The range comes from the seller&rsquo;s own dosing
      instruction, which spans one to two droppers, once or twice a day.</dd>

  <dt>Where should I buy it?</dt>
  <dd>From the seller&rsquo;s own website. It is not sold in shops, and a listing on a marketplace is not
      the seller. Buying anywhere else means the seller&rsquo;s refund policy and support are not yours to
      use.</dd>

  <dt>Can I take it with my medication?</dt>
  <dd>Ask your doctor or pharmacist, and take the bottle with you. That is the honest answer and the only
      one we will give &mdash; particularly with diuretics, anticoagulants, or medication for blood
      pressure, blood sugar or the thyroid. It is not for use during pregnancy or breastfeeding, or by
      anyone under 18.</dd>

  <dt>What if I want a refund?</dt>
  <dd>Contact the seller, not us. We do not sell, ship or process payments and we cannot see your order.
      The seller&rsquo;s support is reachable at support@linfaflow.com and by phone; the numbers are on our
      <a href="/contact">contact page</a>. Confirm your refund window at the time of purchase, because the
      seller publishes three different ones.</dd>
</dl>

${caixa('What we would want a reader to do',
`Open the seller&rsquo;s page. Check three things before you enter a card: whether you are buying once or
subscribing, what refund window the page you are on states, and what the label says it contains. If the
answers satisfy you, buy. If they do not, that is a good reason not to &mdash; and we would rather say that
than have you charged for something you did not mean to buy.`)}

${cta('Go to the Official LinfaFlow Page')}

${DSHEA}
</div>

<footer><div class="wrap">
${F_RODAPE}
<p style="margin-top:14px"><a href="/privacy">Privacy Policy</a> &middot; <a href="/terms">Terms of Use</a> &middot; <a href="/contact">Contact</a> &middot; <a href="/affiliate-disclosure">Advertising &amp; Affiliate Disclosure</a></p>
</div></footer>
</body>
</html>`;

fs.mkdirSync(DESTINO, { recursive: true });
fs.writeFileSync(path.join(DESTINO, 'index.html'), html);

// ─────────────────────────────────────────────────────────── conferência de build
// ⚠️ Reprova de verdade (exit 1). A lista PROIBIDO do gerador irmão só IMPRIME, e por isso `cure`
// acende nas 5 páginas por causa do texto obrigatório da DSHEA sem que ninguém repare — lista que
// nunca reprova é decoração. Aqui os termos são os que NÃO podem existir nesta página, e os que
// existem legitimamente (guarantee, refund) ficam de fora da lista de propósito.
const PROIBIDO = [
  'verified purchase', 'i tried', 'we tried', 'i tested', 'we tested', 'our team tested',
  'out of 5', '/5', 'star rating', '★', '⭐',
  'miracle', 'cure for', 'cures ', 'clinically proven', 'doctor recommended',
  'edema', 'lymphedema', 'venous insufficiency', 'lipedema',
  'in 7 days', 'in 16 days', 'within days', 'guaranteed results', 'you will lose', 'before and after',
];
const OBRIGATORIO = [
  ['não-uso declarado', 'We have not used this product'],
  ['não-independência declarada', 'not an independent review site'],
  ['renovação automática divulgada', 'renew automatically every 30 days'],
  ['rótulo de anúncio', 'pdc-ad-label'],
  ['disclosure de afiliado', 'pdc-affiliate-disclosure'],
  ['aviso médico', 'pdc-health-notice'],
  ['DSHEA', 'pdc-dshea'],
  ['identidade do publisher', 'pdc-publisher'],
];
const texto = html.replace(/<[^>]*>/g, ' ').toLowerCase();
const achou = PROIBIDO.filter((p) => texto.includes(p.toLowerCase()));
const faltou = OBRIGATORIO.filter(([, m]) => !html.includes(m)).map(([n]) => n);
const ctas = (html.match(/data-pdc-aff-param/g) || []).length;
const disclosures = (html.match(/Paid link &mdash; we earn a commission/g) || []).length;
const ancoras = ['botanicals', 'the-ritual', 'how-lymph-moves', 'faq'].filter((a) => !html.includes(`id="${a}"`));
const placeholder = /SEU-DOMINIO|RAZAO SOCIAL|ENDERECO POSTAL|\[EMAIL@/.test(html);

console.log(`review: ${DESTINO}/index.html · ${Math.round(Buffer.byteLength(html) / 1024)} KB`);
console.log(`  CTAs rastreados: ${ctas} · disclosures acima de CTA: ${disclosures}`);
console.log(`  âncoras de sitelink faltando: ${ancoras.length ? ancoras.join(', ') : 'nenhuma'}`);
console.log(`  proibidos: ${achou.length ? achou.join(', ') : 'nenhum'}`);
console.log(`  blocos obrigatórios faltando: ${faltou.length ? faltou.join(', ') : 'nenhum'}`);
if (achou.length || faltou.length || ancoras.length || placeholder || ctas !== disclosures || ctas === 0) {
  console.error('\nBUILD REPROVADA' + (ctas !== disclosures ? ` — ${ctas} CTAs para ${disclosures} disclosures: cada CTA precisa do seu` : ''));
  process.exit(1);
}
console.log('  build aprovada');
