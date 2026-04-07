// ==============================================
// MÓDULO AI — GERAÇÃO DE PARECER TRIBUTÁRIO
// Integração com Claude (Anthropic API)
// ==============================================

import Anthropic from '@anthropic-ai/sdk';
import type { ResultadoAnalise, ParecerIA } from '@/types';
import { SYSTEM_PROMPT, construirPromptParecer } from './prompts';

// -----------------------------------------------
// CLIENTE ANTHROPIC (singleton)
// -----------------------------------------------

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY não configurada. Defina a variável de ambiente para gerar pareceres com IA.');
    }
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

// -----------------------------------------------
// GERAÇÃO DO PARECER
// -----------------------------------------------

export async function gerarParecer(resultado: ResultadoAnalise): Promise<ParecerIA> {
  const client = getClient();
  const promptUsuario = construirPromptParecer(resultado);

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: promptUsuario,
      },
    ],
  });

  const textoCompleto = response.content
    .filter(b => b.type === 'text')
    .map(b => b.type === 'text' ? b.text : '')
    .join('');

  // Extrair seções do parecer
  const secoes = extrairSecoes(textoCompleto);

  return {
    resumoExecutivo: secoes.resumoExecutivo,
    analiseTecnica: secoes.analiseTecnica,
    fundamentacaoRecomendacao: secoes.fundamentacaoRecomendacao,
    vantagensRegimeRecomendado: secoes.vantagensRegimeRecomendado,
    desvantagensRegimesNaoRecomendados: secoes.analiseOutrosRegimes,
    riscosTributarios: secoes.riscosPontosAtencao,
    pontosDeAtencao: secoes.riscosPontosAtencao,
    ressalvasLegais: secoes.ressalvasLegais,
    conclusaoFinal: secoes.conclusao,
    modeloUtilizado: 'claude-opus-4-6',
    geradoEm: new Date().toISOString(),
  };
}

// -----------------------------------------------
// EXTRAÇÃO DE SEÇÕES DO TEXTO
// -----------------------------------------------

interface SecoesParecerParsed {
  resumoExecutivo: string;
  analiseTecnica: string;
  fundamentacaoRecomendacao: string;
  vantagensRegimeRecomendado: string;
  analiseOutrosRegimes: string;
  riscosPontosAtencao: string;
  ressalvasLegais: string;
  conclusao: string;
  textoCompleto: string;
}

function extrairSecoes(texto: string): SecoesParecerParsed {
  const secoes: SecoesParecerParsed = {
    resumoExecutivo: '',
    analiseTecnica: '',
    fundamentacaoRecomendacao: '',
    vantagensRegimeRecomendado: '',
    analiseOutrosRegimes: '',
    riscosPontosAtencao: '',
    ressalvasLegais: '',
    conclusao: '',
    textoCompleto: texto,
  };

  // Mapeamento de padrões de títulos para chaves
  const padroes: Array<{ chave: keyof SecoesParecerParsed; regex: RegExp }> = [
    { chave: 'resumoExecutivo', regex: /RESUMO\s+EXECUTIVO/i },
    { chave: 'analiseTecnica', regex: /AN[AÁ]LISE\s+T[EÉ]CNICA/i },
    { chave: 'fundamentacaoRecomendacao', regex: /FUNDAMENTA[CÇ][AÃ]O\s+DA\s+RECOMENDA[CÇ][AÃ]O/i },
    { chave: 'vantagensRegimeRecomendado', regex: /VANTAGENS\s+DO\s+REGIME/i },
    { chave: 'analiseOutrosRegimes', regex: /AN[AÁ]LISE\s+DOS\s+DEMAIS|OUTROS\s+REGIMES/i },
    { chave: 'riscosPontosAtencao', regex: /RISCOS\s+E\s+PONTOS|PONTOS\s+DE\s+ATEN[CÇ][AÃ]O/i },
    { chave: 'ressalvasLegais', regex: /RESSALVAS|RECOMENDA[CÇ][OÕ]ES\s+FINAIS/i },
    { chave: 'conclusao', regex: /CONCLUS[AÃ]O/i },
  ];

  // Dividir por headings (** ** ou # )
  const linhas = texto.split('\n');
  let secaoAtual: keyof SecoesParecerParsed = 'resumoExecutivo';
  const buffers: Partial<Record<keyof SecoesParecerParsed, string[]>> = {};

  for (const linha of linhas) {
    // Verificar se é um título
    let isTitulo = false;
    for (const { chave, regex } of padroes) {
      if (regex.test(linha)) {
        secaoAtual = chave;
        buffers[secaoAtual] = buffers[secaoAtual] ?? [];
        isTitulo = true;
        break;
      }
    }
    if (!isTitulo) {
      buffers[secaoAtual] = buffers[secaoAtual] ?? [];
      buffers[secaoAtual]!.push(linha);
    }
  }

  // Montar seções
  for (const { chave } of padroes) {
    secoes[chave] = (buffers[chave] ?? []).join('\n').trim();
  }

  // Fallback: se nenhuma seção foi extraída, usar o texto completo
  const temConteudo = padroes.some(({ chave }) => secoes[chave].length > 50);
  if (!temConteudo) {
    secoes.resumoExecutivo = texto;
    secoes.analiseTecnica = texto;
    secoes.conclusao = texto;
  }

  return secoes;
}

// -----------------------------------------------
// VERIFICAÇÃO DE DISPONIBILIDADE DA API
// -----------------------------------------------

export function isAIDisponivel(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
