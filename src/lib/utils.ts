// ==============================================
// UTILITÁRIOS GERAIS
// ==============================================

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatarMoeda(valor: number, casas = 2): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

export function formatarPercentual(valor: number, casas = 2): string {
  return `${(valor * 100).toFixed(casas)}%`;
}

export function formatarCNPJ(cnpj: string): string {
  const s = cnpj.replace(/\D/g, '');
  return s.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

export function formatarCNAE(cnae: string): string {
  const s = cnae.replace(/\D/g, '');
  if (s.length >= 7) {
    return `${s.substring(0, 4)}-${s.substring(4, 5)}/${s.substring(5)}`;
  }
  return cnae;
}

export function nomeRegime(regime: string): string {
  const nomes: Record<string, string> = {
    MEI: 'MEI',
    SIMPLES_NACIONAL: 'Simples Nacional',
    LUCRO_PRESUMIDO: 'Lucro Presumido',
    LUCRO_REAL: 'Lucro Real',
  };
  return nomes[regime] ?? regime;
}

export function nomeNaturezaJuridica(nj: string): string {
  const nomes: Record<string, string> = {
    MEI: 'MEI — Microempreendedor Individual',
    EI: 'EI — Empresário Individual',
    EIRELI: 'EIRELI',
    SLU: 'SLU — Sociedade Limitada Unipessoal',
    LTDA: 'LTDA — Sociedade Limitada',
    SA: 'S.A. — Sociedade Anônima',
    SS: 'Sociedade Simples',
    COOPERATIVA: 'Cooperativa',
    HOLDING_LTDA: 'Holding (LTDA)',
    HOLDING_SA: 'Holding (S.A.)',
    OFFSHORE: 'Offshore',
    TRUST: 'Trust',
    OUTROS: 'Outros',
  };
  return nomes[nj] ?? nj;
}

export function corRegime(regime: string): string {
  const cores: Record<string, string> = {
    MEI: '#10b981',
    SIMPLES_NACIONAL: '#3b82f6',
    LUCRO_PRESUMIDO: '#f59e0b',
    LUCRO_REAL: '#ef4444',
  };
  return cores[regime] ?? '#6b7280';
}

export function nivelRiscoLabel(nivel: string): { label: string; cor: string } {
  switch (nivel) {
    case 'ALTO': return { label: 'Alto', cor: 'text-red-700 bg-red-50 border-red-200' };
    case 'MEDIO': return { label: 'Médio', cor: 'text-yellow-700 bg-yellow-50 border-yellow-200' };
    case 'BAIXO': return { label: 'Baixo', cor: 'text-green-700 bg-green-50 border-green-200' };
    default: return { label: nivel, cor: 'text-gray-700 bg-gray-50 border-gray-200' };
  }
}

export function tipoAlertaConfig(tipo: string): { icon: string; cor: string } {
  switch (tipo) {
    case 'CRITICO': return { icon: '🚨', cor: 'border-red-300 bg-red-50' };
    case 'ATENCAO': return { icon: '⚠️', cor: 'border-yellow-300 bg-yellow-50' };
    case 'OPORTUNIDADE': return { icon: '💡', cor: 'border-green-300 bg-green-50' };
    default: return { icon: 'ℹ️', cor: 'border-blue-300 bg-blue-50' };
  }
}
