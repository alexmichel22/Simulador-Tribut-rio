// ==============================================
// MÓDULO DE ELEGIBILIDADE TRIBUTÁRIA
// Verifica impedimentos e vedações legais
// Base: LC 123/2006, Lei 9.718/98, RIR/2018
// ==============================================

import type {
  EmpresaInput,
  ElegibilidadeRegime,
  ImpedimentoSimples,
  RegimeTributario,
  NaturezaJuridica,
} from '@/types';
import { LIMITES } from './constants';
import { buscarCNAE, inferirCNAE } from './cnae';

// -----------------------------------------------
// VERIFICADOR PRINCIPAL
// -----------------------------------------------

export function verificarElegibilidades(empresa: EmpresaInput): ElegibilidadeRegime[] {
  return [
    verificarMEI(empresa),
    verificarSimplesNacional(empresa),
    verificarLucroPresumido(empresa),
    verificarLucroReal(empresa),
  ];
}

// -----------------------------------------------
// MEI
// -----------------------------------------------

function verificarMEI(empresa: EmpresaInput): ElegibilidadeRegime {
  const impedimentos: ImpedimentoSimples[] = [];
  const observacoes: string[] = [];
  const { cadastrais, societarios, operacionais } = empresa;

  // Faturamento
  if (operacionais.faturamentoAnual > LIMITES.MEI) {
    impedimentos.push({
      impedimento: `Faturamento anual (R$ ${fmtMoeda(operacionais.faturamentoAnual)}) supera o limite do MEI (R$ ${fmtMoeda(LIMITES.MEI)})`,
      fundamento: 'Art. 18-A, §1º, LC 123/2006',
      gravidade: 'IMPEDITIVO',
    });
  }

  // Natureza jurídica incompatível com MEI
  const naturezasVedasMEI: NaturezaJuridica[] = ['SA', 'LTDA', 'HOLDING_LTDA', 'HOLDING_SA', 'OFFSHORE', 'TRUST', 'COOPERATIVA', 'SS'];
  if (naturezasVedasMEI.includes(cadastrais.naturezaJuridica)) {
    impedimentos.push({
      impedimento: `Natureza jurídica "${cadastrais.naturezaJuridica}" não é compatível com MEI`,
      fundamento: 'Art. 18-A, LC 123/2006 — MEI exclusivo para EI/MEI',
      gravidade: 'IMPEDITIVO',
    });
  }

  // Mais de 1 sócio
  if (societarios.qtdSocios > 1) {
    impedimentos.push({
      impedimento: 'MEI não admite sócios — é exclusivo para empreendedor individual',
      fundamento: 'Art. 18-A, LC 123/2006',
      gravidade: 'IMPEDITIVO',
    });
  }

  // Empregados
  if (operacionais.qtdEmpregados > 1) {
    impedimentos.push({
      impedimento: `MEI admite no máximo 1 empregado — empresa possui ${operacionais.qtdEmpregados}`,
      fundamento: 'Art. 18-C, LC 123/2006',
      gravidade: 'IMPEDITIVO',
    });
  }

  // Participação em outras empresas
  if (societarios.temParticipacaoOutrasEmpresas) {
    impedimentos.push({
      impedimento: 'MEI não pode ter participação em outras empresas como titular ou sócio',
      fundamento: 'Art. 18-A, §4º, XI, LC 123/2006',
      gravidade: 'IMPEDITIVO',
    });
  }

  // CNAE — verificar se atividade é permitida no MEI
  const cnaeInfo = buscarCNAE(cadastrais.cnaePrincipal) ?? inferirCNAE(cadastrais.cnaePrincipal, cadastrais.descricaoAtividade);
  if (cnaeInfo.tipoAtividade === 'FINANCEIRA') {
    impedimentos.push({
      impedimento: 'Atividade financeira não é permitida no MEI',
      fundamento: 'Resolução CGSN 140/2018',
      gravidade: 'IMPEDITIVO',
    });
  }

  if (impedimentos.length === 0) {
    observacoes.push('MEI é a opção de menor burocracia e custo fixo reduzido.');
    observacoes.push('Contribuição mensal fixa — sem proporcionalidade ao faturamento.');
  }

  return {
    regime: 'MEI',
    elegivel: impedimentos.filter(i => i.gravidade === 'IMPEDITIVO').length === 0,
    impedimentos,
    observacoes,
  };
}

// -----------------------------------------------
// SIMPLES NACIONAL
// -----------------------------------------------

