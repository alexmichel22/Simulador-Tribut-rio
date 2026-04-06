import Link from 'next/link';
import { EmpresaForm } from '@/components/forms/EmpresaForm';

export default function NovaAnalisePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">ST</span>
              </div>
              <span className="font-semibold text-slate-800">Simulador Tributário</span>
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 text-sm">Nova Análise</span>
          </div>
          <Link href="/" className="btn-ghost text-sm">
            ← Voltar ao início
          </Link>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8 text-center">
          <h1 className="page-title mb-2">Nova Análise Tributária</h1>
          <p className="text-muted max-w-lg mx-auto">
            Preencha os dados da empresa em 4 etapas. O sistema irá calcular e comparar todos os regimes tributários aplicáveis.
          </p>
        </div>

        <EmpresaForm />

        {/* Aviso de privacidade */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            Os dados informados são utilizados exclusivamente para a análise tributária e não são armazenados de forma persistente sem configuração de banco de dados.
          </p>
        </div>
      </main>
    </div>
  );
}
