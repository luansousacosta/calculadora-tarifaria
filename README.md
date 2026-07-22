# Simulador de economia solar — Sousa Costa Energia

Calculadora simples e voltada ao cliente (Grupo B) que compara três caminhos e
gera um relatório de economia:

- **Solar próprio** — estima potência (kWp), investimento e retorno (payback).
- **Solar + bateria (híbrido)** — mesma base, com backup e maior autoconsumo
  (investimento = solar + 85%).
- **Assinatura de energia** — sem investir, desconto garantido sobre o
  economizável.

Base de cálculo: tarifas da **Neoenergia Cosern — B1 Residencial** (fatura
06/2026, com tributos), regra do **maior valor entre Fio B e custo de
disponibilidade** + CIP (Lei 14.300/2022) e preços médios de sistemas da
**Pesquisa SED Greener (jan/2026)**.

Construído em **React + Vite + Tailwind CSS** com **Framer Motion**.

## Rodar localmente

```bash
npm install
npm run dev
```

## Deploy (GitHub Pages)

Deploy automático via **GitHub Actions** a cada push na `main`.

> Estimativas para orientação comercial; não substituem a fatura oficial.
