import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Gauge,
  Sun,
  ArrowLeftRight,
  ArrowLeft,
  Info,
  Calculator,
  Building2,
  Home,
  RotateCcw,
  Leaf,
} from "lucide-react";

/* ================================================================== *
 *  DADOS TARIFÁRIOS OFICIAIS
 *  Fonte: ANEEL — Resolução Homologatória nº 3.573, de 22/04/2026
 *  Distribuidora: Neoenergia Cosern (Rio Grande do Norte)
 *  Vigência: 22/04/2026 a 21/04/2027
 *
 *  Valores de TUSD (demanda em R$/kW) e TUSD+TE (energia em R$/MWh)
 *  extraídos das Tabelas 1 (Grupo A) e 2 (Grupo B) da Resolução.
 *  As linhas "SCEE" representam a tarifa aplicada ao faturamento da
 *  energia compensada (injetada) — Sistema de Compensação de Energia
 *  Elétrica, Lei nº 14.300/2022.
 * ================================================================== */

const META = {
  distribuidora: "Neoenergia Cosern — Rio Grande do Norte",
  resolucao: "Resolução Homologatória ANEEL nº 3.573/2026",
  vigencia: "22/04/2026 a 21/04/2027",
};

// energia: { tusd, te, fioB } em R$/MWh · demanda em R$/kW (Grupo A)
// scee: tarifa da energia injetada (R$/MWh) · fioB = parcela TUSD Distribuição
// usada na valoração da energia injetada (Lei 14.300).
// Valores da aba "TA - Aplicação" — PCAT Neoenergia Cosern 2026 (RTA 2026).
const TARIFAS = {
  A: {
    label: "Grupo A — média/alta tensão (com demanda)",
    subgrupos: {
      A2: {
        label: "A2 · 88 a 138 kV",
        modalidades: {
          AZUL: {
            demanda: { P: 26.36, FP: 12.08 },
            demandaFioB: { P: 13.3878, FP: 1.3388 },
            energia: {
              P: { tusd: 67.53, te: 494.6, fioB: 0 },
              FP: { tusd: 67.53, te: 291.65, fioB: 0 },
            },
            scee: { P: { tusd: 67.53, te: 9.76 }, FP: { tusd: 67.53, te: 9.76 } },
          },
        },
      },
      A3: {
        label: "A3 · 69 kV",
        modalidades: {
          AZUL: {
            demanda: { P: 29.23, FP: 15.05 },
            demandaFioB: { P: 14.4421, FP: 3.7088 },
            energia: {
              P: { tusd: 68.14, te: 494.6, fioB: 0 },
              FP: { tusd: 68.14, te: 291.65, fioB: 0 },
            },
            scee: { P: { tusd: 68.14, te: 9.76 }, FP: { tusd: 68.14, te: 9.76 } },
          },
        },
      },
      A4: {
        label: "A3a / A4 · 2,3 a 25 kV",
        modalidades: {
          AZUL: {
            demanda: { P: 77.92, FP: 32.0 },
            demandaFioB: { P: 63.9545, FP: 20.263 },
            energia: {
              P: { tusd: 117.19, te: 485.53, fioB: 0 },
              FP: { tusd: 117.19, te: 282.57, fioB: 0 },
            },
            scee: { P: { tusd: 117.19, te: 0.69 }, FP: { tusd: 117.19, te: 0.69 } },
          },
          VERDE: {
            demanda: { NA: 32.0 },
            demandaFioB: { NA: 20.263 },
            energia: {
              P: { tusd: 2009.69, te: 485.53, fioB: 1538.1083 },
              FP: { tusd: 117.19, te: 282.57, fioB: 0 },
            },
            scee: { P: { tusd: 2009.69, te: 0.69 }, FP: { tusd: 117.19, te: 0.69 } },
          },
        },
      },
    },
  },
  B: {
    label: "Grupo B — baixa tensão (sem demanda)",
    subgrupos: {
      B1: {
        label: "B1 · Residencial",
        modalidades: {
          CONVENCIONAL: {
            energia: { NA: { tusd: 482.36, te: 293.44, fioB: 266.9958 } },
            scee: { NA: { tusd: 482.36, te: -5.36 } },
          },
          BRANCA: {
            energia: {
              P: { tusd: 1190.91, te: 479.48, fioB: 867.7363 },
              INT: { tusd: 781.52, te: 276.53, fioB: 520.6418 },
              FP: { tusd: 372.14, te: 276.53, fioB: 173.5472 },
            },
            scee: {
              P: { tusd: 1190.91, te: -5.36 },
              INT: { tusd: 781.52, te: -5.36 },
              FP: { tusd: 372.14, te: -5.36 },
            },
          },
        },
      },
      B2: {
        label: "B2 · Rural",
        modalidades: {
          CONVENCIONAL: {
            energia: { NA: { tusd: 482.36, te: 293.44, fioB: 266.9958 } },
            scee: { NA: { tusd: 482.36, te: -5.36 } },
          },
          BRANCA: {
            energia: {
              P: { tusd: 1206.65, te: 479.48, fioB: 881.086 },
              INT: { tusd: 790.97, te: 276.53, fioB: 528.6516 },
              FP: { tusd: 375.29, te: 276.53, fioB: 176.2172 },
            },
            scee: {
              P: { tusd: 1206.65, te: -5.36 },
              INT: { tusd: 790.97, te: -5.36 },
              FP: { tusd: 375.29, te: -5.36 },
            },
          },
        },
      },
      B3: {
        label: "B3 · Comercial / Industrial / Demais",
        modalidades: {
          CONVENCIONAL: {
            energia: { NA: { tusd: 482.36, te: 293.44, fioB: 266.9958 } },
            scee: { NA: { tusd: 482.36, te: -5.36 } },
          },
          BRANCA: {
            energia: {
              P: { tusd: 1175.16, te: 479.48, fioB: 854.3865 },
              INT: { tusd: 772.08, te: 276.53, fioB: 512.6319 },
              FP: { tusd: 368.99, te: 276.53, fioB: 170.8773 },
            },
            scee: {
              P: { tusd: 1175.16, te: -5.36 },
              INT: { tusd: 772.08, te: -5.36 },
              FP: { tusd: 368.99, te: -5.36 },
            },
          },
        },
      },
      B4: {
        label: "B4 · Iluminação Pública",
        modalidades: {
          "B4a — Rede de distribuição": {
            energia: { NA: { tusd: 265.3, te: 161.39, fioB: 146.8477 } },
            scee: { NA: { tusd: 265.3, te: -5.36 } },
          },
          "B4b — Bulbo de lâmpada": {
            energia: { NA: { tusd: 289.42, te: 176.06, fioB: 160.1975 } },
            scee: { NA: { tusd: 289.42, te: -5.36 } },
          },
        },
      },
    },
  },
};

