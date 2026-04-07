// ==============================================
// MOTOR DE REGRAS TRIBUTÁRIAS — ORQUESTRADOR
// Etapas 1-6 do fluxo de decisão
// ==============================================

import type {
  EmpresaInput,
  ResultadoAnalise,
  CenarioTributario,
  RegimeTributario,
  Risco,
  Alerta,
  TipoAtividade,
  PorteEmpresa,
} from '@/types';
import { LIMITES } from './constants';
import { buscarCNAE, inferirCNAE } from './cnae';
import { verificarElegibilidades } from './eligibility';
import { calcularSimplesNacional } from './calculators/simples';
import { calcularLucroPresumido } from './calculators/lucro-presumido';
import { calcularLucroReal } from './calculators/lucro-real';
import { calcularMEI } from './calculators/mei';

// -----------------------------------------------
// PONTO DE ENTRADA PRINCIPAL
// -----------------------------------------------

export function executarAnalise(empresa: EmpresaInput): ResultadoAnalise {
  // ETAPA 1-2: Classificação
  const cnaeInfo = buscarCNAE(empresa.cadastrais.cnaePrincipal) ??
    inferirCNAE(empresa.cadastrais.cnaePrincipal, empresa.cadastrais.descricaoAtividade);
  const tipoAtividade: TipoAtividade = cnaeInfo.tipoAtividade;
  const porteCalculado = calcularPorte(empresa);

  // ETAPA 3-4: Verificar elegibilidade
  const elegibilidades = verificarElegibilidades(empresa);

  // ETAPA 5: Calcular cenários
  const cenarios = calcularCenarios(empresa, elegibilidades);

  // ETAPA 6: Selecionar regime recomendado
  const { regimeRecomendado, justificativaTecnica } = selecionarRegimeRecomendado(
    empresa, cenarios, elegibilidades
  );

  // Comparativos
  const regimeRecomendadoCenario = cenarios.find(c => c.regime === regimeRecomendado)!;
  const cenarosComparativo = cenarios.map(c => ({
    ...c,
    diferencaVsRecomendado: c.regime !== regimeRecomendado
      ? c.impostoAnual - regimeRecomendadoCenario.impostoAnual
      : 0,
    diferencaPercentual: c.regime !== regimeRecomendado && regimeRecomendadoCenario.impostoAnual > 0
      ? ((c.impostoAnual - regimeRecomendadoCenario.impostoAnual) / regimeRecomendadoCenario.impostoAnual) * 100
      : 0,
  }));

  // Economia tributária
  const cenariosElegiveis = cenarios.filter(c => c.elegivel && c.impostoAnual > 0);
  const piorCenario = cenariosElegiveis.reduce((max, c) => c.impostoAnual > max.impostoAnual ? c : max, cenariosElegiveis[0]);
  const economiaTributariaAnual = piorCenario && piorCenario.regime !== regimeRecomendado
    ? piorCenario.impostoAnual - regimeRecomendadoCenario.impostoAnual
    : 0;
  const economiaTributariaPercentual = piorCenario && piorCenario.impostoAnual > 0
    ? (economiaTributariaAnual / piorCenario.impostoAnual) * 100
    : 0;

  // Casos especiais
  const casosEspeciais = identificarCasosEspeciais(empresa);

  // Riscos e alertas
  const riscos = identificarRiscos(empresa, regimeRecomendado, cnaeInfo.tipoAtividade);
  const alertas = identificarAlertas(empresa, regimeRecomendado, elegibilidades);

  return {
    id: gerarId(),
    empresaSnapshot: empresa,
    timestamp: new Date().toISOString(),
    tipoAtividade,
    cnaeInfo,
    porteCalculado,
    casosEspeciais,
    elegibilidades,
    cenarios: cenarosComparativo,
    regimeRecomendado,
    regimeRecomendadoCenario,
    justificativaTecnica,
    riscos,
    alertas,
    economiaTributariaAnual,
    economiaTributariaPercentual,
  };
}

// -----------------------------------------------
// CÁLCULO DOS CENÁRIOS
// -----------------------------------------------

