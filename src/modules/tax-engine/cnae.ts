// ==============================================
// MÓDULO CNAE — Classificação e Enquadramento
// Base: Tabela CNAE 2.3 / IBGE e LC 123/2006
// ==============================================

import type { CNAEInfo, TipoAtividade, AnexoSimples } from '@/types';

// -----------------------------------------------
// BASE DE CNAEs RELEVANTES
// (Lista curada para fins tributários — principais atividades)
// -----------------------------------------------
const BASE_CNAE: CNAEInfo[] = [
  // ---- COMÉRCIO VAREJISTA ----
  {
    codigo: '4711-3/01', descricao: 'Comércio varejista de mercadorias em geral — supermercado',
    divisao: '47', secao: 'G', tipoAtividade: 'COMERCIO',
    anexoSimplesPrincipal: 'I', permiteSimples: true, impedidoSimples: false,
    aliquotaPresuncaoIRPJ: 0.08, aliquotaPresuncaoCSLL: 0.12,
  },
  {
    codigo: '4712-1/00', descricao: 'Comércio varejista de mercadorias em geral — mercearia',
    divisao: '47', secao: 'G', tipoAtividade: 'COMERCIO',
    anexoSimplesPrincipal: 'I', permiteSimples: true, impedidoSimples: false,
    aliquotaPresuncaoIRPJ: 0.08, aliquotaPresuncaoCSLL: 0.12,
  },
  {
    codigo: '4713-0/01', descricao: 'Lojas de departamentos ou magazines',
    divisao: '47', secao: 'G', tipoAtividade: 'COMERCIO',
    anexoSimplesPrincipal: 'I', permiteSimples: true, impedidoSimples: false,
    aliquotaPresuncaoIRPJ: 0.08, aliquotaPresuncaoCSLL: 0.12,
  },
  {
    codigo: '4741-5/00', descricao: 'Comércio varejista de tintas e materiais para pintura',
    divisao: '47', secao: 'G', tipoAtividade: 'COMERCIO',
    anexoSimplesPrincipal: 'I', permiteSimples: true, impedidoSimples: false,
    aliquotaPresuncaoIRPJ: 0.08, aliquotaPresuncaoCSLL: 0.12,
  },
  // ---- COMÉRCIO ATACADISTA ----
  {
    codigo: '4639-7/01', descricao: 'Comércio atacadista de produtos alimentícios em geral',
    divisao: '46', secao: 'G', tipoAtividade: 'COMERCIO',
    anexoSimplesPrincipal: 'I', permiteSimples: true, impedidoSimples: false,
    aliquotaPresuncaoIRPJ: 0.08, aliquotaPresuncaoCSLL: 0.12,
  },
  // ---- INDÚSTRIA ----
  {
    codigo: '1091-1/01', descricao: 'Fabricação de produtos de panificação industrial',
    divisao: '10', secao: 'C', tipoAtividade: 'INDUSTRIA',
    anexoSimplesPrincipal: 'II', permiteSimples: true, impedidoSimples: false,
    aliquotaPresuncaoIRPJ: 0.08, aliquotaPresuncaoCSLL: 0.12,
  },
  {
    codigo: '2511-0/00', descricao: 'Fabricação de estruturas metálicas',
    divisao: '25', secao: 'C', tipoAtividade: 'INDUSTRIA',
    anexoSimplesPrincipal: 'II', permiteSimples: true, impedidoSimples: false,
    aliquotaPresuncaoIRPJ: 0.08, aliquotaPresuncaoCSLL: 0.12,
  },
  {
    codigo: '6201-5/01', descricao: 'Desenvolvimento de programas de computador sob encomenda',
    divisao: '62', secao: 'J', tipoAtividade: 'SERVICOS_INTELECTUAIS',
    anexoSimplesPrincipal: 'V', anexoSimplesAlternativo: 'III',
    permiteSimples: true, impedidoSimples: false,
    aliquotaPresuncaoIRPJ: 0.32, aliquotaPresuncaoCSLL: 0.32,
    observacoes: 'Sujeito ao Fator R para definição do Anexo III ou V',
  },
  {
    codigo: '6202-3/00', descricao: 'Desenvolvimento e licenciamento de programas customizáveis',
    divisao: '62', secao: 'J', tipoAtividade: 'SERVICOS_INTELECTUAIS',
    anexoSimplesPrincipal: 'V', anexoSimplesAlternativo: 'III',
    permiteSimples: true, impedidoSimples: false,
    aliquotaPresuncaoIRPJ: 0.32, aliquotaPresuncaoCSLL: 0.32,
    observacoes: 'Sujeito ao Fator R',
  },
  {
    codigo: '6203-1/00', descricao: 'Desenvolvimento e licenciamento de programas não customizáveis',
    divisao: '62', secao: 'J', tipoAtividade: 'SERVICOS_INTELECTUAIS',
    anexoSimplesPrincipal: 'III', permiteSimples: true, impedidoSimples: false,
    aliquotaPresuncaoIRPJ: 0.32, aliquotaPresuncaoCSLL: 0.32,
  },
  {
    codigo: '6209-1/00', descricao: 'Suporte técnico, manutenção e outros serviços em TI',
    divisao: '62', secao: 'J', tipoAtividade: 'SERVICOS_INTELECTUAIS',
    anexoSimplesPrincipal: 'V', anexoSimplesAlternativo: 'III',
    permiteSimples: true, impedidoSimples: false,
    aliquotaPresuncaoIRPJ: 0.32, aliquotaPresuncaoCSLL: 0.32,
    observacoes: 'Sujeito ao Fator R',
  },
  // ---- CONSULTORIA E SERVIÇOS PROFISSIONAIS ----
  {
    codigo: '6911-7/01', descricao: 'Serviços advocatícios',
    divisao: '69', secao: 'M', tipoAtividade: 'SERVICOS_INTELECTUAIS',
    anexoSimplesPrincipal: 'IV', permiteSimples: true, impedidoSimples: false,
    aliquotaPresuncaoIRPJ: 0.32, aliquotaPresuncaoCSLL: 0.32,
    observacoes: 'Vedada a sociedade de advogados no Simples em certos casos',
  },
  {
    codigo: '6920-6/01', descricao: 'Atividades de contabilidade',
    divisao: '69', secao: 'M', tipoAtividade: 'SERVICOS_INTELECTUAIS',
    anexoSimplesPrincipal: 'V', anexoSimplesAlternativo: 'III',
    permiteSimples: true, impedidoSimples: false,
    aliquotaPresuncaoIRPJ: 0.32, aliquotaPresuncaoCSLL: 0.32,
    observacoes: 'Sujeito ao Fator R',
  },
  {
    codigo: '7020-4/00', descricao: 'Atividades de consultoria em gestão empresarial',
    divisao: '70', secao: 'M', tipoAtividade: 'SERVICOS_INTELECTUAIS',
    anexoSimplesPrincipal: 'V', anexoSimplesAlternativo: 'III',
    permiteSimples: true, impedidoSimples: false,
    aliquotaPresuncaoIRPJ: 0.32, aliquotaPresuncaoCSLL: 0.32,
    observacoes: 'Sujeito ao Fator R',
  },
  {
    codigo: '7111-1/00', descricao: 'Serviços de arquitetura',
    divisao: '71', secao: 'M', tipoAtividade: 'SERVICOS_INTELECTUAIS',
    anexoSimplesPrincipal: 'V', anexoSimplesAlternativo: 'III',
    permiteSimples: true, impedidoSimples: false,
    aliquotaPresuncaoIRPJ: 0.32, aliquotaPresuncaoCSLL: 0.32,
    observacoes: 'Sujeito ao Fator R',
  },
  {
    codigo: '7112-0/00', descricao: 'Serviços de engenharia',
    divisao: '71', secao: 'M', tipoAtividade: 'SERVICOS_INTELECTUAIS',
    anexoSimplesPrincipal: 'V', anexoSimplesAlternativo: 'III',
    permiteSimples: true, impedidoSimples: false,
    aliquotaPresuncaoIRPJ: 0.32, aliquotaPresuncaoCSLL: 0.32,
    observacoes: 'Sujeito ao Fator R',
  },
  {
    codigo: '8621-6/01', descricao: 'UTI móvel — serviço de atendimento a urgências',
    divisao: '86', secao: 'Q', tipoAtividade: 'SERVICOS_HOSPITALARES',
    anexoSimplesPrincipal: 'III', permiteSimples: true, impedidoSimples: false,
    aliquotaPresuncaoIRPJ: 0.08, aliquotaPresuncaoCSLL: 0.12,
  },
  {
    codigo: '8630-5/01', descricao: 'Atividade médica ambulatorial com recursos para exames complementares',
    divisao: '86', secao: 'Q', tipoAtividade: 'SERVICOS_HOSPITALARES',
    anexoSimplesPrincipal: 'III', permiteSimples: true, impedidoSimples: false,
    aliquotaPresuncaoIRPJ: 0.08, aliquotaPresuncaoCSLL: 0.12,
    observacoes: 'Presunção reduzida para serviços hospitalares',
  },
  {
    codigo: '8630-5/03', descricao: 'Atividade odontológica',
    divisao: '86', secao: 'Q', tipoAtividade: 'SERVICOS_INTELECTUAIS',
    anexoSimplesPrincipal: 'V', anexoSimplesAlternativo: 'III',
    permiteSimples: true, impedidoSimples: false,
    aliquotaPresuncaoIRPJ: 0.32, aliquotaPresuncaoCSLL: 0.32,
    observacoes: 'Sujeito ao Fator R',
  },
  // ---- CONSTRUÇÃO CIVIL ----
  {
    codigo: '4120-4/00', descricao: 'Construção de edifícios',
    divisao: '41', secao: 'F', tipoAtividade: 'CONSTRUCAO',
    anexoSimplesPrincipal: 'IV', permiteSimples: true, impedidoSimples: false,
    aliquotaPresuncaoIRPJ: 0.08, aliquotaPresuncaoCSLL: 0.12,
    observacoes: 'CPP recolhida separadamente — Anexo IV',
  },
  {
    codigo: '4321-5/00', descricao: 'Instalação e manutenção elétrica',
    divisao: '43', secao: 'F', tipoAtividade: 'CONSTRUCAO',
    anexoSimplesPrincipal: 'IV', permiteSimples: true, impedidoSimples: false,
    aliquotaPresuncaoIRPJ: 0.08, aliquotaPresuncaoCSLL: 0.12,
  },
  // ---- TRANSPORTE ----
  {
    codigo: '4921-3/01', descricao: 'Transporte rodoviário coletivo de passageiros',
    divisao: '49', secao: 'H', tipoAtividade: 'TRANSPORTE',
    anexoSimplesPrincipal: 'III', permiteSimples: true, impedidoSimples: false,
    aliquotaPresuncaoIRPJ: 0.16, aliquotaPresuncaoCSLL: 0.12,
  },
  {
    codigo: '4930-2/02', descricao: 'Transporte rodoviário de carga, exceto produtos perigosos',
    divisao: '49', secao: 'H', tipoAtividade: 'TRANSPORTE',
    anexoSimplesPrincipal: 'III', permiteSimples: true, impedidoSimples: false,
    aliquotaPresuncaoIRPJ: 0.08, aliquotaPresuncaoCSLL: 0.12,
  },
  // ---- SERVIÇOS GERAIS ----
  {
    codigo: '5611-2/01', descricao: 'Restaurantes e similares',
    divisao: '56', secao: 'I', tipoAtividade: 'COMERCIO',
    anexoSimplesPrincipal: 'I', permiteSimples: true, impedidoSimples: false,
    aliquotaPresuncaoIRPJ: 0.08, aliquotaPresuncaoCSLL: 0.12,
  },
  {
    codigo: '5620-1/01', descricao: 'Fornecimento de alimentos preparados para empresas',
    divisao: '56', secao: 'I', tipoAtividade: 'COMERCIO',
    anexoSimplesPrincipal: 'I', permiteSimples: true, impedidoSimples: false,
    aliquotaPresuncaoIRPJ: 0.08, aliquotaPresuncaoCSLL: 0.12,
  },
  {
    codigo: '8011-1/01', descricao: 'Atividades de vigilância e segurança privada',
    divisao: '80', secao: 'N', tipoAtividade: 'SERVICOS_GERAIS',
    anexoSimplesPrincipal: 'IV', permiteSimples: true, impedidoSimples: false,
    aliquotaPresuncaoIRPJ: 0.32, aliquotaPresuncaoCSLL: 0.32,
  },
  {
    codigo: '8121-4/00', descricao: 'Limpeza em prédios e em domicílios',
    divisao: '81', secao: 'N', tipoAtividade: 'SERVICOS_GERAIS',
    anexoSimplesPrincipal: 'IV', permiteSimples: true, impedidoSimples: false,
    aliquotaPresuncaoIRPJ: 0.32, aliquotaPresuncaoCSLL: 0.32,
  },
  // ---- IMOBILIÁRIO / HOLDING / LOCAÇÃO ----
  {
    codigo: '6810-2/01', descricao: 'Compra e venda de imóveis próprios',
    divisao: '68', secao: 'L', tipoAtividade: 'SERVICOS_GERAIS',
    anexoSimplesPrincipal: 'III', permiteSimples: false, impedidoSimples: true,
    motivoImpedimento: 'Atividade de compra e venda de imóveis não é permitida no Simples Nacional — vedação do art. 17, §1º, LC 123/2006',
    aliquotaPresuncaoIRPJ: 0.08, aliquotaPresuncaoCSLL: 0.12,
    observacoes: 'Locação de imóveis próprios pode ser tributada pelo Lucro Presumido ou Real',
  },
  {
    codigo: '6820-0/00', descricao: 'Aluguel de imóveis próprios',
    divisao: '68', secao: 'L', tipoAtividade: 'SERVICOS_GERAIS',
    anexoSimplesPrincipal: 'III', permiteSimples: false, impedidoSimples: true,
    motivoImpedimento: 'Locação de imóveis próprios não é atividade permitida no Simples Nacional (art. 17, VI, LC 123/2006)',
    aliquotaPresuncaoIRPJ: 0.08, aliquotaPresuncaoCSLL: 0.12,
    observacoes: 'Estruturas de holding imobiliária geralmente adotam Lucro Presumido',
  },
  // ---- FINANCEIRO / SEGUROS ----
  {
    codigo: '6499-3/99', descricao: 'Outras atividades de serviços financeiros não especificadas',
    divisao: '64', secao: 'K', tipoAtividade: 'FINANCEIRA',
    anexoSimplesPrincipal: 'V', permiteSimples: false, impedidoSimples: true,
    motivoImpedimento: 'Instituições financeiras são vedadas no Simples Nacional — art. 17, II, LC 123/2006',
    aliquotaPresuncaoIRPJ: 0.32, aliquotaPresuncaoCSLL: 0.32,
    observacoes: 'Obrigatório Lucro Real para instituições financeiras (art. 14, II, Lei 9.718/98)',
  },
  // ---- MARKETING / PUBLICIDADE ----
  {
    codigo: '7311-4/00', descricao: 'Agências de publicidade',
    divisao: '73', secao: 'M', tipoAtividade: 'SERVICOS_INTELECTUAIS',
    anexoSimplesPrincipal: 'V', anexoSimplesAlternativo: 'III',
    permiteSimples: true, impedidoSimples: false,
    aliquotaPresuncaoIRPJ: 0.32, aliquotaPresuncaoCSLL: 0.32,
    observacoes: 'Sujeito ao Fator R',
  },
  // ---- EDUCAÇÃO ----
  {
    codigo: '8511-2/00', descricao: 'Educação infantil — creche',
    divisao: '85', secao: 'P', tipoAtividade: 'SERVICOS_GERAIS',
    anexoSimplesPrincipal: 'III', permiteSimples: true, impedidoSimples: false,
    aliquotaPresuncaoIRPJ: 0.32, aliquotaPresuncaoCSLL: 0.32,
  },
  {
    codigo: '8550-3/01', descricao: 'Administração de caixas escolar',
    divisao: '85', secao: 'P', tipoAtividade: 'SERVICOS_GERAIS',
    anexoSimplesPrincipal: 'III', permiteSimples: true, impedidoSimples: false,
    aliquotaPresuncaoIRPJ: 0.32, aliquotaPresuncaoCSLL: 0.32,
  },
  {
    codigo: '8599-6/04', descricao: 'Treinamento em desenvolvimento profissional',
    divisao: '85', secao: 'P', tipoAtividade: 'SERVICOS_INTELECTUAIS',
    anexoSimplesPrincipal: 'V', anexoSimplesAlternativo: 'III',
    permiteSimples: true, impedidoSimples: false,
    aliquotaPresuncaoIRPJ: 0.32, aliquotaPresuncaoCSLL: 0.32,
    observacoes: 'Sujeito ao Fator R',
  },
];

