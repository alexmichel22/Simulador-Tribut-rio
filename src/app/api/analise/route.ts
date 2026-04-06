// ==============================================
// API ROUTE — /api/analise
// POST: Executa análise tributária
// ==============================================

import { NextRequest, NextResponse } from 'next/server';
import type { AnalisarEmpresaRequest, AnalisarEmpresaResponse } from '@/types';
import { executarAnalise } from '@/modules/tax-engine/engine';
import { gerarParecer, isAIDisponivel } from '@/modules/ai/parecer';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // segundos — para geração de parecer com IA

export async function POST(request: NextRequest): Promise<NextResponse<AnalisarEmpresaResponse>> {
  try {
    const body = await request.json() as AnalisarEmpresaRequest;

    // Validação básica
    if (!body.empresa) {
      return NextResponse.json({
        sucesso: false,
        erro: 'Dados da empresa são obrigatórios',
      }, { status: 400 });
    }

    if (!body.empresa.cadastrais?.nomeEmpresa || !body.empresa.cadastrais?.cnaePrincipal) {
      return NextResponse.json({
        sucesso: false,
        erro: 'Nome da empresa e CNAE principal são obrigatórios',
      }, { status: 400 });
    }

    // Validar faturamento
    if (!body.empresa.operacionais?.faturamentoAnual || body.empresa.operacionais.faturamentoAnual <= 0) {
      return NextResponse.json({
        sucesso: false,
        erro: 'Faturamento anual deve ser maior que zero',
      }, { status: 400 });
    }

    // ETAPA 1-6: Motor de regras
    const resultado = executarAnalise(body.empresa);

    // ETAPA 7: Gerar parecer com IA (se solicitado e disponível)
    if (body.gerarParecer && isAIDisponivel()) {
      try {
        const parecer = await gerarParecer(resultado);
        resultado.parecer = parecer;
      } catch (err) {
        console.error('Erro ao gerar parecer com IA:', err);
        // Não falha a análise — apenas sem parecer de IA
      }
    }

    // Persistência opcional (sem DATABASE_URL — pula)
    if (process.env.DATABASE_URL) {
      try {
        const { prisma } = await import('@/lib/prisma');
        await prisma.analise.create({
          data: {
            empresaSnapshot: resultado.empresaSnapshot as object,
            regimesPossiveis: resultado.elegibilidades.filter(e => e.elegivel).map(e => e.regime) as string[],
            regimesVedados: resultado.elegibilidades.filter(e => !e.elegivel).map(e => ({ regime: e.regime, motivos: e.impedimentos })) as object[],
            cenariosComparativos: resultado.cenarios as object[],
            regimeRecomendado: resultado.regimeRecomendado,
            justificativaTecnica: resultado.justificativaTecnica,
            riscos: resultado.riscos as object[],
            alertas: resultado.alertas as object[],
            parecerExecutivo: resultado.parecer?.resumoExecutivo,
            analiseTecnica: resultado.parecer?.analiseTecnica,
            conclusao: resultado.parecer?.conclusaoFinal,
            parecerStatus: resultado.parecer ? 'GERADO' : 'PENDENTE',
          },
        });
      } catch (dbErr) {
        console.warn('Banco de dados não disponível — análise processada sem persistência:', dbErr);
      }
    }

    return NextResponse.json({ sucesso: true, resultado }, { status: 200 });

  } catch (error) {
    console.error('Erro na análise tributária:', error);
    return NextResponse.json({
      sucesso: false,
      erro: 'Erro interno ao processar a análise. Verifique os dados informados.',
    }, { status: 500 });
  }
}
