# API Gateway

## gateway-0 | ponte | Do trigger do Glue à rota HTTP
No Glue Workflow, um evento inicia uma etapa. No Gateway, a combinação de método e caminho seleciona a integração que atende a requisição.
- TRIGGER | Evento do workflow inicia o job.
- ROTA | GET /cards seleciona a integração de leitura.

## gateway-1 | armadilha | No curl passa. No browser falha.
O navegador aplica CORS quando o Angular chama uma API em outra origem. Um teste com curl confirma a rota, mas sozinho não verifica essa regra do navegador.
- ORIGEM | Combine a rota com a origem efetiva do frontend.
- CHECAGEM | Faça a chamada a partir da página e inspecione a aba Rede.

## gateway-2 | desafio | Atravesse a portaria
Configure a rota GET /cards na API e invoque pela URL de teste. Confirme status, Content-Type e se o corpo tem os campos do contrato.
- ENTRADA | GET /cards
- ACEITE | 200, application/json e ids estáveis.

## gateway-3 | boss | Publique as rotas do baralho
Abra um PR com a configuração do Gateway, exemplos de chamada e CORS para a origem de desenvolvimento. Documente qual limite de requisições você adotou para o laboratório.
- CASOS | Lista, detalhe, id ausente e acesso pelo navegador.
- ACEITE | Outra pessoa consegue repetir os testes usando o README.