// -----------------------------------------------
// FUNÇÕES DE CONSULTA
// -----------------------------------------------

/**
 * Busca informações de um CNAE pelo código
 */
export function buscarCNAE(codigo: string): CNAEInfo | undefined {
  const codigoNormalizado = normalizarCodigo(codigo);
  return BASE_CNAE.find(c => normalizarCodigo(c.codigo) === codigoNormalizado);
}

/**
 * Pesquisa CNAEs por descrição ou código (para autocomplete)
 */
export function pesquisarCNAE(termo: string, limite = 10): CNAEInfo[] {
  const termoLower = termo.toLowerCase().trim();
  if (!termoLower) return BASE_CNAE.slice(0, limite);

  return BASE_CNAE
    .filter(c =>
      c.codigo.includes(termoLower) ||
      c.descricao.toLowerCase().includes(termoLower) ||
      c.divisao.includes(termoLower)
    )
    .slice(0, limite);
}

/**
 * Infere informações de CNAE genéricas quando código não encontrado na base
 */
export function inferirCNAE(codigo: string, descricao?: string): CNAEInfo {
  const divisao = codigo.substring(0, 2);
  const tipoAtividade = inferirTipoAtividadePorDivisao(divisao, descricao);
  const anexo = inferirAnexoPorTipo(tipoAtividade);

  return {
    codigo,
    descricao: descricao ?? `Atividade CNAE ${codigo}`,
    divisao,
    secao: inferirSecaoPorDivisao(divisao),
    tipoAtividade,
    anexoSimplesPrincipal: anexo.principal,
    anexoSimplesAlternativo: anexo.alternativo,
    permiteSimples: !isDivisaoVedadaSimples(divisao),
    impedidoSimples: isDivisaoVedadaSimples(divisao),
    motivoImpedimento: isDivisaoVedadaSimples(divisao)
      ? 'Atividade potencialmente vedada no Simples Nacional — requer validação'
      : undefined,
    aliquotaPresuncaoIRPJ: inferirPresuncaoIRPJ(tipoAtividade),
    aliquotaPresuncaoCSLL: inferirPresuncaoCSLL(tipoAtividade),
    observacoes: 'CNAE não encontrado na base — dados inferidos. Recomenda-se validação manual.',
  };
}

