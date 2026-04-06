// ==============================================
// SIMULADOR TRIBUTÁRIO — TIPOS CENTRAIS
// ==============================================

// -----------------------------------------------
// ENUMERAÇÕES
// -----------------------------------------------

export type RegimeTributario =
  | 'MEI'
  | 'SIMPLES_NACIONAL'
  | 'LUCRO_PRESUMIDO'
  | 'LUCRO_REAL';

export type NaturezaJuridica =
  | 'MEI'
  | 'EI' // Empresário Individual
  | 'EIRELI'
  | 'SLU' // Sociedade Limitada Unipessoal
  | 'LTDA'
  | 'SA' // Sociedade Anônima
  | 'SS' // Sociedade Simples
  | 'COOPERATIVA'
  | 'HOLDING_LTDA'
  | 'HOLDING_SA'
  | 'OFFSHORE'
  | 'TRUST'
  | 'OUTROS';

export type PorteEmpresa = 'MEI' | 'ME' | 'EPP' | 'MEDIO' | 'GRANDE';

export type TipoSocio = 'PF' | 'PJ' | 'MISTO';

export type AnexoSimples = 'I' | 'II' | 'III' | 'IV' | 'V';

export type TipoAtividade =
  | 'COMERCIO'
  | 'INDUSTRIA'
  | 'SERVICOS_GERAIS'
  | 'SERVICOS_INTELECTUAIS'
  | 'SERVICOS_HOSPITALARES'
  | 'TRANSPORTE'
  | 'CONSTRUCAO'
  | 'RURAL'
  | 'FINANCEIRA'
  | 'MISTO';

// -----------------------------------------------
// DADOS DE ENTRADA (Formulário)
// -----------------------------------------------

export interface DadosCadastrais {
  nomeEmpresa: string;
  cnpj?: string;
  cnaePrincipal: string;
  cnaesSecundarios?: string[];
  descricaoAtividade?: string;
  naturezaJuridica: NaturezaJuridica;
  porteEmpresa: PorteEmpresa;
  dataAbertura?: string;
  estado: string;
  municipio: string;
  possuiFiliais: boolean;
}

export interface DadosSocietarios {
  qtdSocios: number;
  tipoSocio: TipoSocio;
  temSocioPJ: boolean;
  temSocioExterior: boolean;
  temParticipacaoOutrasEmpresas: boolean;
  percentualParticipacaoOutras?: number; // % na outra empresa
  outraEmpresaOpcaoSimples?: boolean;
  estruturaHolding: boolean;
  temOffshore: boolean;
  temTrust: boolean;
}

export interface DadosOperacionais {
  faturamentoAnual: number;
  qtdEmpregados: number;
  prolabreMensalTotal: number;
  folhaMensal: number;
  custoFixoMensal: number;
  custoVariavelMensal: number;
  margemLiquidaEstimada?: number; // %
}

export interface DadosTributarios {
  regimeAtual?: RegimeTributario;
  priorizaEconomiaTributaria: boolean;
  priorizaSimplicidade: boolean;
  atividadeDependeFatorR?: boolean;
  temCreditosPISCOFINS?: boolean;
}

export interface EmpresaInput {
  cadastrais: DadosCadastrais;
  societarios: DadosSocietarios;
  operacionais: DadosOperacionais;
  tributarios: DadosTributarios;
}

// -----------------------------------------------
// CNAE
// -----------------------------------------------

export interface CNAEInfo {
  codigo: string;
  descricao: string;
  divisao: string;
  secao: string;
  tipoAtividade: TipoAtividade;
  anexoSimplesPrincipal?: AnexoSimples;
  anexoSimplesAlternativo?: AnexoSimples; // para Fator R
  permiteSimples: boolean;
  impedidoSimples: boolean;
  motivoImpedimento?: string;
  aliquotaPresuncaoIRPJ: number; // percentual (ex: 0.32)
  aliquotaPresuncaoCSLL: number;
  observacoes?: string;
}

// -----------------------------------------------
// MOTOR DE REGRAS — RESULTADOS
// -----------------------------------------------

export interface ImpedimentoSimples {
  impedimento: string;
  fundamento: string;
  gravidade: 'IMPEDITIVO' | 'ATENCAO' | 'INFORMATIVO';
}

export interface ElegibilidadeRegime {
  regime: RegimeTributario;
  elegivel: boolean;
  impedimentos: ImpedimentoSimples[];
  observacoes: string[];
}

export interface CenarioTributario {
  regime: RegimeTributario;
  elegivel: boolean;

  // Valores anuais estimados
  impostoAnual: number;
  cargaTributariaEfetiva: number; // %
  detalheImpostos: DetalheImpostos;

  // Projeção mensal
  impostoMensal: number;

  // Comparativo
  diferencaVsRecomendado?: number; // valor absoluto
  diferencaPercentual?: number; // %

  // Para Simples Nacional
  anexoAplicavel?: AnexoSimples;
  fatorR?: number;
  aliquotaEfetiva?: number;
}

export interface DetalheImpostos {
  irpj?: number;
  csll?: number;
  pis?: number;
  cofins?: number;
  iss?: number;
  icms?: number;
  cpp?: number; // Contribuição Patronal
  simplesNacional?: number;
  total: number;
}

export interface Risco {
  tipo: 'FISCAL' | 'LEGAL' | 'OPERACIONAL' | 'SOCIETARIO' | 'INTERNACIONAL';
  descricao: string;
  nivel: 'ALTO' | 'MEDIO' | 'BAIXO';
  recomendacao: string;
}

export interface Alerta {
  tipo: 'ATENCAO' | 'CRITICO' | 'INFORMATIVO' | 'OPORTUNIDADE';
  titulo: string;
  descricao: string;
  requerValidacaoHumana: boolean;
}

// -----------------------------------------------
// RESULTADO FINAL DA ANÁLISE
// -----------------------------------------------

export interface ResultadoAnalise {
  id: string;
  empresaSnapshot: EmpresaInput;
  timestamp: string;

  // Classificação da empresa
  tipoAtividade: TipoAtividade;
  cnaeInfo: CNAEInfo;
  porteCalculado: PorteEmpresa;
  casosEspeciais: string[];

  // Elegibilidade
  elegibilidades: ElegibilidadeRegime[];

  // Cenários
  cenarios: CenarioTributario[];
  regimeRecomendado: RegimeTributario;
  regimeRecomendadoCenario: CenarioTributario;

  // Análise
  justificativaTecnica: string;
  riscos: Risco[];
  alertas: Alerta[];
  economiaTributariaAnual: number; // vs pior regime elegível
  economiaTributariaPercentual: number;

  // Parecer IA (assíncrono)
  parecer?: ParecerIA;
}

export interface ParecerIA {
  resumoExecutivo: string;
  analiseTecnica: string;
  fundamentacaoRecomendacao: string;
  vantagensRegimeRecomendado: string;
  desvantagensRegimesNaoRecomendados: string;
  riscosTributarios: string;
  pontosDeAtencao: string;
  ressalvasLegais: string;
  conclusaoFinal: string;
  modeloUtilizado: string;
  geradoEm: string;
}

// -----------------------------------------------
// REQUEST / RESPONSE API
// -----------------------------------------------

export interface AnalisarEmpresaRequest {
  empresa: EmpresaInput;
  gerarParecer?: boolean; // se deve chamar IA
}

export interface AnalisarEmpresaResponse {
  sucesso: boolean;
  resultado?: ResultadoAnalise;
  erro?: string;
}
