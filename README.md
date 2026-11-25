# CatStudyTik

Um laboratório para quem já trabalha com SQL, Python, Glue e S3 e quer aprender a construir uma aplicação web com Angular e AWS. O projeto da trilha é o próprio CatStudyTik.

[Veja a tela inicial do mockup](preview.png) ou [a versão mobile](preview-mobile.png). Para navegar, abra [`mockup.html`](mockup.html) no navegador. O arquivo contém a interface, os seis baralhos e a pixel art gerada com ImageGen. Posição, conclusões e favoritos ficam no armazenamento local do navegador quando disponível.

## Fase 1 · Dados e contrato

Nesta fase, o Markdown é a fonte e o JSON é o artefato que a futura API vai servir. O Python lê o [baralho em Markdown](cards/dados.md), aplica as regras do contrato e publica o [JSON versionado](data/dados.json). O mockup incorpora esse mesmo JSON no build.

Com Python 3.8 ou superior, rode na raiz do repo:

```sh
python3 baralho.py gerar
python3 baralho.py validar
python3 build.py
python3 -m unittest discover -s tests -v
```

O primeiro comando gera quatro cards e o segundo valida o arquivo em disco. O terceiro atualiza o HTML com o baralho gerado. Os testes conferem a reprodução do JSON, a correspondência com o mockup e a rejeição de entradas inválidas. O script usa apenas a biblioteca padrão.

### Contrato do baralho

- A raiz do JSON tem `fase` e `cards`. O primeiro baralho usa `fase: "dados"`.
- Há um card de cada tipo, em ordem de leitura: `ponte`, `armadilha`, `desafio` e `boss`.
- Cada card tem `id`, `tipo`, `titulo`, `texto` e uma lista de `exemplos`, cada um com `rotulo` e `conteudo`.
- Os IDs são explícitos no Markdown, únicos no baralho e começam com o slug da fase, como `dados-0`. Preserve o ID ao revisar o título ou o texto.
- Campos ausentes, textos vazios, tipos fora da ordem e IDs repetidos fazem o comando sair com status 1. Uma geração reprovada preserva o JSON da última execução válida.

No Markdown, cada card começa com `## id | tipo | título`, seguido do texto e de uma ou mais linhas `- RÓTULO | exemplo`.

### Exercício de 2 a 5 minutos

Faça uma cópia de `cards/dados.md` em `/tmp/catstudytik-dados.md` e troque o tipo do primeiro card de `ponte` para `surpresa`.

```sh
python3 baralho.py gerar --origem /tmp/catstudytik-dados.md --saida /tmp/catstudytik-dados.json
```

A geração deve acusar `cards[0].tipo`. Corrija o tipo, altere o título mantendo o ID, gere de novo e rode `python3 baralho.py validar /tmp/catstudytik-dados.json`. Confira que só o título mudou no card. O **Boss** é abrir um PR com uma edição real no Markdown, o JSON regenerado e evidência de que IDs duplicados e campos ausentes são rejeitados.

## Próximas fases no mockup

| Fase | Ponte com engenharia de dados | Entrega de estudo |
| --- | --- | --- |
| Python na Lambda | Invocação por evento do S3 | Handler HTTP com lista, detalhe e testes |
| API Gateway | Gatilhos e seleção de integração | Rotas, CORS e exemplos de chamada |
| Frontend Angular | Schema do Glue Catalog e execução preguiçosa do Spark | Feed, serviço HTTP, navegação e formulário |
| API em container | Glue job e execução finita | FastAPI em ECS Fargate e comparação com Lambda |
| Deploy do laboratório | Publicação de artefatos no S3 | URL, configuração de CloudFront e infraestrutura como código |

Os baralhos de prévia estão em [`cards/`](cards/) e a ordem das fases está em [`trilha.json`](trilha.json).
