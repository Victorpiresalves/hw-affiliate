// carimbar.test.mjs — testes do carimbo de versão. Roda com: node --test carimbar.test.mjs
// Usa SÓ pastas temporárias; nunca toca nas páginas reais.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { calcularHash, carimbar, descobrirPaginas, rodar, separarCarimbo } from './carimbar.mjs';

const SCRIPT = fileURLToPath(new URL('./carimbar.mjs', import.meta.url));

const HTML_LF =
  '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>t</title>\n</head>\n<body>oi</body>\n</html>\n';
const HTML_CRLF = HTML_LF.replace(/\n/g, '\r\n');

function raizTemp(t) {
  const raiz = mkdtempSync(join(tmpdir(), 'carimbar-'));
  t.after(() => rmSync(raiz, { recursive: true, force: true }));
  return raiz;
}
function escreverPagina(raiz, slug, html) {
  const dir = join(raiz, ...slug.split('/'));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), Buffer.from(html, 'latin1'));
}
function lerPagina(raiz, slug) {
  return readFileSync(join(raiz, ...slug.split('/'), 'index.html')).toString('latin1');
}
function lerManifesto(raiz) {
  return JSON.parse(readFileSync(join(raiz, 'paginas.json'), 'utf8'));
}
function contar(texto, re) {
  return (texto.match(re) ?? []).length;
}
function cli(raiz, ...args) {
  return spawnSync(process.execPath, [SCRIPT, '--raiz', raiz, ...args], { encoding: 'utf8' });
}

test('hash ignora CRLF/LF e o carimbo não entra no hash', () => {
  assert.equal(calcularHash(HTML_LF), calcularHash(HTML_CRLF));
  const carimbado = carimbar(HTML_CRLF, 'x', 'v1-0000000', '\r\n');
  const { semCarimbo, carimbo } = separarCarimbo(carimbado);
  assert.equal(semCarimbo, HTML_CRLF, 'separar o carimbo devolve exatamente o original');
  assert.deepEqual({ slug: carimbo.slug, versao: carimbo.versao }, { slug: 'x', versao: 'v1-0000000' });
  assert.equal(calcularHash(semCarimbo), calcularHash(HTML_LF));
});

test('re-carimbar não bumpa: 2ª rodada é inalterada e não escreve nada', (t) => {
  const raiz = raizTemp(t);
  escreverPagina(raiz, 'adv1', HTML_CRLF);

  const r1 = rodar({ raiz, commit: 'abc1234', agora: '2026-08-27T00:00:00.000Z' });
  assert.equal(r1.resultados.length, 1);
  assert.match(r1.resultados[0].status, /^nova → v1-[0-9a-f]{7}$/);
  assert.deepEqual(r1.escritos, ['adv1/index.html']);
  assert.equal(r1.manifestoEscrito, true);

  const html1 = lerPagina(raiz, 'adv1');
  assert.match(
    html1,
    /<head>\r\n<meta name="pdc-page" content="adv1">\r\n<meta name="pdc-version" content="v1-[0-9a-f]{7}">\r\n<meta charset="utf-8">/,
    'as duas metas ficam logo após o <head>, cada uma na sua linha, com a quebra CRLF do arquivo',
  );
  assert.equal(contar(html1, /\r\n/g), contar(HTML_CRLF, /\r\n/g) + 2, 'exatamente 2 CRLF a mais');
  assert.equal(contar(html1, /(?<!\r)\n/g), 0, 'nenhum LF solto introduzido');

  const m1 = lerManifesto(raiz);
  assert.equal(m1.adv1.versao, r1.resultados[0].versao);
  assert.equal(m1.adv1.hash, calcularHash(HTML_LF));
  assert.equal(m1.adv1.commit, 'abc1234');
  assert.equal(m1.adv1.historico.length, 1);
  assert.equal(m1.adv1.historico[0].nota, null);
  const jsonAntes = readFileSync(join(raiz, 'paginas.json'), 'utf8');

  const r2 = rodar({ raiz, commit: 'outro999', agora: '2026-08-28T00:00:00.000Z' });
  assert.equal(r2.resultados[0].status, 'inalterada');
  assert.deepEqual(r2.escritos, []);
  assert.equal(r2.manifestoEscrito, false);
  assert.equal(lerPagina(raiz, 'adv1'), html1, 'bytes do arquivo idênticos');
  assert.equal(readFileSync(join(raiz, 'paginas.json'), 'utf8'), jsonAntes, 'manifesto idêntico');

  // CRLF↔LF do arquivo inteiro não muda a versão (só recarimba com a quebra nova).
  writeFileSync(join(raiz, 'adv1', 'index.html'), Buffer.from(html1.replace(/\r\n/g, '\n'), 'latin1'));
  const r3 = rodar({ raiz, commit: null });
  assert.equal(r3.resultados[0].versao, r1.resultados[0].versao, 'mesma versão depois de trocar CRLF por LF');
  assert.equal(r3.resultados[0].status, 'inalterada');
});

