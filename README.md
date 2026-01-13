# ⏰ Sistema de Batimento de Ponto

Sistema web moderno e responsivo para registro de ponto eletrônico, desenvolvido com Angular 19.

![Angular](https://img.shields.io/badge/Angular-19-red)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🚀 Características

- ✅ **Interface Moderna**: Design limpo e profissional com gradientes
- ✅ **Responsivo**: Funciona perfeitamente em desktop, tablet e mobile
- ✅ **Tempo Real**: Relógio atualizado a cada segundo
- ✅ **Validação Inteligente**: Impede registros inválidos automaticamente
- ✅ **Cálculo Automático**: Horas trabalhadas e pausas calculadas em tempo real
- ✅ **Persistência Local**: Dados salvos no navegador (localStorage)
- ✅ **Sem Backend**: Funciona 100% no cliente

## 📋 Funcionalidades

### Tipos de Registro
1. **Entrada** 🟢 - Marca chegada ao trabalho
2. **Saída** 🔴 - Marca saída do trabalho
3. **Início de Pausa** ⏸️ - Marca início de intervalo
4. **Fim de Pausa** ▶️ - Marca fim de intervalo

### Resumo do Dia
- Tempo total trabalhado
- Tempo total em pausa
- Horário da primeira entrada
- Horário da última saída

### Histórico
- Visualização de todos os batimentos do dia
- Exclusão de registros incorretos
- Ordenação cronológica

## 🛠️ Tecnologias

- **Framework**: Angular 19 (Standalone Components)
- **Linguagem**: TypeScript 5.6+
- **Estilização**: SCSS com variáveis e mixins
- **Build**: esbuild (via Angular CLI)
- **Armazenamento**: localStorage API

## 📦 Instalação

### Pré-requisitos
```bash
node --version  # v18.0.0 ou superior
npm --version   # v9.0.0 ou superior
```

### Passos

```bash
# 1. Clone o repositório
git clone <url-do-repositorio>

# 2. Entre no diretório
cd backofficeApp

# 3. Instale as dependências
npm install

# 4. Inicie o servidor de desenvolvimento
npm start

# 5. Abra o navegador em
http://localhost:4200
```

## 🎯 Como Usar

1. **Primeiro Acesso**: Clique em "Entrada" para registrar sua chegada
2. **Pausa**: Use "Iniciar Pausa" quando for fazer um intervalo
3. **Retorno**: Use "Finalizar Pausa" ao voltar do intervalo
4. **Saída**: Use "Saída" ao fim do expediente
5. **Correções**: Clique no ícone 🗑️ para excluir registros incorretos

### Regras de Validação

O sistema aplica validação automática:

```
✅ Sequência Válida:
Entrada → Pausa → Fim Pausa → Saída → Entrada

❌ Sequência Inválida:
Saída (sem entrada)
Pausa (sem entrada)
Fim Pausa (sem início)
```

## 🏗️ Estrutura do Projeto

```
src/app/
├── models/
│   └── time-entry.model.ts      # Interfaces e tipos
├── services/
│   └── time-clock.service.ts    # Lógica de negócio
├── app.component.ts             # Componente principal
├── app.component.html           # Template
├── app.component.scss           # Estilos
└── app.config.ts                # Configuração
```

## 📊 Modelo de Dados

### TimeEntry
```typescript
{
  id: string;           // ID único
  userId: string;       // ID do usuário
  userName: string;     // Nome do usuário
  date: string;         // Data (YYYY-MM-DD)
  entries: PunchEntry[] // Lista de batimentos
}
```

### PunchEntry
```typescript
{
  id: string;                    // ID único
  timestamp: Date;               // Data/hora do batimento
  type: 'entrada' | 'saida' |    // Tipo de batimento
        'pausa-inicio' | 
        'pausa-fim';
  notes?: string;                // Observações (opcional)
}
```

## 📚 Documentação

Documentação técnica completa disponível em [DOCUMENTATION.md](./DOCUMENTATION.md)

Inclui:
- Arquitetura detalhada
- Modelagem de dados
- Fluxo de funcionamento
- API dos serviços
- Guia de contribuição

## 🧪 Testes

```bash
# Testes unitários
npm test

# Testes com coverage (quando disponível)
npm run test:coverage
```

## 🚧 Roadmap

### v1.1 (Próxima)
- [ ] Histórico de dias anteriores
- [ ] Exportação de relatórios (CSV)
- [ ] Notas personalizadas nos batimentos

### v1.2
- [ ] Múltiplos usuários
- [ ] Tema escuro
- [ ] Gráficos de produtividade

### v2.0
- [ ] Backend com API
- [ ] Banco de dados
- [ ] Autenticação
- [ ] App mobile

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/MinhaFeature`
3. Commit: `git commit -m 'feat: Minha nova feature'`
4. Push: `git push origin feature/MinhaFeature`
5. Abra um Pull Request

### Padrão de Commits
Seguimos o [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação de código
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Manutenção

## 📄 Licença

Este projeto está sob a licença MIT.

---

**Versão**: 1.0.0  
**Status**: Em Desenvolvimento Ativo  
**Última Atualização**: Janeiro 2026
