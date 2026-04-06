// ==============================================
// CALCULADOR — SIMPLES NACIONAL
// Base: LC 123/2006, Resolução CGSN 140/2018
// ==============================================

import type { EmpresaInput, CenarioTributario, DetalheImpostos, AnexoSimples } from '@/types';
import {
  TABELAS_SIMPLES,
  FATOR_R_MINIMO,
  type FaixaSimples,
} from '../constants';
import { buscarCNAE, inferirCNAE } from '../cnae';

// -----------------------------------------------
// CÁLCULO PRINCIPAL
// -----------------------------------------------

export function calcularSimplesNacional(empresa: EmpresaInput): CenarioTributario {
  const { cadastrais, operacionais, tributarios } = empresa;
  const faturamento = operacionais.faturamentoAnual;

  // Determinar anexo e Fator R
  const cnaeInfo = buscarCNAE(cadastrais.cnaePrincipal) ?? inferirCNAE(cadastrais.cnaePrincipal, cadastrais.descricaoAtividade);

  const fatorR = calcularFatorR(operacionais.folhaMensal, faturamento);
  const anexo = determinarAnexo(cnaeInfo.anexoSimplesPrincipal ?? 'III', cnaeInfo.anexoSimplesAlternativo, fatorR, tributarios.atividadeDependeFatorR);

  // Calcular alíquota efetiva
  const tabela = TABELAS_SIMPLES[anexo];
  const faixa = encontrarFaixa(faturamento, tabela);

  if (!faixa) {
    return cenarioInelegivel('SIMPLES_NACIONAL', 'Faturamento fora dos limites do Simples Nacional');
  }

  const aliquotaEfetiva = calcularAliquotaEfetiva(faturamento, faixa);
  const impostoAnual = faturamento * aliquotaEfetiva;
  const impostoMensal = impostoAnual / 12;

  // Estimar composição do DAS (percentual de cada tributo varia por anexo/faixa)
  const composicao = estimarComposicaoDAS(anexo, impostoAnual);

  const detalhe: DetalheImpostos = {
    simplesNacional: impostoAnual,
    irpj: composicao.irpj,
    csll: composicao.csll,
    pis: composicao.pis,
    cofins: composicao.cofins,
    cpp: composicao.cpp,
    iss: composicao.iss,
    icms: composicao.icms,
    total: impostoAnual,
  };

  return {
    regime: 'SIMPLES_NACIONAL',
    elegivel: true,
    impostoAnual,
    cargaTributariaEfetiva: aliquotaEfetiva,
    detalheImpostos: detalhe,
    impostoMensal,
    anexoAplicavel: anexo,
    fatorR,
    aliquotaEfetiva,
  };
}

// -----------------------------------------------
// FATOR R
// folha12meses / receita12meses >= 28%
// -----------------------------------------------

export function calcularFatorR(folhaMensal: number, faturamentoAnual: number): number {
  if (faturamentoAnual === 0) return 0;
  const folha12 = folhaMensal * 12;
  const receita12 = faturamentoAnual;
  return folha12 / receita12;
}

// -----------------------------------------------
// DETERMINAÇÃO DO ANEXO
// -----------------------------------------------

function determinarAnexo(
  principal: AnexoSimples,
  alternativo: AnexoSimples | undefined,
  fatorR: number,
  atividadeDependeFatorR?: boolean
): AnexoSimples {
  // Se a atividade possui dois possíveis anexos (V / III) — depende do Fator R
  if (alternativo && (principal === 'V' || principal === 'III')) {
    if (atividadeDependeFatorR !== false) {
      // Fator R >= 28% → Anexo III (mais barato); < 28% → Anexo V
      if (fatorR >= FATOR_R_MINIMO) return 'III';
      return 'V';
    }
  }
  return principal;
}

// -----------------------------------------------
// FAIXA DE TRIBUTAÇÃO
// -----------------------------------------------

function encontrarFaixa(faturamento: number, tabela: FaixaSimples[]): FaixaSimples | null {
  return tabela.find(f => faturamento >= f.limiteInferior && faturamento <= f.limiteSuperior) ?? null;
}

// -----------------------------------------------
// ALÍQUOTA EFETIVA
// Fórmula: (RBT12 × Alíquota - PD) / RBT12
// -----------------------------------------------

function calcularAliquotaEfetiva(rbt12: number, faixa: FaixaSimples): number {
  if (rbt12 === 0) return 0;
  const efetiva = (rbt12 * faixa.aliquotaNominal - faixa.parcelaDeduzir) / rbt12;
  return Math.max(0, efetiva);
}

// -----------------------------------------------
// COMPOSIÇÃO ESTIMADA DO DAS
// Percentuais médios por tributo dentro do DAS
// (Resolução CGSN 140/2018 — Tabela de partilha)
// -----------------------------------------------

interface ComposicaoDAS {
  irpj: number;
  csll: number;
  cofins: number;
  pis: number;
  cpp: number;
  iss: number;
  icms: number;
}

function estimarComposicaoDAS(anexo: AnexoSimples, totalDAS: number): ComposicaoDAS {
  // Distribuição média estimada por tributo (varia por faixa — simplificação)
  const distribuicoes: Record<AnexoSimples, ComposicaoDAS> = {
    I: { irpj: 0.055, csll: 0.035, cofins: 0.086, pis: 0.019, cpp: 0.414, iss: 0, icms: 0.391 },
    II: { irpj: 0.055, csll: 0.035, cofins: 0.086, pis: 0.019, cpp: 0.414, iss: 0, icms: 0.391 },
    III: { irpj: 0.04, csll: 0.035, cofins: 0.1239, pis: 0.0269, cpp: 0.43, iss: 0.34, icms: 0 },
    IV: { irpj: 0.18, csll: 0.15, cofins: 0.425, pis: 0.092, cpp: 0, iss: 0.153, icms: 0 },
    V: { irpj: 0.125, csll: 0.15, cofins: 0.3, pis: 0.065, cpp: 0.28, iss: 0.08, icms: 0 },
  };

  const dist = distribuicoes[anexo];
  return {
    irpj: totalDAS * dist.irpj,
    csll: totalDAS * dist.csll,
    cofins: totalDAS * dist.cofins,
    pis: totalDAS * dist.pis,
    cpp: totalDAS * dist.cpp,
    iss: totalDAS * dist.iss,
    icms: totalDAS * dist.icms,
  };
}

// -----------------------------------------------
// HELPER
// -----------------------------------------------

function cenarioInelegivel(regime: 'SIMPLES_NACIONAL', motivo: string): CenarioTributario {
  return {
    regime,
    elegivel: false,
    impostoAnual: 0,
    cargaTributariaEfetiva: 0,
    detalheImpostos: { total: 0 },
    impostoMensal: 0,
  };
}
