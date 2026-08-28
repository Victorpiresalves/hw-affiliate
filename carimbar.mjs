#!/usr/bin/env node
// carimbar.mjs — carimbo de VERSÃO imutável nas páginas publicadas.
//
// Cada `<pasta>/index.html` (até 3 níveis, nunca a raiz) recebe, logo após o primeiro `<head>`:
//   <meta name="pdc-page" content="<slug>">
//   <meta name="pdc-version" content="v<N>-<hash7>">
// e o manifesto `paginas.json` guarda a versão corrente + histórico por slug.
//
// hash7 = sha256 do conteúdo SEM as duas metas e com quebras de linha normalizadas para LF
// (CRLF↔LF não muda a versão; rodar de novo é idempotente). N é sequencial POR SLUG.
//
// Uso:  node carimbar.mjs                 carimba o que mudou e atualiza paginas.json
//       node carimbar.mjs --check         não escreve nada; sai com 1 se há página sem
//                                         carimbo, com carimbo desatualizado ou fora do manifesto
//       node carimbar.mjs --nota "texto"  grava a nota nas entradas de histórico criadas agora
//       node carimbar.mjs --raiz <dir>    raiz do repo (padrão: a pasta deste arquivo)
//
// Saída: uma linha por página, separada por TAB: slug, versão, status, arquivo.
// status ∈ "inalterada" | "nova → v1" | "v2 → v3" | "v3 (recarimbada)".
// Node 22, sem dependências. Bytes são lidos/gravados como latin1 (round-trip exato).

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const PROFUNDIDADE_MAX = 3;
export const NOME_MANIFESTO = 'paginas.json';

const RE_HEAD = /<head(?:\s[^>]*)?>/i; // não casa <header>: exige ">" ou espaço logo após "head"
const RE_CARIMBO =
  /(?:\r\n|\n)?<meta name="pdc-page" content="([^"]*)">(?:\r\n|\n)?<meta name="pdc-version" content="([^"]*)">/;
const RE_SLUG_VALIDO = /^[A-Za-z0-9._][A-Za-z0-9._-]*(?:\/[A-Za-z0-9._][A-Za-z0-9._-]*)*$/;
const RE_VERSAO = /^v(\d+)-([0-9a-f]{7})$/;
const PASTAS_IGNORADAS = new Set(['node_modules', 'dist']);

export function metaPagina(slug) {
  return `<meta name="pdc-page" content="${slug}">`;
}
export function metaVersao(versao) {
  return `<meta name="pdc-version" content="${versao}">`;
}

/** Quebra de linha dominante do arquivo (CRLF quando há mais CRLF do que LF solto). */
export function eolDominante(conteudo) {
  let crlf = 0;
  let lf = 0;
  for (let i = 0; i < conteudo.length; i++) {
    if (conteudo.charCodeAt(i) !== 10) continue;
    if (i > 0 && conteudo.charCodeAt(i - 1) === 13) crlf++;
    else lf++;
  }
  return crlf > lf ? '\r\n' : '\n';
}

const RE_META_SOLTA = /(?:\r\n|\n)?<meta name="pdc-(?:page|version)" content="[^"]*">/g;

/**
 * Remove o carimbo (a primeira ocorrência do par de metas) e devolve o que ele dizia.
 * ⚠️ Metas SOLTAS ou INVERTIDAS (alguém trocou a ordem à mão) também saem: sem isto o par velho
 * entraria no hash (bump falso) e o script inseriria um par NOVO por cima — dois pdc-version no
 * arquivo para sempre, com --check passando. Tudo que sobrou com name="pdc-*" sai antes do hash;
 * `soltas` conta quantas, para a saída dizer que recarimbou por causa disso.
 */
export function separarCarimbo(conteudo) {
  const m = RE_CARIMBO.exec(conteudo);
  let semCarimbo = m ? conteudo.slice(0, m.index) + conteudo.slice(m.index + m[0].length) : conteudo;
  const soltas = (semCarimbo.match(RE_META_SOLTA) || []).length;
  if (soltas) semCarimbo = semCarimbo.replace(RE_META_SOLTA, '');
  if (!m) return { semCarimbo, carimbo: null, soltas };
  return { semCarimbo, carimbo: { slug: m[1], versao: m[2], indice: m.index }, soltas };
}

/** sha256 (hex) do conteúdo com CRLF e CR normalizados para LF. */
export function calcularHash(semCarimbo) {
  const normalizado = semCarimbo.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return createHash('sha256').update(Buffer.from(normalizado, 'latin1')).digest('hex');
}

/**
 * Insere as duas metas logo após o PRIMEIRO `<head>`.
 * Se o `<head>` é seguido de quebra de linha, as metas viram duas linhas próprias (com a
 * quebra dominante do arquivo). Se não é (arquivo minificado, tudo numa linha), entram coladas
 * ao `<head>` — um arquivo sem linhas não ganha linhas.
 */
export function carimbar(semCarimbo, slug, versao, eol) {
  const m = RE_HEAD.exec(semCarimbo);
  if (!m) return null;
  const fim = m.index + m[0].length;
  const seguidoDeQuebra = semCarimbo.startsWith('\r\n', fim) || semCarimbo.startsWith('\n', fim);
  const separador = seguidoDeQuebra ? eol : '';
  const carimbo = separador + metaPagina(slug) + separador + metaVersao(versao);
  return semCarimbo.slice(0, fim) + carimbo + semCarimbo.slice(fim);
}

export function numeroDaVersao(versao) {
  const m = RE_VERSAO.exec(String(versao ?? ''));
  return m ? Number(m[1]) : 0;
}

/** Todas as `<pasta>/index.html` até PROFUNDIDADE_MAX níveis, excluindo a raiz. Ordenadas por slug. */
export function descobrirPaginas(raiz) {
  const achadas = [];
  const andar = (dir, profundidade) => {
    if (profundidade > PROFUNDIDADE_MAX) return;
    let entradas;
    try {
      entradas = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entradas) {
      if (!e.isDirectory()) continue;
      if (e.name.startsWith('.') || PASTAS_IGNORADAS.has(e.name)) continue;
      const pasta = join(dir, e.name);
      const indice = join(pasta, 'index.html');
      if (existsSync(indice)) {
        const slug = relative(raiz, pasta).split(sep).join('/');
        achadas.push({ slug, arquivo: indice, arquivoRel: `${slug}/index.html` });
      }
      andar(pasta, profundidade + 1);
    }
  };
  andar(raiz, 1);
  return achadas.sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
}

export function lerManifesto(raiz) {
  const caminho = join(raiz, NOME_MANIFESTO);
  if (!existsSync(caminho)) return {};
  const texto = readFileSync(caminho, 'utf8');
  const dados = JSON.parse(texto);
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
    throw new Error(`${NOME_MANIFESTO} não é um objeto JSON`);
  }
  return dados;
}

