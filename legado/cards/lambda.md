# Python na Lambda

## lambda-0 | ponte | Do evento do S3 à requisição HTTP
Você já leu registros de um evento do S3. Com API Gateway, o handler Python continua recebendo um evento, agora com informação sobre a requisição do navegador.
- S3 | O evento informa qual objeto mudou.
- HTTP | A integração informa método, caminho e parâmetros.

## lambda-1 | armadilha | Trabalho que sobrevive à invocação
O Dorminhoco pode reaproveitar o ambiente entre chamadas, mas o próximo evento pode cair em outro ambiente. Progresso de estudo precisa de armazenamento durável.
- TEMPORÁRIO | Cache em memória pode desaparecer.
- DURÁVEL | Persista progresso por usuária e id do card.

## lambda-2 | desafio | Faça o handler listar cards
Use uma coleção local de cards no primeiro handler. Leia o filtro tipo, serialize a lista e compare com a resposta quando nenhum card combina.
- ENTRADA | GET /cards?tipo=ponte
- SAÍDA | 200 e uma lista JSON, vazia quando não houver resultados.

## lambda-3 | boss | Uma API testável em Python
Abra um PR com o handler, a leitura do baralho e testes locais para lista, detalhe e id ausente. Separe a lógica de negócio da adaptação do evento HTTP.
- ENTREGA | GET /cards e GET /cards/{id}
- ACEITE | Lista válida, detalhe conhecido e 404 para id inexistente.
