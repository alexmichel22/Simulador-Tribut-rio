// ==============================================
// CALCULADOR — LUCRO PRESUMIDO
// Base: Lei 9.249/1995, Lei 9.718/1998, RIR/2018
// ==============================================

import type { EmpresaInput, CenarioTributario, DetalheImpostos } from '@/types';
import {
  LUCRO_PRESUMIDO,
  ADICIONAL_IRPJ,
  ISS_ALIQUOTA_PADRAO,
} from '../constants';
import { buscarCNAE, inferirCNAE } from '../cnae';

// -----------------------------------------------
// CÁLCULO PRINCIPAL
// -----------------------------------------------

export function calcularLucroPresumido(empresa: EmpresaInput): CenarioTributario {
  const { cadastrais, operacionais } = empresa;
  const faturamento = operacionais.faturamentoAnual;
  const faturamentoMensal = faturamento / 12;

  // Identificar atividade para presunção
  const cnaeInfo = buscarCNAE(cadastrais.cnaePrincipal) ??
    inferirCNAE(cadastrais.cnaePrincipal, cadastrais.descricaoAtividade);

  const tipoAtividade = cnaeInfo.tipoAtividade;
  const tipoChave = mapearTipoParaChave(tipoAtividade);

  const presuncaoIRPJ = cnaeInfo.aliquotaPresuncaoIRPJ;
  const presuncaoCSLL = cnaeInfo.aliquotaPresuncaoCSLL;

  // --- IRPJ ---
  const baseIRPJMensal = faturamentoMensal * presuncaoIRPJ;
  const baseIRPJAnual = faturamento * presuncaoIRPJ;

  const irpjBaseMensal = baseIRPJMensal * LUCRO_PRESUMIDO.IRPJ_ALIQUOTA;
  const adicionaIRPJMensal = Math.max(0, baseIRPJMensal - ADICIONAL_IRPJ.LIMITE_MENSAL) * ADICIONAL_IRPJ.ALIQUOTA;
  const irpjMensal = irpjBaseMensal + adicionaIRPJMensal;
  const irpjAnual = irpjMensal * 12;

  // --- CSLL ---
  const baseCSLLAnual = faturamento * presuncaoCSLL;
  const csllAnual = baseCSLLAnual * LUCRO_PRESUMIDO.CSLL_ALIQUOTA;

  // --- PIS/COFINS (regime cumulativo) ---
  const pisAnual = faturamento * LUCRO_PRESUMIDO.PIS_ALIQUOTA;
  const cofinsAnual = faturamento * LUCRO_PRESUMIDO.COFINS_ALIQUOTA;

  // --- ISS (quando serviço) ---
  let issAnual = 0;
  if (['SERVICOS_GERAIS', 'SERVICOS_INTELECTUAIS', 'SERVICOS_HOSPITALARES'].includes(tipoAtividade)) {
    issAnual = faturamento * ISS_ALIQUOTA_PADRAO;
  }

  // --- ICMS (quando comércio/indústria — estimativa) ---
  let icmsAnual = 0;
  if (['COMERCIO', 'INDUSTRIA'].includes(tipoAtividade)) {
    // ICMS: estimativa de valor agregado. Para comércio: ~18% sobre margem ~30%
    // Simplificação conservadora: estimativa de 5% sobre faturamento
    icmsAnual = faturamento * 0.05;
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
    regime: 'LUCRO_PRESUMIDO',
    elegivel: true,
    impostoAnual: totalAnual,
    cargaTributariaEfetiva: cargaEfetiva,
    detalheImpostos: detalhe,
    impostoMensal: totalAnual / 12,
  };
}

// -----------------------------------------------
// MAPEAMENTO DE TIPO DE ATIVIDADE
// -----------------------------------------------

function mapearTipoParaChave(tipo: string): string {
  const mapa: Record<string, string> = {
    COMERCIO: 'COMERCIO',
    INDUSTRIA: 'INDUSTRIA',
    SERVICOS_HOSPITALARES: 'SERVICOS_HOSPITALARES',
    TRANSPORTE: 'TRANSPORTE_CARGAS',
    SERVICOS_GERAIS: 'SERVICOS_GERAIS',
    SERVICOS_INTELECTUAIS: 'SERVICOS_INTELECTUAIS',
    CONSTRUCAO: 'CONSTRUCAO',
    RURAL: 'RURAL',
    FINANCEIRA: 'FINANCEIRA',
    MISTO: 'MISTO',
  };
  return mapa[tipo] ?? 'SERVICOS_GERAIS';
}