export function serializarManifesto(manifesto) {
  const ordenado = {};
  for (const slug of Object.keys(manifesto).sort()) ordenado[slug] = manifesto[slug];
  return `${JSON.stringify(ordenado, null, 2)}\n`;
}

function lerCommit(raiz) {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: raiz,
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    }).trim() || null;
  } catch {
    return null;
  }
}

/**
 * Roda uma rodada completa.
 * @param {object} opts
 * @param {string} opts.raiz          raiz do repo
 * @param {boolean} [opts.check]      só diagnostica; não escreve nada
 * @param {string|null} [opts.nota]   nota das entradas de histórico criadas nesta rodada
 * @param {string} [opts.agora]       ISO do carimbo (padrão: agora)
 * @param {string|null} [opts.commit] sha para gravar (undefined = ler o HEAD do git; null = nenhum)
 */
export function rodar(opts) {
  const raiz = opts.raiz;
  const check = Boolean(opts.check);
  const nota = opts.nota ?? null;
  const agora = opts.agora ?? new Date().toISOString();
  const commit = opts.commit === undefined ? lerCommit(raiz) : opts.commit;

  const manifestoAntes = lerManifesto(raiz);
  const manifesto = structuredClone(manifestoAntes);
  const paginas = descobrirPaginas(raiz);
  const resultados = [];
  const problemas = [];
  const avisos = [];
  const escritos = [];
  let versoesNovas = 0;

  for (const pagina of paginas) {
    const { slug, arquivo, arquivoRel } = pagina;
    if (!RE_SLUG_VALIDO.test(slug)) {
      problemas.push({ slug, motivo: 'slug com caractere fora de [A-Za-z0-9._-/] — não carimbada' });
      resultados.push({ slug, versao: '', status: 'ignorada (slug inválido)', arquivo: arquivoRel, escrito: false });
      continue;
    }

    const original = readFileSync(arquivo).toString('latin1');
    const { semCarimbo, carimbo } = separarCarimbo(original);
    const hash = calcularHash(semCarimbo);
    const atual = manifesto[slug];

    let versao;
    let bump;
    if (!atual) {
      versao = `v1-${hash.slice(0, 7)}`;
      bump = true;
    } else if (atual.hash === hash) {
      versao = atual.versao;
      bump = false;
    } else {
      versao = `v${numeroDaVersao(atual.versao) + 1}-${hash.slice(0, 7)}`;
      bump = true;
    }

    const novo = carimbar(semCarimbo, slug, versao, eolDominante(original));
    if (novo === null) {
      problemas.push({ slug, motivo: 'sem tag <head> — não carimbada' });
      resultados.push({ slug, versao: '', status: 'ignorada (sem <head>)', arquivo: arquivoRel, escrito: false });
      continue;
    }
    const precisaEscrever = novo !== original;

    let status;
    if (bump) status = atual ? `${atual.versao} → ${versao}` : `nova → ${versao}`;
    else if (precisaEscrever) status = `${versao} (recarimbada)`;
    else status = 'inalterada';

    if (bump || precisaEscrever) {
      const motivos = [];
      if (!carimbo) motivos.push('sem carimbo');
      else if (carimbo.slug !== slug || carimbo.versao !== versao) {
        motivos.push(`carimbo desatualizado (arquivo diz ${carimbo.slug}@${carimbo.versao}, esperado ${slug}@${versao})`);
      } else motivos.push('carimbo fora de lugar ou com quebra de linha divergente');
      if (!atual) motivos.push('fora do manifesto');
      else if (bump) motivos.push(`conteúdo mudou desde ${atual.versao}`);
      problemas.push({ slug, motivo: motivos.join('; ') });
    }

    if (!check) {
      if (precisaEscrever) {
        writeFileSync(arquivo, Buffer.from(novo, 'latin1'));
        escritos.push(arquivoRel);
      }
      if (bump) {
        versoesNovas++;
        manifesto[slug] = {
          versao,
          hash,
          atualizado_em: agora,
          commit,
          historico: [...(Array.isArray(atual?.historico) ? atual.historico : []), { versao, hash, em: agora, commit, nota }],
        };
      }
    }

    resultados.push({ slug, versao, status, arquivo: arquivoRel, escrito: !check && precisaEscrever });
  }

  const slugsVivos = new Set(paginas.map((p) => p.slug));
  for (const slug of Object.keys(manifesto)) {
    if (!slugsVivos.has(slug)) avisos.push(`${slug}: está no manifesto mas a página não existe mais (entrada mantida como histórico)`);
  }
  if (nota && !check && versoesNovas === 0) avisos.push('nenhuma versão nova nesta rodada — a nota não foi gravada');

  let manifestoEscrito = false;
  if (!check) {
    const antes = serializarManifesto(manifestoAntes);
    const depois = serializarManifesto(manifesto);
    const caminho = join(raiz, NOME_MANIFESTO);
    if (antes !== depois || !existsSync(caminho)) {
      writeFileSync(caminho, depois, 'utf8');
      manifestoEscrito = true;
    }
  }

  return { resultados, problemas, avisos, escritos, manifestoEscrito, manifesto };
}

