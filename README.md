# Beco 404

Jogo de navegador pra quem já trabalha com dados (SQL, Python, Glue, S3) e quer aprender a parte de aplicação: Lambda em Python, API Gateway e a base do Angular (TypeScript e RxJS).

Você é a plantonista nova de um beco onde cada gato que chega na porta é uma requisição. Você escreve o código, aperta **Rodar** e vê quem entra e quem fica do lado de fora. O código é de verdade e roda no próprio navegador.

## Como jogar

Precisa de internet (o Python, o TypeScript e o editor vêm de CDN). Na raiz do repo:

```sh
python3 -m http.server 8795
```

Abra <http://localhost:8795>. Também funciona publicado no GitHub Pages, porque é só HTML, CSS e JavaScript, sem build.

O progresso fica no `localStorage` do navegador.

## Os turnos

| Turno | Assunto | O que ela escreve | Fases |
| --- | --- | --- | --- |
| 1. O Dorminhoco | AWS Lambda em Python | `handler(event, context)` de verdade, no formato de evento 2.0 do HTTP API, rodando com Pyodide | 7 |
| 2. O Porteiro | API Gateway | Tabela de rotas, CORS e authorizer em JSON, passada por um simulador | 4 |
| 3. O Desconfiado | TypeScript e RxJS | Funções e Observables de verdade, com o RxJS oficial | 5 |
| 4. A Vitrine | Angular (componentes, HttpClient) | em obra | |
| 5. O Vigia | ECS Fargate | em obra | |

O código inicial de cada fase já vem quase pronto, com os pontos a mexer marcados como `TODO`. Cada fase tem cinco partes:

- **Você já sabe / Aqui no beco:** a ponte entre uma coisa de dados e a coisa nova (`WHERE` vira query string, partição vira caminho, action do Spark vira `subscribe`).
- **Cola:** a sintaxe que a fase pede. Fica recolhida; abrir não custa estrela.
- **Visitantes:** os casos de teste. Cada um é um gato com um pedido e uma resposta esperada. Alguns são surpresa e só aparecem depois de rodar.
- **Relatório do plantão:** aparece ao passar. Diz onde a comparação com dados quebra e como é na AWS de verdade.
- **</> Por dentro:** raio-X da cena. Mostra as tags HTML do beco lidas da página, e o JavaScript que mexe nelas enquanto os gatos andam. Passar o mouse numa linha acende a tag na cena. Tem um **passo a passo** (a cena para a cada mudança e espera o clique em "Próximo passo") e um console onde ela digita JavaScript de verdade (`placa.textContent = "miau"`) e vê a tag mudar. Serve pra explicar o que é frontend antes do turno de Angular.

Quando o código quebra, a linha errada fica vermelha no editor com um recado em português logo abaixo, já dizendo o conserto e, quando dá, mostrando a linha corrigida (faltou aspas, faltou vírgula, nome digitado errado, recuo). O recado some quando ela mexe no código. A mensagem original da máquina aparece em letra pequena no painel, pra ela ir se acostumando a ler.

A velocidade dos gatos na cena é escolhida ao lado do botão Rodar: lenta, normal ou rápida.

Estrelas: 3 com no máximo 1 dica e 5 tentativas, 2 se pediu a segunda dica ou passou de 5 tentativas, 1 se viu a solução. **Reiniciar** zera a fase pra tentar as 3 de novo.

## Pra quem ensina

- `?livre` na URL destranca todas as fases e mostra o botão **Ver solução**.
- No console do navegador, `await BECO.testarTudo()` roda a solução de cada fase (tem que passar em tudo) e o código inicial (tem que falhar em alguma coisa).
- O turno 2 é um simulador simplificado. Os nomes `cors.allowOrigins`, `allowMethods` e `allowHeaders` são os da AWS; o formato `{"lambda": "...", "auth": "jwt"}` é só do jogo.
- O turno 3 roda o TypeScript sem conferir tipos (a fase 1 avisa disso).

## Estrutura

```
index.html
css/estilo.css
js/runners.js        executa Python, o simulador de gateway e TypeScript
js/cena.js           o beco e os gatos em pixel art, desenhados por código
js/main.js           mapa, tela da fase, estrelas e progresso
js/niveis/*.js       um arquivo por turno, com todas as fases
assets/              retratos dos gatos de cada turno
legado/              o painel de cards antigo (não é usado pelo jogo)
```

Pra criar uma fase, copie um objeto dentro de `js/niveis/` e preencha `sabe`, `aqui`, `missao`, `inicial`, `solucao`, `dicas`, `visitantes` e `relatorio`. Depois rode `await BECO.testarTudo()`.
