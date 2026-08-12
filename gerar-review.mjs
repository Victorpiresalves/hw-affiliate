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
<meta name="description" content="What the LinfaFlow seller publishes: two different ingredient panels, two price ladders, a membership added to the cart, and three refund windows. Advertisement.">
<meta name="robots" content="noindex">
<style>${CSS}
.chk{max-width:680px;margin:0 auto;overflow-x:auto}
.chk table{width:100%;border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;font-size:15px}
.chk th,.chk td{border:1px solid #ddd;padding:9px 10px;text-align:left;vertical-align:top}
.chk th{background:#f0f4f7;font-size:14px}
.pc{display:flex;gap:18px;flex-wrap:wrap;max-width:680px;margin:0 auto}
.pc>div{flex:1 1 280px;min-width:0;border:1px solid #ddd;padding:14px 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65}
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
<p><strong>The short version:</strong> it is a real product from a real seller, sold direct-to-consumer,
with a published refund policy and a support number printed on the seller&rsquo;s own pages. We found
nothing suggesting a scam. What we could not verify is what it does &mdash; nobody here has taken it, and
the only evidence the seller cites is given without a reference. What we <em>could</em> verify are the
terms, and four of them are worth thirty seconds before you enter a card.</p>
<ul>
  <li><strong>A membership is added to your cart on the seller&rsquo;s store.</strong> The order text
      states that the cart includes a digital &ldquo;Wellness Club&rdquo; membership with a 14-day free
      trial which, unless cancelled, bills <strong>$77 a month for six months &mdash; $462</strong>,
      separate from the drops.</li>
  <li><strong>A subscription option exists and renews on its own</strong>, and the seller states the charge
      appears on your statement as the package name &mdash; for example &ldquo;Buy one&rdquo; &mdash; not
      as the word subscription.</li>
  <li><strong>The refund window is published three different ways</strong>, two of them on the same page.</li>
  <li><strong>There are two different ingredient panels</strong> on the seller&rsquo;s own site, and they
      do not describe the same product.</li>
</ul>
<p>None of that makes it a scam, and we are not saying it is one. It does mean the terms deserve reading,
which is what the rest of this page is for.</p>

${cta('Open the Seller&rsquo;s Order Page')}

<h2 id="botanicals">What the seller says is in it</h2>
<p>This is the part the seller publishes twice, in two versions that do not agree. We are reproducing both
as published on ${CONFERIDO}, because the difference is the single most useful thing on this page.</p>

<h3>Panel one: the ingredient popup on the product page</h3>
<p>This one matches the four botanicals the product description names, and each description below is the
seller&rsquo;s own wording, not ours:</p>
<div class="chk"><table>
  <tr><th style="width:36%">Proprietary Blend, 300 mg</th><th>How the seller describes it</th></tr>
  <tr><td>Cleavers aerial parts <em>(Galium aparine)</em></td><td>&ldquo;Encourages lymph flow and gentle cleansing&rdquo;</td></tr>
  <tr><td>Red clover flower <em>(Trifolium pratense)</em></td><td>&ldquo;Promotes healthy circulation and clear skin&rdquo;</td></tr>
  <tr><td>Prickly ash bark</td><td>&ldquo;Boosts energy and supports microcirculation&rdquo;</td></tr>
  <tr><td>Stillingia root</td><td>&ldquo;Aids gentle detox and natural drainage&rdquo;</td></tr>
  <tr><td>Other ingredients</td><td>Vegetable glycerin, water</td></tr>
</table></div>

<h3>Panel two: the block headed &ldquo;Full Supplement Facts&rdquo; on the same site</h3>
<p>This one lists a different formula, and <strong>not one of the four botanicals above appears in it</strong>:</p>
<div class="chk"><table>
  <tr><th style="width:36%">Proprietary Herbal Blend, 200 mg</th><td>Maca root extract, African mango seed
      extract, grape seed extract, guarana seed extract, eleutherococcus senticosus, astragalus, green tea
      leaf, gymnema sylvestre, coleus forskohlii, cayenne pepper, grapefruit seed, ginseng, raspberry
      ketones, L-glutamine, L-tyrosine, L-arginine, beta alanine, monoammonium glycyrrhizinate, GABA,
      L-tryptophan, L-carnitine HCl</td></tr>
  <tr><th>Other ingredients</th><td>Water, citric acid</td></tr>
  <tr><th>Serving size</th><td>1/4 teaspoon (1 mL) &middot; 59 servings per container</td></tr>
</table></div>
<p>So the seller publishes two ingredient lists and two blend weights for one product, and neither gives the
amount of any single ingredient. We do not know which is current, and we are not going to guess: a formula
is not something to infer from marketing copy.</p>

${caixa('Why this one is worth acting on',
`The second panel contains <strong>guarana, green tea and ginseng</strong> &mdash; caffeine and stimulants
&mdash; plus gymnema, which is associated with blood sugar, and monoammonium glycyrrhizinate, a liquorice
derivative associated with blood pressure and potassium. The first panel contains none of those. The two
versions are not interchangeable for anyone who has a reason to care what they swallow.<br><br>
<strong>The only version that counts is the label on the bottle you receive.</strong> If you take
prescription medication &mdash; particularly a diuretic, a blood thinner, or medication for blood pressure,
blood sugar or the thyroid &mdash; or if you avoid caffeine, read that label before the first dose and show
it to your pharmacist. That is worth doing with any supplement. It matters more when the published list
exists in two versions and only one of them is caffeinated.`, '#c9a94f')}

<h2 id="the-ritual">How the seller says it is taken</h2>
<p>The instruction published on the official product page is <strong>one to two droppers (1&ndash;2 mL),
once or twice daily</strong>, either under the tongue or stirred into water, tea or juice.</p>
<p>If you have seen this product described anywhere as &ldquo;two drops under the tongue&rdquo;, that is not
what the seller&rsquo;s own directions say. A dropper holds about a millilitre &mdash; roughly twenty drops
&mdash; so the published instruction is a far larger dose than that phrase suggests. We are quoting the
directions as the seller publishes them, and the bottle you receive is the version that counts.</p>
<p>The same page lists a serving as 1 mL and 59 servings per container. That puts a bottle at close to two
months on the smallest dose the label allows, and at about two weeks on the largest &mdash; a four-fold
difference in what a bottle costs you per month, decided by an instruction that gives a range rather than a
dose.</p>

<h2>What it costs, and what else is in the cart</h2>
<p>Prices differ depending on which of the seller&rsquo;s pages you land on. Both ladders below are what
each page showed on ${CONFERIDO}. Check the total on the payment screen before you confirm &mdash; that is
the only number that binds.</p>
<div class="chk"><table>
  <tr><th style="width:26%">Where</th><th>What it showed</th></tr>
  <tr><td>Official store page</td><td>1 bottle $29.99, 3 bottles $59.99 and 5 bottles $89.99, with higher
      &ldquo;compare at&rdquo; prices shown alongside ($39.99, $119.97 and $199.95).</td></tr>
  <tr><td>Direct checkout page<br><span style="font-size:13px;color:#555">(where our links go)</span></td>
      <td>A different ladder, priced per bottle, with shipping free: &ldquo;Buy 1 Get 1 Free&rdquo; at
      $34.75 a bottle ($69.50 in total), &ldquo;Buy 2 Get 2 Free&rdquo; at $27.49 a bottle ($109.96) and
      &ldquo;Buy 3 Get 3 Free&rdquo; at $19.99 a bottle ($119.94) &mdash; the last of these is already
      selected for you when the page loads. An expedited shipping upgrade of $9.95 is
      <strong>ticked by default</strong> below the pay button; untick it if you do not want it. The same
      page separately offers a 12-bottle annual supply at $24.75 a month, &ldquo;billed yearly &ndash;
      $297.00&rdquo; &mdash; that one is a yearly subscription, not one of the three options above.</td></tr>
</table></div>

${caixa('The charge that is not the bottles',
`On the store, the seller&rsquo;s own order text reads: &ldquo;By placing the order, I understand and agree
that my cart includes a digital &lsquo;Linfaflow Wellness Club&rsquo; membership with a 14-day free trial.
Unless canceled before the trial ends, I agree and authorise Linfaflow to automatically charge my credit
card $77 per month for a total of 6 consecutive monthly payments.&rdquo;<br><br>
That is <strong>$462</strong>, separate from the supplement, and it starts by itself if the trial is not
cancelled &mdash; more than five times the price of the largest bottle package on the same page.
<strong>If you want only the drops, check what else is in the cart before you pay, and keep the
confirmation e-mail.</strong>`, '#b03a2e')}

${caixa('And the subscription, which is a different thing again',
`The drops themselves can be bought once or on a subscription, and the seller is explicit that this is your
choice: &ldquo;If you select a subscription&hellip; you will be charged the price shown above (e.g. $29.99)
now and every 30 days thereafter until you cancel.&rdquo; The part worth knowing is what happens next:
&ldquo;The package name (e.g. &lsquo;Buy one&rsquo;, &lsquo;Buy 2 Get 1 FREE&rsquo;) will appear on your
statement&rdquo; &mdash; not the word subscription, which is what makes a recurring charge easy to miss for
several months.<br><br>
The checkout page our links open is less consistent with itself: it carries &ldquo;Refills Ship Every 30
Days | Stop or Cancel Anytime&rdquo; and, further down the same page, &ldquo;Your order is a one-time
purchase &mdash; no subscription, no recurring charge.&rdquo; Both sentences are on the page you will be
looking at. Read the option you tick rather than the reassurance underneath it.`, '#b03a2e')}

<h2>Refunds: the seller publishes three different windows</h2>
<p>This is the clearest reason to read the seller&rsquo;s own pages rather than a summary of them. On
${CONFERIDO}, three different figures were published, two of them on the same page:</p>
<div class="chk"><table>
  <tr><th style="width:36%">Where it appears</th><th>What it says</th></tr>
  <tr><td>Official product page</td><td>&ldquo;30-Day Money-Back Guarantee, no questions asked&rdquo; in one
      place, and &ldquo;60-Day Money-Back Guarantee&rdquo; in another &mdash; both on that page</td></tr>
  <tr><td>Checkout page, top banner</td><td>&ldquo;60 days money back guarantee&rdquo;</td></tr>
  <tr><td>Checkout page, footer</td><td>&ldquo;We allow returns or replacement for any product within 90
      days from the date of purchase&rdquo;</td></tr>
</table></div>
<p><strong>Treat the shortest one as the safe assumption</strong> and confirm the window in your order
confirmation. If you intend to rely on the refund, do not rely on a figure you read on a page you cannot
produce later.</p>

${cta('See the Seller&rsquo;s Current Terms')}

<h2>Where it is worth it, and where it is not</h2>
<div class="pc">
  <div>
    <h3>Points in its favour</h3>
    <ul>
      <li>Sold direct-to-consumer, so the same party takes the order, the shipping and the refund.</li>
      <li>The seller states it is formulated and bottled in the United States in GMP-certified facilities, and that each batch is third-party tested for purity and potency.</li>
      <li>Liquid drops taken at home, with no pill to swallow &mdash; and the directions allow the routine to be as short as once a day, which is the part most supplements fail on.</li>
      <li>The seller states the formula is free from alcohol, sugar and gluten.</li>
      <li>There is a published refund policy, and the seller&rsquo;s pages refer to cancelling at any time.</li>
      <li>Shipping is free on the checkout our links open.</li>
    </ul>
  </div>
  <div>
    <h3>Points against, and they are real</h3>
    <ul>
      <li><strong>Two different ingredient panels</strong> on the seller&rsquo;s own site, with two blend weights and no amount given for any single ingredient.</li>
      <li><strong>A &ldquo;Wellness Club&rdquo; membership added to the cart</strong> with a free trial that bills $77 a month for six months &mdash; $462 &mdash; unless cancelled.</li>
      <li><strong>A $9.95 shipping upgrade ticked by default</strong> at the checkout.</li>
      <li><strong>Three different refund windows</strong>, two of them on the same page.</li>
      <li>Two different price ladders for the same product.</li>
      <li>The only evidence cited is &ldquo;a 12-week observational study on 200 adults&rdquo;, published without a reference we could check.</li>
      <li>Sold direct-to-consumer only, as far as we could see, so there is no way to buy a single bottle in person to try.</li>
    </ul>
  </div>
</div>

<h2 id="how-lymph-moves">Why a product like this is sold as a daily routine</h2>
<p>Unlike blood, which the heart pushes, lymph has no central pump. It is moved by muscle contraction, by
breathing and by pressure from outside &mdash; which is the reason a compression garment and walking do
something, and the reason products of this kind are sold as something you do every day rather than
something you take once. That much is anatomy, and it is the part of the seller&rsquo;s framing that is
not in dispute.</p>
<p>What it does not tell you is how much of anything is in a dose, or whether a botanical taken by mouth
changes any of it. The seller cites one 12-week observational study on 200 adults and publishes no
reference for it, so there is no way to see what was measured or by whom. We cannot close that gap and
neither can the page you are reading.</p>

<h2>Who this is for, and who it is not for</h2>
<p>Everyday puffiness and heaviness &mdash; at the end of a long day, after a flight, after a salty meal, in
hot weather &mdash; is the situation this kind of product is sold for, and it is the situation most people
mean when they go looking for one. Swelling that does not settle, or that comes with any of the warning
signs at the top of this page, is a different matter and belongs with a doctor rather than with a
supplement.</p>
${D_NAOSUB}
<p>It is not for use during pregnancy or breastfeeding, or by anyone under 18. Nothing here replaces
compression garments, manual lymphatic drainage, prescribed medication or the advice of your own clinician
&mdash; if you already use any of those, keep using them.</p>

<h2 id="faq">Questions people actually ask</h2>
<dl class="faq">
  <dt>Is LinfaFlow a scam?</dt>
  <dd>We found no sign of one. It is a real product from a company that publishes a refund policy, a way to
      cancel and a support phone number. We have not placed an order, so we cannot speak to delivery, and we
      would not trust a page that claimed to without buying. The problems we found are about clarity of
      terms, not about whether the product exists &mdash; and they are all listed above so you can judge
      them yourself.</dd>

  <dt>Does it work?</dt>
  <dd>We cannot tell you that, and we would be suspicious of a page that did. Nobody here has used it, the
      published ingredient information exists in two versions that disagree, and the only evidence the
      seller cites is a 12-week observational study on 200 adults given without a reference we could check.
      What we can tell you is what the seller says is in it, what it costs, what else lands in the cart and
      how the refund works. That makes the decision yours rather than ours.</dd>

  <dt>Is it a subscription?</dt>
  <dd>It can be, and there are two separate recurring charges to look for. The drops can be bought once or
      on a subscription that renews every 30 days until cancelled. Separately, the store&rsquo;s order text
      says a &ldquo;Wellness Club&rdquo; membership is included in the cart on a 14-day free trial and then
      bills $77 a month for six months. Check both before you confirm.</dd>

  <dt>What does it taste like?</dt>
  <dd>The seller does not describe the taste, and we have not tasted it. It is a herbal liquid taken under
      the tongue or stirred into water, tea or juice &mdash; the seller offers the second option itself,
      which is usually how a tincture is taken by people who dislike the first.</dd>

  <dt>How long does a bottle last?</dt>
  <dd>The seller lists 59 servings of 1 mL per container. At one dropper once a day that is close to two
      months; at two droppers twice a day it is about two weeks. The range comes from the seller&rsquo;s own
      instruction, which gives a range rather than a dose.</dd>

  <dt>Where should I buy it?</dt>
  <dd>From the seller&rsquo;s own site. A listing anywhere else is not the seller, which means the
      seller&rsquo;s refund policy and support are not yours to use.</dd>

  <dt>Can I take it with my medication?</dt>
  <dd>Ask your doctor or pharmacist, and take the bottle with you. That is the honest answer and the only
      one we will give &mdash; particularly with diuretics, anticoagulants, or medication for blood
      pressure, blood sugar or the thyroid. One of the two published panels contains caffeine sources and a
      liquorice derivative, which is a further reason to have the actual label in front of you.</dd>

  <dt>What if I want a refund?</dt>
  <dd>Contact the seller, not us. We do not sell, ship or process payments and we cannot see your order. The
      seller&rsquo;s support is reachable at support&#64;linfaflow.com and on +1 (888) 811-1186, with a
      separate refunds line on +1 (800) 390-6035. Confirm your refund window at the time of purchase,
      because the seller publishes three different ones.</dd>
</dl>

${caixa('What we would want a reader to do',
`Open the seller&rsquo;s page and check four things before you enter a card: what is actually in the cart
besides the bottles, whether you are buying once or subscribing, what refund window that page states, and
what the label says it contains. If the answers satisfy you, buy. If they do not, that is a good reason not
to &mdash; and we would rather say so than have you charged for something you did not mean to buy.`)}

${cta('Go to the Seller&rsquo;s Order Page')}

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
// ⚠️ Cada linha aqui é uma DIVULGAÇÃO que já foi apurada e que a página não pode perder numa
// reescrita. A conferência é por frase justamente para reprovar quando alguém reescrever o
// parágrafo e o fato sair junto — foi o que aconteceu na 1ª revisão desta página.
const OBRIGATORIO = [
  ['não-uso declarado', 'We have not used this product'],
  ['não-independência declarada', 'not an independent review site'],
  ['assinatura das gotas divulgada', 'every 30 days thereafter until you cancel'],
  ['associação de $462 divulgada', '$77 per month for a total of 6 consecutive monthly payments'],
  ['upgrade pré-marcado divulgado', 'ticked by default'],
  ['os DOIS painéis de ingrediente', 'Proprietary Herbal Blend, 200 mg'],
  ['o painel que BATE com os botânicos', 'Proprietary Blend, 300 mg'],
  ['estudo citado sem referência', '12-week observational study'],
  ['rótulo de anúncio', 'pdc-ad-label'],
  ['disclosure de afiliado', 'pdc-affiliate-disclosure'],
  ['aviso médico', 'pdc-health-notice'],
  ['DSHEA', 'pdc-dshea'],
  ['identidade do publisher', 'pdc-publisher'],
];
// ⚠️ Âncora de sitelink se confere por CONTEÚDO, não por existência. A versão anterior só olhava
// `id="x"` e por isso aprovou uma página em que #how-lymph-moves apontava para o parágrafo que
// dizia ao leitor que o produto não resolve o problema dele — o clique pago mais caro da campanha
// caindo no texto mais desmobilizador. Existir não é entregar.
const ANCORAS = [
  ['botanicals', 'Proprietary Blend, 300 mg'],
  ['the-ritual', 'droppers'],
  ['how-lymph-moves', 'no central pump'],
  ['faq', 'refund'],
];
// ⚠️ Colapsa espaço ANTES de conferir qualquer frase: o template quebra linha no meio das frases,
// e conferência sensível a quebra reprova página CERTA — tão inútil quanto a que aprova a errada.
const corrido = html.replace(/\s+/g, ' ');
const texto = corrido.replace(/<[^>]*>/g, ' ').toLowerCase();
const achou = PROIBIDO.filter((p) => texto.includes(p.toLowerCase()));
const faltou = OBRIGATORIO.filter(([, m]) => !corrido.includes(m)).map(([n]) => n);
const ctas = (html.match(/data-pdc-aff-param/g) || []).length;
const disclosures = (html.match(/Paid link &mdash; we earn a commission/g) || []).length;
const ancoras = ANCORAS.filter(([a, frase]) => {
  const i = html.indexOf(`id="${a}"`);
  return i < 0 || !html.slice(i, i + 3000).includes(frase);
}).map(([a]) => a);
const placeholder = /SEU-DOMINIO|RAZAO SOCIAL|ENDERECO POSTAL|\[EMAIL@/.test(html);
// ⚠️ O Scrape Shield da Cloudflare reescreve todo "@" LITERAL para "[email protected]", e o token
// do projeto não tem Zone Settings:Edit para desligá-lo. Um "@" cru na resposta de reembolso
// apagaria justamente o endereço que o leitor precisa. O `@` tem que ser sempre `&#64;`.
const arrobaCru = /[^&#][a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(html.replace(/&#64;/g, ''));
// ⚠️ Rótulo de CTA tem que descrever o DESTINO. Os três diziam "Official Product Page" e abriam o
// checkout — a única coisa que a página escondia, num texto cujo capital é não esconder nada.
const rotuloFalso = /(Official Product Page|Official LinfaFlow Page|official site)/i.test(
  (html.match(/class="cta"[^>]*>([^<]*)</g) || []).join(' '));
// ⚠️ A duração do frasco apareceu escrita de dois jeitos diferentes na MESMA página (um mês no
// corpo, dois meses no FAQ) — numa página cujo argumento é que o VENDEDOR se contradiz.
const duracaoIncoerente = (corrido.match(/close to two months/g) || []).length < 2;

console.log(`review: ${DESTINO}/index.html · ${Math.round(Buffer.byteLength(html) / 1024)} KB`);
console.log(`  CTAs rastreados: ${ctas} · disclosures acima de CTA: ${disclosures}`);
console.log(`  âncoras sem o conteúdo prometido: ${ancoras.length ? ancoras.join(', ') : 'nenhuma'}`);
console.log(`  proibidos: ${achou.length ? achou.join(', ') : 'nenhum'}`);
console.log(`  divulgações obrigatórias faltando: ${faltou.length ? faltou.join(', ') : 'nenhuma'}`);
console.log(`  @ cru (a Cloudflare apagaria): ${arrobaCru ? 'SIM' : 'não'} · rótulo de CTA falso: ${rotuloFalso ? 'SIM' : 'não'} · duração incoerente: ${duracaoIncoerente ? 'SIM' : 'não'}`);
if (achou.length || faltou.length || ancoras.length || placeholder || arrobaCru || rotuloFalso
    || duracaoIncoerente || ctas !== disclosures || ctas === 0) {
  console.error('\nBUILD REPROVADA' + (ctas !== disclosures ? ` — ${ctas} CTAs para ${disclosures} disclosures: cada CTA precisa do seu` : ''));
  process.exit(1);
}
console.log('  build aprovada');