function verificarSimplesNacional(empresa: EmpresaInput): ElegibilidadeRegime {
  const impedimentos: ImpedimentoSimples[] = [];
  const observacoes: string[] = [];
  const { cadastrais, societarios, operacionais } = empresa;

  // Faturamento
  if (operacionais.faturamentoAnual > LIMITES.SIMPLES_NACIONAL) {
    impedimentos.push({
      impedimento: `Faturamento anual (R$ ${fmtMoeda(operacionais.faturamentoAnual)}) supera o limite do Simples Nacional (R$ ${fmtMoeda(LIMITES.SIMPLES_NACIONAL)})`,
      fundamento: 'Art. 3º, II, LC 123/2006',
      gravidade: 'IMPEDITIVO',
    });
  } else if (operacionais.faturamentoAnual > LIMITES.SIMPLES_SUBLIMITE_ISS_ICMS) {
    observacoes.push(
      `Faturamento entre R$ 3,6M e R$ 4,8M: aplica-se o sublimite. ISS e ICMS podem ser recolhidos fora do DAS em alguns estados — verifique a legislação estadual.`
    );
  }

  // Sócio PJ
  if (societarios.temSocioPJ) {
    impedimentos.push({
      impedimento: 'Presença de sócio pessoa jurídica impede opção pelo Simples Nacional',
      fundamento: 'Art. 3º, §4º, IV, LC 123/2006',
      gravidade: 'IMPEDITIVO',
    });
  }

  // Sócio domiciliado no exterior
  if (societarios.temSocioExterior) {
    impedimentos.push({
      impedimento: 'Existência de sócio domiciliado no exterior impede o Simples Nacional',
      fundamento: 'Art. 3º, §4º, III, LC 123/2006',
      gravidade: 'IMPEDITIVO',
    });
  }

  // Participação em outra empresa
  if (societarios.temParticipacaoOutrasEmpresas) {
    const percentual = societarios.percentualParticipacaoOutras ?? 0;
    if (percentual > 10 && !societarios.outraEmpresaOpcaoSimples) {
      impedimentos.push({
        impedimento: `Sócio com participação acima de 10% em outra empresa não optante do Simples impede a opção`,
        fundamento: 'Art. 3º, §4º, V e VI, LC 123/2006',
        gravidade: 'IMPEDITIVO',
      });
    } else if (percentual > 10) {
      observacoes.push('Sócio com participação em outra empresa: verificar se a outra empresa é optante pelo Simples e se o somatório de faturamentos não supera R$ 4,8M.');
    }
  }

  // Natureza jurídica incompatível
  if (['SA', 'COOPERATIVA', 'OFFSHORE', 'TRUST'].includes(cadastrais.naturezaJuridica)) {
    impedimentos.push({
      impedimento: `Natureza jurídica "${cadastrais.naturezaJuridica}" não pode optar pelo Simples Nacional`,
      fundamento: 'Art. 3º, §4º, LC 123/2006 — S.A. e cooperativas (exceto consumo) são vedadas',
      gravidade: 'IMPEDITIVO',
    });
  }

  // Filial no exterior
  if (cadastrais.possuiFiliais) {
    observacoes.push('Verificar se existem filiais no exterior — se sim, há impedimento ao Simples Nacional (art. 3º, §4º, IX, LC 123/2006).');
  }

  // Estrutura holding
  if (societarios.estruturaHolding) {
    observacoes.push('Holding com participação societária ativa deve verificar vedação do art. 17, §1º, LC 123/2006 quanto à locação de bens imóveis e administração de participações.');
  }

  // Offshore / Trust
  if (societarios.temOffshore || societarios.temTrust) {
    impedimentos.push({
      impedimento: 'Empresa vinculada a estrutura offshore ou trust requer análise específica de transparência fiscal — pode haver impedimento ao Simples Nacional',
      fundamento: 'Art. 3º, §4º, LC 123/2006; Lei 14.754/2023 (tributação de offshores)',
      gravidade: 'ATENCAO',
    });
  }

  // CNAE impedido
  const cnaeInfo = buscarCNAE(cadastrais.cnaePrincipal) ?? inferirCNAE(cadastrais.cnaePrincipal, cadastrais.descricaoAtividade);
  if (cnaeInfo.impedidoSimples) {
    impedimentos.push({
      impedimento: `CNAE ${cadastrais.cnaePrincipal} não é permitido no Simples Nacional: ${cnaeInfo.motivoImpedimento}`,
      fundamento: 'Art. 17, LC 123/2006',
      gravidade: 'IMPEDITIVO',
    });
  }

  // Atividade vedada genérica
  if (cnaeInfo.tipoAtividade === 'FINANCEIRA') {
    impedimentos.push({
      impedimento: 'Instituições financeiras, seguradoras e entidades de previdência complementar são vedadas no Simples Nacional',
      fundamento: 'Art. 17, II, LC 123/2006',
      gravidade: 'IMPEDITIVO',
    });
  }

  // Observações positivas
  if (impedimentos.filter(i => i.gravidade === 'IMPEDITIVO').length === 0) {
    observacoes.push('Simples Nacional unifica DAS (IRPJ, CSLL, PIS, COFINS, CPP, ISS/ICMS) em guia única.');
    if (cnaeInfo.anexoSimplesAlternativo) {
      observacoes.push(`Para o CNAE ${cadastrais.cnaePrincipal}, o enquadramento no Anexo III ou V depende do Fator R (folha 12m ÷ receita 12m ≥ 28%).`);
    }
  }

  return {
    regime: 'SIMPLES_NACIONAL',
    elegivel: impedimentos.filter(i => i.gravidade === 'IMPEDITIVO').length === 0,
    impedimentos,
    observacoes,
  };
}