function lerArgs(argv) {
  const opts = { check: false, nota: null, raiz: null, ajuda: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--check') opts.check = true;
    else if (a === '--nota') opts.nota = argv[++i] ?? '';
    else if (a.startsWith('--nota=')) opts.nota = a.slice('--nota='.length);
    else if (a === '--raiz') opts.raiz = argv[++i] ?? null;
    else if (a.startsWith('--raiz=')) opts.raiz = a.slice('--raiz='.length);
    else if (a === '--help' || a === '-h') opts.ajuda = true;
    else throw new Error(`argumento desconhecido: ${a}`);
  }
  if (opts.nota !== null && opts.nota.trim() === '') throw new Error('--nota exige um texto');
  return opts;
}

export function main(argv = process.argv.slice(2)) {
  let opts;
  try {
    opts = lerArgs(argv);
  } catch (e) {
    console.error(`carimbar: ${e.message}`);
    return 2;
  }
  if (opts.ajuda) {
    console.log('uso: node carimbar.mjs [--check] [--nota "texto"] [--raiz <dir>]');
    return 0;
  }
  const raiz = opts.raiz ?? dirname(fileURLToPath(import.meta.url));

  let r;
  try {
    r = rodar({ raiz, check: opts.check, nota: opts.nota });
  } catch (e) {
    console.error(`carimbar: ${e.message}`);
    return 2;
  }

  for (const x of r.resultados) console.log(`${x.slug}\t${x.versao}\t${x.status}\t${x.arquivo}`);
  for (const a of r.avisos) console.error(`aviso: ${a}`);

  if (opts.check) {
    if (r.problemas.length) {
      console.error(`\n${r.problemas.length} página(s) sem carimbo ou com carimbo desatualizado (rode "node carimbar.mjs"):`);
      for (const p of r.problemas) console.error(`  ${p.slug}: ${p.motivo}`);
      return 1;
    }
    console.error(`ok: ${r.resultados.length} página(s) carimbadas e coerentes com ${NOME_MANIFESTO}`);
    return 0;
  }

  const ignoradas = r.problemas.filter((p) => /não carimbada/.test(p.motivo));
  for (const p of ignoradas) console.error(`aviso: ${p.slug}: ${p.motivo}`);
  console.error(
    `${r.escritos.length} arquivo(s) carimbado(s), ${NOME_MANIFESTO} ${r.manifestoEscrito ? 'atualizado' : 'inalterado'}`,
  );
  return 0;
}

const chamadoDiretamente = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (chamadoDiretamente) process.exitCode = main();
