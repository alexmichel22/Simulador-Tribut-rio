// ==============================================
// CONSTANTES TRIBUTÁRIAS BRASILEIRAS (2024/2025)
// Base legal: LC 123/2006, RIR/2018, Lei 9.430/96
// ==============================================

// -----------------------------------------------
// LIMITES DE FATURAMENTO
// -----------------------------------------------
export const LIMITES = {
  MEI: 81_000, // art. 18-A, §1º, LC 123/2006
  SIMPLES_NACIONAL: 4_800_000, // art. 3º, II, LC 123/2006
  SIMPLES_SUBLIMITE_ISS_ICMS: 3_600_000, // sublimite para ISS/ICMS em alguns estados
  LUCRO_PRESUMIDO: 78_000_000, // art. 13, Lei 9.718/98
  // Lucro Real: obrigatório acima de R$ 78M ou para setores específicos
} as const;

// -----------------------------------------------
// ADICIONAL DE IRPJ
// -----------------------------------------------
export const ADICIONAL_IRPJ = {
  ALIQUOTA: 0.10, // 10%
  LIMITE_MENSAL: 20_000, // R$ 20.000/mês sobre a base de presunção
  LIMITE_ANUAL: 240_000,
} as const;

// -----------------------------------------------
// ALÍQUOTAS — LUCRO PRESUMIDO
// -----------------------------------------------
export const LUCRO_PRESUMIDO = {
  IRPJ_ALIQUOTA: 0.15, // 15% sobre a base de presunção
  CSLL_ALIQUOTA: 0.09, // 9% sobre a base de presunção CSLL
  PIS_ALIQUOTA: 0.0065, // 0,65% — regime cumulativo
  COFINS_ALIQUOTA: 0.03, // 3% — regime cumulativo

  // Percentuais de presunção do IRPJ (art. 15, Lei 9.249/95)
  PRESUNCAO_IRPJ: {
    COMERCIO: 0.08,
    INDUSTRIA: 0.08,
    SERVICOS_HOSPITALARES: 0.08,
    TRANSPORTE_CARGAS: 0.08,
    TRANSPORTE_PASSAGEIROS: 0.16,
    SERVICOS_GERAIS: 0.32,
    SERVICOS_INTELECTUAIS: 0.32,
    CONSTRUCAO: 0.08, // com material próprio
    RURAL: 0.08,
    FINANCEIRA: 0.32,
    MISTO: 0.32, // conservador
  } as Record<string, number>,

  // Percentuais de presunção da CSLL (art. 20, Lei 9.249/95)
  PRESUNCAO_CSLL: {
    COMERCIO: 0.12,
    INDUSTRIA: 0.12,
    SERVICOS_HOSPITALARES: 0.12,
    TRANSPORTE_CARGAS: 0.12,
    TRANSPORTE_PASSAGEIROS: 0.12,
    SERVICOS_GERAIS: 0.32,
    SERVICOS_INTELECTUAIS: 0.32,
    CONSTRUCAO: 0.12,
    RURAL: 0.12,
    FINANCEIRA: 0.32,
    MISTO: 0.32,
  } as Record<string, number>,
} as const;

// -----------------------------------------------
// ALÍQUOTAS — LUCRO REAL
// -----------------------------------------------
export const LUCRO_REAL = {
  IRPJ_ALIQUOTA: 0.15,
  CSLL_ALIQUOTA: 0.09,
  PIS_ALIQUOTA: 0.0165, // 1,65% — não cumulativo
  COFINS_ALIQUOTA: 0.076, // 7,6% — não cumulativo
  // Créditos de PIS/COFINS sobre insumos — variável por setor
  CREDITO_PIS_COFINS_ESTIMADO: 0.30, // estimativa conservadora: 30% do PIS/COFINS
} as const;

// -----------------------------------------------
// TABELAS SIMPLES NACIONAL (Resolução CGSN 140/2018)
// Vigência: 2018 até atualização legal
// -----------------------------------------------

export interface FaixaSimples {
  limiteInferior: number;
  limiteSuperior: number;
  aliquotaNominal: number;
  parcelaDeduzir: number;
}

// ANEXO I — Comércio (art. 25, Tabela I, LC 123/2006)
export const ANEXO_I: FaixaSimples[] = [
  { limiteInferior: 0, limiteSuperior: 180_000, aliquotaNominal: 0.04, parcelaDeduzir: 0 },
  { limiteInferior: 180_000.01, limiteSuperior: 360_000, aliquotaNominal: 0.073, parcelaDeduzir: 5_940 },
  { limiteInferior: 360_000.01, limiteSuperior: 720_000, aliquotaNominal: 0.095, parcelaDeduzir: 13_860 },
  { limiteInferior: 720_000.01, limiteSuperior: 1_800_000, aliquotaNominal: 0.107, parcelaDeduzir: 22_500 },
  { limiteInferior: 1_800_000.01, limiteSuperior: 3_600_000, aliquotaNominal: 0.143, parcelaDeduzir: 87_300 },
  { limiteInferior: 3_600_000.01, limiteSuperior: 4_800_000, aliquotaNominal: 0.19, parcelaDeduzir: 378_000 },
];

// ANEXO II — Indústria (art. 25, Tabela II, LC 123/2006)
export const ANEXO_II: FaixaSimples[] = [
  { limiteInferior: 0, limiteSuperior: 180_000, aliquotaNominal: 0.045, parcelaDeduzir: 0 },
  { limiteInferior: 180_000.01, limiteSuperior: 360_000, aliquotaNominal: 0.078, parcelaDeduzir: 5_940 },
  { limiteInferior: 360_000.01, limiteSuperior: 720_000, aliquotaNominal: 0.10, parcelaDeduzir: 13_860 },
  { limiteInferior: 720_000.01, limiteSuperior: 1_800_000, aliquotaNominal: 0.112, parcelaDeduzir: 22_500 },
  { limiteInferior: 1_800_000.01, limiteSuperior: 3_600_000, aliquotaNominal: 0.147, parcelaDeduzir: 85_500 },
  { limiteInferior: 3_600_000.01, limiteSuperior: 4_800_000, aliquotaNominal: 0.30, parcelaDeduzir: 720_000 },
];