function calcularCenarios(empresa: EmpresaInput, elegibilidades: ReturnType<typeof verificarElegibilidades>): CenarioTributario[] {
  const cenarios: CenarioTributario[] = [];

  const elegMEI = elegibilidades.find(e => e.regime === 'MEI');
  const elegSimples = elegibilidades.find(e => e.regime === 'SIMPLES_NACIONAL');
  const elegPresumido = elegibilidades.find(e => e.regime === 'LUCRO_PRESUMIDO');

  if (elegMEI?.elegivel) {
    cenarios.push(calcularMEI(empresa));
  } else {
    cenarios.push({ regime: 'MEI', elegivel: false, impostoAnual: 0, cargaTributariaEfetiva: 0, detalheImpostos: { total: 0 }, impostoMensal: 0 });
  }

  if (elegSimples?.elegivel) {
    cenarios.push(calcularSimplesNacional(empresa));
  } else {
    cenarios.push({ regime: 'SIMPLES_NACIONAL', elegivel: false, impostoAnual: 0, cargaTributariaEfetiva: 0, detalheImpostos: { total: 0 }, impostoMensal: 0 });
  }

  if (elegPresumido?.elegivel) {
    cenarios.push(calcularLucroPresumido(empresa));
  } else {
    cenarios.push({ regime: 'LUCRO_PRESUMIDO', elegivel: false, impostoAnual: 0, cargaTributariaEfetiva: 0, detalheImpostos: { total: 0 }, impostoMensal: 0 });
  }

  cenarios.push(calcularLucroReal(empresa));

  return cenarios;
}

// -----------------------------------------------
// SELEÇÃO DO REGIME RECOMENDADO
// -----------------------------------------------

function selecionarRegimeRecomendado(
  empresa: EmpresaInput,
  cenarios: CenarioTributario[],
  elegibilidades: ReturnType<typeof verificarElegibilidades>
): { regimeRecomendado: RegimeTributario; justificativaTecnica: string } {

  const cenariosElegiveis = cenarios.filter(c => c.elegivel && c.impostoAnual > 0);
  if (cenariosElegiveis.length === 0) {
    return { regimeRecomendado: 'LUCRO_REAL', justificativaTecnica: 'Lucro Real é o único regime disponível para esta configuração.' };
  }

  const { tributarios, operacionais } = empresa;
  const faturamento = operacionais.faturamentoAnual;

  // Ordenar por menor carga tributária (critério principal)
  const ordenadosPorCarga = [...cenariosElegiveis].sort((a, b) => a.impostoAnual - b.impostoAnual);
  const maisBarato = ordenadosPorCarga[0];

  let regimeRecomendado = maisBarato.regime;
  const justificativas: string[] = [];

  // ---- Ajuste por preferências do usuário ----
  if (tributarios.priorizaSimplicidade && !tributarios.priorizaEconomiaTributaria) {
    // Preferência por simplicidade: MEI > Simples > Presumido > Real
    const ordemSimplicidade: RegimeTributario[] = ['MEI', 'SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL'];
    const maisSimples = ordemSimplicidade.find(r => cenariosElegiveis.some(c => c.regime === r));
    if (maisSimples) {
      regimeRecomendado = maisSimples;
      justificativas.push('O regime foi selecionado priorizando simplicidade operacional, conforme preferência informada.');
    }
  }

  // ---- Análise de Fator R para Simples Nacional ----
  const cenarioSimples = cenariosElegiveis.find(c => c.regime === 'SIMPLES_NACIONAL');
  if (cenarioSimples && cenarioSimples.fatorR !== undefined) {
    const fatorR = cenarioSimples.fatorR;
    if (fatorR >= 0.28 && cenarioSimples.anexoAplicavel === 'III') {
      justificativas.push(`Fator R de ${(fatorR * 100).toFixed(1)}% (≥ 28%) enquadra a atividade no Anexo III do Simples Nacional — tributação mais favorável do que o Anexo V.`);
    }
  }

  // ---- Verificação: margem baixa → Lucro Real pode ser mais vantajoso ----
  if (operacionais.margemLiquidaEstimada !== undefined && operacionais.margemLiquidaEstimada < 10) {
    const cenarioReal = cenariosElegiveis.find(c => c.regime === 'LUCRO_REAL');
    if (cenarioReal && cenarioReal.impostoAnual < (cenariosElegiveis.find(c => c.regime === 'LUCRO_PRESUMIDO')?.impostoAnual ?? Infinity)) {
      if (regimeRecomendado === 'LUCRO_PRESUMIDO') {
        regimeRecomendado = 'LUCRO_REAL';
        justificativas.push('Margem líquida abaixo de 10%: o Lucro Real tende a ser mais vantajoso por tributar o lucro efetivo, enquanto o Lucro Presumido aplica presunções que podem superar a margem real.');
      }
    }
  }

  // ---- Holding / imobiliária ----
  if (empresa.societarios.estruturaHolding) {
    justificativas.push('Para estruturas de holding, o Lucro Presumido geralmente oferece equilíbrio entre tributação e compliance — avalie conforme natureza das receitas (operacional vs. participações).');
  }

  // ---- Construir justificativa final ----
  const cenarioEscolhido = cenarios.find(c => c.regime === regimeRecomendado);
  const justificativaBase = construirJustificativa(empresa, regimeRecomendado, cenarioEscolhido!, cenariosElegiveis);

  const justificativaTecnica = [justificativaBase, ...justificativas].join('\n\n');

  return { regimeRecomendado, justificativaTecnica };
}

