# Simulador Tributário

Sistema web inteligente de análise tributária para empresas brasileiras. Recomenda o melhor regime tributário com base em dados reais da empresa, regras legais vigentes e parecer gerado por inteligência artificial.

---

## Visão Geral

O sistema funciona como um **consultor tributário digital**: coleta dados da empresa, aplica um motor de regras tributárias, compara cenários (MEI, Simples Nacional, Lucro Presumido, Lucro Real) e gera um parecer técnico fundamentado com apoio de IA.

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Estilo | Tailwind CSS |
| Gráficos | Recharts |
| IA | Anthropic Claude API (`claude-opus-4-6`) |
| Banco de dados | PostgreSQL + Prisma ORM |
| Runtime | Node.js 18+ |

---

## Estrutura de Pastas

```
src/
├── app/
│   ├── api/
│   │   ├── analise/route.ts     # POST — motor de análise + IA
│   │   └── cnae/search/route.ts # GET  — pesquisa de CNAEs
│   ├── nova-analise/page.tsx    # Formulário multi-etapas
│   ├── resultado/page.tsx       # Relatório da análise
│   ├── page.tsx                 # Landing page
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── forms/EmpresaForm.tsx    # Formulário 4 etapas
│   └── report/TaxReport.tsx    # Relatório com abas e gráficos
│
├── modules/
│   ├── tax-engine/              # Motor de regras tributárias
│   │   ├── constants.ts         # Tabelas, limites, alíquotas 2024
│   │   ├── cnae.ts              # Base CNAE e classificação
│   │   ├── eligibility.ts       # Verificador de elegibilidade
│   │   ├── engine.ts            # Orquestrador principal
│   │   └── calculators/
│   │       ├── simples.ts
│   │       ├── lucro-presumido.ts
│   │       ├── lucro-real.ts
│   │       └── mei.ts
│   └── ai/
│       ├── prompts.ts           # System prompt + prompt de usuário
│       └── parecer.ts           # Integração Claude API
│
├── lib/
│   ├── prisma.ts
│   └── utils.ts
│
└── types/index.ts               # Todos os tipos TypeScript

prisma/schema.prisma
```

---

## Instalação e Execução

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local`:

```env
# Obrigatório para parecer com IA
ANTHROPIC_API_KEY=sk-ant-...

# Opcional — banco de dados para persistência
DATABASE_URL=postgresql://user:pass@localhost:5432/simulador_tributario
```

### 3. Banco de dados (opcional)

```bash
npx prisma db push
```

### 4. Executar

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## Funcionalidades

### Motor de Regras Tributárias
- Verifica elegibilidade para todos os 4 regimes
- Aplica vedações do Simples Nacional (LC 123/2006)
- Calcula Fator R automaticamente
- Enquadra CNAE nos Anexos I a V do Simples
- Compara cenários com valores anuais e mensais
- Identifica riscos e alertas específicos

### Cálculos Implementados

**MEI:** DAS fixo mensal | Limite R$ 81k/ano

**Simples Nacional:** Tabelas Anexos I-V (2024) | Alíquota efetiva: `(RBT12 × Alíq - PD) / RBT12` | Fator R automático

**Lucro Presumido:** Presunção por tipo de atividade | Adicional IRPJ | PIS/COFINS cumulativos (0,65% + 3%)

**Lucro Real:** Lucro estimado pelos custos informados | PIS/COFINS não cumulativos (1,65% + 7,6%) | Créditos estimados

### Parecer com IA (Claude)
- Resumo executivo
- Análise técnica fundamentada
- Fundamentação com base legal
- Vantagens e desvantagens por regime
- Riscos e pontos de atenção

---

## API Endpoints

### `POST /api/analise`
```json
{ "empresa": { ...EmpresaInput }, "gerarParecer": true }
```

### `GET /api/cnae/search?q={termo}&limite={n}`
Pesquisa CNAEs por código ou descrição.

---

## Base Legal

LC 123/2006 | Res. CGSN 140/2018 | Lei 9.249/1995 | Lei 9.718/1998 | RIR/2018 | LC 116/2003 | Lei 14.754/2023

---

## Aviso Legal

Este sistema é uma ferramenta de apoio à decisão tributária. As análises são estimativas e **não substituem assessoria de contador (CRC) ou advogado tributarista**. Casos envolvendo offshore, trust e internacionalização requerem validação especializada.