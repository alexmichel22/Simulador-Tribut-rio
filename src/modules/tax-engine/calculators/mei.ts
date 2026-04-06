// ==============================================
// CALCULADOR — MEI
// Base: Art. 18-A, LC 123/2006; Res. CGSN 140/2018
// ==============================================

import type { EmpresaInput, CenarioTributario, DetalheImpostos } from '@/types';
import { MEI_VALORES } from '../constants';
import { buscarCNAE, inferirCNAE } from '../cnae';

// -----------------------------------------------
// CÁLCULO PRINCIPAL
// -----------------------------------------------

export function calcularMEI(empresa: EmpresaInput): CenarioTributario {
  const { cadastrais, operacionais } = empresa;

  const cnaeInfo = buscarCNAE(cadastrais.cnaePrincipal) ??
    inferirCNAE(cadastrais.cnaePrincipal, cadastrais.descricaoAtividade);

  // Determinar valor do DAS mensal
  const dasMensal = determinarDASMensal(cnaeInfo.tipoAtividade);
  const dasAnual = dasMensal * 12;

  // MEI tem carga tributária fixa — independente do faturamento (dentro do limite)
  const cargaEfetiva = operacionais.faturamentoAnual > 0
    ? dasAnual / operacionais.faturamentoAnual
    : 0;

  const detalhe: DetalheImpostos = {
    simplesNacional: dasAnual,
    total: dasAnual,
  };

  return {
    regime: 'MEI',
    elegivel: true,
    impostoAnual: dasAnual,
    cargaTributariaEfetiva: cargaEfetiva,
    detalheImpostos: detalhe,
    impostoMensal: dasMensal,
  };
}

// -----------------------------------------------
// DETERMINAÇÃO DO DAS MENSAL
// -----------------------------------------------

function determinarDASMensal(tipoAtividade: string): number {
  switch (tipoAtividade) {
    case 'COMERCIO':
    case 'INDUSTRIA':
      return MEI_VALORES.DAS_COMERCIO_INDUSTRIA;
    case 'SERVICOS_GERAIS':
    case 'SERVICOS_INTELECTUAIS':
    case 'SERVICOS_HOSPITALARES':
    case 'TRANSPORTE':
    case 'CONSTRUCAO':
      return MEI_VALORES.DAS_SERVICOS;
    default:
      // Misto: maior valor
      return MEI_VALORES.DAS_COMERCIO_SERVICOS;
  }
}