test('conteúdo mudado bumpa v1→v2, preserva o histórico e grava a --nota', (t) => {
  const raiz = raizTemp(t);
  escreverPagina(raiz, 'adv1', HTML_CRLF);
  const r1 = rodar({ raiz, commit: 'c1', agora: '2026-08-27T00:00:00.000Z' });
  const v1 = r1.resultados[0].versao;

  const mudado = lerPagina(raiz, 'adv1').replace('<body>oi</body>', '<body>oi, mudou</body>');
  writeFileSync(join(raiz, 'adv1', 'index.html'), Buffer.from(mudado, 'latin1'));

  const r2 = rodar({ raiz, commit: 'c2', agora: '2026-08-28T00:00:00.000Z', nota: 'troquei o corpo' });
  const v2 = r2.resultados[0].versao;
  assert.match(v2, /^v2-[0-9a-f]{7}$/);
  assert.notEqual(v2.slice(3), v1.slice(3), 'hash7 diferente');
  assert.equal(r2.resultados[0].status, `${v1} → ${v2}`);

  const m = lerManifesto(raiz);
  assert.equal(m.adv1.versao, v2);
  assert.equal(m.adv1.commit, 'c2');
  assert.equal(m.adv1.atualizado_em, '2026-08-28T00:00:00.000Z');
  assert.equal(m.adv1.historico.length, 2);
  assert.equal(m.adv1.historico[0].versao, v1);
  assert.equal(m.adv1.historico[0].commit, 'c1');
  assert.equal(m.adv1.historico[0].nota, null);
  assert.equal(m.adv1.historico[1].versao, v2);
  assert.equal(m.adv1.historico[1].nota, 'troquei o corpo');
  assert.equal(m.adv1.historico[1].em, '2026-08-28T00:00:00.000Z');

  const html2 = lerPagina(raiz, 'adv1');
  assert.equal(contar(html2, /pdc-version/g), 1, 'só UMA meta de versão (a antiga foi trocada, não empilhada)');
  assert.ok(html2.includes(`content="${v2}"`));
  assert.ok(!html2.includes(`content="${v1}"`));
  assert.equal(contar(html2, /\r\n/g), contar(HTML_CRLF, /\r\n/g) + 2);
});

test('--check reprova arquivo sem carimbo (exit 1) e não escreve; depois de carimbar, aprova', (t) => {
  const raiz = raizTemp(t);
  escreverPagina(raiz, 'tema/a', HTML_CRLF);

  const check1 = cli(raiz, '--check');
  assert.equal(check1.status, 1, `esperava exit 1; stdout=${check1.stdout} stderr=${check1.stderr}`);
  assert.match(check1.stderr, /tema\/a: sem carimbo/);
  assert.match(check1.stdout, /^tema\/a\tv1-[0-9a-f]{7}\tnova → v1-[0-9a-f]{7}\ttema\/a\/index\.html$/m);
  assert.equal(lerPagina(raiz, 'tema/a'), HTML_CRLF, '--check não toca no arquivo');
  assert.equal(existsSync(join(raiz, 'paginas.json')), false, '--check não cria o manifesto');

  const carimbo = cli(raiz, '--nota', 'carimbo inicial');
  assert.equal(carimbo.status, 0, carimbo.stderr);
  assert.equal(lerManifesto(raiz)['tema/a'].historico[0].nota, 'carimbo inicial');
  assert.match(lerPagina(raiz, 'tema/a'), /<meta name="pdc-page" content="tema\/a">/, 'slug de subpasta usa "/"');

  const check2 = cli(raiz, '--check');
  assert.equal(check2.status, 0, check2.stderr);
  assert.match(check2.stdout, /^tema\/a\tv1-[0-9a-f]{7}\tinalterada\ttema\/a\/index\.html$/m);

  // Carimbo editado à mão (versão que não bate) → --check reprova de novo.
  const adulterado = lerPagina(raiz, 'tema/a').replace(/content="v1-[0-9a-f]{7}"/, 'content="v9-1234567"');
  writeFileSync(join(raiz, 'tema', 'a', 'index.html'), Buffer.from(adulterado, 'latin1'));
  const check3 = cli(raiz, '--check');
  assert.equal(check3.status, 1);
  assert.match(check3.stderr, /carimbo desatualizado/);
});