// ANEXO III — Serviços com Fator R >= 28% (art. 25, Tabela III, LC 123/2006)
export const ANEXO_III: FaixaSimples[] = [
  { limiteInferior: 0, limiteSuperior: 180_000, aliquotaNominal: 0.06, parcelaDeduzir: 0 },
  { limiteInferior: 180_000.01, limiteSuperior: 360_000, aliquotaNominal: 0.112, parcelaDeduzir: 9_360 },
  { limiteInferior: 360_000.01, limiteSuperior: 720_000, aliquotaNominal: 0.132, parcelaDeduzir: 17_640 },
  { limiteInferior: 720_000.01, limiteSuperior: 1_800_000, aliquotaNominal: 0.16, parcelaDeduzir: 35_640 },
  { limiteInferior: 1_800_000.01, limiteSuperior: 3_600_000, aliquotaNominal: 0.21, parcelaDeduzir: 125_640 },
  { limiteInferior: 3_600_000.01, limiteSuperior: 4_800_000, aliquotaNominal: 0.33, parcelaDeduzir: 648_000 },
];

// ANEXO IV — Serviços específicos (vigilância, limpeza, construção civil, etc.)
// Não inclui CPP — recolhido separadamente ao INSS
export const ANEXO_IV: FaixaSimples[] = [
  { limiteInferior: 0, limiteSuperior: 180_000, aliquotaNominal: 0.045, parcelaDeduzir: 0 },
  { limiteInferior: 180_000.01, limiteSuperior: 360_000, aliquotaNominal: 0.09, parcelaDeduzir: 8_100 },
  { limiteInferior: 360_000.01, limiteSuperior: 720_000, aliquotaNominal: 0.102, parcelaDeduzir: 12_420 },
  { limiteInferior: 720_000.01, limiteSuperior: 1_800_000, aliquotaNominal: 0.14, parcelaDeduzir: 39_780 },
  { limiteInferior: 1_800_000.01, limiteSuperior: 3_600_000, aliquotaNominal: 0.22, parcelaDeduzir: 183_780 },
  { limiteInferior: 3_600_000.01, limiteSuperior: 4_800_000, aliquotaNominal: 0.33, parcelaDeduzir: 828_000 },
];

// ANEXO V — Serviços intelectuais com Fator R < 28% (art. 25, Tabela V, LC 123/2006)
export const ANEXO_V: FaixaSimples[] = [
  { limiteInferior: 0, limiteSuperior: 180_000, aliquotaNominal: 0.155, parcelaDeduzir: 0 },
  { limiteInferior: 180_000.01, limiteSuperior: 360_000, aliquotaNominal: 0.18, parcelaDeduzir: 4_500 },
  { limiteInferior: 360_000.01, limiteSuperior: 720_000, aliquotaNominal: 0.195, parcelaDeduzir: 9_900 },
  { limiteInferior: 720_000.01, limiteSuperior: 1_800_000, aliquotaNominal: 0.205, parcelaDeduzir: 17_100 },
  { limiteInferior: 1_800_000.01, limiteSuperior: 3_600_000, aliquotaNominal: 0.23, parcelaDeduzir: 62_100 },
  { limiteInferior: 3_600_000.01, limiteSuperior: 4_800_000, aliquotaNominal: 0.305, parcelaDeduzir: 540_000 },
];

export const TABELAS_SIMPLES: Record<string, FaixaSimples[]> = {
  I: ANEXO_I,
  II: ANEXO_II,
  III: ANEXO_III,
  IV: ANEXO_IV,
  V: ANEXO_V,
};

// -----------------------------------------------
// FATOR R — Simples Nacional
// -----------------------------------------------
export const FATOR_R_MINIMO = 0.28; // 28% (folha 12m / receita 12m)

// -----------------------------------------------
// MEI — Valores mensais (2024)
// -----------------------------------------------
export const MEI_VALORES = {
  LIMITE_FATURAMENTO: 81_000,
  DAS_COMERCIO_INDUSTRIA: 71.60, // INSS + ICMS (2024)
  DAS_SERVICOS: 75.60, // INSS + ISS
  DAS_COMERCIO_SERVICOS: 76.60, // INSS + ICMS + ISS
  MAX_EMPREGADOS: 1,
} as const;

// -----------------------------------------------
// ISS — estimativa padrão
// -----------------------------------------------
export const ISS_ALIQUOTA_PADRAO = 0.03; // 3% — média nacional
export const ISS_ALIQUOTA_MINIMA = 0.02; // 2% — CF/88, art. 156, §3º, I
export const ISS_ALIQUOTA_MAXIMA = 0.05; // 5% — LC 116/2003

// -----------------------------------------------
// INSS PATRONAL (fora do Simples — Anexo IV)
// -----------------------------------------------
export const INSS_PATRONAL = 0.20; // 20% sobre folha
export const RAT_MEDIO = 0.02; // 2% média — acidente do trabalho
export const OUTRAS_ENTIDADES = 0.058; // 5,8% média (SESI, SENAI, etc.)
export const ENCARGOS_PATRONAIS_TOTAL = INSS_PATRONAL + RAT_MEDIO + OUTRAS_ENTIDADES; // ~27,8%