// -----------------------------------------------
// CONSTRUÇÃO DA JUSTIFICATIVA TÉCNICA
// -----------------------------------------------

function construirJustificativa(
  empresa: EmpresaInput,
  regime: RegimeTributario,
  cenario: CenarioTributario,
  cenariosElegiveis: CenarioTributario[]
): string {
  const faturamento = empresa.operacionais.faturamentoAnual;
  const carga = (cenario.cargaTributariaEfetiva * 100).toFixed(2);

  const nomes: Record<RegimeTributario, string> = {
    MEI: 'MEI (Microempreendedor Individual)',
    SIMPLES_NACIONAL: 'Simples Nacional',
    LUCRO_PRESUMIDO: 'Lucro Presumido',
    LUCRO_REAL: 'Lucro Real',
  };

  let texto = `O regime recomendado é o ${nomes[regime]}, com carga tributária efetiva estimada de ${carga}% sobre o faturamento anual de R$ ${fmtMoeda(faturamento)}, resultando em uma estimativa de tributos anuais de R$ ${fmtMoeda(cenario.impostoAnual)}.`;

  // Comparar com outros regimes elegíveis
  const outros = cenariosElegiveis.filter(c => c.regime !== regime);
  if (outros.length > 0) {
    const comparacoes = outros.map(c => {
      const diff = c.impostoAnual - cenario.impostoAnual;
      return `${nomes[c.regime]} (R$ ${fmtMoeda(c.impostoAnual)}/ano — ${diff > 0 ? 'R$ ' + fmtMoeda(diff) + ' a mais' : 'similar'})`;
    });
    texto += ` Em comparação com os demais regimes elegíveis: ${comparacoes.join('; ')}.`;
  }

  // Detalhes específicos por regime
  switch (regime) {
    case 'SIMPLES_NACIONAL':
      texto += ` O Simples Nacional unifica IRPJ, CSLL, PIS, COFINS, CPP e ISS/ICMS em guia única (DAS), reduzindo significativamente a burocracia fiscal.`;
      if (cenario.anexoAplicavel) {
        texto += ` A empresa está enquadrada no Anexo ${cenario.anexoAplicavel} do Simples Nacional.`;
      }
      break;
    case 'LUCRO_PRESUMIDO':
      texto += ` O Lucro Presumido aplica percentuais de presunção sobre o faturamento para determinar a base tributável — vantajoso quando a margem real supera a presunção legal. PIS e COFINS no regime cumulativo (0,65% + 3%).`;
      break;
    case 'LUCRO_REAL':
      texto += ` O Lucro Real tributa o lucro efetivo apurado — vantajoso para empresas com margens reduzidas. PIS/COFINS no regime não cumulativo (1,65% + 7,6%), com possibilidade de créditos sobre insumos e serviços.`;
      break;
    case 'MEI':
      texto += ` O MEI oferece contribuição mensal fixa de R$ ${fmtMoeda(cenario.impostoMensal)}, independente do faturamento realizado (desde que dentro do limite de R$ ${fmtMoeda(LIMITES.MEI)}/ano).`;
      break;
  }

  return texto;
}

// -----------------------------------------------
// RISCOS
// -----------------------------------------------