test('só o PRIMEIRO <head> é carimbado; <header> não conta; minificado fica sem linhas novas', () => {
  const doisHeads =
    '<!doctype html>\r\n<html>\r\n<head>\r\n<meta charset="utf-8">\r\n</head>\r\n<body>\r\n<header class="topo">x</header>\r\n' +
    '<iframe srcdoc="<html><head><title>aninhado</title></head><body></body></html>"></iframe>\r\n</body>\r\n</html>\r\n';
  const c1 = carimbar(doisHeads, 'p', 'v1-abcdef0', '\r\n');
  assert.equal(contar(c1, /pdc-page/g), 1);
  assert.ok(c1.startsWith('<!doctype html>\r\n<html>\r\n<head>\r\n<meta name="pdc-page" content="p">\r\n<meta name="pdc-version" content="v1-abcdef0">\r\n<meta charset="utf-8">'));

  const semHead = '<html><body>nada</body></html>';
  assert.equal(carimbar(semHead, 'p', 'v1-abcdef0', '\n'), null);

  const soHeader = '<html>\n<header>x</header>\n</html>\n';
  assert.equal(carimbar(soHeader, 'p', 'v1-abcdef0', '\n'), null, '<header> não é <head>');

  const scriptAntesDoCharset = '<!DOCTYPE html>\r\n<html>\r\n\r\n<head>\r\n  <script>1</script>\r\n  <meta charset="UTF-8">\r\n</head>\r\n</html>\r\n';
  const c2 = carimbar(scriptAntesDoCharset, 'doctor', 'v1-abcdef0', '\r\n');
  assert.ok(c2.includes('<head>\r\n<meta name="pdc-page" content="doctor">\r\n<meta name="pdc-version" content="v1-abcdef0">\r\n  <script>1</script>'), 'carimbo antes do script, colado ao <head>');

  const minificado = '<!DOCTYPE html><html lang="en-US"><head><script>1</script><meta charset="UTF-8"><title>m</title></head><body></body></html>\r\n';
  const c3 = carimbar(minificado, 'min', 'v1-abcdef0', '\r\n');
  assert.ok(c3.startsWith('<!DOCTYPE html><html lang="en-US"><head><meta name="pdc-page" content="min"><meta name="pdc-version" content="v1-abcdef0"><script>1</script>'));
  assert.equal(contar(c3, /\r\n/g), contar(minificado, /\r\n/g), 'arquivo de uma linha não ganha linhas');
  assert.equal(separarCarimbo(c3).semCarimbo, minificado, 'separar devolve o original também no minificado');
});

test('descoberta: até 3 níveis, exclui a raiz, pastas ocultas e node_modules', (t) => {
  const raiz = raizTemp(t);
  writeFileSync(join(raiz, 'index.html'), HTML_LF);
  escreverPagina(raiz, 'n1', HTML_LF);
  escreverPagina(raiz, 'n1/n2', HTML_LF);
  escreverPagina(raiz, 'n1/n2/n3', HTML_LF);
  escreverPagina(raiz, 'n1/n2/n3/n4', HTML_LF);
  escreverPagina(raiz, '.oculta', HTML_LF);
  escreverPagina(raiz, 'node_modules/pacote', HTML_LF);
  mkdirSync(join(raiz, 'vazia'));
  assert.deepEqual(
    descobrirPaginas(raiz).map((p) => p.slug),
    ['n1', 'n1/n2', 'n1/n2/n3'],
  );
});

import { test as testeSoltas } from "node:test";
import assertSoltas from "node:assert/strict";
import { separarCarimbo as separarSoltas, calcularHash as hashSoltas } from "./carimbar.mjs";

testeSoltas("metas invertidas/soltas saem do hash e nao sobrevivem ao recarimbo", () => {
  const orig = "<html><head>\n<meta charset=\"utf-8\">\n<title>x</title></head></html>";
  const invertido = "<html><head>\n<meta name=\"pdc-version\" content=\"v1-0000000\">\n<meta name=\"pdc-page\" content=\"p\">\n<meta charset=\"utf-8\">\n<title>x</title></head></html>";
  const r = separarSoltas(invertido);
  assertSoltas.equal(r.carimbo, null);                 // par invertido NAO e carimbo valido
  assertSoltas.equal(r.soltas, 2);                     // ...mas as duas metas foram reconhecidas e removidas
  assertSoltas.equal((r.semCarimbo.match(/pdc-(page|version)/g) || []).length, 0);
  assertSoltas.equal(hashSoltas(r.semCarimbo), hashSoltas(orig));   // e nao entram no hash
});
