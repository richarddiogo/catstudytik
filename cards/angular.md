# Frontend Angular

## angular-0 | ponte | Do Glue Catalog ao TypeScript
Use o contrato dos cards como fonte para a interface TypeScript. Ela ajuda o Angular a trabalhar com campos conhecidos, assim como o catálogo descreve os dados que você espera ler.
- CONTRATO | Card tem id, tipo, titulo e texto.
- FRONTEND | Um componente recebe um Card e desenha seu conteúdo.

## angular-1 | armadilha | O tipo não valida o JSON recebido
Interfaces TypeScript ajudam durante a compilação. Se a API devolver um objeto diferente do combinado, a aplicação ainda precisa lidar com a resposta real.
- COMPILAÇÃO | HttpClient.get<Card[]>() informa o tipo esperado.
- EXECUÇÃO | Valide o formato quando a fronteira exigir essa garantia.

## angular-2 | desafio | Dispare a leitura do baralho
O HttpClient retorna um Observable e a requisição ocorre quando alguém assina. Lembre da execução preguiçosa do Spark para ligar a ideia, e use o async pipe para renderizar o resultado.
- SERVIÇO | baralho$ = this.http.get<Card[]>('/cards');
- CHECAGEM | A tela mostra estado de carregamento e a lista recebida.

## angular-3 | boss | Construa o feed de estudo
Abra um PR com um componente de card, o serviço HTTP e o controle de avanço. Valide um formulário simples para anotar uma dúvida sobre o card.
- ENTREGA | Feed, estados de erro e vazio, e formulário validado.
- ACEITE | Uma pessoa consegue estudar e concluir o primeiro baralho.
