# hw-affiliate — páginas publicadas em nationalhealthnews.blog

Este repo é a **fonte de publicação** do projeto Cloudflare Pages. Em modo git, a Cloudflare
publica **tudo que está aqui** — então o que não pode ir ao ar não pode ficar no `main`.

## Como gerar

```
node gerar-paginas.mjs        # lê anuncios.json e escreve dist/
```

O que muda entre as páginas de um mesmo grupo é **só o primeiro bloco** (H1 ou subheadline,
nunca os dois) — é o teste A/B de congruência busca → anúncio → página.

## Carimbo de versão das páginas (`carimbar.mjs` + `paginas.json`)

Cada `<pasta>/index.html` (até 3 níveis; a raiz, `404.html` e as páginas legais ficam de fora)
carrega duas metas logo depois do **primeiro** `<head>`:

```
<meta name="pdc-page" content="ankle-swelling/adv">
<meta name="pdc-version" content="v2-9c27787">
```

O `tracking.js` lê as duas e grava na sessão qual página **e qual versão** a pessoa viu — é o que
responde "qual palavra-chave × criativo × versão de página vendeu". A versão é **imutável**:
`hash7` = sha256 do arquivo sem as duas metas e com quebras de linha em LF (CRLF↔LF não muda a
versão); `N` é sequencial **por slug** e mora em `paginas.json`, que guarda a versão corrente e o
histórico (`versao`, `hash`, `em`, `commit`, `nota`). Conteúdo igual = mesma versão = nada é
escrito; conteúdo diferente = N+1 e uma entrada nova no histórico.

```
node carimbar.mjs                  # carimba o que mudou e atualiza paginas.json
node carimbar.mjs --check          # não escreve; sai com 1 se há página sem carimbo ou desatualizada
node carimbar.mjs --nota "texto"   # anota o motivo nas versões criadas nesta rodada
node --test carimbar.test.mjs      # testes (só pastas temporárias)
```

**Ative o hook uma vez por clone** — a cada commit ele carimba e faz `git add` do que carimbou
mais o `paginas.json`:

```
git config core.hooksPath .githooks
```

Gotchas: o `commit` gravado no manifesto é o HEAD no momento do carimbo (dentro do hook, é o
commit **pai** — o que está nascendo ainda não existe); o hook carimba **todas** as páginas, então
página editada e não staged entra no commit (ele avisa na tela); arquivo minificado (`<head>` no
meio da linha) recebe as metas coladas ao `<head>`, sem ganhar linhas; **nunca edite as metas à
mão** — o carimbo é derivado do conteúdo, e `--check` reprova o que divergir.

## Estrutura

- `ankle-swelling/`, `water-retention/`, `puffy-face/`, `lymphatic-support/`, `linfaflow/`
  — cada um com `/a/` e `/b/` (controle + 2 braços = 15 páginas)
- `index.html`, `404.html`, `privacy.html`, `terms.html`, `contact.html`

## Páginas-história ("mom de Ohio") — `/<tema>/story/`

Uma por ad group da campanha `24120677924` (2026-08-13): `ankle-swelling/story/`,
`water-retention/story/`, `puffy-face/story/`, `lymphatic-support/story/`, `linfaflow/story/`.
São a NARRATIVA do Advertorial 3 do fornecedor reescrita **Google-safe**: sem médico fictício,
sem quase-morte/clot, sem timeline de resultado, sem "leaky veins" — persona declarada como
**história composta** (disclosure no byline e no FAQ), blocos de conformidade idênticos aos das
páginas A/B, dek = subheadline sobrevivente do `anuncios.json`, âncoras dos sitelinks de cada
grupo garantidas. O primeiro bloco de cada uma ecoa a keyword do grupo (congruência).
Assets: referenciam `../assets/` (o do tema). O tracking herda das linhas já existentes em
`pressell_deployments` (o `tracking-resolve` casa por `path.startsWith('/<slug>/')`).

## ⚠️ Material do fornecedor NÃO está aqui, de propósito

Os advertoriais do H&W (`h2/`, `h-w-linfaflow-...`) foram removidos do `main` porque **não
passam na política do Google**: 36 ocorrências proibidas em 34 mil caracteres de texto — não são
adjetivos, é a espinha do argumento ("reduced or completely eliminated their diuretic
medications", "canceled the vein procedures their doctor had recommended", "chronic venous
insufficiency", "Top MD" 9x com médico fictício assinando, "Vascular Drowning Syndrome",
tabela comparando o custo do suplemento com consulta médica e diurético com receita).

Estão preservados no branch **`material-fornecedor`** e em `generated_pressells` no Supabase.
Não trazer de volta para o `main`: em modo git isso os coloca no ar automaticamente.

## ⚠️ Contato

`contact.html` está com placeholder. A FTC exige contato real num site de afiliado — preencher
antes de rodar anúncio.
