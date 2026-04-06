'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  EmpresaInput,
  DadosCadastrais,
  DadosSocietarios,
  DadosOperacionais,
  DadosTributarios,
  NaturezaJuridica,
  PorteEmpresa,
  TipoSocio,
  RegimeTributario,
} from '@/types';

// -----------------------------------------------
// TIPOS AUXILIARES PARA ESTADO DO FORMULÁRIO
// -----------------------------------------------

const NATUREZAS_JURIDICAS: { value: NaturezaJuridica; label: string }[] = [
  { value: 'MEI', label: 'MEI — Microempreendedor Individual' },
  { value: 'EI', label: 'EI — Empresário Individual' },
  { value: 'SLU', label: 'SLU — Sociedade Limitada Unipessoal' },
  { value: 'LTDA', label: 'LTDA — Sociedade Limitada' },
  { value: 'SA', label: 'S.A. — Sociedade Anônima' },
  { value: 'SS', label: 'Sociedade Simples' },
  { value: 'HOLDING_LTDA', label: 'Holding LTDA' },
  { value: 'HOLDING_SA', label: 'Holding S.A.' },
  { value: 'COOPERATIVA', label: 'Cooperativa' },
  { value: 'OUTROS', label: 'Outros' },
];

const PORTES: { value: PorteEmpresa; label: string }[] = [
  { value: 'MEI', label: 'MEI' },
  { value: 'ME', label: 'ME — Microempresa' },
  { value: 'EPP', label: 'EPP — Empresa de Pequeno Porte' },
  { value: 'MEDIO', label: 'Médio Porte' },
  { value: 'GRANDE', label: 'Grande Porte' },
];

const REGIMES: { value: RegimeTributario; label: string }[] = [
  { value: 'MEI', label: 'MEI' },
  { value: 'SIMPLES_NACIONAL', label: 'Simples Nacional' },
  { value: 'LUCRO_PRESUMIDO', label: 'Lucro Presumido' },
  { value: 'LUCRO_REAL', label: 'Lucro Real' },
];

const ESTADOS_BR = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
  'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO',
];

// -----------------------------------------------
// ESTADO INICIAL
// -----------------------------------------------

const CADASTRAIS_INICIAL: DadosCadastrais = {
  nomeEmpresa: '',
  cnpj: '',
  cnaePrincipal: '',
  cnaesSecundarios: [],
  descricaoAtividade: '',
  naturezaJuridica: 'LTDA',
  porteEmpresa: 'ME',
  dataAbertura: '',
  estado: 'SP',
  municipio: '',
  possuiFiliais: false,
};

const SOCIETARIOS_INICIAL: DadosSocietarios = {
  qtdSocios: 2,
  tipoSocio: 'PF',
  temSocioPJ: false,
  temSocioExterior: false,
  temParticipacaoOutrasEmpresas: false,
  percentualParticipacaoOutras: 0,
  outraEmpresaOpcaoSimples: false,
  estruturaHolding: false,
  temOffshore: false,
  temTrust: false,
};

const OPERACIONAIS_INICIAL: DadosOperacionais = {
  faturamentoAnual: 0,
  qtdEmpregados: 0,
  prolabreMensalTotal: 0,
  folhaMensal: 0,
  custoFixoMensal: 0,
  custoVariavelMensal: 0,
  margemLiquidaEstimada: undefined,
};

const TRIBUTARIOS_INICIAL: DadosTributarios = {
  regimeAtual: undefined,
  priorizaEconomiaTributaria: true,
  priorizaSimplicidade: false,
  atividadeDependeFatorR: undefined,
  temCreditosPISCOFINS: undefined,
};

// -----------------------------------------------
// COMPONENTE PRINCIPAL
// -----------------------------------------------

