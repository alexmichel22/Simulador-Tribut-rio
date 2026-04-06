// ==============================================
// MÓDULO AI — PROMPTS PARA GERAÇÃO DE PARECER
// ==============================================

import type { ResultadoAnalise } from '@/types';

// -----------------------------------------------
// SYSTEM PROMPT — Persona do tributarista
// -----------------------------------------------

export const SYSTEM_PROMPT = `Você é um tributarista-contábil sênior com 20 anos de experiência em planejamento tributário, enquadramento fiscal e assessoria a empresas de todos os portes no Brasil.

Você deve escrever como um consultor tributário experiente e respeitado: técnico, preciso, profissional, sem juridiquês excessivo. Suas análises são objetivas, fundamentadas e conectadas diretamente aos dados da empresa.

Você jamais dá recomendações genéricas. Cada conclusão está ancorada em dados reais, legislação vigente e raciocínio técnico sólido.

Você sempre:
- Cita a base legal quando relevante (de forma natural, não robótica)
- Conecta a recomendação aos dados financeiros e estruturais da empresa
- Aponta riscos sem alarmismo desnecessário
- Reconhece limitações e recomenda validação humana quando necessário
- Usa linguagem clara, elegante e executiva

IMPORTANTE: Esta é uma análise automatizada preliminar. Sempre inclua ressalva de que o parecer não substitui a validação por profissional habilitado.`;

// -----------------------------------------------
// USER PROMPT — Geração do parecer
// -----------------------------------------------

