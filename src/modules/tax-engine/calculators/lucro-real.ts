// ==============================================
// CALCULADOR — LUCRO REAL
// Base: RIR/2018 (Decreto 9.580/2018), Lei 9.718/1998
// ==============================================

import type { EmpresaInput, CenarioTributario, DetalheImpostos } from '@/types';
import {
  LUCRO_REAL,
  ADICIONAL_IRPJ,
  ISS_ALIQUOTA_PADRAO,
} from '../constants';
import { buscarCNAE, inferirCNAE } from '../cnae';

// -----------------------------------------------
// CÁLCULO PRINCIPAL
// -----------------------------------------------

export function calcularLucroReal(empresa: EmpresaInput): CenarioTributario {
  const { cadastrais, operacionais, tributarios } = empresa;
  const faturamento = operacionais.faturamentoAnual;
  const faturamentoMensal = faturamento / 12;

  const cnaeInfo = buscarCNAE(cadastrais.cnaePrincipal) ??
    inferirCNAE(cadastrais.cnaePrincipal, cadastrais.descricaoAtividade);

  // Estimar lucro real baseado nos dados operacionais
  const lucroRealEstimado = estimarLucroReal(empresa);
  const lucroMensal = lucroRealEstimado / 12;

  // --- IRPJ sobre lucro real ---
  const irpjBaseMensal = Math.max(0, lucroMensal) * LUCRO_REAL.IRPJ_ALIQUOTA;
  const adicionaIRPJMensal = Math.max(0, lucroMensal - ADICIONAL_IRPJ.LIMITE_MENSAL) * ADICIONAL_IRPJ.ALIQUOTA;
  const irpjMensal = irpjBaseMensal + adicionaIRPJMensal;
  const irpjAnual = irpjMensal * 12;

  // --- CSLL ---
  const csllAnual = Math.max(0, lucroRealEstimado) * LUCRO_REAL.CSLL_ALIQUOTA;

  // --- PIS/COFINS não cumulativo ---
  const pisGrosso = faturamento * LUCRO_REAL.PIS_ALIQUOTA;
  const cofinsGrosso = faturamento * LUCRO_REAL.COFINS_ALIQUOTA;

  // Crédito estimado — depende da estrutura de insumos
  const creditoEstimado = tributarios.temCreditosPISCOFINS !== false
    ? (pisGrosso + cofinsGrosso) * LUCRO_REAL.CREDITO_PIS_COFINS_ESTIMADO
    : 0;

  const pisAnual = Math.max(0, pisGrosso - creditoEstimado * (pisGrosso / (pisGrosso + cofinsGrosso)));
  const cofinsAnual = Math.max(0, cofinsGrosso - creditoEstimado * (cofinsGrosso / (pisGrosso + cofinsGrosso)));

  // --- ISS (quando serviço) ---
  let issAnual = 0;
  if (['SERVICOS_GERAIS', 'SERVICOS_INTELECTUAIS', 'SERVICOS_HOSPITALARES'].includes(cnaeInfo.tipoAtividade)) {
    issAnual = faturamento * ISS_ALIQUOTA_PADRAO;
  }

  // --- ICMS ---
  let icmsAnual = 0;
  if (['COMERCIO', 'INDUSTRIA'].includes(cnaeInfo.tipoAtividade)) {
    icmsAnual = faturamento * 0.04; // estimativa com créditos
  }

  const totalAnual = irpjAnual + csllAnual + pisAnual + cofinsAnual + issAnual + icmsAnual;
  const cargaEfetiva = faturamento > 0 ? totalAnual / faturamento : 0;

  const detalhe: DetalheImpostos = {
    irpj: irpjAnual,
    csll: csllAnual,
    pis: pisAnual,
    cofins: cofinsAnual,
    iss: issAnual,
    icms: icmsAnual,
    total: totalAnual,
  };

  return {
    regime: 'LUCRO_REAL',
    elegivel: true,
    impostoAnual: totalAnual,
    cargaTributariaEfetiva: cargaEfetiva,
    detalheImpostos: detalhe,
    impostoMensal: totalAnual / 12,
  };
}

// -----------------------------------------------
// ESTIMATIVA DE LUCRO REAL
// Baseada nos dados informados pelo usuário
// -----------------------------------------------

function estimarLucroReal(empresa: EmpresaInput): number {
  const { operacionais } = empresa;
  const faturamento = operacionais.faturamentoAnual;

  // Se o usuário informou margem líquida estimada
  if (operacionais.margemLiquidaEstimada !== undefined && operacionais.margemLiquidaEstimada > 0) {
    return faturamento * (operacionais.margemLiquidaEstimada / 100);
  }

  // Calcular a partir dos custos informados
  const custoFixoAnual = operacionais.custoFixoMensal * 12;
  const custoVariavelAnual = operacionais.custoVariavelMensal * 12;
  const folhaAnual = operacionais.folhaMensal * 12;
  const prolabreAnual = operacionais.prolabreMensalTotal * 12;

  // INSS patronal sobre folha + pró-labore (estimativa 20% + encargos)
  const encargosPatronaisAnual = (folhaAnual + prolabreAnual) * 0.28;

  const totalCustos = custoFixoAnual + custoVariavelAnual + folhaAnual + prolabreAnual + encargosPatronaisAnual;
  const lucroEstimado = faturamento - totalCustos;

  // Proteção — se não houver dados suficientes, usar margem padrão conservadora
  if (lucroEstimado <= 0 || totalCustos === 0) {
    return estimarLucroPorMargemPadrao(empresa);
  }

  return lucroEstimado;
}

function estimarLucroPorMargemPadrao(empresa: EmpresaInput): number {
  const faturamento = empresa.operacionais.faturamentoAnual;
  const cnaeInfo = buscarCNAE(empresa.cadastrais.cnaePrincipal) ??
    inferirCNAE(empresa.cadastrais.cnaePrincipal, empresa.cadastrais.descricaoAtividade);

  // Margens médias por tipo de atividade
  const margensPadrao: Record<string, number> = {
    COMERCIO: 0.05,
    INDUSTRIA: 0.08,
    SERVICOS_GERAIS: 0.15,
    SERVICOS_INTELECTUAIS: 0.25,
    SERVICOS_HOSPITALARES: 0.12,
    TRANSPORTE: 0.08,
    CONSTRUCAO: 0.07,
    RURAL: 0.10,
    FINANCEIRA: 0.20,
    MISTO: 0.10,
  };

  const margem = margensPadrao[cnaeInfo.tipoAtividade] ?? 0.10;
  return faturamento * margem;
}