// Percentual do "Fio B" (TUSD Distribuição) pago sobre a energia INJETADA —
// regra de transição da Lei nº 14.300/2022 para geração distribuída.
const TRANSICAO_FIO_B = {
  2023: 0.15,
  2024: 0.3,
  2025: 0.45,
  2026: 0.6,
  2027: 0.75,
  2028: 0.9,
  2029: 1.0,
};

const POSTO_LABEL = {
  P: "Ponta",
  FP: "Fora de ponta",
  INT: "Intermediário",
  NA: "Único (sem posto)",
};

// Custo de disponibilidade (Grupo B) — consumo mínimo faturável por tipo de ligação
// (art. 98 da REN nº 1.000/2021).
const LIGACOES = {
  MONO: { label: "Monofásico (30 kWh)", kwh: 30 },
  BI: { label: "Bifásico (50 kWh)", kwh: 50 },
  TRI: { label: "Trifásico (100 kWh)", kwh: 100 },
};

// Bandeiras tarifárias — adicional sobre a energia consumida (R$/MWh).
// Valores fixados pela ANEEL em ato específico; ajuste se houver atualização.
const BANDEIRAS = {
  VERDE: { label: "Verde (sem adicional)", mwh: 0 },
  AMARELA: { label: "Amarela (+ R$ 18,85/MWh)", mwh: 18.85 },
  VERMELHA1: { label: "Vermelha P1 (+ R$ 44,63/MWh)", mwh: 44.63 },
  VERMELHA2: { label: "Vermelha P2 (+ R$ 78,77/MWh)", mwh: 78.77 },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const brl = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number.isFinite(v) ? v : 0
  );
