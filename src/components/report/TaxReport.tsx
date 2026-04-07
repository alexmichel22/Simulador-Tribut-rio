'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { ResultadoAnalise } from '@/types';
import {
  formatarMoeda, formatarPercentual, nomeRegime, corRegime,
  nivelRiscoLabel, tipoAlertaConfig,
} from '@/lib/utils';

interface TaxReportProps {
  resultado: ResultadoAnalise;
}

const ABAS = [
  { id: 'resumo', label: 'Resumo' },
  { id: 'comparativo', label: 'Comparativo' },
  { id: 'regimes', label: 'Regimes' },
  { id: 'riscos', label: 'Riscos e Alertas' },
  { id: 'parecer', label: 'Parecer IA' },
];

export function TaxReport({ resultado }: TaxReportProps) {
  const [aba, setAba] = useState('resumo');

  const { empresaSnapshot, cnaeInfo, cenarios, regimeRecomendado, regimeRecomendadoCenario,
    elegibilidades, riscos, alertas, economiaTributariaAnual, economiaTributariaPercentual,
    justificativaTecnica, parecer, casosEspeciais } = resultado;
  const { cadastrais, operacionais } = empresaSnapshot;

  const cenariosGrafico = cenarios
    .filter(c => c.elegivel)
    .map(c => ({
      nome: nomeRegime(c.regime),
      valor: c.impostoAnual,
      carga: +(c.cargaTributariaEfetiva * 100).toFixed(2),
      cor: corRegime(c.regime),
      recomendado: c.regime === regimeRecomendado,
    }));

  const formatarTooltip = (value: number) => [formatarMoeda(value), 'Imposto anual estimado'];

  return (
    <div className="space-y-6">
      {/* Header do relatório */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="badge badge-blue">Análise Tributária</span>
                <span className="text-muted">{new Date(resultado.timestamp).toLocaleDateString('pt-BR')}</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{cadastrais.nomeEmpresa}</h1>
              <p className="text-muted mt-1">
                CNAE {cadastrais.cnaePrincipal} — {cnaeInfo.descricao}
              </p>
            </div>
            <div className="flex-shrink-0">
              <div className="text-right">
                <p className="text-xs text-slate-500 mb-1">Regime Recomendado</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-white"
                  style={{ backgroundColor: corRegime(regimeRecomendado) }}>
                  {nomeRegime(regimeRecomendado)}
                </div>
                {regimeRecomendadoCenario && (
                  <p className="text-sm text-slate-600 mt-1.5">
                    Carga: {formatarPercentual(regimeRecomendadoCenario.cargaTributariaEfetiva)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Métricas rápidas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-slate-100">
            <MetricaCard
              label="Faturamento Anual"
              valor={formatarMoeda(operacionais.faturamentoAnual)}
            />
            <MetricaCard
              label="Imposto Estimado/ano"
              valor={formatarMoeda(regimeRecomendadoCenario?.impostoAnual ?? 0)}
              destaque
            />
            <MetricaCard
              label="Carga Tributária Efetiva"
              valor={formatarPercentual(regimeRecomendadoCenario?.cargaTributariaEfetiva ?? 0)}
              destaque
            />
            <MetricaCard
              label="Economia vs pior regime"
              valor={`até ${formatarMoeda(economiaTributariaAnual)}/ano`}
              positivo={economiaTributariaAnual > 0}
            />
          </div>

          {/* Casos especiais */}
          {casosEspeciais.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {casosEspeciais.map(c => (
                <span key={c} className="badge badge-yellow">{c}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Abas de navegação */}
      <div className="flex gap-1 overflow-x-auto pb-1 no-print">
        {ABAS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setAba(id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              aba === id
                ? 'bg-brand-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-300'
            }`}
          >
            {label}
            {id === 'riscos' && riscos.filter(r => r.nivel === 'ALTO').length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-xs">
                {riscos.filter(r => r.nivel === 'ALTO').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ABA RESUMO */}
      {aba === 'resumo' && (
        <div className="space-y-6 animate-fade-in">
          {/* Justificativa técnica */}
          <div className="card">
            <div className="card-header">
              <h2 className="section-title">Justificativa Técnica</h2>
            </div>
            <div className="card-body">
              <div className="prose prose-sm text-slate-700 max-w-none">
                {justificativaTecnica.split('\n\n').map((p, i) => (
                  <p key={i} className="mb-3 leading-relaxed">{p}</p>
                ))}
              </div>
            </div>
          </div>

          {/* Elegibilidades */}
          <div className="card">
            <div className="card-header">
              <h2 className="section-title">Elegibilidade por Regime</h2>
            </div>
            <div className="card-body space-y-3">
              {elegibilidades.map(eleg => (
                <div key={eleg.regime} className={`p-4 rounded-xl border ${eleg.elegivel ? 'border-green-200 bg-green-50' : 'border-red-100 bg-red-50/50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${eleg.elegivel ? 'bg-green-600 text-white' : 'bg-red-500 text-white'}`}>
                        {eleg.elegivel ? '✓' : '✗'}
                      </span>
                      <span className="font-medium text-slate-800">{nomeRegime(eleg.regime)}</span>
                    </div>
                    <span className={`badge ${eleg.elegivel ? 'badge-green' : 'badge-red'}`}>
                      {eleg.elegivel ? 'Elegível' : 'Inelegível'}
                    </span>
                  </div>

                  {eleg.impedimentos.filter(i => i.gravidade === 'IMPEDITIVO').map((imp, i) => (
                    <p key={i} className="text-red-700 text-xs mt-1">• {imp.impedimento}</p>
                  ))}
                  {eleg.observacoes.slice(0, 2).map((obs, i) => (
                    <p key={i} className="text-slate-600 text-xs mt-1">ℹ {obs}</p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ABA COMPARATIVO */}
      {aba === 'comparativo' && (
        <div className="space-y-6 animate-fade-in">
          {/* Gráfico */}
          {cenariosGrafico.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="section-title">Comparativo de Carga Tributária</h2>
                <p className="text-muted mt-1">Imposto anual estimado por regime</p>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={cenariosGrafico} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="nome" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={v => `R$ ${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip formatter={formatarTooltip} />
                    <Bar dataKey="valor" radius={[6, 6, 0, 0]} maxBarSize={80}>
                      {cenariosGrafico.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.cor}
                          opacity={entry.recomendado ? 1 : 0.5}
                          stroke={entry.recomendado ? entry.cor : 'transparent'}
                          strokeWidth={entry.recomendado ? 2 : 0}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-center text-slate-400 mt-2">
                  Barras destacadas = regime recomendado. Valores estimados com base nos dados informados.
                </p>
              </div>
            </div>
          )}

          {/* Tabela comparativa */}
          <div className="card">
            <div className="card-header">
              <h2 className="section-title">Tabela Detalhada</h2>
            </div>
            <div className="card-body overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 pr-4 font-medium text-slate-500">Regime</th>
                    <th className="text-right py-3 pr-4 font-medium text-slate-500">Imposto/mês</th>
                    <th className="text-right py-3 pr-4 font-medium text-slate-500">Imposto/ano</th>
                    <th className="text-right py-3 pr-4 font-medium text-slate-500">Carga %</th>
                    <th className="text-right py-3 font-medium text-slate-500">Diferença</th>
                  </tr>
                </thead>
                <tbody>
                  {cenarios.map(c => (
                    <tr key={c.regime}
                      className={`border-b border-slate-50 ${c.regime === regimeRecomendado ? 'bg-brand-50' : ''}`}>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: corRegime(c.regime) }} />
                          <span className={`font-medium ${!c.elegivel ? 'text-slate-400' : 'text-slate-800'}`}>
                            {nomeRegime(c.regime)}
                          </span>
                          {c.regime === regimeRecomendado && (
                            <span className="badge badge-blue text-xs">Recomendado</span>
                          )}
                          {!c.elegivel && <span className="badge badge-gray text-xs">Inelegível</span>}
                        </div>
                        {c.anexoAplicavel && (
                          <p className="text-xs text-slate-400 ml-5 mt-0.5">Anexo {c.anexoAplicavel} | Fator R: {((c.fatorR ?? 0) * 100).toFixed(1)}%</p>
                        )}
                      </td>
                      <td className={`text-right py-3 pr-4 tabular-nums ${!c.elegivel ? 'text-slate-400' : 'text-slate-700'}`}>
                        {c.elegivel ? formatarMoeda(c.impostoMensal) : '—'}
                      </td>
                      <td className={`text-right py-3 pr-4 tabular-nums font-semibold ${!c.elegivel ? 'text-slate-400' : 'text-slate-800'}`}>
                        {c.elegivel ? formatarMoeda(c.impostoAnual) : '—'}
                      </td>
                      <td className={`text-right py-3 pr-4 tabular-nums ${!c.elegivel ? 'text-slate-400' : 'text-slate-700'}`}>
                        {c.elegivel ? `${(c.cargaTributariaEfetiva * 100).toFixed(2)}%` : '—'}
                      </td>
                      <td className="text-right py-3 tabular-nums">
                        {c.regime === regimeRecomendado ? (
                          <span className="badge badge-green">Base</span>
                        ) : c.elegivel && c.diferencaVsRecomendado !== undefined && c.diferencaVsRecomendado > 0 ? (
                          <span className="text-red-600 text-sm">+{formatarMoeda(c.diferencaVsRecomendado)}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Decomposição do imposto recomendado */}
          {regimeRecomendadoCenario?.detalheImpostos && (
            <div className="card">
              <div className="card-header">
                <h2 className="section-title">Composição do Imposto — {nomeRegime(regimeRecomendado)}</h2>
              </div>
              <div className="card-body">
                <div className="grid sm:grid-cols-2 gap-3">
                  {Object.entries(regimeRecomendadoCenario.detalheImpostos)
                    .filter(([k, v]) => k !== 'total' && v && (v as number) > 0)
                    .map(([chave, valor]) => (
                      <div key={chave} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <span className="text-sm text-slate-600 uppercase tracking-wide font-medium">{chave}</span>
                        <span className="text-sm font-semibold text-slate-800 tabular-nums">
                          {formatarMoeda(valor as number)}
                        </span>
                      </div>
                    ))}
                  <div className="flex items-center justify-between p-3 bg-brand-50 border border-brand-200 rounded-xl sm:col-span-2">
                    <span className="text-sm font-bold text-brand-800">TOTAL ANUAL</span>
                    <span className="text-sm font-bold text-brand-800 tabular-nums">
                      {formatarMoeda(regimeRecomendadoCenario.detalheImpostos.total)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-3">* Valores estimados. Cálculos dependem de variáveis específicas da empresa.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ABA REGIMES */}
      {aba === 'regimes' && (
        <div className="space-y-4 animate-fade-in">
          {elegibilidades.map(eleg => (
            <div key={eleg.regime} className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h3 className="section-title text-lg">{nomeRegime(eleg.regime)}</h3>
                  <span className={`badge ${eleg.elegivel ? 'badge-green' : 'badge-red'}`}>
                    {eleg.elegivel ? '✓ Elegível' : '✗ Inelegível'}
                  </span>
                </div>
              </div>
              <div className="card-body">
                {eleg.impedimentos.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-red-700 mb-2">Impedimentos</h4>
                    <div className="space-y-2">
                      {eleg.impedimentos.map((imp, i) => (
                        <div key={i} className={`p-3 rounded-lg border text-sm ${
                          imp.gravidade === 'IMPEDITIVO' ? 'border-red-200 bg-red-50 text-red-800' :
                          imp.gravidade === 'ATENCAO' ? 'border-yellow-200 bg-yellow-50 text-yellow-800' :
                          'border-blue-200 bg-blue-50 text-blue-800'
                        }`}>
                          <p className="font-medium">{imp.impedimento}</p>
                          <p className="text-xs mt-1 opacity-75">{imp.fundamento}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {eleg.observacoes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Observações</h4>
                    <div className="space-y-2">
                      {eleg.observacoes.map((obs, i) => (
                        <p key={i} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="text-brand-500 mt-0.5 flex-shrink-0">ℹ</span>
                          {obs}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ABA RISCOS E ALERTAS */}
      {aba === 'riscos' && (
        <div className="space-y-6 animate-fade-in">
          {/* Alertas */}
          <div className="card">
            <div className="card-header">
              <h2 className="section-title">Alertas</h2>
            </div>
            <div className="card-body space-y-3">
              {alertas.map((alerta, i) => {
                const config = tipoAlertaConfig(alerta.tipo);
                return (
                  <div key={i} className={`p-4 rounded-xl border ${config.cor}`}>
                    <div className="flex items-start gap-2">
                      <span className="text-lg flex-shrink-0">{config.icon}</span>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{alerta.titulo}</p>
                        <p className="text-slate-600 text-sm mt-1 leading-relaxed">{alerta.descricao}</p>
                        {alerta.requerValidacaoHumana && (
                          <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            ⚠ Requer validação profissional
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Riscos */}
          <div className="card">
            <div className="card-header">
              <h2 className="section-title">Riscos Identificados</h2>
            </div>
            <div className="card-body space-y-3">
              {riscos.length === 0 ? (
                <p className="text-muted">Nenhum risco crítico identificado para esta configuração.</p>
              ) : (
                riscos.map((risco, i) => {
                  const { cor } = nivelRiscoLabel(risco.nivel);
                  return (
                    <div key={i} className="p-4 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`badge ${cor}`}>{risco.nivel}</span>
                        <span className="badge badge-gray text-xs">{risco.tipo}</span>
                      </div>
                      <p className="text-slate-800 text-sm font-medium mb-1">{risco.descricao}</p>
                      <p className="text-slate-500 text-xs">{risco.recomendacao}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ABA PARECER IA */}
      {aba === 'parecer' && (
        <div className="space-y-6 animate-fade-in">
          {!parecer ? (
            <div className="card">
              <div className="card-body text-center py-12">
                <p className="text-2xl mb-3">🤖</p>
                <p className="text-slate-600 font-medium">Parecer de IA não disponível</p>
                <p className="text-muted mt-1">
                  Configure a variável ANTHROPIC_API_KEY para habilitar a geração de pareceres com IA.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
                <p className="text-sm text-brand-700">
                  <strong>Parecer gerado por IA</strong> — Modelo: {parecer.modeloUtilizado} |
                  Gerado em: {new Date(parecer.geradoEm).toLocaleString('pt-BR')}
                </p>
              </div>

              {[
                { titulo: 'Resumo Executivo', conteudo: parecer.resumoExecutivo },
                { titulo: 'Análise Técnica', conteudo: parecer.analiseTecnica },
                { titulo: 'Fundamentação da Recomendação', conteudo: parecer.fundamentacaoRecomendacao },
                { titulo: 'Vantagens do Regime Recomendado', conteudo: parecer.vantagensRegimeRecomendado },
                { titulo: 'Análise dos Demais Regimes', conteudo: parecer.desvantagensRegimesNaoRecomendados },
                { titulo: 'Riscos e Pontos de Atenção', conteudo: parecer.riscosTributarios },
                { titulo: 'Ressalvas Legais e Recomendações', conteudo: parecer.ressalvasLegais },
                { titulo: 'Conclusão', conteudo: parecer.conclusaoFinal },
              ].filter(s => s.conteudo && s.conteudo.trim().length > 20).map(({ titulo, conteudo }) => (
                <div key={titulo} className="card">
                  <div className="card-header">
                    <h3 className="section-title">{titulo}</h3>
                  </div>
                  <div className="card-body">
                    <div className="text-slate-700 text-sm leading-relaxed space-y-3">
                      {conteudo.split('\n').filter(l => l.trim()).map((linha, i) => (
                        <p key={i}>{linha}</p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-amber-800 text-sm">
                  <strong>⚠ Aviso importante:</strong> Este parecer é gerado automaticamente por inteligência artificial com base nos dados informados.
                  Não constitui assessoria tributária profissional. Recomenda-se validação por contador habilitado pelo CRC ou advogado tributarista antes de qualquer decisão de enquadramento fiscal.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------
// COMPONENTES AUXILIARES
// -----------------------------------------------

function MetricaCard({ label, valor, destaque = false, positivo = false }: {
  label: string;
  valor: string;
  destaque?: boolean;
  positivo?: boolean;
}) {
  return (
    <div className={`p-3 rounded-xl ${destaque ? 'bg-brand-50 border border-brand-100' : 'bg-slate-50'}`}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-sm font-semibold tabular-nums ${
        positivo ? 'text-emerald-700' :
        destaque ? 'text-brand-700' : 'text-slate-800'
      }`}>
        {valor}
      </p>
    </div>
  );
}