function identificarRiscos(
  empresa: EmpresaInput,
  regime: RegimeTributario,
  tipoAtividade: TipoAtividade
): Risco[] {
  const riscos: Risco[] = [];
  const { societarios, operacionais, cadastrais } = empresa;

  // Risco de ultrapassar limite do Simples
  if (regime === 'SIMPLES_NACIONAL' && operacionais.faturamentoAnual > LIMITES.SIMPLES_NACIONAL * 0.85) {
    riscos.push({
      tipo: 'FISCAL',
      descricao: 'Faturamento próximo ao limite do Simples Nacional (R$ 4,8M). Ultrapassar o limite implica exclusão automática e retroação de tributos.',
      nivel: 'ALTO',
      recomendacao: 'Monitorar faturamento mensalmente e estruturar planejamento para eventual migração ao Lucro Presumido.',
    });
  }

  // Risco de distribuição de lucros
  if (regime === 'LUCRO_PRESUMIDO') {
    riscos.push({
      tipo: 'FISCAL',
      descricao: 'Distribuição de lucros acima da presunção requer demonstração contábil do lucro efetivo — caso contrário, o excedente pode ser tributado como remuneração.',
      nivel: 'MEDIO',
      recomendacao: 'Manter escrituração contábil completa para suportar distribuição de lucros isenta além da presunção.',
    });
  }

  // Risco internacional
  if (societarios.temOffshore || societarios.temTrust) {
    riscos.push({
      tipo: 'INTERNACIONAL',
      descricao: 'Estruturas offshore e trust estão sujeitas à Lei 14.754/2023, que passou a tributar lucros no exterior anualmente (IRPF) e alterou regras de transparência fiscal.',
      nivel: 'ALTO',
      recomendacao: 'Consultar especialista em tributação internacional para adequação à Lei 14.754/2023 e às obrigações do Siscoaf/SISCOEX.',
    });
  }

  // Risco societário — sócio no exterior
  if (societarios.temSocioExterior) {
    riscos.push({
      tipo: 'INTERNACIONAL',
      descricao: 'Sócio domiciliado no exterior sujeita a empresa a regras de preço de transferência e retenção de IR sobre remessas.',
      nivel: 'ALTO',
      recomendacao: 'Avaliar impacto das novas regras de preços de transferência (IN RFB 2.161/2023) e IRRF sobre remessas ao exterior.',
    });
  }

  // Risco de pró-labore baixo no Simples
  if (regime === 'SIMPLES_NACIONAL' && operacionais.prolabreMensalTotal < 1412) {
    riscos.push({
      tipo: 'LEGAL',
      descricao: 'Pró-labore abaixo do salário mínimo pode ser questionado pela Receita Federal e pelo INSS.',
      nivel: 'MEDIO',
      recomendacao: 'Fixar pró-labore em pelo menos 1 salário mínimo (R$ 1.412 em 2024). Avaliação da carga previdenciária sobre pró-labore.',
    });
  }

  // Risco de atividade mista
  if (cadastrais.cnaesSecundarios && cadastrais.cnaesSecundarios.length > 2) {
    riscos.push({
      tipo: 'FISCAL',
      descricao: 'Empresa com múltiplos CNAEs pode ter atividades enquadradas em diferentes anexos do Simples Nacional, exigindo segregação de receitas.',
      nivel: 'MEDIO',
      recomendacao: 'Verificar enquadramento de cada CNAE e aplicar proporção correta de receitas por anexo.',
    });
  }

  // Risco holding
  if (societarios.estruturaHolding) {
    riscos.push({
      tipo: 'SOCIETARIO',
      descricao: 'Estrutura de holding exige atenção ao tratamento tributário de dividendos recebidos de subsidiárias e à neutralidade fiscal nas reorganizações societárias.',
      nivel: 'MEDIO',
      recomendacao: 'Mapear fluxo de dividendos e ganhos de capital entre holding e subsidiárias. Avaliar aplicação do art. 20 do DL 1.598/77.',
    });
  }

  return riscos;
}

// -----------------------------------------------
// ALERTAS
// -----------------------------------------------

