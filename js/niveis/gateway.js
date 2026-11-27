/* Turno 2: O Porteiro (API Gateway).
   A jogadora edita a tabela de rotas em JSON. Um simulador de HTTP API decide quem entra.
   Os nomes cors.allowOrigins / allowMethods / allowHeaders são os mesmos da AWS. */
(function () {
  const B = (window.BECO = window.BECO || {});
  B.mundos = B.mundos || [];
  const SITE = 'https://beco404.dev';
  const PIRATA = 'https://gato-pirata.xyz';

  function txt(obj) {
    return JSON.stringify(obj, null, 2) + '\n';
  }

  B.mundos.push({
    id: 'gateway',
    nome: 'O Porteiro',
    assunto: 'API Gateway: rotas, CORS e crachá',
    retrato: 'assets/porteiro.webp',
    mascote: 'porteiro',
    fala: 'Ninguém passa sem rota. Pra certas portas, nem com rota: precisa de crachá.',
    linguagem: 'json',
    arquivo: 'api-gateway.json',
    niveis: [
      {
        id: 'gateway-1',
        titulo: 'Cada um na sua porta',
        tipo: 'gateway',
        lambdas: ['listar-gatos', 'criar-gato'],
        sabe: 'No Glue Workflow, o trigger decide qual job roda quando chega cada evento.',
        aqui: 'No API Gateway, a <b>rota</b> decide qual Lambda roda quando chega cada requisição. A chave da rota é <code>MÉTODO caminho</code>, tipo <code>"GET /gatos"</code>. Mesmo caminho com método diferente é outra rota.',
        missao: 'Lambdas disponíveis: <code>listar-gatos</code> e <code>criar-gato</code>. Mande cada pedido pra Lambda certa. Pedido sem rota tem que levar <code>404</code>.',
        cola: 'Cada rota é uma linha <code>"MÉTODO /caminho": "nome-da-lambda"</code>. Entre uma linha e outra vai vírgula. Depois da última, não.',
        inicial: txt({ rotas: { 'GET /gatos': 'criar-gato' } }),
        solucao: txt({ rotas: { 'GET /gatos': 'listar-gatos', 'POST /gatos': 'criar-gato' } }),
        dicas: ['A rota que já está aí aponta pra Lambda errada.', 'São duas rotas: <code>"GET /gatos": "listar-gatos"</code> e <code>"POST /gatos": "criar-gato"</code>.'],
        visitantes: [
          { nome: 'Fuligem', pelo: 'preto', pedido: 'GET /gatos', req: { metodo: 'GET', caminho: '/gatos' }, espera: { destino: 'listar-gatos' } },
          { nome: 'Sombra', pelo: 'preto', pedido: 'POST /gatos', req: { metodo: 'POST', caminho: '/gatos' }, espera: { destino: 'criar-gato' } },
          { nome: 'Perdido', pelo: 'cinza', pedido: 'GET /peixes', req: { metodo: 'GET', caminho: '/peixes' }, espera: { status: 404 } },
          { nome: 'Faísca', pelo: 'laranja', pedido: 'DELETE /gatos', req: { metodo: 'DELETE', caminho: '/gatos' }, espera: { status: 404 }, oculto: true },
        ],
        relatorio:
          'O <code>404</code> do gato perdido saiu do próprio Porteiro. Nenhuma Lambda rodou, nenhum centavo de Lambda foi gasto. Rota que não existe é a validação mais barata que tem.',
      },
      {
        id: 'gateway-2',
        titulo: 'Um buraco na cerca',
        tipo: 'gateway',
        lambdas: ['listar-gatos', 'buscar-gato', 'gatos-novos', 'nao-achei'],
        sabe: 'No Glue você aponta um crawler pra <code>s3://beco/gatos/</code> e ele entende que <code>id=2</code>, <code>id=3</code> são a mesma tabela com partição variável.',
        aqui: 'Na rota, o pedaço variável vai entre chaves: <code>"GET /gatos/{id}"</code>. Se duas rotas casam, ganha a mais específica: caminho fixo vence o variável. E <code>"$default"</code> pega tudo que sobrou.',
        missao: 'Lambdas: <code>listar-gatos</code>, <code>buscar-gato</code>, <code>gatos-novos</code>, <code>nao-achei</code>. <code>/gatos/novos</code> é uma lista especial. Qualquer coisa fora do mapa vai pra <code>nao-achei</code>.',
        cola: 'Pedaço variável do caminho: <code>{id}</code>. Tudo que sobrar: <code>"$default"</code>.',
        inicial: txt({ rotas: { 'GET /gatos': 'listar-gatos', 'GET /gatos/{id}': 'buscar-gato' } }),
        solucao: txt({ rotas: { 'GET /gatos': 'listar-gatos', 'GET /gatos/{id}': 'buscar-gato', 'GET /gatos/novos': 'gatos-novos', $default: 'nao-achei' } }),
        dicas: ['<code>/gatos/novos</code> está caindo em <code>{id}</code> com id = "novos". Crie uma rota fixa pra ele.', 'Faltam duas chaves: <code>"GET /gatos/novos": "gatos-novos"</code> e <code>"$default": "nao-achei"</code>.'],
        visitantes: [
          { nome: 'Ferrugem', pelo: 'laranja', pedido: 'GET /gatos', req: { metodo: 'GET', caminho: '/gatos' }, espera: { destino: 'listar-gatos' } },
          { nome: 'Neblina', pelo: 'cinza', pedido: 'GET /gatos/7', req: { metodo: 'GET', caminho: '/gatos/7' }, espera: { destino: 'buscar-gato' } },
          { nome: 'Novato', pelo: 'branco', pedido: 'GET /gatos/novos', req: { metodo: 'GET', caminho: '/gatos/novos' }, espera: { destino: 'gatos-novos' } },
          { nome: 'Perdido', pelo: 'malhado', pedido: 'GET /peixes/3', req: { metodo: 'GET', caminho: '/peixes/3' }, espera: { destino: 'nao-achei' } },
          { nome: 'Faísca', pelo: 'laranja', pedido: 'POST /qualquer/coisa/aqui', req: { metodo: 'POST', caminho: '/qualquer/coisa/aqui' }, espera: { destino: 'nao-achei' }, oculto: true },
        ],
        relatorio:
          'Com <code>$default</code> o gato perdido deixou de levar o 404 seco do Porteiro e passou a acordar uma Lambda. É mais simpático e é mais caro: agora qualquer robô chutando URL faz sua função rodar. Na vida real se pensa duas vezes.',
      },
      {
        id: 'gateway-3',
        titulo: 'O segurança é o navegador',
        tipo: 'gateway',
        lambdas: ['listar-gatos', 'criar-gato'],
        sabe: 'Em dados não existe nada parecido. Athena, Glue e S3 nunca perguntaram de que <i>página</i> você veio. Essa é nova.',
        aqui: 'Quando o JavaScript de uma página chama uma API em outro endereço, o <b>navegador</b> pergunta pra API: "essa origem pode?". Se a API não responder que sim, o navegador esconde a resposta do JavaScript. Isso é CORS. Quem chama de fora do navegador (terminal, outra Lambda) nem passa por isso.',
        missao: 'O site do beco é <code>' + SITE + '</code> e precisa listar e criar gatos. O site <code>' + PIRATA + '</code> tem que ser barrado. O bloco <code>cors</code> já existe, mas está liberando gente demais e método de menos.',
        cola: 'Lista em JSON: <code>["a", "b"]</code>. São três listas: quem pode (<code>allowOrigins</code>), fazendo o quê (<code>allowMethods</code>) e mandando quais cabeçalhos (<code>allowHeaders</code>). <code>"*"</code> quer dizer "qualquer um".',
        inicial: txt({ rotas: { 'GET /gatos': 'listar-gatos', 'POST /gatos': 'criar-gato' }, cors: { allowOrigins: ['*'], allowMethods: ['GET'], allowHeaders: ['content-type'] } }),
        solucao: txt({ rotas: { 'GET /gatos': 'listar-gatos', 'POST /gatos': 'criar-gato' }, cors: { allowOrigins: [SITE], allowMethods: ['GET', 'POST'], allowHeaders: ['content-type'] } }),
        dicas: [
          'O <code>"*"</code> em <code>allowOrigins</code> libera todo mundo, inclusive o pirata. Troque pelo endereço do site do beco.',
          'São duas mudanças: <code>"allowOrigins": ["https://beco404.dev"]</code> e <code>"allowMethods": ["GET", "POST"]</code>. O POST com JSON faz o navegador perguntar antes (requisição <code>OPTIONS</code>), por isso o método precisa estar na lista.',
        ],
        visitantes: [
          { nome: 'Site do beco', pelo: 'laranja', pedido: 'GET /gatos (de ' + SITE + ')', req: { metodo: 'GET', caminho: '/gatos', origem: SITE }, espera: { destino: 'listar-gatos' } },
          { nome: 'Site do beco', pelo: 'laranja', pedido: 'POST /gatos com JSON (de ' + SITE + ')', req: { metodo: 'POST', caminho: '/gatos', origem: SITE, json: true }, espera: { destino: 'criar-gato' } },
          { nome: 'Pirata', pelo: 'malhado', pedido: 'GET /gatos (de ' + PIRATA + ')', req: { metodo: 'GET', caminho: '/gatos', origem: PIRATA }, espera: { cors: 'bloqueado' } },
          { nome: 'Terminal', pelo: 'preto', pedido: 'GET /gatos (curl, sem origem)', req: { metodo: 'GET', caminho: '/gatos' }, espera: { destino: 'listar-gatos' } },
          { nome: 'Pirata', pelo: 'malhado', pedido: 'POST /gatos com JSON (de ' + PIRATA + ')', req: { metodo: 'POST', caminho: '/gatos', origem: PIRATA, json: true }, espera: { cors: 'bloqueado' }, oculto: true },
        ],
        relatorio:
          'Repara no gato do terminal: entrou sem ninguém perguntar nada. <b>CORS não protege a API.</b> Ele protege o usuário de um site malicioso usando o navegador dele. Quem quiser chamar sua API por fora, chama. Proteção de verdade é o crachá, na próxima fase.',
      },
      {
        id: 'gateway-4',
        titulo: 'Só com crachá',
        chefe: true,
        tipo: 'gateway',
        lambdas: ['listar-gatos', 'buscar-gato', 'criar-gato', 'apagar-gato'],
        sabe: 'Você já esbarrou em IAM: o job do Glue só lê o bucket se a role dele deixar. Sem permissão, <code>AccessDenied</code>.',
        aqui: 'Na API, quem confere o crachá é um <b>authorizer</b> ligado à rota. O visitante manda um token no cabeçalho <code>authorization</code>. Sem token, o Porteiro devolve <code>401</code> e a Lambda nem acorda. Aqui a rota protegida se escreve <code>{"lambda": "nome", "auth": "jwt"}</code>.',
        missao: 'Ler é público: <code>GET /gatos</code> e <code>GET /gatos/{id}</code>. Criar e apagar exigem crachá: <code>POST /gatos</code> e <code>DELETE /gatos/{id}</code>. As quatro rotas já existem, mas hoje qualquer um cria e apaga.',
        cola: 'Rota aberta: <code>"GET /gatos": "listar-gatos"</code>. Rota com crachá: <code>"POST /gatos": {"lambda": "criar-gato", "auth": "jwt"}</code>. O crachá viaja no cabeçalho <code>authorization</code>.',
        inicial: txt({
          rotas: { 'GET /gatos': 'listar-gatos', 'GET /gatos/{id}': 'buscar-gato', 'POST /gatos': 'criar-gato', 'DELETE /gatos/{id}': 'apagar-gato' },
          cors: { allowOrigins: [SITE], allowMethods: ['GET', 'POST', 'DELETE'], allowHeaders: ['content-type'] },
        }),
        solucao: txt({
          rotas: {
            'GET /gatos': 'listar-gatos',
            'GET /gatos/{id}': 'buscar-gato',
            'POST /gatos': { lambda: 'criar-gato', auth: 'jwt' },
            'DELETE /gatos/{id}': { lambda: 'apagar-gato', auth: 'jwt' },
          },
          cors: { allowOrigins: [SITE], allowMethods: ['GET', 'POST', 'DELETE'], allowHeaders: ['content-type', 'authorization'] },
        }),
        dicas: [
          'Nas rotas de <code>POST</code> e <code>DELETE</code>, troque o texto por um objeto: <code>{"lambda": "criar-gato", "auth": "jwt"}</code>.',
          'Depois disso o site do beco ainda é barrado: o navegador só manda cabeçalho que estiver em <code>allowHeaders</code>. Acrescente <code>"authorization"</code> na lista.',
        ],
        visitantes: [
          { nome: 'Curioso', pelo: 'cinza', pedido: 'GET /gatos (site, sem crachá)', req: { metodo: 'GET', caminho: '/gatos', origem: SITE }, espera: { destino: 'listar-gatos' } },
          { nome: 'Curioso', pelo: 'cinza', pedido: 'GET /gatos/2 (site, sem crachá)', req: { metodo: 'GET', caminho: '/gatos/2', origem: SITE }, espera: { destino: 'buscar-gato' } },
          { nome: 'Dona do turno', pelo: 'laranja', pedido: 'POST /gatos com JSON (site, com crachá)', req: { metodo: 'POST', caminho: '/gatos', origem: SITE, json: true, token: true }, espera: { destino: 'criar-gato' } },
          { nome: 'Penetra', pelo: 'malhado', pedido: 'POST /gatos com JSON (terminal, sem crachá)', req: { metodo: 'POST', caminho: '/gatos', json: true }, espera: { status: 401 } },
          { nome: 'Dona do turno', pelo: 'laranja', pedido: 'DELETE /gatos/3 (site, com crachá)', req: { metodo: 'DELETE', caminho: '/gatos/3', origem: SITE, token: true }, espera: { destino: 'apagar-gato' } },
          { nome: 'Penetra', pelo: 'malhado', pedido: 'DELETE /gatos/3 (terminal, sem crachá)', req: { metodo: 'DELETE', caminho: '/gatos/3' }, espera: { status: 401 }, oculto: true },
          { nome: 'Pirata', pelo: 'preto', pedido: 'GET /gatos (de ' + PIRATA + ')', req: { metodo: 'GET', caminho: '/gatos', origem: PIRATA }, espera: { cors: 'bloqueado' }, oculto: true },
        ],
        relatorio:
          'Agora são duas barreiras e cada uma faz uma coisa. O <b>navegador</b> (CORS) decide quais sites podem falar com a API. O <b>authorizer</b> decide quem pode fazer o quê, venha de onde vier. O penetra do terminal passou reto pela primeira e bateu na segunda. Na AWS de verdade, o <code>"jwt"</code> aponta pra um Cognito ou outro emissor de token.',
      },
    ],
  });
})();
