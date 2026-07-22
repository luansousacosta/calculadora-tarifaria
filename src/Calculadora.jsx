import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Sun,
  BatteryCharging,
  Handshake,
  Zap,
  Printer,
  ArrowLeft,
  Info,
  Sparkles,
  TrendingDown,
  Wallet,
  SlidersHorizontal,
} from "lucide-react";

/* ================================================================== *
 *  PREMISSAS — Tarifas Neoenergia Cosern (B1 Residencial)
 *  Fonte: fatura Cosern NF 161114458 (06/2026) — valores COM tributos.
 * ================================================================== */
const PREMISSAS = {
  tusdConsumo: 0.6416, // R$/kWh (com tributos)
  teConsumo: 0.3903, // R$/kWh (com tributos)
  tusdGD: 0.4286, // R$/kWh — compensação (já com Fio B)
  teGD: 0.3903, // R$/kWh — compensação TE
  cip: 112.04, // R$/mês — Iluminação Pública (varia por município)
};
// Fio B não compensado (pago à distribuidora sobre a energia compensada)
const FIO_B = PREMISSAS.tusdConsumo - PREMISSAS.tusdGD; // 0,2131 R$/kWh
// Tarifa cheia de consumo (sem bandeira)
const TARIFA_CHEIA = PREMISSAS.tusdConsumo + PREMISSAS.teConsumo; // 1,032 R$/kWh

// Bandeiras (adicional COM tributos, R$/kWh) — ANEEL 2026 × fator 1,328
const BANDEIRAS = {
  VERDE: { label: "Verde (sem adicional)", kwh: 0 },
  AMARELA: { label: "Amarela", kwh: 0.025 },
  VERMELHA1: { label: "Vermelha P1", kwh: 0.0593 },
  VERMELHA2: { label: "Vermelha P2", kwh: 0.1046 },
};

// Disponibilidade mínima por tipo de ligação (kWh)
const LIGACOES = {
  MONO: { label: "Monofásico (30 kWh)", kwh: 30 },
  BI: { label: "Bifásico (50 kWh)", kwh: 50 },
  TRI: { label: "Trifásico (100 kWh)", kwh: 100 },
};

// Preço médio de sistemas FV — Pesquisa SED Greener (jan/2026), telhado.
// [kWp, R$/Wp]. Interpolado linearmente conforme a potência estimada.
const PRECO_FV = [
  [2, 3.44],
  [4, 2.66],
  [8, 2.21],
  [12, 2.04],
  [30, 1.91],
  [50, 1.94],
  [75, 2.26],
  [150, 2.21],
  [300, 2.2],
];
const HIBRIDO_MULT = 1.85; // solar + bateria = +85% sobre o solar

/* ------------------------------------------------------------------ */
const brl = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number.isFinite(v) ? v : 0
  );
const pct = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 }).format(
    Number.isFinite(v) ? v : 0
  );
const num = (v) => {
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};
// R$/Wp interpolado para uma potência kWp
function precoPorWp(kwp) {
  if (kwp <= PRECO_FV[0][0]) return PRECO_FV[0][1];
  const last = PRECO_FV[PRECO_FV.length - 1];
  if (kwp >= last[0]) return last[1];
  for (let i = 0; i < PRECO_FV.length - 1; i++) {
    const [k1, p1] = PRECO_FV[i];
    const [k2, p2] = PRECO_FV[i + 1];
    if (kwp >= k1 && kwp <= k2) {
      return p1 + ((kwp - k1) / (k2 - k1)) * (p2 - p1);
    }
  }
  return last[1];
}

/* ================================================================== *
 *  Componente principal
 * ================================================================== */