// -----------------------------------------------
// LUCRO PRESUMIDO
// -----------------------------------------------

function verificarLucroPresumido(empresa: EmpresaInput): ElegibilidadeRegime {
  const impedimentos: ImpedimentoSimples[] = [];
  const observacoes: string[] = [];
  const { cadastrais, operacionais } = empresa;

  // Faturamento
  if (operacionais.faturamentoAnual > LIMITES.LUCRO_PRESUMIDO) {
    impedimentos.push({
      impedimento: `Faturamento anual (R$ ${fmtMoeda(operacionais.faturamentoAnual)}) supera o limite do Lucro Presumido (R$ ${fmtMoeda(LIMITES.LUCRO_PRESUMIDO)})`,
      fundamento: 'Art. 13, §1º, Lei 9.718/1998',
      gravidade: 'IMPEDITIVO',
    });
  }

  // Atividades obrigadas ao Lucro Real
  const cnaeInfo = buscarCNAE(cadastrais.cnaePrincipal) ?? inferirCNAE(cadastrais.cnaePrincipal, cadastrais.descricaoAtividade);
  if (cnaeInfo.tipoAtividade === 'FINANCEIRA') {
    impedimentos.push({
      impedimento: 'Instituições financeiras são obrigadas ao Lucro Real — vedado o Lucro Presumido',
      fundamento: 'Art. 14, II, Lei 9.718/1998',
      gravidade: 'IMPEDITIVO',
    });
  }

  // Offshore / Trust — alerta
  if (empresa.societarios.temOffshore || empresa.societarios.temTrust) {
    observacoes.push('Empresa com offshore ou trust vinculada: verificar impactos da Lei 14.754/2023 sobre tributação de lucros no exterior no contexto do Lucro Presumido.');
  }

  if (impedimentos.length === 0) {
    observacoes.push('Lucro Presumido oferece tributação simplificada com alíquotas de presunção fixas.');
    observacoes.push('PIS/COFINS no regime cumulativo (0,65% + 3%) — sem direito a créditos.');
    observacoes.push('Distribuição de lucros isenta de IR — vantajosa para empresas com margens acima da presunção legal.');
  }

  return {
    regime: 'LUCRO_PRESUMIDO',
    elegivel: impedimentos.filter(i => i.gravidade === 'IMPEDITIVO').length === 0,
    impedimentos,
    observacoes,
  };
}

// -----------------------------------------------
// LUCRO REAL
// -----------------------------------------------

function verificarLucroReal(empresa: EmpresaInput): ElegibilidadeRegime {
  const impedimentos: ImpedimentoSimples[] = [];
  const observacoes: string[] = [];
  const { operacionais } = empresa;
  const cnaeInfo = buscarCNAE(empresa.cadastrais.cnaePrincipal) ?? inferirCNAE(empresa.cadastrais.cnaePrincipal, empresa.cadastrais.descricaoAtividade);

  // Lucro Real não tem impedimentos gerais — qualquer empresa pode optar
  // Mas para financeiras é obrigatório
  if (cnaeInfo.tipoAtividade === 'FINANCEIRA') {
    observacoes.push('Para instituições financeiras, o Lucro Real é OBRIGATÓRIO (art. 14, II, Lei 9.718/1998).');
  }

  if (operacionais.faturamentoAnual > LIMITES.LUCRO_PRESUMIDO) {
    observacoes.push('Faturamento acima de R$ 78M: Lucro Real é OBRIGATÓRIO (art. 14, I, Lei 9.718/1998).');
  }

  observacoes.push('Tributação sobre o lucro efetivo — vantajoso quando margem de lucro é baixa.');
  observacoes.push('PIS/COFINS não cumulativo (1,65% + 7,6%) — admite créditos de insumos, bens e serviços.');
  observacoes.push('Permite compensação de prejuízos fiscais acumulados (limitada a 30% do lucro em cada período).');
  observacoes.push('Maior complexidade contábil e obrigações acessórias (SPED, ECF, ECD).');

  if (empresa.societarios.temOffshore || empresa.societarios.temTrust) {
    observacoes.push('Lei 14.754/2023: lucros de offshores passam a ser tributados anualmente. Consultar especialista em tributação internacional.');
  }

  return {
    regime: 'LUCRO_REAL',
    elegivel: true, // sempre elegível (não há impedimento — pode ser obrigatório)
    impedimentos,
    observacoes,
  };
}

// -----------------------------------------------
// HELPER
// -----------------------------------------------

function fmtMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