// -----------------------------------------------
// HELPERS INTERNOS
// -----------------------------------------------

function normalizarCodigo(codigo: string): string {
  return codigo.replace(/[^0-9]/g, '');
}

function inferirTipoAtividadePorDivisao(divisao: string, descricao?: string): TipoAtividade {
  const div = parseInt(divisao);
  const desc = descricao?.toLowerCase() ?? '';

  if (div >= 10 && div <= 33) return 'INDUSTRIA';
  if (div >= 45 && div <= 47) return 'COMERCIO';
  if (div >= 49 && div <= 53) return 'TRANSPORTE';
  if (div >= 55 && div <= 56) return 'COMERCIO';
  if (div >= 58 && div <= 63) return 'SERVICOS_INTELECTUAIS';
  if (div >= 64 && div <= 66) return 'FINANCEIRA';
  if (div >= 68 && div <= 68) return 'SERVICOS_GERAIS';
  if (div >= 69 && div <= 75) return 'SERVICOS_INTELECTUAIS';
  if (div >= 77 && div <= 82) return 'SERVICOS_GERAIS';
  if (div >= 85 && div <= 85) return 'SERVICOS_GERAIS';
  if (div >= 86 && div <= 88) return 'SERVICOS_HOSPITALARES';
  if (div >= 41 && div <= 43) return 'CONSTRUCAO';
  if (div >= 1 && div <= 3) return 'RURAL';

  if (desc.includes('médic') || desc.includes('hospital') || desc.includes('clínica')) return 'SERVICOS_HOSPITALARES';
  if (desc.includes('constru') || desc.includes('engenharia')) return 'CONSTRUCAO';
  if (desc.includes('transport')) return 'TRANSPORTE';

  return 'SERVICOS_GERAIS';
}

