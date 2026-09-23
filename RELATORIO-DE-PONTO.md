# Relatório de Ponto

Integrado ao menu existente, com Hoje e Geral / Acumulado. Usa a aba Labor da mesma planilha do painel, sem gravar nela. Falha de sincronização não usa os registros de reserva no relatório.

Cada linha de Labor representa um segmento. Use linhas diferentes para projetos diferentes ou para intervalos no mesmo dia. Campos existentes: labor_id, project_id, worker, date, hours, rate, entry_time, exit_time. Campos opcionais lidos pelo relatório: worker_id (identidade estável), client, status, notes, correction, exit_date. Datas: DD/MM/AAAA ou AAAA-MM-DD; horários: HH:mm ou HH:mm:ss. Para virada de dia, informe exit_date. Sem worker_id, o nome exato identifica o funcionário.

Com entrada e saída válidas, a duração é calculada pela diferença. Uma diferença superior a um minuto em relação a hours gera divergência. Sem ambos os horários, hours pode ser usado como horas decimais, identificado na tela. Com apenas um horário, a duração fica pendente. Sobreposições do mesmo funcionário são detectadas antes de filtros e excluídas das somas, mantendo as linhas para conferência. Linhas com data inválida são avisadas e ficam fora dos totais por período. Turnos com exit_date são atribuídos à data de entrada.

Média = horas consideradas / funcionários distintos presentes nos filtros (incluindo funcionários com segmentos pendentes). Total e média ficam marcados como parciais se há duração pendente. Percentual = horas do projeto / horas consideradas nos filtros; com total zero, não há percentual. Arredondamento apenas na exibição pode resultar em percentuais somando 99,99% ou 100,01%. Custo = duração por segmento × taxa/hora; taxa zero/ausente fica a confirmar, conforme convenção existente.

O carregamento JSON permite conferir registros fornecidos separadamente sem publicar dados pessoais no repositório. Formato: objeto com label, projects (id, name) e labor (id, projectId, worker, date, entry, exit, reportHours opcional, rate opcional, notes, correction, reportStatus, exitDate). Fica salvo no armazenamento local deste navegador, sem se misturar com a planilha. O botão Remover consulta e voltar à planilha apaga a consulta local e restaura a origem conectada. Uma nova importação substitui a consulta anterior, evitando duplicar segmentos. Esse carregamento é uma fotografia dos registros, não uma conexão automática com a API QuickBooks Time.

Os testes em time-report.test.cjs usam exclusivamente nomes e projetos sintéticos. Executar: `node --test time-report.test.cjs`.
