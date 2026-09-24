# Backlog - Sistema de Controle de Ponto Inteligente

## Histórico e Tarefas Planejadas

### Inicialização do Projeto
- [x] Iniciar `backlog.md`.
- [x] Criar estrutura base `index.html`.
- [x] Criar estrutura base `style.css` (UI corporativa, clean, sem emojis).
- [x] Criar `app.js` (controlador principal).
- [x] Criar `supabase.js` com a conexão inicial utilizando credenciais fornecidas.
- [x] Realizar verificação dos arquivos e testes iniciais.
- [x] Atualizar `index.html` com link para solicitar matrícula.
- [x] Criar `cadastro.html` para solicitação de matrícula.
- [x] Criar `cadastro.js` com integração EmailJS para enviar a solicitação.

### Fluxo Principal do Sistema de Ponto
- [x] Validação de Matrícula (`app.js`): Busca na tabela `employees` do Supabase, alerta de matrícula não encontrada / inativa, armazenamento no `sessionStorage` e redirecionamento.
- [x] Interface da Câmera (`camera.html` e `camera.css`): Design minimalista e corporativo, leitor centralizado.
- [x] Reconhecimento Facial (`camera.js`): Integração com `face-api.js` via CDN, ativação de webcam (`getUserMedia`), indicador visual verde de 'Rosto Detectado' e ativação dinâmica do botão de confirmação.
- [x] Gravação do Ponto (`time_records` / `time_logs` no Supabase): Cálculo do horário atual, verificação da regra de tolerância de 15 minutos em relação ao horário do funcionário, gravação de `employee_id`, `created_at`, `type` (Entrada/Saída) e `status`.
- [x] Tela / Modal de Confirmação: Exibição do horário exato do ponto registrado e contagem regressiva de 5 segundos para retorno ao `index.html`.

### Funcionalidades Futuras Planejadas (A Definir Detalhes)
- Configuração de `timeUtils.js` (Day.js).
- Implementação de regras de Penalidade e Atraso (`penalty_points`).
- Verificação de Faltas (cron/trigger).
