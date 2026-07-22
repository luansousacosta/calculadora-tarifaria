# Calculadora de tarifas e valoração de energia

Simulador tarifário da **Sousa Costa Energia** baseado na **Resolução
Homologatória ANEEL nº 3.573/2026** (Neoenergia Cosern — Rio Grande do Norte)
e nas planilhas de aplicação tarifária (PCAT 2026).

Construído em **React + Vite + Tailwind CSS** com **Framer Motion**.

## O que a calculadora faz

- Escolha de **grupo e subgrupo tarifário** (Grupo A: A2, A3, A3a/A4 · Grupo B:
  B1, B2, B3, B4), modalidade (Azul/Verde · Convencional/Branca) e posto.
- **Dados da fatura:** energia consumida e injetada (no Grupo A, por posto —
  ponta e fora de ponta — além da demanda contratada).
- **Tributos (RN):** ICMS e PIS/COFINS aplicados "por dentro", ajustáveis.
- **Bandeiras tarifárias:** verde / amarela / vermelha P1 / vermelha P2.
- **Valoração da energia injetada (Lei 14.300/2022):**
  - **Grupo B** — Fio B (valor exato da planilha) sobre a energia injetada,
    conforme a transição; cobrança mínima = maior entre o custo de
    disponibilidade (30/50/100 kWh) e o Fio B.
  - **Grupo A** — Fio B cobrado na demanda; energia injetada compensada 100%.

## Rodar localmente

```bash
npm install
npm run dev
```

## Build de produção

```bash
npm run build      # gera a pasta dist/
npm run preview    # pré-visualiza o build
```

## Deploy (GitHub Pages)

O deploy é automático via **GitHub Actions** (`.github/workflows/deploy.yml`)
a cada push na branch `main`. Basta habilitar o Pages em
**Settings → Pages → Source: GitHub Actions** (o workflow também tenta
habilitar automaticamente).

> Os resultados são estimativas para orientação comercial e não substituem a
> fatura oficial da distribuidora.