const brl4 = (v) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(Number.isFinite(v) ? v : 0);

// R$/MWh -> R$/kWh
const rkwh = (mwh) => mwh / 1000;

const num = (v) => {
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

/* ================================================================== *
 *  Componente principal
 * ================================================================== */
export default function Calculadora() {
  const [grupo, setGrupo] = useState("B");
  const [subgrupo, setSubgrupo] = useState("B3");
  const [modalidade, setModalidade] = useState("CONVENCIONAL");
  const [posto, setPosto] = useState("NA");
  const [ano, setAno] = useState(2026);

  // Grupo B (posto único selecionado) — dados da fatura
  const [consumo, setConsumo] = useState("1000");
  const [injecao, setInjecao] = useState("400");
  // Grupo A — demanda contratada e energia por posto (dados da fatura)
  const [demandaP, setDemandaP] = useState("100");
  const [demandaFP, setDemandaFP] = useState("100");
  const [demandaUnica, setDemandaUnica] = useState("100"); // Verde: demanda única
  const [consumoP, setConsumoP] = useState("2000");
  const [consumoFP, setConsumoFP] = useState("8000");
  const [injecaoP, setInjecaoP] = useState("0");
  const [injecaoFP, setInjecaoFP] = useState("4000");
  const [ligacao, setLigacao] = useState("TRI");
  const [bandeira, setBandeira] = useState("VERDE");

  // Tributos (RN) — aplicados "por dentro". PIS/COFINS somados.
  const [icms, setIcms] = useState("20");
  const [pisCofins, setPisCofins] = useState("5");

  /* --- reconciliação das seleções em cascata --------------------- */
  const subgrupos = TARIFAS[grupo].subgrupos;
  const subKeys = Object.keys(subgrupos);
  const subOk = subKeys.includes(subgrupo) ? subgrupo : subKeys[0];
  const modalidades = subgrupos[subOk].modalidades;
  const modKeys = Object.keys(modalidades);
  const modOk = modKeys.includes(modalidade) ? modalidade : modKeys[0];
  const conf = modalidades[modOk];
  const postoKeys = Object.keys(conf.energia);
  const postoOk = postoKeys.includes(posto) ? posto : postoKeys[0];

  const onGrupo = (g) => {
    setGrupo(g);
    const s = Object.keys(TARIFAS[g].subgrupos)[0];
    setSubgrupo(s);
    const m = Object.keys(TARIFAS[g].subgrupos[s].modalidades)[0];
    setModalidade(m);
    setPosto(Object.keys(TARIFAS[g].subgrupos[s].modalidades[m].energia)[0]);
  };
  const onSub = (s) => {
    setSubgrupo(s);
    const m = Object.keys(subgrupos[s].modalidades)[0];
    setModalidade(m);
    setPosto(Object.keys(subgrupos[s].modalidades[m].energia)[0]);
  };
  const onMod = (m) => {
    setModalidade(m);
    setPosto(Object.keys(modalidades[m].energia)[0]);
  };
  const onPosto = (p) => setPosto(p);

  /* --- cálculo --------------------------------------------------- */
  const r = useMemo(() => {
    // Tributos "por dentro": tarifa_com_tributos = tarifa / (1 - (ICMS+PIS/COFINS))
    const aliqTotal = Math.min(0.99, Math.max(0, (num(icms) + num(pisCofins)) / 100));
    const fatorTrib = 1 / (1 - aliqTotal);
    // Bandeira tarifária — adicional sobre a energia consumida (R$/MWh)
    const bandeiraMwh = BANDEIRAS[bandeira]?.mwh ?? 0;
    const pct = TRANSICAO_FIO_B[ano] ?? 0.6;
    const isAg = grupo === "A";

    // Tarifas por posto (R$/kWh, já com tributos):
    //  cheia  = TUSD + TE (+ bandeira) — usada no consumo
    //  fio    = parcela cobrada sobre a energia INJETADA:
    //           Grupo B → TUSD_FioB exato (× %transição).
    //           Grupo A → 0: o Fio B do Grupo A é cobrado na DEMANDA, não na
    //           energia; a energia injetada é compensada integralmente.
    //  credito= valor da energia injetada = cheia − fio × %transição
    const tarifasDe = (pk) => {
      const en = conf.energia[pk];
      if (!en) return null;
      const semImposto = rkwh(en.tusd + en.te);
      const cheia = rkwh(en.tusd + en.te + bandeiraMwh) * fatorTrib;
      const fio = (isAg ? 0 : rkwh(en.fioB ?? 0)) * fatorTrib;
      return { semImposto, cheia, fio, tusd: en.tusd, te: en.te };
    };

    const scRef = conf.scee[postoOk];
    const tarifaScee = rkwh((scRef?.tusd ?? 0) + (scRef?.te ?? 0)) * fatorTrib;

    let out;
    if (isAg) {
      /* ---------------- GRUPO A (por posto) ---------------- */
      const isVerdeA = modOk === "VERDE";
      const dem = conf.demanda; // { P, FP } (Azul) ou { NA } (Verde)
      const demFioB = conf.demandaFioB || {};
      const custoDemanda = isVerdeA
        ? num(demandaUnica) * (dem.NA ?? 0)
        : num(demandaP) * (dem.P ?? 0) + num(demandaFP) * (dem.FP ?? 0);
      // Fio B do Grupo A — cobrado na demanda (parcela TUSD_FioB da demanda)
      const custoDemandaFioB = isVerdeA
        ? num(demandaUnica) * (demFioB.NA ?? 0)
        : num(demandaP) * (demFioB.P ?? 0) + num(demandaFP) * (demFioB.FP ?? 0);

      const cons = { P: num(consumoP), FP: num(consumoFP) };
      const inj = { P: num(injecaoP), FP: num(injecaoFP) };

      let custoConsumo = 0;
      let creditoBruto = 0;
      let custoFio = 0;
      const postosDet = [];
      ["P", "FP"].forEach((pk) => {
        const t = tarifasDe(pk);
        if (!t) return;
        const cConsumo = cons[pk] * t.cheia;
        const cCredBruto = inj[pk] * t.cheia;
        const cFio = inj[pk] * t.fio * pct;
        custoConsumo += cConsumo;
        creditoBruto += cCredBruto;
        custoFio += cFio;
        postosDet.push({
          posto: pk,
          consumo: cons[pk],
          injecao: inj[pk],
          tarifa: t.cheia,
          custoConsumo: cConsumo,
          creditoLiquido: cCredBruto - cFio,
        });
      });

      const creditoLiquido = creditoBruto - custoFio; // valor da energia injetada
      // Energia: paga o consumo, abate a injeção (líquida do fio). Não fica negativa.
      const energiaLiquida = Math.max(0, custoConsumo - creditoLiquido);
      const contaComSolar = custoDemanda + energiaLiquida;
      const contaSemSolar = custoDemanda + custoConsumo;
      const economiaTotal = contaSemSolar - contaComSolar;

      out = {
        modoA: true,
        custoDemanda,
        custoDemandaFioB,
        custoConsumo,
        creditoBruto,
        custoFioB: custoFio,
        creditoLiquido,
        energiaLiquida,
        contaSemSolar,
        contaComSolar,
        economiaTotal,
        postosDet,
        piso: custoDemanda,
      };
    } else {
      /* ---------------- GRUPO B (posto único) ---------------- */
      const t = tarifasDe(postoOk);
      const tarifaCheia = t.cheia;
      const kConsumo = num(consumo);
      const kInjecao = num(injecao);

      const valorConsumo = kConsumo * tarifaCheia; // energia consumida da rede
      const creditoBruto = kInjecao * tarifaCheia; // compensação pela injeção
      const custoFioB = kInjecao * t.fio * pct; // Fio B sobre a injeção
      const creditoLiquido = creditoBruto - custoFioB;

      const minKwh = LIGACOES[ligacao]?.kwh ?? 0;
      const custoDisponibilidade = minKwh * tarifaCheia;
      // Regra Lei 14.300: cobrança mínima = maior entre disponibilidade e Fio B
      const piso = Math.max(custoDisponibilidade, custoFioB);
      const pisoFioBMaior = custoFioB >= custoDisponibilidade;

      const contaLiquida = valorConsumo - creditoBruto;
      const contaComSolar = Math.max(contaLiquida, piso);
      const economiaTotal = valorConsumo - contaComSolar;

      out = {
        modoA: false,
        tarifaCheia,
        valorConsumo,
        creditoBruto,
        custoFioB,
        creditoLiquido,
        minKwh,
        custoDisponibilidade,
        piso,
        pisoFioBMaior,
        contaSemSolar: valorConsumo,
        contaComSolar,
        economiaTotal,
      };
    }

    // Tarifa cheia de referência para exibição (posto selecionado)
    const tRef = tarifasDe(postoOk) || { cheia: 0, semImposto: 0, fio: 0 };
    return {
      ...out,
      aliqTotal,
      bandeiraMwh,
      pct,
      tarifaScee,
      tarifaCheiaRef: tRef.cheia,
      tarifaSemImposto: tRef.semImposto,
      fioRef: tRef.fio,
    };
  }, [
    conf,
    postoOk,
    modOk,
    grupo,
    consumo,
    injecao,
    demandaP,
    demandaFP,
    demandaUnica,
    consumoP,
    consumoFP,
    injecaoP,
    injecaoFP,
    ano,
    icms,
    pisCofins,
    ligacao,
    bandeira,
  ]);

  const isA = grupo === "A";
  const isVerde = modOk === "VERDE";

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-royal-50/40 to-white font-sans text-royal-950">
      {/* Cabeçalho */}
      <header className="border-b border-royal-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <a
            href="https://www.sousacosta.com.br/"
            className="flex items-center gap-2.5"
            aria-label="Sousa Costa Energia"
          >
            <svg viewBox="0 0 100 100" className="h-9 w-9" aria-hidden="true">
              <rect width="100" height="100" rx="24" fill="#3E4095" />
              <path
                d="M68 34c-4-6-11-9-19-9-11 0-19 6-19 15 0 8 6 12 17 14 8 2 11 3 11 7 0 3-3 5-9 5-6 0-11-2-15-7l-8 9c5 7 13 10 22 10 12 0 20-6 20-16 0-8-6-12-18-15-7-2-10-3-10-6 0-3 3-5 8-5 5 0 9 2 12 6z"
                fill="#9AD52A"
              />
            </svg>
            <span className="font-display text-lg font-extrabold leading-none text-royal-700">
              Sousa Costa <span className="text-brand-600">Energia</span>
            </span>
          </a>
          <a
            href="https://www.sousacosta.com.br/"
            className="inline-flex items-center gap-1.5 rounded-full border border-royal-200 px-4 py-2 text-sm font-semibold text-royal-700 transition hover:bg-royal-50"
          >
            <ArrowLeft className="h-4 w-4" /> Ir para o site
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Título */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-500/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-700">
            <Calculator className="h-3.5 w-3.5" /> Simulador tarifário
          </span>
          <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight text-royal-950 sm:text-4xl">
            Calculadora de tarifas e valoração de energia
          </h1>
          <p className="mt-3 max-w-3xl text-royal-600">
            Escolha o grupo e subgrupo tarifário e informe os dados da fatura — energia{" "}
            <strong>consumida</strong> e <strong>injetada</strong> (e a demanda, no Grupo A). A
            calculadora mostra o valor da energia e a valoração da energia injetada conforme a Lei nº
            14.300/2022.
          </p>
          <p className="mt-2 text-xs text-royal-400">
            Base tarifária: {META.resolucao} · {META.distribuidora} · vigência {META.vigencia}.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-6 lg:grid-cols-5">
          {/* ---------------- Entradas ---------------- */}
          <div className="space-y-6 lg:col-span-3">
            {/* Configuração tarifária */}
            <Card>
              <CardTitle icon={Gauge}>Configuração tarifária</CardTitle>

              <Field label="Grupo tarifário">
                <div className="grid grid-cols-2 gap-2">
                  {["A", "B"].map((g) => (
                    <button
                      key={g}
                      onClick={() => onGrupo(g)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition ${
                        grupo === g
                          ? "border-brand-500 bg-brand-500/10 text-royal-900"
                          : "border-royal-200 text-royal-600 hover:border-royal-300"
                      }`}
                    >
                      {g === "A" ? (
                        <Building2 className="h-4 w-4 shrink-0" />
                      ) : (
                        <Home className="h-4 w-4 shrink-0" />
                      )}
                      {TARIFAS[g].label}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Subgrupo">
                  <Select value={subOk} onChange={(e) => onSub(e.target.value)}>
                    {subKeys.map((k) => (
                      <option key={k} value={k}>
                        {subgrupos[k].label}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Modalidade">
                  <Select value={modOk} onChange={(e) => onMod(e.target.value)}>
                    {modKeys.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Posto tarifário">
                  <Select value={postoOk} onChange={(e) => onPosto(e.target.value)}>
                    {postoKeys.map((k) => (
                      <option key={k} value={k}>
                        {POSTO_LABEL[k] || k}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Ano (transição Lei 14.300)">
                  <Select value={ano} onChange={(e) => setAno(Number(e.target.value))}>
                    {Object.keys(TRANSICAO_FIO_B).map((a) => (
                      <option key={a} value={a}>
                        {a} — Fio B {Math.round(TRANSICAO_FIO_B[a] * 100)}%
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Bandeira tarifária">
                  <Select value={bandeira} onChange={(e) => setBandeira(e.target.value)}>
                    {Object.keys(BANDEIRAS).map((k) => (
                      <option key={k} value={k}>
                        {BANDEIRAS[k].label}
                      </option>
                    ))}
                  </Select>
                </Field>

                {grupo === "B" && (
                  <Field label="Tipo de ligação (disponibilidade)">
                    <Select value={ligacao} onChange={(e) => setLigacao(e.target.value)}>
                      {Object.keys(LIGACOES).map((k) => (
                        <option key={k} value={k}>
                          {LIGACOES[k].label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}
              </div>
            </Card>

            {/* Dados da fatura */}
            <Card>
              <CardTitle icon={Zap}>Dados da fatura</CardTitle>
              <p className="-mt-2 mb-4 text-xs text-royal-400">
                Informe os valores que aparecem na conta de energia: energia consumida da rede e
                energia injetada. {isA ? "No Grupo A, separe por posto (ponta e fora de ponta)." : ""}
              </p>

              {isA ? (
                <>
                  {/* Demanda contratada */}
                  {isVerde ? (
                    <Field label="Demanda contratada (kW)" hint="Verde: demanda única">
                      <Input
                        value={demandaUnica}
                        onChange={(e) => setDemandaUnica(e.target.value)}
                        unit="kW"
                      />
                    </Field>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Demanda contratada — Ponta (kW)">
                        <Input value={demandaP} onChange={(e) => setDemandaP(e.target.value)} unit="kW" />
                      </Field>
                      <Field label="Demanda contratada — Fora ponta (kW)">
                        <Input value={demandaFP} onChange={(e) => setDemandaFP(e.target.value)} unit="kW" />
                      </Field>
                    </div>
                  )}

                  <div className="my-3 border-t border-royal-100" />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Consumo — Ponta (kWh)">
                      <Input value={consumoP} onChange={(e) => setConsumoP(e.target.value)} unit="kWh" />
                    </Field>
                    <Field label="Consumo — Fora ponta (kWh)">
                      <Input value={consumoFP} onChange={(e) => setConsumoFP(e.target.value)} unit="kWh" />
                    </Field>
                    <Field label="Injeção — Ponta (kWh)">
                      <Input value={injecaoP} onChange={(e) => setInjecaoP(e.target.value)} unit="kWh" />
                    </Field>
                    <Field label="Injeção — Fora ponta (kWh)">
                      <Input value={injecaoFP} onChange={(e) => setInjecaoFP(e.target.value)} unit="kWh" />
                    </Field>
                  </div>
                </>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Energia consumida da rede (kWh)">
                    <Input value={consumo} onChange={(e) => setConsumo(e.target.value)} unit="kWh" />
                  </Field>
                  <Field label="Energia injetada (kWh)" hint="Excedente enviado à rede">
                    <Input value={injecao} onChange={(e) => setInjecao(e.target.value)} unit="kWh" />
                  </Field>
                </div>
              )}
            </Card>

            {/* Tributos */}
            <Card>
              <CardTitle icon={ArrowLeftRight}>Tributos (por dentro)</CardTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="ICMS (RN)" hint="Aplicado por dentro sobre a tarifa">
                  <Input value={icms} onChange={(e) => setIcms(e.target.value)} unit="%" />
                </Field>
                <Field label="PIS + COFINS" hint="Somados — por dentro sobre a tarifa">
                  <Input value={pisCofins} onChange={(e) => setPisCofins(e.target.value)} unit="%" />
                </Field>
              </div>
              <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-royal-400">
                  Tributos totais: <strong>{(r.aliqTotal * 100).toFixed(0)}%</strong> · tarifa sem
                  impostos ({POSTO_LABEL[postoOk] || postoOk}): {brl4(r.tarifaSemImposto)}/kWh
                </p>
                <button
                  onClick={() => {
                    setIcms("20");
                    setPisCofins("5");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-royal-200 px-3 py-2 text-xs font-semibold text-royal-600 transition hover:bg-royal-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Restaurar padrão
                </button>
              </div>
            </Card>
          </div>

          {/* ---------------- Resultados ---------------- */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-6 space-y-4">
              {/* Destaque valoração da injeção */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-gradient-to-br from-royal-700 to-royal-900 p-6 text-white shadow-card"
              >
                <div className="flex items-center gap-2 text-brand-300">
                  <Sun className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Valoração da energia injetada
                  </span>
                </div>
                <p className="mt-4 font-display text-3xl font-extrabold">
                  {brl(r.creditoLiquido)}
                </p>
                <p className="text-sm text-royal-200">crédito líquido pela energia injetada</p>

                <dl className="mt-5 space-y-2 border-t border-white/15 pt-4 text-sm">
                  <Row label="Crédito bruto da injeção" value={brl(r.creditoBruto)} light />
                  {isA ? (
                    <Row
                      label="Fio B — cobrado na demanda"
                      value={brl(r.custoDemandaFioB)}
                      light
                      muted
                    />
                  ) : (
                    <Row
                      label={`Fio B pago (${Math.round(r.pct * 100)}% · Lei 14.300)`}
                      value={`− ${brl(r.custoFioB)}`}
                      light
                    />
                  )}
                  <Row
                    label="Tarifa energia injetada (SCEE)"
                    value={`${brl4(r.tarifaScee)}/kWh`}
                    light
                    muted
                  />
                </dl>
              </motion.div>

              {/* Balanço */}
              <div className="rounded-2xl border border-royal-100 bg-white p-6 shadow-card">
                <p className="text-xs font-bold uppercase tracking-widest text-royal-400">
                  Balanço estimado
                </p>

                <dl className="mt-4 space-y-3 text-sm">
                  {r.modoA ? (
                    <>
                      <Row label="Demanda contratada" value={brl(r.custoDemanda)} />
                      <Row
                        label="↳ Fio B (cobrado na demanda)"
                        value={brl(r.custoDemandaFioB)}
                        muted
                      />
                      <Row label="Energia consumida" value={brl(r.custoConsumo)} />
                      <Row
                        label="Energia injetada (compensada 100%)"
                        value={`− ${brl(r.creditoLiquido)}`}
                        accent
                      />
                      <div className="my-2 border-t border-royal-100" />
                      <Row
                        label="Cobrança mínima — demanda"
                        value={brl(r.custoDemanda)}
                        muted
                      />
                    </>
                  ) : (
                    <>
                      <Row label="Energia consumida da rede" value={brl(r.valorConsumo)} />
                      {r.bandeiraMwh > 0 && (
                        <Row
                          label={`Bandeira ${BANDEIRAS[bandeira].label.split(" ")[0].toLowerCase()} (inclusa)`}
                          value={`${brl4(rkwh(r.bandeiraMwh) / (1 - r.aliqTotal))}/kWh`}
                          muted
                        />
                      )}
                      <Row
                        label="Compensação da energia injetada"
                        value={`− ${brl(r.creditoBruto)}`}
                        accent
                      />
                      <div className="my-2 border-t border-royal-100" />
                      <div className="rounded-xl bg-royal-50 px-3 py-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-royal-400">
                          Cobrança mínima — maior entre:
                        </p>
                        <Row
                          label={`Custo de disponibilidade (${r.minKwh} kWh)`}
                          value={brl(r.custoDisponibilidade)}
                          highlight={!r.pisoFioBMaior}
                        />
                        <Row
                          label={`Fio B da injeção (${Math.round(r.pct * 100)}%)`}
                          value={brl(r.custoFioB)}
                          highlight={r.pisoFioBMaior}
                        />
                      </div>
                    </>
                  )}

                  <div className="my-2 border-t border-royal-100" />
                  <Row
                    label="Economia estimada"
                    value={brl(r.economiaTotal)}
                    big
                    accent
                  />
                  <Row label="Conta estimada com solar" value={brl(r.contaComSolar)} big />
                </dl>

                <div className="mt-5 flex items-center gap-2 rounded-xl bg-brand-500/10 px-3 py-2.5 text-xs text-royal-600">
                  <Leaf className="h-4 w-4 shrink-0 text-brand-600" />
                  Tarifa cheia da energia ({POSTO_LABEL[postoOk] || postoOk}):{" "}
                  <strong>{brl4(r.tarifaCheiaRef)}/kWh</strong>
                </div>
              </div>

              <a
                href="https://www.sousacosta.com.br/#contato"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3.5 font-bold text-royal-950 shadow-lg shadow-brand-500/30 transition hover:bg-brand-400"
              >
                Falar com um especialista
              </a>
            </div>
          </div>
        </div>

        {/* Nota / disclaimer */}
        <div className="mt-10 flex gap-3 rounded-2xl border border-royal-100 bg-royal-50/50 p-5 text-xs leading-relaxed text-royal-500">
          <Info className="h-5 w-5 shrink-0 text-royal-400" />
          <p>
            Simulação com base nas Tabelas 1 e 2 da {META.resolucao} ({META.distribuidora}). Tarifas
            de TUSD e TE com tributos aplicados por dentro (ICMS 20% e PIS/COFINS 5% no padrão do RN,
            ajustáveis) e bandeira tarifária selecionável. A valoração da energia injetada segue a
            regra de transição da Lei nº 14.300/2022 (Fio B): 2023 = 15% … 2029 = 100%. No Grupo B, o
            Fio B incide sobre a energia injetada e a cobrança mínima é o maior valor entre o custo de
            disponibilidade (30/50/100 kWh) e esse Fio B. No Grupo A, o Fio B é cobrado na demanda
            (não na energia): a energia injetada é compensada integralmente e a demanda contratada é
            faturada por completo. Os resultados são estimativas para orientação comercial e não
            substituem a fatura oficial da distribuidora.
          </p>
        </div>
      </main>

      <footer className="border-t border-royal-100 py-8 text-center text-xs text-royal-400">
        © {new Date().getFullYear()} Sousa Costa Energia · Calculadora tarifária baseada em dados
        públicos da ANEEL.
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Subcomponentes de UI                                              */
/* ------------------------------------------------------------------ */
function Card({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-royal-100 bg-white p-6 shadow-card"
    >
      {children}
    </motion.div>
  );
}

function CardTitle({ icon: Icon, children }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-royal-900">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-royal-100 text-royal-700">
        <Icon className="h-4 w-4" />
      </span>
      {children}
    </h2>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-sm font-semibold text-royal-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-royal-400">{hint}</span>}
    </label>
  );
}

function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className="w-full rounded-xl border border-royal-200 bg-white px-3 py-2.5 text-sm font-medium text-royal-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
    >
      {children}
    </select>
  );
}

function Input({ unit, ...props }) {
  return (
    <div className="relative">
      <input
        inputMode="decimal"
        {...props}
        className="w-full rounded-xl border border-royal-200 bg-white px-3 py-2.5 pr-16 text-sm font-medium text-royal-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
      />
      {unit && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-royal-400">
          {unit}
        </span>
      )}
    </div>
  );
}

function Row({ label, value, big, accent, light, muted, highlight }) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 ${
        highlight ? "rounded-lg bg-brand-500/15 px-2 py-1 -mx-2" : ""
      }`}
    >
      <dt
        className={`${light ? "text-royal-200" : "text-royal-500"} ${
          muted ? "opacity-70" : ""
        } ${highlight ? "font-semibold text-royal-800" : ""} text-sm`}
      >
        {label}
        {highlight && <span className="ml-1 text-brand-700">◄ aplicado</span>}
      </dt>
      <dd
        className={`text-right font-semibold tabular-nums ${
          big ? "font-display text-lg" : "text-sm"
        } ${
          highlight
            ? "text-brand-700"
            : accent
            ? "text-brand-600"
            : light
            ? "text-white"
            : "text-royal-900"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
