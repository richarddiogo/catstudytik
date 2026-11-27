# API em container

## ecs-0 | ponte | Da task que termina ao serviço que fica
Um Glue job costuma executar trabalho finito. No ECS, uma task também pode executar e encerrar. Um ECS service é a configuração que mantém tasks disponíveis para atender chamadas.
- EXECUÇÃO PONTUAL | ECS task para uma carga que termina.
- API DISPONÍVEL | ECS service mantém a quantidade desejada de tasks.

## ecs-1 | armadilha | Mesma rota, outro perfil de operação
Lambda invoca seu handler quando chega uma requisição. Um serviço no ECS mantém processos ativos e precisa de verificações de saúde e configuração de escala.
- LAMBDA | Observe latência e inicialização sob demanda.
- ECS | Observe saúde do processo e capacidade provisionada.

## ecs-2 | desafio | Suba a API no container
Exponha a lógica de leitura dos cards em FastAPI e construa uma imagem. Rode localmente e compare o JSON da rota de lista com o JSON do handler Lambda.
- ROTA | GET /cards
- CHECAGEM | Mesmo status e mesmo contrato para a mesma entrada.

## ecs-3 | boss | Compare Lambda e ECS Fargate
Abra um PR com a imagem, a definição de task e as verificações de contrato. Registre o que observou sobre latência, escala e operação em cada alternativa.
- ACEITE | As duas implementações passam pelo mesmo teste de contrato.
- DECISÃO | Escreva em que cenário escolheria cada opção.
