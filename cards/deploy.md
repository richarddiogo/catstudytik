# Deploy do laboratório

## deploy-0 | ponte | Do artefato de dados ao build web
Você já publica saídas em S3. O build do Angular também gera artefatos, que serão servidos para o navegador via CloudFront a partir da origem S3.
- BUILD | O Angular gera HTML, JavaScript e CSS.
- ENTREGA | CloudFront serve esses arquivos ao navegador.

## deploy-1 | armadilha | Abrir a rota direto precisa funcionar
Ao recarregar uma rota interna, o navegador pede aquele caminho ao host. Configure a distribuição para servir a entrada do Angular para rotas da SPA e preservar a resposta de arquivos reais ausentes.
- TESTE 1 | Recarregue /trilha direto na barra de endereços.
- TESTE 2 | Peça um arquivo JS inexistente e verifique o erro.

## deploy-2 | desafio | Faça um teste de ponta a ponta
Abra a URL web, leia um card servido pela API e conclua a leitura. Recarregue a página e verifique o que aconteceu com o progresso.
- FLUXO | Abrir → carregar → concluir → recarregar.
- ACEITE | O progresso continua visível após a recarga.

## deploy-3 | boss | Entregue o laboratório
Abra o PR final com a infraestrutura como código, o roteiro de publicação e a demonstração do baralho. Registre a opção de backend escolhida e a razão.
- ENTREGA | URL web, definição da infraestrutura e instruções de verificação.
- ACEITE | Uma segunda pessoa consegue verificar o fluxo completo.
