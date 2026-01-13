# Documentação do Sistema de Batimento de Ponto

## 📋 Índice
- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Modelagem de Dados](#modelagem-de-dados)
- [Serviços](#serviços)
- [Componentes](#componentes)
- [Fluxo de Dados](#fluxo-de-dados)
- [Funcionalidades](#funcionalidades)
- [Instalação e Execução](#instalação-e-execução)

---

## 🎯 Visão Geral

Sistema web de batimento de ponto eletrônico desenvolvido em **Angular 19** com design responsivo para desktop e mobile. Os dados são armazenados localmente no navegador através do **localStorage**.

### Características Principais
- ✅ Interface moderna e responsiva
- ✅ Registro de entrada, saída e pausas
- ✅ Cálculo automático de horas trabalhadas
- ✅ Resumo em tempo real do dia
- ✅ Histórico de batimentos
- ✅ Validação de sequência lógica
- ✅ Persistência local (localStorage)

### Tecnologias Utilizadas
- **Framework**: Angular 19 (Standalone Components)
- **Linguagem**: TypeScript 5.6+
- **Estilização**: SCSS
- **Armazenamento**: localStorage API
- **Build**: esbuild (via Angular CLI)

---

## 🏗️ Arquitetura

### Estrutura de Diretórios

```
src/app/
├── models/
│   └── time-entry.model.ts      # Definições de tipos e interfaces
├── services/
│   └── time-clock.service.ts    # Lógica de negócio e persistência
├── app.component.ts             # Componente principal
├── app.component.html           # Template
├── app.component.scss           # Estilos
├── app.config.ts                # Configurações da aplicação
└── app.routes.ts                # Rotas (futuro)
```

### Padrão de Arquitetura

O sistema segue uma **arquitetura em camadas**:

```
┌─────────────────────────────────────┐
│   Presentation Layer (Component)    │  ← Interface do usuário
├─────────────────────────────────────┤
│   Business Logic Layer (Service)    │  ← Regras de negócio
├─────────────────────────────────────┤
│   Data Layer (localStorage)         │  ← Persistência
└─────────────────────────────────────┘
```

**Princípios aplicados:**
- **Single Responsibility**: Cada classe tem uma responsabilidade única
- **Dependency Injection**: Serviços injetados via DI do Angular
- **Separation of Concerns**: Separação clara entre camadas
- **Type Safety**: TypeScript com tipagem forte

---

## 📊 Modelagem de Dados

### Diagrama de Entidades

```
┌─────────────────────┐
│    TimeEntry        │
├─────────────────────┤
│ id: string          │
│ userId: string      │
│ userName: string    │
│ date: string        │ (YYYY-MM-DD)
│ entries: Array      │───┐
└─────────────────────┘   │
                          │
                          │ 1:N
                          │
                          ▼
              ┌─────────────────────┐
              │   PunchEntry        │
              ├─────────────────────┤
              │ id: string          │
              │ timestamp: Date     │
              │ type: string        │ (entrada|saida|pausa-inicio|pausa-fim)
              │ location?: Object   │
              │ notes?: string      │
              └─────────────────────┘
```

### Interfaces TypeScript

#### `TimeEntry`
Representa um registro diário completo de batimentos de um usuário.

```typescript
interface TimeEntry {
  id: string;              // Identificador único do registro diário
  userId: string;          // ID do usuário
  userName: string;        // Nome do usuário
  date: string;            // Data no formato YYYY-MM-DD
  entries: PunchEntry[];   // Lista de batimentos do dia
}
```

#### `PunchEntry`
Representa um batimento individual (entrada, saída ou pausa).

```typescript
interface PunchEntry {
  id: string;              // Identificador único do batimento
  timestamp: Date;         // Data e hora do batimento
  type: 'entrada' | 'saida' | 'pausa-inicio' | 'pausa-fim';
  location?: {             // Localização (opcional, futuro)
    latitude: number;
    longitude: number;
  };
  notes?: string;          // Observações (opcional)
}
```

#### `DailySummary`
Resumo calculado das horas trabalhadas no dia.

```typescript
interface DailySummary {
  date: string;            // Data do resumo
  totalWorked: number;     // Total de minutos trabalhados
  totalPause: number;      // Total de minutos em pausa
  firstEntry?: Date;       // Horário da primeira entrada
  lastExit?: Date;         // Horário da última saída
}
```

### Tipos de Batimento

| Tipo | Descrição | Sequência Válida Anterior |
|------|-----------|---------------------------|
| `entrada` | Registro de chegada | `null`, `saida` |
| `saida` | Registro de saída | `entrada`, `pausa-fim` |
| `pausa-inicio` | Início de pausa | `entrada`, `pausa-fim` |
| `pausa-fim` | Fim de pausa | `pausa-inicio` |

### Estrutura no localStorage

**Chave**: `time-entries`

```json
[
  {
    "id": "lq8x2m9k",
    "userId": "1",
    "userName": "Usuário",
    "date": "2026-01-13",
    "entries": [
      {
        "id": "lq8x2n1p",
        "timestamp": "2026-01-13T08:00:00.000Z",
        "type": "entrada"
      },
      {
        "id": "lq8x3a7k",
        "timestamp": "2026-01-13T12:00:00.000Z",
        "type": "pausa-inicio"
      },
      {
        "id": "lq8x4m2n",
        "timestamp": "2026-01-13T13:00:00.000Z",
        "type": "pausa-fim"
      },
      {
        "id": "lq8x7p9x",
        "timestamp": "2026-01-13T17:00:00.000Z",
        "type": "saida"
      }
    ]
  }
]
```

---

## 🔧 Serviços

### TimeClockService

Serviço principal que gerencia toda a lógica de negócio do sistema.

#### Responsabilidades
1. **Gerenciamento de Usuário**: Controle do usuário atual
2. **Persistência de Dados**: Salvar/recuperar dados do localStorage
3. **Validação de Batimentos**: Garantir sequência lógica
4. **Cálculos**: Processar horas trabalhadas e pausas
5. **CRUD**: Criar, ler e deletar registros

#### Métodos Principais

##### Gerenciamento de Usuário

```typescript
getCurrentUser(): { id: string; name: string }
```
Retorna o usuário atual. Se não existir, cria um usuário padrão.

```typescript
setCurrentUser(user: { id: string; name: string }): void
```
Define o usuário atual no localStorage.

##### Gerenciamento de Batimentos

```typescript
getAllEntries(): TimeEntry[]
```
Retorna todos os registros de batimento armazenados.

```typescript
getTodayEntry(): TimeEntry | null
```
Retorna o registro de batimento do dia atual, ou `null` se não existir.

```typescript
addPunch(type: PunchEntry['type'], notes?: string): PunchEntry
```
Adiciona um novo batimento. Cria automaticamente um `TimeEntry` se for o primeiro do dia.

**Fluxo:**
1. Busca ou cria `TimeEntry` do dia
2. Cria novo `PunchEntry` com timestamp atual
3. Adiciona à lista de entries
4. Salva no localStorage
5. Retorna o batimento criado

```typescript
getLastPunchType(): PunchEntry['type'] | null
```
Retorna o tipo do último batimento registrado hoje, usado para validação.

```typescript
deletePunch(punchId: string): void
```
Remove um batimento específico do registro do dia.

##### Cálculos e Resumos

```typescript
getTodaySummary(): DailySummary
```
Calcula e retorna o resumo do dia atual.

**Algoritmo de Cálculo:**
1. Ordena batimentos por timestamp
2. Percorre cada batimento:
   - `entrada`: Marca início do trabalho
   - `saida`: Calcula diferença e acumula tempo trabalhado
   - `pausa-inicio`: Marca início da pausa
   - `pausa-fim`: Calcula diferença e acumula tempo de pausa
3. Se ainda está trabalhando/pausado, calcula até o momento atual
4. Retorna totais em minutos

##### Utilitários

```typescript
formatMinutes(minutes: number): string
```
Converte minutos para formato legível (ex: "8h 30min").

```typescript
clearAllData(): void
```
Limpa todos os dados do localStorage (útil para testes).

```typescript
private generateId(): string
```
Gera ID único usando timestamp + random (base36).

```typescript
private getToday(): string
```
Retorna a data atual no formato YYYY-MM-DD.

---

## 🖥️ Componentes

### AppComponent

Componente principal e único da aplicação (arquitetura standalone).

#### Propriedades

```typescript
currentTime: Date              // Relógio em tempo real
todayEntries: PunchEntry[]     // Batimentos do dia
summary: DailySummary | null   // Resumo calculado
lastPunchType: string | null   // Último tipo de batimento
```

#### Métodos de Ação

```typescript
registerEntry(): void          // Registra entrada
registerExit(): void           // Registra saída
registerPauseStart(): void     // Inicia pausa
registerPauseEnd(): void       // Finaliza pausa
deletePunch(id: string): void  // Deleta batimento
```

#### Computed Properties (Getters)

```typescript
get canRegisterEntry(): boolean
```
Verifica se pode registrar entrada (não há batimento ou último foi saída).

```typescript
get canRegisterExit(): boolean
```
Verifica se pode registrar saída (último foi entrada ou fim de pausa).

```typescript
get canRegisterPauseStart(): boolean
```
Verifica se pode iniciar pausa (último foi entrada ou fim de pausa).

```typescript
get canRegisterPauseEnd(): boolean
```
Verifica se pode finalizar pausa (último foi início de pausa).

#### Métodos de Formatação

```typescript
formatTime(date: Date): string
```
Formata data para HH:MM:SS (pt-BR).

```typescript
formatDate(date: Date): string
```
Formata data para DD/MM/YYYY (pt-BR).

```typescript
getPunchTypeLabel(type: string): string
```
Retorna label amigável do tipo de batimento.

---

## 🔄 Fluxo de Dados

### 1. Inicialização da Aplicação

```
┌──────────────┐
│ ngOnInit()   │
└──────┬───────┘
       │
       ├─► updateTime() ────► Atualiza relógio (1s interval)
       │
       └─► loadTodayData() ──┬─► getTodayEntry()
                             ├─► getTodaySummary()
                             └─► getLastPunchType()
```

### 2. Registro de Batimento

```
┌─────────────────┐
│ Usuário clica   │
│ em botão        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Componente      │
│ registerEntry() │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ TimeClockService        │
│ addPunch('entrada')     │
└────────┬────────────────┘
         │
         ├─► getCurrentUser()
         ├─► getAllEntries()
         ├─► Cria PunchEntry
         ├─► Salva no localStorage
         └─► Retorna PunchEntry
                │
                ▼
         ┌─────────────────┐
         │ Componente      │
         │ loadTodayData() │
         └─────────────────┘
                │
                ▼
         ┌─────────────────┐
         │ UI Atualizada   │
         └─────────────────┘
```

### 3. Cálculo de Resumo

```
TimeEntry.entries
    │
    ▼
Ordenar por timestamp
    │
    ▼
Para cada entry:
├─ entrada? → workStart = timestamp
├─ saida? → totalWorked += diff(timestamp - workStart)
├─ pausa-inicio? → pauseStart = timestamp
└─ pausa-fim? → totalPause += diff(timestamp - pauseStart)
    │
    ▼
Se workStart != null → adicionar tempo até agora
Se pauseStart != null → adicionar tempo até agora
    │
    ▼
Retornar DailySummary
```

---

## ⚙️ Funcionalidades

### 1. Relógio em Tempo Real
- Atualização automática a cada segundo
- Exibição de hora (HH:MM:SS) e data (DD/MM/YYYY)
- Formato brasileiro (pt-BR)

### 2. Registro de Batimentos
- **Entrada**: Marca início do expediente
- **Saída**: Marca fim do expediente
- **Pausa Início**: Marca início de intervalo
- **Pausa Fim**: Marca fim de intervalo

### 3. Validação de Sequência
O sistema impede registros inválidos:
- Não permite saída sem entrada
- Não permite pausa sem estar trabalhando
- Não permite fim de pausa sem início

### 4. Cálculo Automático
- **Tempo Trabalhado**: Soma de intervalos entre entradas e saídas
- **Tempo de Pausa**: Soma de intervalos entre inícios e fins de pausa
- **Tempo em Andamento**: Inclui tempo atual se ainda trabalhando

### 5. Histórico do Dia
- Lista cronológica reversa (mais recente primeiro)
- Ícones visuais por tipo de batimento
- Horário de cada registro
- Opção de excluir registros

### 6. Resumo Visual
Cards com informações:
- ⏱️ Tempo total trabalhado
- ☕ Tempo total de pausa
- 🟢 Horário da primeira entrada
- 🔴 Horário da última saída

### 7. Design Responsivo
- **Desktop**: Layout em 2 colunas (botões + resumo | registros)
- **Tablet**: Layout em 1 coluna
- **Mobile**: Botões em grid 2x2, cards compactos

---

## 🚀 Instalação e Execução

### Pré-requisitos
- Node.js 18+ 
- npm 9+

### Instalação

```bash
# Clone o repositório
git clone <url-do-repositorio>

# Entre no diretório
cd backofficeApp

# Instale as dependências
npm install
```

### Desenvolvimento

```bash
# Inicia servidor de desenvolvimento
npm start

# Aplicação disponível em http://localhost:4200
```

### Build de Produção

```bash
# Gera build otimizado
npm run build

# Arquivos em dist/backofficeApp
```

### Testes

```bash
# Executa testes unitários
npm test

# Testes com coverage
npm run test:coverage
```

---

## 📝 Melhorias Futuras

### Curto Prazo
- [ ] Adicionar notas aos batimentos
- [ ] Histórico de dias anteriores
- [ ] Exportação de relatórios (CSV/PDF)
- [ ] Tema escuro/claro

### Médio Prazo
- [ ] Múltiplos usuários
- [ ] Geolocalização nos batimentos
- [ ] Notificações de lembrete
- [ ] Gráficos e estatísticas

### Longo Prazo
- [ ] Backend com API REST
- [ ] Banco de dados relacional
- [ ] Autenticação e autorização
- [ ] App mobile nativo
- [ ] Sincronização offline

---

## 📄 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.

---

## 👥 Contribuindo

Contribuições são bem-vindas! Por favor:
1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

---

**Versão**: 1.0.0  
**Última Atualização**: Janeiro 2026