function inferirAnexoPorTipo(tipo: TipoAtividade): { principal: AnexoSimples; alternativo?: AnexoSimples } {
  switch (tipo) {
    case 'COMERCIO': return { principal: 'I' };
    case 'INDUSTRIA': return { principal: 'II' };
    case 'CONSTRUCAO': return { principal: 'IV' };
    case 'SERVICOS_HOSPITALARES': return { principal: 'III' };
    case 'TRANSPORTE': return { principal: 'III' };
    case 'SERVICOS_INTELECTUAIS': return { principal: 'V', alternativo: 'III' };
    case 'RURAL': return { principal: 'I' };
    default: return { principal: 'III' };
  }
}

function inferirSecaoPorDivisao(divisao: string): string {
  const div = parseInt(divisao);
  if (div >= 1 && div <= 3) return 'A';
  if (div >= 5 && div <= 9) return 'B';
  if (div >= 10 && div <= 33) return 'C';
  if (div === 35) return 'D';
  if (div >= 36 && div <= 39) return 'E';
  if (div >= 41 && div <= 43) return 'F';
  if (div >= 45 && div <= 47) return 'G';
  if (div >= 49 && div <= 53) return 'H';
  if (div >= 55 && div <= 56) return 'I';
  if (div >= 58 && div <= 63) return 'J';
  if (div >= 64 && div <= 66) return 'K';
  if (div === 68) return 'L';
  if (div >= 69 && div <= 75) return 'M';
  if (div >= 77 && div <= 82) return 'N';
  if (div === 84) return 'O';
  if (div === 85) return 'P';
  if (div >= 86 && div <= 88) return 'Q';
  return 'S';
}

// Divisões potencialmente vedadas no Simples Nacional
function isDivisaoVedadaSimples(divisao: string): boolean {
  const div = parseInt(divisao);
  // Financeiras (64-66), energia elétrica (35), combustíveis (65)
  return (div >= 64 && div <= 66) || div === 35;
}

function inferirPresuncaoIRPJ(tipo: TipoAtividade): number {
  switch (tipo) {
    case 'COMERCIO':
    case 'INDUSTRIA':
    case 'CONSTRUCAO':
    case 'RURAL': return 0.08;
    case 'TRANSPORTE': return 0.16;
    case 'SERVICOS_HOSPITALARES': return 0.08;
    default: return 0.32;
  }
}

function inferirPresuncaoCSLL(tipo: TipoAtividade): number {
  switch (tipo) {
    case 'COMERCIO':
    case 'INDUSTRIA':
    case 'CONSTRUCAO':
    case 'RURAL':
    case 'SERVICOS_HOSPITALARES': return 0.12;
    default: return 0.32;
  }
}

export { BASE_CNAE };