function identificarAlertas(
  empresa: EmpresaInput,
  regime: RegimeTributario,
  elegibilidades: ReturnType<typeof verificarElegibilidades>
): Alerta[] {
  const alertas: Alerta[] = [];
  const { societarios, operacionais } = empresa;

  // Alerta padrão — validação humana
  alertas.push({
    tipo: 'INFORMATIVO',
    titulo: 'Análise automatizada — validação profissional recomendada',
    descricao: 'Este parecer é gerado por sistema automatizado com base nos dados informados. Não substitui a análise de contador habilitado ou advogado tributarista.',
    requerValidacaoHumana: true,
  });

  // Caso sensível — offshore
  if (societarios.temOffshore || societarios.temTrust) {
    alertas.push({
      tipo: 'CRITICO',
      titulo: 'Estrutura internacional detectada — caso sensível',
      descricao: 'A presença de offshore ou trust exige análise tributária especializada em internacionalização. Regras de transparência fiscal, IRPF sobre lucros no exterior e compliance cambial são obrigatórios.',
      requerValidacaoHumana: true,
    });
  }

  // Fator R próximo de 28%
  const cenarioSimples = elegibilidades.find(e => e.regime === 'SIMPLES_NACIONAL');
  const fatorR = empresa.operacionais.folhaMensal * 12 / empresa.operacionais.faturamentoAnual;
  if (cenarioSimples?.elegivel && Math.abs(fatorR - 0.28) < 0.05) {
    alertas.push({
      tipo: 'ATENCAO',
      titulo: 'Fator R próximo do limiar de 28%',
      descricao: `Fator R atual: ${(fatorR * 100).toFixed(1)}%. Oscilações na folha de pagamento ou faturamento podem alterar o enquadramento entre Anexo III (mais favorável) e Anexo V.`,
      requerValidacaoHumana: false,
    });
  }

  // Oportunidade de planejamento tributário — folha alta no Presumido
  if (regime === 'LUCRO_PRESUMIDO' && operacionais.folhaMensal > operacionais.faturamentoAnual * 0.20 / 12) {
    alertas.push({
      tipo: 'OPORTUNIDADE',
      titulo: 'Folha de pagamento relevante — avaliar Lucro Real',
      descricao: 'Com folha de pagamento significativa, os créditos de PIS/COFINS não cumulativos do Lucro Real podem reduzir a carga. Recomendamos simulação comparativa detalhada.',
      requerValidacaoHumana: false,
    });
  }

  // Alerta exclusão Simples por crescimento
  if (regime === 'SIMPLES_NACIONAL' && operacionais.faturamentoAnual > LIMITES.SIMPLES_NACIONAL * 0.75) {
    alertas.push({
      tipo: 'ATENCAO',
      titulo: 'Monitorar limite do Simples Nacional',
      descricao: 'O faturamento está acima de 75% do limite do Simples (R$ 3,6M). Planejar com antecedência a eventual migração de regime.',
      requerValidacaoHumana: false,
    });
  }

  return alertas;
}

// -----------------------------------------------
// CASOS ESPECIAIS
// -----------------------------------------------

function identificarCasosEspeciais(empresa: EmpresaInput): string[] {
  const casos: string[] = [];
  const { societarios, cadastrais } = empresa;

  if (societarios.estruturaHolding) casos.push('Estrutura de holding');
  if (societarios.temOffshore) casos.push('Offshore vinculada');
  if (societarios.temTrust) casos.push('Trust vinculado');
  if (societarios.temSocioExterior) casos.push('Sócio domiciliado no exterior');
  if (societarios.temParticipacaoOutrasEmpresas) casos.push('Participação em outras empresas');
  if (cadastrais.possuiFiliais) casos.push('Empresa com filiais');
  if ((cadastrais.cnaesSecundarios?.length ?? 0) > 0) casos.push('Atividade mista (múltiplos CNAEs)');

  return casos;
}

// -----------------------------------------------
// HELPERS
// -----------------------------------------------

function calcularPorte(empresa: EmpresaInput): PorteEmpresa {
  const fat = empresa.operacionais.faturamentoAnual;
  if (fat <= LIMITES.MEI) return 'MEI';
  if (fat <= 360_000) return 'ME';
  if (fat <= LIMITES.SIMPLES_NACIONAL) return 'EPP';
  if (fat <= 30_000_000) return 'MEDIO';
  return 'GRANDE';
}

function gerarId(): string {
  return `analise_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function fmtMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
