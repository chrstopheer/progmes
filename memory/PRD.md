# PRD — Programação Comunidade Putim (PWA)

## Problema
App PWA para uma ONG (Comunidade Putim) que permite montar a programação mensal de atividades. A cada mês, uma nova programação é criada, salva no dispositivo, e pode ser exportada em PDF (formato A4 retrato) e compartilhada por WhatsApp.

## Escolhas do usuário
- Autenticação: **sem login** (uso aberto)
- Armazenamento: **offline PWA** (localStorage)
- Envio WhatsApp: **PDF + link wa.me** (Web Share API quando suportado, senão download + WhatsApp Web)
- Divisões pré-definidas: **DE, DFJ, DMJ, DF, DS, 5 Div.** (editáveis)
- Cores: **azul, amarelo, vermelho** discretos, seguindo o modelo enviado
- Cabeçalho/rodapé: pré-preenchidos com o modelo e editáveis via Ajustes

## Personas
- Coordenador da ONG que monta a programação mensal em uma agenda e distribui via WhatsApp.

## Requisitos centrais (fixos)
1. Calendário mensal na tela inicial com seletor de ano e mês.
2. Ao clicar em um dia, abrir tela de cadastro/edição da atividade daquele dia com colunas: divisão, atividade, local, horário.
3. Botões Salvar e Excluir voltam para o calendário.
4. Data, dia da semana e nomes de colunas não editáveis; determinados pelo mês selecionado.
5. Cabeçalho e rodapé pré-preenchidos, editáveis em Ajustes.
6. Tabela final cabe em uma única folha A4 retrato.
7. Exportar PDF e compartilhar via WhatsApp.
8. Persistência offline (PWA + localStorage).
9. Layout intuitivo, responsivo e moderno com paleta azul/amarelo/vermelho discreta.

## O que foi implementado (12/02/2026)
- Estrutura PWA (manifest + service worker mínimo com cache-first).
- Rotas: `/`, `/atividade/:year/:month/:day`, `/programacao/:year/:month`.
- Home com calendário grid, seletores mês/ano, navegação prev/next, lista de "Programações salvas".
- Formulário de atividade com Select de divisões, campos de local (texto) e horário (time input), fluxo Salvar/Excluir/Cancelar.
- Preview A4 fiel ao modelo enviado (cabeçalho amarelo, títulos vermelhos, linhas preenchidas azul-claro, rodapé amarelo com texto vermelho itálico).
- Geração de PDF com jsPDF + jspdf-autotable, ajustado para A4 retrato em uma página.
- Compartilhamento por WhatsApp via `navigator.share` (Web Share API) com fallback para `wa.me` + download do PDF.
- Ajustes: edição de cabeçalho (título, comunidade, frase do ano), rodapé, gerenciamento de divisões (adicionar/remover, com botão restaurar padrão).
- Persistência total em localStorage (settings + atividades por mês).
- Design paper-feel com fontes Fraunces (display) + IBM Plex Sans, paleta discreta em CSS variables.
- Test IDs em todos os elementos interativos.

## Testes
- Iteração 1: **100% passing** em todos os fluxos e mobile 390x844. Único warning cosmético (Select controlled/uncontrolled) sem impacto funcional.

## Backlog prioritário
- **P1** Notificações / lembretes locais para atividades próximas.
- **P2** Ícones PWA (icon-192.png, icon-512.png) para instalação (atualmente ausentes; app instalável, mas com ícone padrão).
- **P2** Duplicar programação de um mês para outro (para meses parecidos).
- **P2** Backup/Restore em JSON (para trocar de dispositivo).
- **P3** Modo escuro discreto.
- **P3** Suporte a múltiplas comunidades (perfis).