export function EmpresaForm() {
  const router = useRouter();
  const [etapa, setEtapa] = useState(1);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [cadastrais, setCadastrais] = useState<DadosCadastrais>(CADASTRAIS_INICIAL);
  const [societarios, setSocietarios] = useState<DadosSocietarios>(SOCIETARIOS_INICIAL);
  const [operacionais, setOperacionais] = useState<DadosOperacionais>(OPERACIONAIS_INICIAL);
  const [tributarios, setTributarios] = useState<DadosTributarios>(TRIBUTARIOS_INICIAL);

  const totalEtapas = 4;

  function avancar() {
    setErro(null);
    if (!validarEtapa()) return;
    setEtapa(e => Math.min(e + 1, totalEtapas));
  }

  function voltar() {
    setEtapa(e => Math.max(e - 1, 1));
    setErro(null);
  }

  function validarEtapa(): boolean {
    if (etapa === 1) {
      if (!cadastrais.nomeEmpresa.trim()) { setErro('Informe o nome da empresa'); return false; }
      if (!cadastrais.cnaePrincipal.trim()) { setErro('Informe o CNAE principal'); return false; }
      if (!cadastrais.municipio.trim()) { setErro('Informe o município'); return false; }
    }
    if (etapa === 3) {
      if (!operacionais.faturamentoAnual || operacionais.faturamentoAnual <= 0) {
        setErro('Informe o faturamento anual'); return false;
      }
    }
    return true;
  }

  async function submeter() {
    setErro(null);
    setCarregando(true);

    const empresa: EmpresaInput = { cadastrais, societarios, operacionais, tributarios };

    try {
      const res = await fetch('/api/analise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresa, gerarParecer: true }),
      });

      const data = await res.json();

      if (!data.sucesso) {
        setErro(data.erro ?? 'Erro ao processar análise');
        return;
      }

      // Salvar resultado no sessionStorage para a página de resultado
      sessionStorage.setItem('resultado_analise', JSON.stringify(data.resultado));
      router.push('/resultado');

    } catch {
      setErro('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {['Cadastral', 'Societário', 'Operacional', 'Tributário'].map((label, i) => {
            const num = i + 1;
            const ativo = num === etapa;
            const completo = num < etapa;
            return (
              <div key={label} className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  completo ? 'bg-brand-600 text-white' :
                  ativo ? 'bg-brand-600 text-white ring-4 ring-brand-100' :
                  'bg-slate-200 text-slate-500'
                }`}>
                  {completo ? '✓' : num}
                </div>
                <span className={`text-xs mt-1 font-medium ${ativo ? 'text-brand-600' : 'text-slate-400'}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
        <div className="w-full bg-slate-200 h-1.5 rounded-full">
          <div
            className="bg-brand-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${((etapa - 1) / (totalEtapas - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Card do formulário */}
      <div className="card animate-fade-in">
        {/* Etapa 1 — Dados Cadastrais */}
        {etapa === 1 && (
          <>
            <div className="card-header">
              <h2 className="section-title">Dados Cadastrais</h2>
              <p className="text-muted mt-1">Informações básicas da empresa</p>
            </div>
            <div className="card-body space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">Nome da Empresa *</label>
                  <input
                    className="input"
                    placeholder="Razão Social ou Nome Fantasia"
                    value={cadastrais.nomeEmpresa}
                    onChange={e => setCadastrais(p => ({ ...p, nomeEmpresa: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">CNPJ (opcional)</label>
                  <input
                    className="input"
                    placeholder="00.000.000/0001-00"
                    value={cadastrais.cnpj ?? ''}
                    onChange={e => setCadastrais(p => ({ ...p, cnpj: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">CNAE Principal *</label>
                  <input
                    className="input"
                    placeholder="Ex: 6201-5/01 ou somente números"
                    value={cadastrais.cnaePrincipal}
                    onChange={e => setCadastrais(p => ({ ...p, cnaePrincipal: e.target.value }))}
                  />
                  <p className="text-xs text-slate-400 mt-1">Código CNAE da atividade principal</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Descrição da Atividade Principal</label>
                  <textarea
                    className="input min-h-[80px] resize-none"
                    placeholder="Descreva o que a empresa faz..."
                    value={cadastrais.descricaoAtividade ?? ''}
                    onChange={e => setCadastrais(p => ({ ...p, descricaoAtividade: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Natureza Jurídica</label>
                  <select
                    className="select"
                    value={cadastrais.naturezaJuridica}
                    onChange={e => setCadastrais(p => ({ ...p, naturezaJuridica: e.target.value as NaturezaJuridica }))}
                  >
                    {NATUREZAS_JURIDICAS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Porte da Empresa</label>
                  <select
                    className="select"
                    value={cadastrais.porteEmpresa}
                    onChange={e => setCadastrais(p => ({ ...p, porteEmpresa: e.target.value as PorteEmpresa }))}
                  >
                    {PORTES.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Estado</label>
                  <select
                    className="select"
                    value={cadastrais.estado}
                    onChange={e => setCadastrais(p => ({ ...p, estado: e.target.value }))}
                  >
                    {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Município *</label>
                  <input
                    className="input"
                    placeholder="Cidade"
                    value={cadastrais.municipio}
                    onChange={e => setCadastrais(p => ({ ...p, municipio: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Data de Abertura</label>
                  <input
                    type="date"
                    className="input"
                    value={cadastrais.dataAbertura ?? ''}
                    onChange={e => setCadastrais(p => ({ ...p, dataAbertura: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="checkbox"
                    id="filiais"
                    checked={cadastrais.possuiFiliais}
                    onChange={e => setCadastrais(p => ({ ...p, possuiFiliais: e.target.checked }))}
                    className="w-4 h-4 accent-brand-600"
                  />
                  <label htmlFor="filiais" className="text-sm text-slate-700 cursor-pointer">
                    Possui filiais
                  </label>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Etapa 2 — Dados Societários */}
        {etapa === 2 && (
          <>
            <div className="card-header">
              <h2 className="section-title">Dados Societários</h2>
              <p className="text-muted mt-1">Estrutura de sócios e participações</p>
            </div>
            <div className="card-body space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Quantidade de Sócios</label>
                  <input
                    type="number"
                    className="input"
                    min={1}
                    value={societarios.qtdSocios}
                    onChange={e => setSocietarios(p => ({ ...p, qtdSocios: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div>
                  <label className="label">Tipo de Sócio</label>
                  <select
                    className="select"
                    value={societarios.tipoSocio}
                    onChange={e => setSocietarios(p => ({ ...p, tipoSocio: e.target.value as TipoSocio }))}
                  >
                    <option value="PF">Somente Pessoa Física (PF)</option>
                    <option value="PJ">Somente Pessoa Jurídica (PJ)</option>
                    <option value="MISTO">Misto — PF e PJ</option>
                  </select>
                </div>
              </div>

              <div className="divider" />
              <h3 className="font-medium text-slate-700 text-sm">Características societárias</h3>

              <div className="space-y-3">
                {[
                  { id: 'temSocioPJ', label: 'Possui sócio Pessoa Jurídica', field: 'temSocioPJ' as keyof DadosSocietarios },
                  { id: 'temSocioExterior', label: 'Possui sócio domiciliado no exterior', field: 'temSocioExterior' as keyof DadosSocietarios },
                  { id: 'estruturaHolding', label: 'Estrutura de holding (controla outras empresas)', field: 'estruturaHolding' as keyof DadosSocietarios },
                  { id: 'temOffshore', label: 'Possui offshore vinculada', field: 'temOffshore' as keyof DadosSocietarios },
                  { id: 'temTrust', label: 'Possui trust vinculado', field: 'temTrust' as keyof DadosSocietarios },
                ].map(({ id, label, field }) => (
                  <div key={id} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={id}
                      checked={societarios[field] as boolean}
                      onChange={e => setSocietarios(p => ({ ...p, [field]: e.target.checked }))}
                      className="w-4 h-4 accent-brand-600"
                    />
                    <label htmlFor={id} className="text-sm text-slate-700 cursor-pointer">{label}</label>
                  </div>
                ))}
              </div>

              <div className="divider" />
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    id="participacaoOutras"
                    checked={societarios.temParticipacaoOutrasEmpresas}
                    onChange={e => setSocietarios(p => ({ ...p, temParticipacaoOutrasEmpresas: e.target.checked }))}
                    className="w-4 h-4 accent-brand-600"
                  />
                  <label htmlFor="participacaoOutras" className="text-sm text-slate-700 cursor-pointer">
                    Sócio com participação em outra(s) empresa(s)
                  </label>
                </div>

                {societarios.temParticipacaoOutrasEmpresas && (
                  <div className="ml-7 space-y-3 animate-fade-in">
                    <div>
                      <label className="label">Percentual de participação na outra empresa (%)</label>
                      <input
                        type="number"
                        className="input"
                        min={0}
                        max={100}
                        value={societarios.percentualParticipacaoOutras ?? 0}
                        onChange={e => setSocietarios(p => ({ ...p, percentualParticipacaoOutras: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="outraSimples"
                        checked={societarios.outraEmpresaOpcaoSimples ?? false}
                        onChange={e => setSocietarios(p => ({ ...p, outraEmpresaOpcaoSimples: e.target.checked }))}
                        className="w-4 h-4 accent-brand-600"
                      />
                      <label htmlFor="outraSimples" className="text-sm text-slate-700 cursor-pointer">
                        A outra empresa também é optante do Simples Nacional
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Etapa 3 — Dados Operacionais */}
        {etapa === 3 && (
          <>
            <div className="card-header">
              <h2 className="section-title">Dados Operacionais</h2>
              <p className="text-muted mt-1">Faturamento, folha e custos</p>
            </div>
            <div className="card-body space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">Faturamento Bruto Anual (R$) *</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="0,00"
                    min={0}
                    step={1000}
                    value={operacionais.faturamentoAnual || ''}
                    onChange={e => setOperacionais(p => ({ ...p, faturamentoAnual: parseFloat(e.target.value) || 0 }))}
                  />
                  {operacionais.faturamentoAnual > 0 && (
                    <p className="text-xs text-slate-400 mt-1">
                      ≈ R$ {(operacionais.faturamentoAnual / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mês
                    </p>
                  )}
                </div>
                <div>
                  <label className="label">Quantidade de Empregados</label>
                  <input
                    type="number"
                    className="input"
                    min={0}
                    value={operacionais.qtdEmpregados}
                    onChange={e => setOperacionais(p => ({ ...p, qtdEmpregados: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label className="label">Pró-labore Mensal Total (R$)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="0,00"
                    min={0}
                    value={operacionais.prolabreMensalTotal || ''}
                    onChange={e => setOperacionais(p => ({ ...p, prolabreMensalTotal: parseFloat(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-slate-400 mt-1">Soma do pró-labore de todos os sócios</p>
                </div>
                <div>
                  <label className="label">Folha de Pagamento Mensal (R$)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="0,00"
                    min={0}
                    value={operacionais.folhaMensal || ''}
                    onChange={e => setOperacionais(p => ({ ...p, folhaMensal: parseFloat(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-slate-400 mt-1">Salários brutos dos empregados (excluindo pró-labore)</p>
                </div>
                <div>
                  <label className="label">Custo Fixo Mensal (R$)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="0,00"
                    min={0}
                    value={operacionais.custoFixoMensal || ''}
                    onChange={e => setOperacionais(p => ({ ...p, custoFixoMensal: parseFloat(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-slate-400 mt-1">Aluguel, energia, internet, etc.</p>
                </div>
                <div>
                  <label className="label">Custo Variável Mensal (R$)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="0,00"
                    min={0}
                    value={operacionais.custoVariavelMensal || ''}
                    onChange={e => setOperacionais(p => ({ ...p, custoVariavelMensal: parseFloat(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-slate-400 mt-1">Mercadorias, insumos, comissões, etc.</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Margem Líquida Estimada (%) — opcional</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="Ex: 15"
                    min={0}
                    max={100}
                    value={operacionais.margemLiquidaEstimada ?? ''}
                    onChange={e => {
                      const val = e.target.value ? parseFloat(e.target.value) : undefined;
                      setOperacionais(p => ({ ...p, margemLiquidaEstimada: val }));
                    }}
                  />
                  <p className="text-xs text-slate-400 mt-1">Informar melhora a precisão do cálculo de Lucro Real</p>
                </div>
              </div>

              {/* Indicador Fator R */}
              {operacionais.faturamentoAnual > 0 && (operacionais.folhaMensal + operacionais.prolabreMensalTotal) > 0 && (
                <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 animate-fade-in">
                  <p className="text-sm font-medium text-brand-700 mb-1">Estimativa do Fator R</p>
                  <p className="text-brand-600 text-sm">
                    {(((operacionais.folhaMensal + operacionais.prolabreMensalTotal) * 12 / operacionais.faturamentoAnual) * 100).toFixed(1)}%
                    {((operacionais.folhaMensal + operacionais.prolabreMensalTotal) * 12 / operacionais.faturamentoAnual) >= 0.28
                      ? ' ✓ Fator R ≥ 28% → Possível Anexo III'
                      : ' ✗ Fator R < 28% → Possível Anexo V'}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Etapa 4 — Dados Tributários */}
        {etapa === 4 && (
          <>
            <div className="card-header">
              <h2 className="section-title">Dados Tributários e Estratégicos</h2>
              <p className="text-muted mt-1">Regime atual e preferências de análise</p>
            </div>
            <div className="card-body space-y-6">
              <div>
                <label className="label">Regime Tributário Atual (opcional)</label>
                <select
                  className="select"
                  value={tributarios.regimeAtual ?? ''}
                  onChange={e => setTributarios(p => ({
                    ...p,
                    regimeAtual: e.target.value ? e.target.value as RegimeTributario : undefined,
                  }))}
                >
                  <option value="">Não informado / Empresa nova</option>
                  {REGIMES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="divider" />
              <h3 className="font-medium text-slate-700 text-sm">Prioridades da análise</h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:border-brand-300 hover:bg-brand-50/30 transition-all"
                  onClick={() => setTributarios(p => ({ ...p, priorizaEconomiaTributaria: true, priorizaSimplicidade: false }))}>
                  <input
                    type="radio"
                    readOnly
                    checked={tributarios.priorizaEconomiaTributaria && !tributarios.priorizaSimplicidade}
                    className="mt-0.5 accent-brand-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-800">Menor carga tributária</p>
                    <p className="text-xs text-slate-500 mt-0.5">Priorizar a redução máxima de impostos, mesmo com maior complexidade operacional</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:border-brand-300 hover:bg-brand-50/30 transition-all"
                  onClick={() => setTributarios(p => ({ ...p, priorizaSimplicidade: true, priorizaEconomiaTributaria: false }))}>
                  <input
                    type="radio"
                    readOnly
                    checked={tributarios.priorizaSimplicidade && !tributarios.priorizaEconomiaTributaria}
                    className="mt-0.5 accent-brand-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-800">Simplicidade operacional</p>
                    <p className="text-xs text-slate-500 mt-0.5">Preferir regimes com menor burocracia e obrigações acessórias</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:border-brand-300 hover:bg-brand-50/30 transition-all"
                  onClick={() => setTributarios(p => ({ ...p, priorizaEconomiaTributaria: true, priorizaSimplicidade: true }))}>
                  <input
                    type="radio"
                    readOnly
                    checked={tributarios.priorizaEconomiaTributaria && tributarios.priorizaSimplicidade}
                    className="mt-0.5 accent-brand-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-800">Equilíbrio</p>
                    <p className="text-xs text-slate-500 mt-0.5">Considerar tanto a carga tributária quanto a facilidade operacional</p>
                  </div>
                </div>
              </div>

              <div className="divider" />
              <h3 className="font-medium text-slate-700 text-sm">Informações adicionais (opcional)</h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="fatorR"
                    checked={tributarios.atividadeDependeFatorR ?? false}
                    onChange={e => setTributarios(p => ({ ...p, atividadeDependeFatorR: e.target.checked || undefined }))}
                    className="w-4 h-4 accent-brand-600"
                  />
                  <label htmlFor="fatorR" className="text-sm text-slate-700 cursor-pointer">
                    Atividade intelectual sujeita ao Fator R (Anexo III/V do Simples)
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="creditos"
                    checked={tributarios.temCreditosPISCOFINS ?? false}
                    onChange={e => setTributarios(p => ({ ...p, temCreditosPISCOFINS: e.target.checked || undefined }))}
                    className="w-4 h-4 accent-brand-600"
                  />
                  <label htmlFor="creditos" className="text-sm text-slate-700 cursor-pointer">
                    Empresa possui créditos relevantes de PIS/COFINS (insumos, serviços)
                  </label>
                </div>
              </div>

              {/* Resumo antes de enviar */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-4">
                <p className="text-sm font-medium text-slate-700 mb-3">Resumo da análise</p>
                <div className="space-y-1 text-sm text-slate-600">
                  <p><strong>Empresa:</strong> {cadastrais.nomeEmpresa}</p>
                  <p><strong>CNAE:</strong> {cadastrais.cnaePrincipal}</p>
                  <p><strong>Faturamento:</strong> R$ {(operacionais.faturamentoAnual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/ano</p>
                  <p><strong>Natureza jurídica:</strong> {cadastrais.naturezaJuridica}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Erro */}
        {erro && (
          <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm">{erro}</p>
          </div>
        )}

        {/* Navegação */}
        <div className="px-6 pb-6 flex items-center justify-between">
          <button
            onClick={voltar}
            disabled={etapa === 1}
            className="btn-secondary"
          >
            ← Anterior
          </button>

          {etapa < totalEtapas ? (
            <button onClick={avancar} className="btn-primary">
              Próximo →
            </button>
          ) : (
            <button
              onClick={submeter}
              disabled={carregando}
              className="btn-primary min-w-[160px]"
            >
              {carregando ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Analisando...
                </span>
              ) : 'Gerar Análise'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