export default function Calculadora() {
  const [consumo, setConsumo] = useState(""); // cliente preenche
  const [ligacao, setLigacao] = useState("MONO");
  const [bandeira, setBandeira] = useState("VERDE"); // inicia em verde
  const [cip, setCip] = useState(""); // Iluminação Pública — cliente preenche
  const [cliente, setCliente] = useState("");
  const [cidade, setCidade] = useState("");

  // Ajustes avançados (editáveis)
  const [geracao, setGeracao] = useState("130"); // kWh/kWp/mês (RN)
  const [autoSolar, setAutoSolar] = useState("30"); // % autoconsumo instantâneo — solar
  const [autoHibrido, setAutoHibrido] = useState("65"); // % autoconsumo — híbrido
  const [descAssinatura, setDescAssinatura] = useState("20"); // % desconto garantido
  const [showAdv, setShowAdv] = useState(false);

  const r = useMemo(() => {
    const C = num(consumo);
    const band = BANDEIRAS[bandeira]?.kwh ?? 0;
    const cipVal = num(cip); // taxa de iluminação pública informada
    const dispKwh = LIGACOES[ligacao]?.kwh ?? 30;
    const dispCusto = dispKwh * TARIFA_CHEIA;

    // Conta cheia (sem solar)
    const contaCheia = C * (TARIFA_CHEIA + band) + cipVal;

    // Potência e investimento estimados
    const g = num(geracao) || 130;
    const kwp = C / g;
    const rsWp = precoPorWp(kwp);
    const invSolar = kwp * 1000 * rsWp;
    const invHibrido = invSolar * HIBRIDO_MULT;

    // Cenário próprio (solar/híbrido): autoconsumo instantâneo + injeção
    const cenarioProprio = (autoPctStr, investimento) => {
      const a = Math.min(1, Math.max(0, num(autoPctStr) / 100));
      const compensado = C * (1 - a); // injetado e compensado → paga Fio B
      const fioB = compensado * FIO_B;
      const parcelaFixa = Math.max(dispCusto, fioB) + cipVal;
      const contaFinal = parcelaFixa;
      const economiaMes = contaCheia - contaFinal;
      const economiaAno = economiaMes * 12;
      const paybackAnos = economiaAno > 0 ? investimento / economiaAno : Infinity;
      return {
        autoconsumo: a,
        fioB,
        parcelaFixa,
        contaFinal,
        economiaMes,
        economiaAno,
        descontoPct: contaCheia > 0 ? economiaMes / contaCheia : 0,
        investimento,
        paybackAnos,
      };
    };

    // Cenário assinatura: 100% compensado (geração remota) + desconto garantido
    const fioBAss = C * FIO_B;
    const parcelaFixaAss = Math.max(dispCusto, fioBAss) + cipVal;
    const economizavel = contaCheia - parcelaFixaAss;
    const desc = Math.min(1, Math.max(0, num(descAssinatura) / 100));
    const economiaAssMes = economizavel * desc;
    const assinatura = {
      economizavel,
      economiaMes: economiaAssMes,
      economiaAno: economiaAssMes * 12,
      contaFinal: contaCheia - economiaAssMes,
      descontoPct: contaCheia > 0 ? economiaAssMes / contaCheia : 0,
    };

    return {
      C,
      contaCheia,
      kwp,
      rsWp,
      invSolar,
      invHibrido,
      dispCusto,
      solar: cenarioProprio(autoSolar, invSolar),
      hibrido: cenarioProprio(autoHibrido, invHibrido),
      assinatura,
    };
  }, [consumo, ligacao, bandeira, cip, geracao, autoSolar, autoHibrido, descAssinatura]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-royal-50/40 to-white font-sans text-royal-950">
      {/* Cabeçalho */}
      <header className="border-b border-royal-100 bg-white/80 backdrop-blur print:hidden">
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-full bg-royal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-royal-700"
            >
              <Printer className="h-4 w-4" /> Relatório
            </button>
            <a
              href="https://www.sousacosta.com.br/"
              className="inline-flex items-center gap-1.5 rounded-full border border-royal-200 px-4 py-2 text-sm font-semibold text-royal-700 transition hover:bg-royal-50"
            >
              <ArrowLeft className="h-4 w-4" /> Site
            </a>
          </div>
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
            <Sparkles className="h-3.5 w-3.5" /> Simulador de economia
          </span>
          <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight text-royal-950 sm:text-4xl">
            Quanto você economiza com energia solar
          </h1>
          <p className="mt-3 max-w-3xl text-royal-600">
            Informe o consumo mensal e compare três caminhos:{" "}
            <strong>solar próprio</strong>, <strong>solar com bateria</strong> e{" "}
            <strong>assinatura de energia</strong>. A calculadora estima o investimento, a economia
            e o retorno com base nas tarifas da Neoenergia Cosern (Grupo B).
          </p>
        </motion.div>

        {/* Entradas */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardTitle icon={Zap}>Dados do cliente</CardTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Consumo mensal (kWh)">
                  <Input
                    value={consumo}
                    onChange={(e) => setConsumo(e.target.value)}
                    placeholder="Ex.: 500"
                    unit="kWh"
                  />
                </Field>
                <Field label="Tipo de ligação">
                  <Select value={ligacao} onChange={(e) => setLigacao(e.target.value)}>
                    {Object.keys(LIGACOES).map((k) => (
                      <option key={k} value={k}>
                        {LIGACOES[k].label}
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
                <Field
                  label="Iluminação pública (CIP)"
                  hint="Valor da taxa na sua conta — varia por município"
                >
                  <Input
                    value={cip}
                    onChange={(e) => setCip(e.target.value)}
                    placeholder="Ex.: 35,00"
                    unit="R$/mês"
                  />
                </Field>
                <Field label="Cliente (opcional — para o relatório)">
                  <Input
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    placeholder="Nome do cliente"
                  />
                </Field>
              </div>

              {/* Ajustes avançados */}
              <button
                onClick={() => setShowAdv((v) => !v)}
                className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-royal-500 transition hover:text-royal-700"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {showAdv ? "Ocultar ajustes" : "Ajustes avançados"}
              </button>
              {showAdv && (
                <div className="mt-3 grid gap-4 rounded-xl bg-royal-50/60 p-4 sm:grid-cols-2">
                  <Field label="Geração média (kWh/kWp·mês)" hint="RN ≈ 130">
                    <Input value={geracao} onChange={(e) => setGeracao(e.target.value)} />
                  </Field>
                  <Field label="Autoconsumo — solar (%)" hint="Energia usada na hora">
                    <Input value={autoSolar} onChange={(e) => setAutoSolar(e.target.value)} unit="%" />
                  </Field>
                  <Field label="Autoconsumo — híbrido (%)" hint="Maior com bateria">
                    <Input
                      value={autoHibrido}
                      onChange={(e) => setAutoHibrido(e.target.value)}
                      unit="%"
                    />
                  </Field>
                  <Field label="Desconto assinatura (%)" hint="Sobre o economizável">
                    <Input
                      value={descAssinatura}
                      onChange={(e) => setDescAssinatura(e.target.value)}
                      unit="%"
                    />
                  </Field>
                  <Field label="Cidade (opcional)">
                    <Input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Natal/RN" />
                  </Field>
                </div>
              )}
            </Card>
          </div>

          {/* Conta hoje */}
          <div>
            <div className="rounded-2xl bg-gradient-to-br from-royal-700 to-royal-900 p-6 text-white shadow-card">
              <div className="flex items-center gap-2 text-brand-300">
                <Wallet className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-widest">Sua conta hoje</span>
              </div>
              <p className="mt-4 font-display text-3xl font-extrabold">{brl(r.contaCheia)}</p>
              <p className="text-sm text-royal-200">por mês, sem energia solar</p>
              <dl className="mt-5 space-y-2 border-t border-white/15 pt-4 text-sm">
                <RowL label="Consumo" value={`${r.C.toLocaleString("pt-BR")} kWh`} />
                <RowL label="Tarifa cheia" value={`${brl(TARIFA_CHEIA)}/kWh`} />
                <RowL label="Sistema estimado" value={`${r.kwp.toFixed(1)} kWp`} />
              </dl>
            </div>
          </div>
        </div>

        {/* Cenários */}
        <h2 className="mt-12 font-display text-2xl font-extrabold text-royal-950">
          Compare os cenários
        </h2>
        <div className="mt-5 grid gap-6 md:grid-cols-3">
          <CenarioCard
            icon={Sun}
            titulo="Solar próprio"
            subtitulo="Você investe no sistema"
            destaque
            economiaMes={r.solar.economiaMes}
            economiaAno={r.solar.economiaAno}
            descontoPct={r.solar.descontoPct}
            contaFinal={r.solar.contaFinal}
            investimento={r.solar.investimento}
            payback={r.solar.paybackAnos}
            extra={`${r.kwp.toFixed(1)} kWp · ${brl(r.rsWp)}/Wp`}
          />
          <CenarioCard
            icon={BatteryCharging}
            titulo="Solar + bateria"
            subtitulo="Economia + energia de reserva"
            economiaMes={r.hibrido.economiaMes}
            economiaAno={r.hibrido.economiaAno}
            descontoPct={r.hibrido.descontoPct}
            contaFinal={r.hibrido.contaFinal}
            investimento={r.hibrido.investimento}
            payback={r.hibrido.paybackAnos}
            extra="Backup na falta de energia · + autoconsumo"
          />
          <CenarioCard
            icon={Handshake}
            titulo="Assinatura de energia"
            subtitulo="Sem obras, sem investir"
            economiaMes={r.assinatura.economiaMes}
            economiaAno={r.assinatura.economiaAno}
            descontoPct={r.assinatura.descontoPct}
            contaFinal={r.assinatura.contaFinal}
            investimento={0}
            payback={0}
            assinatura
            extra="Desconto garantido todo mês"
          />
        </div>

        {/* Relatório / comparativo */}
        <div className="mt-12 rounded-2xl border border-royal-100 bg-white p-6 shadow-card sm:p-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-700">
                Relatório de economia
              </p>
              <h3 className="mt-1 font-display text-xl font-bold text-royal-950">
                {cliente ? `Cliente: ${cliente}` : "Comparativo de cenários"}
                {cidade ? ` · ${cidade}` : ""}
              </h3>
            </div>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-royal-200 px-3 py-2 text-sm font-semibold text-royal-600 transition hover:bg-royal-50 print:hidden"
            >
              <Printer className="h-4 w-4" /> Imprimir / PDF
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-royal-100 text-left text-royal-400">
                  <th className="py-2 pr-3 font-semibold">Indicador</th>
                  <th className="py-2 px-3 text-right font-semibold">Conta hoje</th>
                  <th className="py-2 px-3 text-right font-semibold text-brand-700">Solar</th>
                  <th className="py-2 px-3 text-right font-semibold">Solar + bateria</th>
                  <th className="py-2 pl-3 text-right font-semibold">Assinatura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-royal-50">
                <TR
                  label="Conta mensal"
                  hoje={brl(r.contaCheia)}
                  solar={brl(r.solar.contaFinal)}
                  hibrido={brl(r.hibrido.contaFinal)}
                  assinatura={brl(r.assinatura.contaFinal)}
                />
                <TR
                  label="Economia por mês"
                  solar={brl(r.solar.economiaMes)}
                  hibrido={brl(r.hibrido.economiaMes)}
                  assinatura={brl(r.assinatura.economiaMes)}
                  accent
                />
                <TR
                  label="Economia por ano"
                  solar={brl(r.solar.economiaAno)}
                  hibrido={brl(r.hibrido.economiaAno)}
                  assinatura={brl(r.assinatura.economiaAno)}
                  accent
                />
                <TR
                  label="Desconto na conta"
                  solar={pct(r.solar.descontoPct)}
                  hibrido={pct(r.hibrido.descontoPct)}
                  assinatura={pct(r.assinatura.descontoPct)}
                />
                <TR
                  label="Investimento"
                  solar={brl(r.solar.investimento)}
                  hibrido={brl(r.hibrido.investimento)}
                  assinatura="—"
                />
                <TR
                  label="Retorno (payback)"
                  solar={paybackTxt(r.solar.paybackAnos)}
                  hibrido={paybackTxt(r.hibrido.paybackAnos)}
                  assinatura="Imediato"
                />
                <TR
                  label="Economia em 25 anos"
                  solar={brl(r.solar.economiaAno * 25 - r.solar.investimento)}
                  hibrido={brl(r.hibrido.economiaAno * 25 - r.hibrido.investimento)}
                  assinatura={brl(r.assinatura.economiaAno * 25)}
                  accent
                />
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex gap-3 rounded-xl bg-royal-50/60 p-4 text-xs leading-relaxed text-royal-500">
            <Info className="h-4 w-4 shrink-0 text-royal-400" />
            <p>
              Estimativa com base nas tarifas da Neoenergia Cosern — B1 Residencial (fatura 06/2026,
              com tributos): tarifa cheia {brl(TARIFA_CHEIA)}/kWh, Fio B não compensado{" "}
              {brl(FIO_B)}/kWh; a iluminação pública (CIP) é informada pelo cliente. Preços de
              sistemas: Pesquisa SED Greener
              (jan/2026); híbrido = solar + 85%. No solar/híbrido considera-se autoconsumo instantâneo
              (não paga Fio B) e o restante compensado (paga Fio B, regra da Lei 14.300/2022); paga-se
              sempre o maior entre o Fio B e o custo de disponibilidade, mais a CIP. A assinatura é
              geração remota (100% compensado) com desconto garantido sobre o economizável. Valores
              podem variar conforme consumo real, geração local e reajustes da ANEEL.
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-royal-400">
          Sousa Costa Energia · Simulador de economia solar — Grupo B · Natal/RN
        </p>
      </main>
    </div>
  );
}

function paybackTxt(anos) {
  if (!Number.isFinite(anos) || anos <= 0) return "—";
  if (anos < 1) return `${Math.round(anos * 12)} meses`;
  return `${anos.toFixed(1).replace(".", ",")} anos`;
}

/* ------------------------------------------------------------------ */
/*  Subcomponentes                                                    */
/* ------------------------------------------------------------------ */
function CenarioCard({
  icon: Icon,
  titulo,
  subtitulo,
  economiaMes,
  economiaAno,
  descontoPct,
  contaFinal,
  investimento,
  payback,
  extra,
  destaque,
  assinatura,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex flex-col rounded-2xl border p-6 shadow-card ${
        destaque ? "border-brand-500 bg-brand-500/5" : "border-royal-100 bg-white"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
            destaque ? "bg-brand-500 text-royal-950" : "bg-royal-100 text-royal-700"
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="font-display font-bold leading-tight text-royal-950">{titulo}</p>
          <p className="text-xs text-royal-400">{subtitulo}</p>
        </div>
      </div>

      <div className="mt-5">
        <p className="flex items-baseline gap-1.5 text-brand-600">
          <TrendingDown className="h-5 w-5" />
          <span className="font-display text-3xl font-extrabold">{brl(economiaMes)}</span>
          <span className="text-sm font-semibold text-royal-400">/mês</span>
        </p>
        <p className="mt-1 text-sm text-royal-500">
          {brl(economiaAno)}/ano · {pct(descontoPct)} de desconto
        </p>
      </div>

      <dl className="mt-5 space-y-2 border-t border-royal-100 pt-4 text-sm">
        <Row label="Conta final" value={brl(contaFinal)} />
        <Row label="Investimento" value={assinatura ? "Sem investir" : brl(investimento)} />
        <Row
          label="Retorno"
          value={assinatura ? "Imediato" : paybackTxt(payback)}
          strong
        />
      </dl>

      <p className="mt-4 rounded-lg bg-royal-50 px-3 py-2 text-center text-xs font-medium text-royal-500">
        {extra}
      </p>
    </motion.div>
  );
}

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
function Row({ label, value, strong }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-sm text-royal-500">{label}</dt>
      <dd
        className={`text-right tabular-nums ${
          strong
            ? "font-display text-base font-bold text-royal-900"
            : "text-sm font-semibold text-royal-900"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
function RowL({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-sm text-royal-200">{label}</dt>
      <dd className="text-right text-sm font-semibold tabular-nums text-white">{value}</dd>
    </div>
  );
}
function TR({ label, hoje, solar, hibrido, assinatura, accent }) {
  return (
    <tr>
      <td className="py-2.5 pr-3 font-medium text-royal-600">{label}</td>
      <td className="py-2.5 px-3 text-right tabular-nums text-royal-500">{hoje ?? "—"}</td>
      <td
        className={`py-2.5 px-3 text-right tabular-nums font-semibold ${
          accent ? "text-brand-600" : "text-royal-900"
        } bg-brand-500/5`}
      >
        {solar}
      </td>
      <td
        className={`py-2.5 px-3 text-right tabular-nums ${
          accent ? "font-semibold text-brand-600" : "text-royal-900"
        }`}
      >
        {hibrido}
      </td>
      <td
        className={`py-2.5 pl-3 text-right tabular-nums ${
          accent ? "font-semibold text-brand-600" : "text-royal-900"
        }`}
      >
        {assinatura}
      </td>
    </tr>
  );
}
