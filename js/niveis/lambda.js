/* Turno 1: O Dorminhoco (AWS Lambda em Python).
   O código da jogadora é um handler de verdade, no formato de evento 2.0 do HTTP API. */
(function () {
  const B = (window.BECO = window.BECO || {});
  B.mundos = B.mundos || [];
  const py = String.raw;

  function ev(metodo, caminho, o) {
    o = o || {};
    const rota = o.rota || metodo + ' ' + caminho;
    const e = {
      version: '2.0',
      routeKey: rota,
      rawPath: caminho,
      rawQueryString: o.query ? Object.keys(o.query).map((k) => k + '=' + encodeURIComponent(o.query[k])).join('&') : '',
      headers: { host: 'api.beco404.dev', 'user-agent': 'gato/1.0' },
      requestContext: { http: { method: metodo, path: caminho }, routeKey: rota, stage: '$default' },
      isBase64Encoded: false,
    };
    if (o.query) e.queryStringParameters = o.query;
    if (o.path) e.pathParameters = o.path;
    if (o.body !== undefined) {
      e.body = o.body;
      e.headers['content-type'] = 'application/json';
    }
    return e;
  }

  const G = [
    { id: 1, nome: 'Fuligem', cor: 'preto' },
    { id: 2, nome: 'Ferrugem', cor: 'laranja' },
    { id: 3, nome: 'Neblina', cor: 'cinza' },
    { id: 4, nome: 'Breu', cor: 'preto' },
  ];

  const GATOS = py`GATOS = [
    {"id": 1, "nome": "Fuligem", "cor": "preto"},
    {"id": 2, "nome": "Ferrugem", "cor": "laranja"},
    {"id": 3, "nome": "Neblina", "cor": "cinza"},
    {"id": 4, "nome": "Breu", "cor": "preto"},
]`;

  const RESPOSTA = py`def resposta(status, dados):
    return {
        "statusCode": status,
        "headers": {"content-type": "application/json"},
        "body": json.dumps(dados),
    }`;

  B.mundos.push({
    id: 'lambda',
    nome: 'O Dorminhoco',
    assunto: 'AWS Lambda em Python',
    retrato: 'assets/dorminhoco.webp',
    mascote: 'dorminhoco',
    fala: 'Dorme até alguém bater na porta. Resolve e volta a dormir. Na primeira batida demora pra levantar.',
    linguagem: 'python',
    arquivo: 'lambda_function.py',
    niveis: [
      {
        id: 'lambda-1',
        titulo: 'Acorda, Dorminhoco',
        tipo: 'python',
        sabe: 'Na Lambda que você ligou no S3, a função era <code>handler(event, context)</code> e o evento dizia qual objeto tinha mudado. Ninguém esperava o retorno.',
        aqui: 'A assinatura é a mesma. Só que agora quem chama é uma requisição HTTP, e tem um gato parado na porta esperando. A resposta é um dict com <code>statusCode</code> (número) e <code>body</code> (texto).',
        missao: 'Todo gato que bater na porta recebe status <code>200</code> e o corpo <code>miau</code>.',
        cola: 'Um dict em Python: <code>{"chave": valor}</code>. Número vai sem aspas: <code>200</code>. Texto vai <b>sempre</b> entre aspas: <code>"miau"</code>. Sem aspas o Python procura uma variável com esse nome e quebra.',
        inicial: py`def handler(event, context):
    # Troque o 0 por 200.
    # Troque o ? por miau, deixando as aspas no lugar: "miau"
    return {"statusCode": 0, "body": "?"}
`,
        solucao: py`def handler(event, context):
    return {"statusCode": 200, "body": "miau"}
`,
        dicas: ['Só os valores mudam: <code>0</code> vira <code>200</code> e <code>"?"</code> vira <code>"miau"</code>.', '<code>return {"statusCode": 200, "body": "miau"}</code>'],
        visitantes: [
          { nome: 'Fuligem', pelo: 'preto', pedido: 'GET /', event: ev('GET', '/'), espera: { status: 200, texto: 'miau' } },
          { nome: 'Ferrugem', pelo: 'laranja', pedido: 'GET /oi', event: ev('GET', '/oi'), espera: { status: 200, texto: 'miau' } },
          { nome: 'Neblina', pelo: 'cinza', pedido: 'POST /qualquer', event: ev('POST', '/qualquer'), espera: { status: 200, texto: 'miau' }, oculto: true },
        ],
        relatorio:
          'No S3 o retorno da função ia pro lixo. Aqui o retorno é o produto. Curiosidade do formato 2.0: se você devolver um dict <b>sem</b> <code>statusCode</code>, o API Gateway assume 200 e manda o dict inteiro como JSON. Funciona, mas quem lê o código depois agradece o status explícito.',
      },
      {
        id: 'lambda-2',
        titulo: 'Quem é?',
        tipo: 'python',
        sabe: 'No evento do S3 você ia buscar o nome do objeto dentro de <code>event["Records"][0]["s3"]...</code>. O dado que interessa mora dentro do evento.',
        aqui: 'O que vem depois do <code>?</code> na URL chega em <code>event["queryStringParameters"]</code>, já como dict. <code>/oi?nome=Fuligem</code> vira <code>{"nome": "Fuligem"}</code>.',
        missao: 'Responda <code>oi, NOME</code> usando o parâmetro <code>nome</code>. Se o gato não disser o nome, responda <code>oi, estranho</code>. Sempre status <code>200</code>.',
        cola: '<code>d["x"]</code> quebra se a chave não existe. <code>d.get("x")</code> devolve <code>None</code>. <code>d.get("x", "padrão")</code> devolve o padrão. <code>valor or {}</code> troca <code>None</code> por um dict vazio.',
        inicial: py`def handler(event, context):
    # Quando a URL não tem "?", a chave "queryStringParameters" nem existe no evento,
    # e colchete em chave que não existe quebra. Troque os colchetes por .get()
    params = event["queryStringParameters"]
    nome = params["nome"]
    return {"statusCode": 200, "body": f"oi, {nome}"}
`,
        solucao: py`def handler(event, context):
    params = event.get("queryStringParameters") or {}
    nome = params.get("nome", "estranho")
    return {"statusCode": 200, "body": f"oi, {nome}"}
`,
        dicas: [
          'Rode do jeito que está e leia o erro do terceiro gato. Clique nele em <b>Visitantes</b> pra ver o evento que ele trouxe.',
          'Duas linhas: <code>params = event.get("queryStringParameters") or {}</code> e <code>nome = params.get("nome", "estranho")</code>.',
        ],
        visitantes: [
          { nome: 'Fuligem', pelo: 'preto', pedido: 'GET /oi?nome=Fuligem', event: ev('GET', '/oi', { query: { nome: 'Fuligem' } }), espera: { status: 200, texto: 'oi, Fuligem' } },
          { nome: 'Breu', pelo: 'preto', pedido: 'GET /oi?nome=Breu', event: ev('GET', '/oi', { query: { nome: 'Breu' } }), espera: { status: 200, texto: 'oi, Breu' } },
          { nome: 'Sem Nome', pelo: 'malhado', pedido: 'GET /oi', event: ev('GET', '/oi'), espera: { status: 200, texto: 'oi, estranho' } },
          { nome: 'Mofo', pelo: 'cinza', pedido: 'GET /oi?cor=cinza', event: ev('GET', '/oi', { query: { cor: 'cinza' } }), espera: { status: 200, texto: 'oi, estranho' }, oculto: true },
        ],
        relatorio:
          'Erro no seu código vira <b>500</b> pra quem está na porta, e o visitante não tem culpa nenhuma. Coluna que às vezes vem nula você já tratava no PySpark. Aqui é igual, só que o "nulo" pode ser a chave inteira faltando.',
      },
      {
        id: 'lambda-3',
        titulo: 'SELECT vira GET',
        tipo: 'python',
        sabe: 'No Athena: <code>SELECT * FROM gatos WHERE cor = \'preto\'</code>.',
        aqui: 'Na API: <code>GET /gatos?cor=preto</code>. O <code>WHERE</code> virou query string. O resultado volta como JSON no <code>body</code>, e <code>body</code> é sempre texto: passe a lista por <code>json.dumps</code> e avise o tipo no cabeçalho <code>content-type</code>.',
        missao: 'Devolva a lista de gatos em JSON. Se vier <code>?cor=</code>, filtre por cor. Sem filtro, devolva todos. A leitura do filtro já está pronta: faltam os três <code>TODO</code>.',
        cola: 'Filtrar lista: <code>[g for g in GATOS if g["cor"] == cor]</code>. Lista vira texto com <code>json.dumps(lista)</code>. O cabeçalho é um dict: <code>{"content-type": "application/json"}</code>.',
        inicial: py`import json

${GATOS}

def handler(event, context):
    params = event.get("queryStringParameters") or {}
    cor = params.get("cor")   # None quando o gato não mandou filtro

    gatos = GATOS
    if cor is not None:
        gatos = GATOS         # TODO 1: fique só com os gatos dessa cor

    return {
        "statusCode": 200,
        "headers": {},        # TODO 2: avise que o corpo é JSON
        "body": gatos,        # TODO 3: body tem que ser texto, não lista
    }
`,
        solucao: py`import json

${GATOS}

def handler(event, context):
    params = event.get("queryStringParameters") or {}
    cor = params.get("cor")

    gatos = GATOS
    if cor is not None:
        gatos = [g for g in GATOS if g["cor"] == cor]

    return {
        "statusCode": 200,
        "headers": {"content-type": "application/json"},
        "body": json.dumps(gatos),
    }
`,
        dicas: [
          'Os três estão na Cola, um pra cada TODO. Faça um, rode, veja o que mudou.',
          'TODO 1: <code>gatos = [g for g in GATOS if g["cor"] == cor]</code>. TODO 2: <code>{"content-type": "application/json"}</code>. TODO 3: <code>json.dumps(gatos)</code>.',
        ],
        visitantes: [
          { nome: 'Fuligem', pelo: 'preto', pedido: 'GET /gatos?cor=preto', event: ev('GET', '/gatos', { query: { cor: 'preto' } }), espera: { status: 200, json: [G[0], G[3]], tipoJson: true } },
          { nome: 'Ferrugem', pelo: 'laranja', pedido: 'GET /gatos', event: ev('GET', '/gatos'), espera: { status: 200, json: G, tipoJson: true } },
          { nome: 'Neblina', pelo: 'cinza', pedido: 'GET /gatos?cor=cinza', event: ev('GET', '/gatos', { query: { cor: 'cinza' } }), espera: { status: 200, json: [G[2]], tipoJson: true } },
          { nome: 'Roxo', pelo: 'branco', pedido: 'GET /gatos?cor=roxo', event: ev('GET', '/gatos', { query: { cor: 'roxo' } }), espera: { status: 200, json: [], tipoJson: true }, oculto: true },
        ],
        relatorio:
          'Filtro que não acha nada devolve <b>200 com lista vazia</b>, igual query que volta zero linhas. Não é erro. <b>404</b> é pra quando pedem uma coisa específica que não existe, e isso é a próxima fase.',
      },
      {
        id: 'lambda-4',
        titulo: 'Partição vira caminho',
        tipo: 'python',
        sabe: 'No S3 você chega num dado específico pelo caminho: <code>s3://beco/gatos/id=2/</code>. E valor de partição é sempre texto.',
        aqui: 'Na API é <code>GET /gatos/2</code>. O pedaço variável chega em <code>event["pathParameters"]["id"]</code>, e também é sempre texto. Query string filtra uma coleção. Caminho aponta pra <b>um</b> item.',
        missao: 'Devolva o gato do <code>id</code> pedido com <code>200</code>. Se não existir, devolva <code>404</code> com um JSON que tenha a chave <code>erro</code>.',
        cola: '<code>int("2")</code> vira o número <code>2</code>. A função <code>resposta(status, dados)</code> já monta o dict da resposta: <code>resposta(404, {"erro": "..."})</code>.',
        inicial: py`import json

${GATOS}

${RESPOSTA}

def handler(event, context):
    gato_id = event["pathParameters"]["id"]   # TODO 1: chega como texto ("2"), e o id do gato é número
    for gato in GATOS:
        if gato["id"] == gato_id:
            return resposta(200, gato)
    return resposta(200, None)                # TODO 2: não achou. Status 404 e um JSON com a chave "erro"
`,
        solucao: py`import json

${GATOS}

${RESPOSTA}

def handler(event, context):
    gato_id = int(event["pathParameters"]["id"])
    for gato in GATOS:
        if gato["id"] == gato_id:
            return resposta(200, gato)
    return resposta(404, {"erro": "gato não encontrado"})
`,
        dicas: ['Compare <code>"2" == 2</code> no Python. Dá <code>False</code>.', '<code>int(event["pathParameters"]["id"])</code>, e no fim <code>resposta(404, {"erro": "gato não encontrado"})</code>.'],
        visitantes: [
          { nome: 'Ferrugem', pelo: 'laranja', pedido: 'GET /gatos/2', event: ev('GET', '/gatos/2', { rota: 'GET /gatos/{id}', path: { id: '2' } }), espera: { status: 200, json: G[1] } },
          { nome: 'Breu', pelo: 'preto', pedido: 'GET /gatos/4', event: ev('GET', '/gatos/4', { rota: 'GET /gatos/{id}', path: { id: '4' } }), espera: { status: 200, json: G[3] } },
          { nome: 'Fantasma', pelo: 'branco', pedido: 'GET /gatos/99', event: ev('GET', '/gatos/99', { rota: 'GET /gatos/{id}', path: { id: '99' } }), espera: { status: 404, chave: 'erro' } },
        ],
        relatorio:
          'A função <code>resposta()</code> que apareceu pronta é só o que você montou na fase anterior, guardado num lugar. Sobre os status: <b>4xx</b> quer dizer "você pediu errado", <b>5xx</b> quer dizer "eu quebrei". Quem consome a API decide o que fazer olhando só pra esse número.',
      },
      {
        id: 'lambda-5',
        titulo: 'INSERT vira POST',
        tipo: 'python',
        sabe: 'Pra gravar linha nova numa tabela você faz <code>INSERT</code>, e os valores vêm junto no comando.',
        aqui: '<code>POST /gatos</code> traz o dado novo em <code>event["body"]</code>. Só que o <code>body</code> chega como <b>texto</b>, do mesmo jeito que o seu sai. <code>json.loads</code> transforma esse texto em dict. E quando você cria uma coisa nova, o status certo é <code>201</code>.',
        missao: 'O código já cria o gato com o próximo <code>id</code> livre. Falta transformar o corpo em dict e devolver <code>201</code>.',
        cola: '<code>json.loads(texto)</code>: texto vira dict. <code>json.dumps(dict)</code>: dict vira texto. O primeiro é pra ler o que chega, o segundo pra responder.',
        inicial: py`import json

${GATOS}

${RESPOSTA}

def handler(event, context):
    dados = event["body"]            # TODO 1: isso é texto. Passe por json.loads(...)
    novo = {
        "id": max(g["id"] for g in GATOS) + 1,
        "nome": dados["nome"],
        "cor": dados["cor"],
    }
    GATOS.append(novo)
    return resposta(200, novo)       # TODO 2: criou coisa nova, o status é 201
`,
        solucao: py`import json

${GATOS}

${RESPOSTA}

def handler(event, context):
    dados = json.loads(event["body"])
    novo = {
        "id": max(g["id"] for g in GATOS) + 1,
        "nome": dados["nome"],
        "cor": dados["cor"],
    }
    GATOS.append(novo)
    return resposta(201, novo)
`,
        dicas: ['Rode e leia o erro: ele diz que você usou um texto como se fosse dict.', '<code>dados = json.loads(event["body"])</code> e, no fim, <code>resposta(201, novo)</code>.'],
        visitantes: [
          { nome: 'Sombra', pelo: 'preto', pedido: 'POST /gatos {"nome":"Sombra","cor":"preto"}', event: ev('POST', '/gatos', { body: '{"nome": "Sombra", "cor": "preto"}' }), espera: { status: 201, json: { id: 5, nome: 'Sombra', cor: 'preto' } } },
          { nome: 'Graxa', pelo: 'cinza', pedido: 'POST /gatos {"nome":"Graxa","cor":"cinza"}', event: ev('POST', '/gatos', { body: '{"nome": "Graxa", "cor": "cinza"}' }), espera: { status: 201, json: { id: 6, nome: 'Graxa', cor: 'cinza' } } },
        ],
        relatorio:
          'A Graxa recebeu o id 6 porque a Sombra ainda estava na lista: a variável <code>GATOS</code> sobreviveu de uma chamada pra outra. Numa Lambda de verdade isso acontece enquanto o ambiente está "quente", e <b>some sem aviso</b> quando ele é trocado. Dado que precisa durar vai pro DynamoDB ou pro S3.',
      },
      {
        id: 'lambda-6',
        titulo: 'Dado ruim não entra',
        tipo: 'python',
        sabe: 'Antes de gravar na tabela você valida: coluna obrigatória preenchida, tipo certo. Linha ruim vai pra rejeitados, não pra tabela.',
        aqui: 'Na API a validação é na porta. Se o visitante mandou coisa errada, a resposta é <code>400</code> ("você pediu errado"). Se o seu código quebrar, vira <code>500</code> ("eu quebrei"), e isso é mentira quando a culpa é de quem mandou.',
        missao: 'O gato só é criado se o corpo for JSON e tiver <code>nome</code> e <code>cor</code>. Qualquer outro caso: <code>400</code>.',
        cola: '<code>try: ... except json.JSONDecodeError: ...</code> pega o erro de texto que não é JSON. <code>dados.get("nome")</code> devolve <code>None</code> se a chave faltar, e <code>if not dados.get("nome"):</code> pega tanto <code>None</code> quanto texto vazio.',
        inicial: py`import json

${GATOS}

${RESPOSTA}

def handler(event, context):
    try:
        dados = json.loads(event.get("body") or "")
    except json.JSONDecodeError:
        return resposta(500, {"erro": "o corpo não é JSON"})   # TODO 1: a culpa é de quem mandou. Qual status?

    # TODO 2: se faltar "nome" ou "cor", devolva 400 aqui, antes de criar

    novo = {
        "id": max(g["id"] for g in GATOS) + 1,
        "nome": dados["nome"],
        "cor": dados["cor"],
    }
    GATOS.append(novo)
    return resposta(201, novo)
`,
        solucao: py`import json

${GATOS}

${RESPOSTA}

def handler(event, context):
    try:
        dados = json.loads(event.get("body") or "")
    except json.JSONDecodeError:
        return resposta(400, {"erro": "o corpo não é JSON"})

    if not dados.get("nome") or not dados.get("cor"):
        return resposta(400, {"erro": "nome e cor são obrigatórios"})

    novo = {
        "id": max(g["id"] for g in GATOS) + 1,
        "nome": dados["nome"],
        "cor": dados["cor"],
    }
    GATOS.append(novo)
    return resposta(201, novo)
`,
        dicas: [
          'No TODO 1 é só trocar o número. No TODO 2 é um <code>if</code> com <code>return resposta(400, ...)</code> dentro.',
          '<code>if not dados.get("nome") or not dados.get("cor"):</code> e, na linha de baixo, <code>return resposta(400, {"erro": "nome e cor são obrigatórios"})</code>.',
        ],
        visitantes: [
          { nome: 'Sombra', pelo: 'preto', pedido: 'POST /gatos {"nome":"Sombra","cor":"preto"}', event: ev('POST', '/gatos', { body: '{"nome": "Sombra", "cor": "preto"}' }), espera: { status: 201, json: { id: 5, nome: 'Sombra', cor: 'preto' } } },
          { nome: 'Sem Nome', pelo: 'malhado', pedido: 'POST /gatos {"cor":"cinza"}', event: ev('POST', '/gatos', { body: '{"cor": "cinza"}' }), espera: { status: 400 } },
          { nome: 'Faísca', pelo: 'laranja', pedido: 'POST /gatos miau', event: ev('POST', '/gatos', { body: 'miau' }), espera: { status: 400 } },
          { nome: 'Mudo', pelo: 'branco', pedido: 'POST /gatos (sem corpo)', event: ev('POST', '/gatos'), espera: { status: 400 }, oculto: true },
        ],
        relatorio:
          'O número do status é o contrato com quem consome a API. Com <b>4xx</b> o outro lado sabe que precisa corrigir o pedido. Com <b>5xx</b> ele tenta de novo mais tarde, porque acha que o problema é seu. Responder 500 pra dado ruim faz o cliente insistir num pedido que nunca vai dar certo.',
      },
      {
        id: 'lambda-7',
        titulo: 'Plantão sozinha',
        chefe: true,
        tipo: 'python',
        sabe: 'Um job seu já tratou vários tipos de arquivo olhando o prefixo do caminho pra decidir o que fazer.',
        aqui: 'Uma Lambda só pode atender várias rotas. O API Gateway avisa qual rota casou em <code>event["routeKey"]</code>, por exemplo <code>"GET /gatos/{id}"</code>. Rota que ninguém configurou chega como <code>"$default"</code>.',
        missao: 'As funções das fases anteriores já estão aqui. Falta ligar as três rotas, responder <code>404</code> pra rota desconhecida, e devolver o filtro de cor ao <code>listar</code>.',
        cola: 'Função pode ser valor de dict: <code>ROTAS = {"GET /gatos": listar}</code>. <code>ROTAS.get(chave)</code> devolve a função, ou <code>None</code> se a rota não existe. Pra chamar: <code>funcao(event)</code>.',
        inicial: py`import json

${GATOS}

${RESPOSTA}

def listar(event):
    params = event.get("queryStringParameters") or {}
    cor = params.get("cor")
    gatos = GATOS                    # TODO 3: se veio cor, fique só com os gatos dessa cor
    return resposta(200, gatos)

def buscar(event):
    gato_id = int(event["pathParameters"]["id"])
    for gato in GATOS:
        if gato["id"] == gato_id:
            return resposta(200, gato)
    return resposta(404, {"erro": "gato não encontrado"})

def criar(event):
    try:
        dados = json.loads(event.get("body") or "")
    except json.JSONDecodeError:
        return resposta(400, {"erro": "o corpo não é JSON"})
    if not dados.get("nome") or not dados.get("cor"):
        return resposta(400, {"erro": "nome e cor são obrigatórios"})
    novo = {"id": max(g["id"] for g in GATOS) + 1, "nome": dados["nome"], "cor": dados["cor"]}
    GATOS.append(novo)
    return resposta(201, novo)

ROTAS = {
    "GET /gatos": listar,
    # TODO 1: faltam "GET /gatos/{id}" e "POST /gatos"
}

def handler(event, context):
    funcao = ROTAS[event["routeKey"]]   # TODO 2: rota desconhecida quebra aqui. Use .get() e devolva 404
    return funcao(event)
`,
        solucao: py`import json

${GATOS}

${RESPOSTA}

def listar(event):
    params = event.get("queryStringParameters") or {}
    cor = params.get("cor")
    gatos = GATOS
    if cor is not None:
        gatos = [g for g in GATOS if g["cor"] == cor]
    return resposta(200, gatos)

def buscar(event):
    gato_id = int(event["pathParameters"]["id"])
    for gato in GATOS:
        if gato["id"] == gato_id:
            return resposta(200, gato)
    return resposta(404, {"erro": "gato não encontrado"})

def criar(event):
    try:
        dados = json.loads(event.get("body") or "")
    except json.JSONDecodeError:
        return resposta(400, {"erro": "o corpo não é JSON"})
    if not dados.get("nome") or not dados.get("cor"):
        return resposta(400, {"erro": "nome e cor são obrigatórios"})
    novo = {"id": max(g["id"] for g in GATOS) + 1, "nome": dados["nome"], "cor": dados["cor"]}
    GATOS.append(novo)
    return resposta(201, novo)

ROTAS = {
    "GET /gatos": listar,
    "GET /gatos/{id}": buscar,
    "POST /gatos": criar,
}

def handler(event, context):
    funcao = ROTAS.get(event["routeKey"])
    if funcao is None:
        return resposta(404, {"erro": "rota não existe"})
    return funcao(event)
`,
        dicas: [
          'TODO 1: duas linhas novas no dict, no mesmo formato da que já está lá. TODO 3 é o mesmo filtro da fase 3.',
          'TODO 2: <code>funcao = ROTAS.get(event["routeKey"])</code>, depois <code>if funcao is None: return resposta(404, {"erro": "rota não existe"})</code>.',
        ],
        visitantes: [
          { nome: 'Ferrugem', pelo: 'laranja', pedido: 'GET /gatos', event: ev('GET', '/gatos'), espera: { status: 200, json: G } },
          { nome: 'Fuligem', pelo: 'preto', pedido: 'GET /gatos?cor=preto', event: ev('GET', '/gatos', { query: { cor: 'preto' } }), espera: { status: 200, json: [G[0], G[3]] } },
          { nome: 'Neblina', pelo: 'cinza', pedido: 'GET /gatos/3', event: ev('GET', '/gatos/3', { rota: 'GET /gatos/{id}', path: { id: '3' } }), espera: { status: 200, json: G[2] } },
          { nome: 'Fantasma', pelo: 'branco', pedido: 'GET /gatos/99', event: ev('GET', '/gatos/99', { rota: 'GET /gatos/{id}', path: { id: '99' } }), espera: { status: 404, chave: 'erro' } },
          { nome: 'Sombra', pelo: 'preto', pedido: 'POST /gatos {"nome":"Sombra","cor":"preto"}', event: ev('POST', '/gatos', { body: '{"nome": "Sombra", "cor": "preto"}' }), espera: { status: 201, json: { id: 5, nome: 'Sombra', cor: 'preto' } } },
          { nome: 'Perdido', pelo: 'cinza', pedido: 'GET /peixes', event: ev('GET', '/peixes', { rota: '$default' }), espera: { status: 404 } },
        ],
        relatorio:
          'Você acabou de montar uma API inteira numa Lambda só. Funciona, e muita gente faz assim. O outro jeito é uma Lambda por rota e deixar a escolha com quem fica na porta. É isso que o Porteiro faz, no próximo turno.',
      },
    ],
  });
})();