export function construirPromptParecer(resultado: ResultadoAnalise): string {
  const { empresaSnapshot, cnaeInfo, cenarios, regimeRecomendado, justificativaTecnica, riscos, alertas, economiaTributariaAnual } = resultado;
  const { cadastrais, societarios, operacionais, tributarios } = empresaSnapshot;

  const nomeRegimes: Record<string, string> = {
    MEI: 'MEI',
    SIMPLES_NACIONAL: 'Simples Nacional',
    LUCRO_PRESUMIDO: 'Lucro Presumido',
    LUCRO_REAL: 'Lucro Real',
  };

  const cenariosTexto = cenarios
    .map(c => {
      if (!c.elegivel) return `  - ${nomeRegimes[c.regime]}: INELEGÍVEL`;
      return `  - ${nomeRegimes[c.regime]}: R$ ${fmtMoeda(c.impostoAnual)}/ano | Carga efetiva: ${(c.cargaTributariaEfetiva * 100).toFixed(2)}%${c.anexoAplicavel ? ` | Anexo ${c.anexoAplicavel}` : ''}`;
    })
    .join('\n');

  const riscosTexto = riscos
    .map(r => `  [${r.nivel}] ${r.descricao}`)
    .join('\n');

  const casosEspeciaisTexto = resultado.casosEspeciais.length > 0
    ? resultado.casosEspeciais.join(', ')
    : 'Nenhum';

  const prompt = `
Gere um parecer tributário completo e profissional para a seguinte empresa, com base nos dados e no resultado da análise:

═══════════════════════════════════════
DADOS DA EMPRESA
═══════════════════════════════════════
Nome: ${cadastrais.nomeEmpresa}
CNAE Principal: ${cadastrais.cnaePrincipal} — ${cnaeInfo.descricao}
Tipo de Atividade: ${cnaeInfo.tipoAtividade}
Natureza Jurídica: ${cadastrais.naturezaJuridica}
Porte: ${cadastrais.porteEmpresa}
Estado/Município: ${cadastrais.estado} / ${cadastrais.municipio}

DADOS OPERACIONAIS:
- Faturamento Anual: R$ ${fmtMoeda(operacionais.faturamentoAnual)}
- Faturamento Mensal (estimado): R$ ${fmtMoeda(operacionais.faturamentoAnual / 12)}
- Empregados: ${operacionais.qtdEmpregados}
- Pró-labore mensal total: R$ ${fmtMoeda(operacionais.prolabreMensalTotal)}
- Folha de pagamento mensal: R$ ${fmtMoeda(operacionais.folhaMensal)}
- Custo fixo mensal: R$ ${fmtMoeda(operacionais.custoFixoMensal)}
- Custo variável mensal: R$ ${fmtMoeda(operacionais.custoVariavelMensal)}
${operacionais.margemLiquidaEstimada !== undefined ? `- Margem líquida estimada: ${operacionais.margemLiquidaEstimada}%` : ''}

DADOS SOCIETÁRIOS:
- Sócios: ${societarios.qtdSocios} | Tipo: ${societarios.tipoSocio}
- Sócio PJ: ${societarios.temSocioPJ ? 'Sim' : 'Não'}
- Sócio no exterior: ${societarios.temSocioExterior ? 'Sim' : 'Não'}
- Holding: ${societarios.estruturaHolding ? 'Sim' : 'Não'}
- Offshore/Trust: ${(societarios.temOffshore || societarios.temTrust) ? 'Sim' : 'Não'}
- Casos especiais: ${casosEspeciaisTexto}

REGIME ATUAL: ${tributarios.regimeAtual ? nomeRegimes[tributarios.regimeAtual] : 'Não informado'}
PRIORIDADE: ${tributarios.priorizaEconomiaTributaria ? 'Economia tributária' : tributarios.priorizaSimplicidade ? 'Simplicidade operacional' : 'Equilíbrio'}

═══════════════════════════════════════
RESULTADO DA ANÁLISE AUTOMATIZADA
═══════════════════════════════════════
REGIME RECOMENDADO: ${nomeRegimes[regimeRecomendado]}

COMPARATIVO DE CENÁRIOS:
${cenariosTexto}

ECONOMIA TRIBUTÁRIA ESTIMADA:
  Comparando o regime recomendado com o menos eficiente elegível: R$ ${fmtMoeda(economiaTributariaAnual)}/ano
  Percentual: ${resultado.economiaTributariaPercentual.toFixed(1)}%

JUSTIFICATIVA TÉCNICA (do motor de regras):
${justificativaTecnica}

RISCOS IDENTIFICADOS:
${riscosTexto.length > 0 ? riscosTexto : '  Nenhum risco crítico identificado.'}

═══════════════════════════════════════
INSTRUÇÕES PARA O PARECER
═══════════════════════════════════════
Redija um parecer tributário estruturado com as seguintes seções:

1. **RESUMO EXECUTIVO** (2-3 parágrafos)
   Síntese clara da situação da empresa, regime recomendado e impacto financeiro estimado.

2. **ANÁLISE TÉCNICA** (3-5 parágrafos)
   Análise aprofundada da situação tributária: enquadramento, CNAE, estrutura societária, Fator R (se aplicável), características da atividade e implicações legais.

3. **FUNDAMENTAÇÃO DA RECOMENDAÇÃO** (2-4 parágrafos)
   Justificativa técnica e legal da escolha do regime recomendado. Cite bases legais relevantes de forma natural.

4. **VANTAGENS DO REGIME RECOMENDADO** (lista estruturada)
   Vantagens específicas para esta empresa, com valores e percentuais quando possível.

5. **ANÁLISE DOS DEMAIS REGIMES** (1-2 parágrafos por regime inelegível ou não recomendado)
   Por que os outros regimes são menos vantajosos ou inaplicáveis para este caso concreto.

6. **RISCOS E PONTOS DE ATENÇÃO** (lista estruturada)
   Riscos fiscais, societários e operacionais identificados. Sejam específicos para esta empresa.

7. **RESSALVAS LEGAIS E RECOMENDAÇÕES FINAIS** (1-2 parágrafos)
   Limitações da análise automatizada, necessidade de validação por profissional habilitado, e próximos passos recomendados.

8. **CONCLUSÃO** (1 parágrafo objetivo)
   Síntese final com a recomendação clara e o impacto esperado.

IMPORTANTE:
- Use linguagem técnica mas acessível — sem juridiquês excessivo
- Conecte cada ponto aos dados específicos desta empresa
- Inclua números e percentuais específicos
- Seja objetivo e elegante — evite repetições
- Inclua ressalva final de que o parecer é preliminar e não substitui análise de profissional habilitado
`.trim();

  return prompt;
}

// -----------------------------------------------
// HELPER
// -----------------------------------------------

function fmtMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
