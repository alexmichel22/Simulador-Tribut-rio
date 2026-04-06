// ==============================================
// API ROUTE — /api/cnae/search
// GET: Pesquisa CNAEs por código ou descrição
// ==============================================

import { NextRequest, NextResponse } from 'next/server';
import { pesquisarCNAE } from '@/modules/tax-engine/cnae';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') ?? '';
  const limite = parseInt(searchParams.get('limite') ?? '10', 10);

  const resultados = pesquisarCNAE(query, Math.min(limite, 50));

  return NextResponse.json({ resultados }, { status: 200 });
}
