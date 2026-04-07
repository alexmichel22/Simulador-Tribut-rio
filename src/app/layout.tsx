import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Simulador Tributário | Análise Inteligente de Regime Tributário',
  description: 'Sistema de análise tributária inteligente para empresas brasileiras. Compare Simples Nacional, Lucro Presumido, Lucro Real e MEI com fundamento técnico e parecer por IA.',
  keywords: ['tributário', 'simples nacional', 'lucro presumido', 'lucro real', 'MEI', 'CNAE', 'enquadramento fiscal', 'planejamento tributário'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}
