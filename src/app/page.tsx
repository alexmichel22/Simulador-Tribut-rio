'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">ST</span>
            </div>
            <span className="text-white font-semibold text-lg">Simulador Tributário</span>
          </div>
          <Link href="/nova-analise" className="btn-primary">
            Iniciar Análise
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-300 text-sm font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
          Análise técnica com Inteligência Artificial
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight mb-6">
          O regime tributário certo
          <br />
          <span className="text-brand-400">para sua empresa</span>
        </h1>

        <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          Sistema de análise tributária inteligente que compara MEI, Simples Nacional, Lucro Presumido e Lucro Real
          com base em dados reais da sua empresa, legislação vigente e inteligência artificial.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/nova-analise" className="btn-primary text-base px-8 py-3.5">
            Iniciar Análise Gratuita
          </Link>
          <a href="#como-funciona" className="btn-secondary text-base px-8 py-3.5 bg-white/10 text-white border-white/20 hover:bg-white/20">
            Como Funciona
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-16 max-w-lg mx-auto">
          {[
            { valor: '4', label: 'Regimes analisados' },
            { valor: '7', label: 'Etapas de análise' },
            { valor: 'IA', label: 'Parecer tributário' },
          ].map(({ valor, label }) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-bold text-white">{valor}</div>
              <div className="text-slate-400 text-sm mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="como-funciona" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Como funciona</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              title: 'Informe os dados',
              desc: 'Preencha o formulário com dados cadastrais, societários, operacionais e tributários da empresa.',
              icon: '📋',
            },
            {
              step: '02',
              title: 'Motor de análise',
              desc: 'O sistema verifica elegibilidade, calcula cenários comparativos e aplica regras tributárias vigentes.',
              icon: '⚙️',
            },
            {
              step: '03',
              title: 'Parecer com IA',
              desc: 'Receba um parecer tributário técnico e executivo gerado por inteligência artificial, com fundamento legal.',
              icon: '📊',
            },
          ].map(({ step, title, desc, icon }) => (
            <div key={step} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{icon}</span>
                <span className="text-brand-400 font-bold text-sm">Etapa {step}</span>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* O que o sistema analisa */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-white/10">
        <h2 className="text-3xl font-bold text-white text-center mb-12">O que o sistema analisa</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'MEI', desc: 'Limite R$ 81k/ano. Cota fixa mensal.', color: 'from-emerald-500/20 to-emerald-600/10' },
            { title: 'Simples Nacional', desc: 'Até R$ 4,8M. Anexos I a V. Fator R.', color: 'from-blue-500/20 to-blue-600/10' },
            { title: 'Lucro Presumido', desc: 'Até R$ 78M. Presunção por atividade.', color: 'from-amber-500/20 to-amber-600/10' },
            { title: 'Lucro Real', desc: 'Sem limite. Créditos PIS/COFINS.', color: 'from-red-500/20 to-red-600/10' },
          ].map(({ title, desc, color }) => (
            <div key={title} className={`bg-gradient-to-br ${color} border border-white/10 rounded-2xl p-5`}>
              <h3 className="text-white font-semibold mb-2">{title}</h3>
              <p className="text-slate-400 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Alertas e compliance */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-white/10">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6">
          <h3 className="text-amber-400 font-semibold text-lg mb-2">⚠️ Aviso de responsabilidade</h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            Este sistema é uma ferramenta de apoio à decisão tributária. Os cálculos e recomendações são estimativas baseadas nos dados informados e nas regras tributárias vigentes.
            Esta análise automatizada não substitui a avaliação de contador habilitado pelo CRC ou de advogado tributarista.
            Para casos envolvendo estruturas societárias complexas, offshore, trust, reorganização societária ou planejamento patrimonial, recomenda-se obrigatoriamente a validação por especialista.
          </p>
        </div>
      </section>

      {/* CTA Final */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center border-t border-white/10">
        <h2 className="text-3xl font-bold text-white mb-4">
          Pronto para otimizar sua tributação?
        </h2>
        <p className="text-slate-300 mb-8">
          Análise completa em minutos. Sem cadastro necessário.
        </p>
        <Link href="/nova-analise" className="btn-primary text-base px-10 py-4">
          Iniciar Análise Agora
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>Simulador Tributário © {new Date().getFullYear()} — Ferramenta de suporte à decisão. Não substitui consultoria profissional.</p>
        </div>
      </footer>
    </div>
  );
}
