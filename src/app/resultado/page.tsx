'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TaxReport } from '@/components/report/TaxReport';
import type { ResultadoAnalise } from '@/types';

export default function ResultadoPage() {
  const [resultado, setResultado] = useState<ResultadoAnalise | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    try {
      const dados = sessionStorage.getItem('resultado_analise');
      if (!dados) {
        setErro('Nenhuma análise encontrada. Realize uma nova análise.');
        return;
      }
      const parsed: ResultadoAnalise = JSON.parse(dados);
      setResultado(parsed);
    } catch {
      setErro('Erro ao carregar resultado da análise.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 no-print">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">ST</span>
              </div>
              <span className="font-semibold text-slate-800">Simulador Tributário</span>
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 text-sm">Resultado da Análise</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="btn-secondary text-sm"
            >
              🖨 Imprimir
            </button>
            <Link href="/nova-analise" className="btn-primary text-sm">
              Nova Análise
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {erro ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">⚠️</p>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">{erro}</h2>
            <Link href="/nova-analise" className="btn-primary mt-4 inline-flex">
              Realizar Nova Análise
            </Link>
          </div>
        ) : resultado ? (
          <TaxReport resultado={resultado} />
        ) : (
          <div className="text-center py-20">
            <div className="inline-block w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4" />
            <p className="text-slate-600">Carregando análise...</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-10 no-print">
        <div className="max-w-5xl mx-auto px-4 text-center text-slate-400 text-xs">
          <p>
            Análise gerada pelo Simulador Tributário. Este relatório é meramente informativo e não substitui assessoria tributária profissional.
            Recomenda-se validação por contador habilitado pelo CRC ou advogado tributarista.
          </p>
        </div>
      </footer>
    </div>
  );
}
