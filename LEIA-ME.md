# hw-affiliate — páginas publicadas em nationalhealthnews.blog

Este repo é a **fonte de publicação** do projeto Cloudflare Pages. Em modo git, a Cloudflare
publica **tudo que está aqui** — então o que não pode ir ao ar não pode ficar no `main`.

## Como gerar

```
node gerar-paginas.mjs        # lê anuncios.json e escreve dist/
```

O que muda entre as páginas de um mesmo grupo é **só o primeiro bloco** (H1 ou subheadline,
nunca os dois) — é o teste A/B de congruência busca → anúncio → página.

## Estrutura

- `ankle-swelling/`, `water-retention/`, `puffy-face/`, `lymphatic-support/`, `linfaflow/`
  — cada um com `/a/` e `/b/` (controle + 2 braços = 15 páginas)
- `index.html`, `404.html`, `privacy.html`, `terms.html`, `contact.html`

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
