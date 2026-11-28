/* Executores: rodam o código da jogadora e comparam com o que cada visitante espera.
   - python  : handler de Lambda de verdade, rodando no navegador com Pyodide
   - gateway : tabela de rotas em JSON, passada por um simulador de API Gateway (HTTP API)
   - ts      : TypeScript transpilado no navegador, com RxJS de verdade */
(function () {
  const B = (window.BECO = window.BECO || {});

  const CDN = {
    pyodide: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
    ts: 'https://cdn.jsdelivr.net/npm/typescript@5.4.5/lib/typescript.js',
    rxjs: 'https://cdn.jsdelivr.net/npm/rxjs@7.8.1/dist/bundles/rxjs.umd.min.js',
  };

  const carregados = {};
  function carregarScript(url) {
    if (!carregados[url]) {
      carregados[url] = new Promise((ok, falha) => {
        const s = document.createElement('script');
        s.src = url;
        s.onload = ok;
        s.onerror = () => {
          delete carregados[url];
          falha(new Error('Não consegui baixar ' + url + '. Confere a internet e tenta de novo.'));
        };
        document.head.appendChild(s);
      });
    }
    return carregados[url];
  }

  // ---------- comparação ----------
  function canonico(v) {
    if (Array.isArray(v)) return v.map(canonico);
    if (v && typeof v === 'object') {
      const o = {};
      Object.keys(v).sort().forEach((k) => (o[k] = canonico(v[k])));
      return o;
    }
    return v;
  }
  function igual(a, b) {
    return JSON.stringify(canonico(a)) === JSON.stringify(canonico(b));
  }
  function mostra(v) {
    if (v === undefined) return 'nada (undefined)';
    if (typeof v === 'string') return JSON.stringify(v);
    try {
      return JSON.stringify(v);
    } catch (e) {
      return String(v);
    }
  }

  // ---------- erros explicados ----------
  // Cada regra recebe o resultado do regex e um contexto { codigo, linha, texto (a linha do código) }
  // e devolve a explicação em português, já dizendo como consertar.
  function distancia(a, b) {
    const d = [];
    for (let i = 0; i <= a.length; i++) d[i] = [i];
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  function nomeSolto(nome, c) {
    // tem outro nome quase igual no código? então é erro de digitação
    const semTexto = c.codigo.replace(/(["'`])(?:\\.|(?!\1).)*\1/g, '""').replace(/(#|\/\/).*$/gm, '');
    const outros = Array.from(new Set(semTexto.match(/[A-Za-z_$][\w$]*/g) || [])).filter((x) => x !== nome && x.length > 2);
    const limite = nome.length > 4 ? 2 : 1;
    const perto = outros.map((x) => [x.toLowerCase() === nome.toLowerCase() ? 0 : distancia(x, nome), x]).filter((p) => p[0] <= limite).sort((p, q) => p[0] - q[0]);
    const parecido = perto.length ? perto[0][1] : null;
    if (parecido) c.troca = [nome, parecido];
    if (parecido) return 'o nome ' + nome + ' não existe. Tem um quase igual no código: ' + parecido + '. Foi erro de digitação? (maiúscula e minúscula contam)';
    // o nome foi criado em algum lugar do código? (x = ..., def x, import x, parâmetro, const x)
    const criado = new RegExp('(^|[^\\w.])(def|class|import|as|for|const|let|var|function)\\s+' + nome + '\\b|\\b' + nome + '\\s*=[^=]|\\(([^)]*,\\s*)?' + nome + '\\s*[,):]', 'm');
    if (criado.test(c.codigo)) return 'o nome ' + nome + ' ainda não existe nesse ponto do código. Confira se ele foi criado antes de ser usado.';
    c.troca = [nome, '"' + nome + '"'];
    return 'sem aspas, ' + nome + ' é lido como nome de variável, e essa variável não existe. Se era um texto, faltam só as aspas: "' + nome + '".';
  }
  const PAR = { '{': 'chave {', '(': 'parêntese (', '[': 'colchete [', '}': 'chave }', ')': 'parêntese )', ']': 'colchete ]' };
  const EXPLICACOES = [
    [/^KeyError: (.+?)( \(linha|$)/, (m) => 'o dict não tem a chave ' + m[1] + '. Quando a chave pode faltar, use .get(' + m[1] + ') no lugar dos colchetes.'],
    [/string indices must be integers/, () => 'você usou um texto como se fosse dict. Faltou passar por json.loads(...)?'],
    [/'NoneType' object is not subscriptable/, () => 'você usou colchetes em cima de None. Alguma coisa antes devolveu "nada".'],
    [/'NoneType' object has no attribute/, () => 'você chamou um método em cima de None. Alguma coisa antes devolveu "nada".'],
    [/the JSON object must be str/, () => 'json.loads recebeu algo que não é texto (talvez None, quando o visitante veio sem corpo).'],
    [/^NameError: name '(.+?)'/, (m, c) => nomeSolto(m[1], c)],
    [/expected an indented block|unexpected indent|unindent does not match/, () => 'o recuo está errado. As linhas de dentro de def, if e for começam com 4 espaços a mais que a linha de cima, todas alinhadas.'],
    [/^(IndentationError|TabError)/, () => 'o recuo (os espaços no começo da linha) está desalinhado com as linhas vizinhas. Dentro de def, if e for, cada linha começa com 4 espaços a mais.'],
    [/forgot a comma/, () => 'faltou uma vírgula separando dois itens. Ou tem um texto sem aspas no meio.'],
    [/unterminated (triple-quoted )?string/i, () => 'você abriu aspas e não fechou. Todo texto começa e termina com aspas.'],
    [/'([{(\[])' was never closed/, (m) => 'você abriu ' + PAR[m[1]] + ' e não fechou.'],
    [/unmatched '([})\]])'/, (m) => 'tem ' + PAR[m[1]] + ' sobrando, sem o par que abre.'],
    [/does not match opening parenthesis/, () => 'você abriu com um tipo de parêntese e fechou com outro. Confira os pares { }, ( ) e [ ].'],
    [/expected ':'/, () => 'faltou os dois-pontos (:) no fim da linha. Toda linha de def, if, else e for termina com ele.'],
    [/':' expected after dictionary key/, () => 'dentro do dict cada item é "chave": valor. Faltou os dois-pontos depois da chave.'],
    [/Maybe you meant '=='/, () => 'pra comparar é == (dois sinais). Um = sozinho serve pra guardar valor.'],
    [/^SyntaxError/, () => 'o Python não conseguiu ler essa linha. Confira parênteses, aspas, vírgulas e os dois-pontos no fim de def/if/for.'],
    [/^JSONDecodeError|Expecting value/, () => 'o texto não é JSON válido, e ninguém tratou isso com try/except.'],
    [/invalid literal for int\(\)/, () => 'tentou transformar em número um texto que não é número.'],
    [/is not JSON serializable/, () => 'tem alguma coisa na resposta que não vira JSON (um set, um objeto, uma função).'],
    [/can only concatenate str/, () => 'você tentou juntar texto com número usando +. Transforme o número com str(...) ou use f"...{valor}".'],
    [/unsupported operand type/, () => 'você fez uma conta entre dois tipos que não combinam (texto com número, ou com None).'],
    [/object has no attribute '(.+?)'/, (m) => 'esse valor não tem .' + m[1] + '. Confira o nome do método e o tipo do valor (dict, list, texto).'],
    [/is not a function/, () => 'você chamou como função uma coisa que não é função. Confira o nome e se faltou importar.'],
    [/Cannot read properties of (undefined|null)/, () => 'você tentou ler um campo de algo que não existe (undefined). Alguma variável antes veio vazia.'],
    [/^(?:ReferenceError: )?([\w$]+) is not defined/, (m, c) => nomeSolto(m[1], c)],
    [/'([,;:)}\]])' expected/, (m) => 'faltou um ' + m[1] + ' nessa linha (ou na linha de cima).'],
    [/Expression expected|Declaration or statement expected/, () => 'tem um símbolo sobrando ou faltando nessa linha. Confira parênteses, chaves e vírgulas.'],
    [/Expected ',' or '[}\]]' after/, () => 'faltou uma vírgula entre dois itens. Olhe o fim da linha de cima: todo item, menos o último, termina com vírgula.'],
    [/Expected property name|Expected double-quoted property name/, () => 'aqui devia começar uma chave entre aspas duplas, tipo "rotas". Ou a chave está sem aspas, ou sobrou uma vírgula depois do último item.'],
    [/Unexpected (token|string|number|end)|Expected .* in JSON|JSON at position/, () => 'o JSON está mal formado perto desse ponto. Confira: aspas duplas em toda chave e todo texto, vírgula entre os itens, e nenhuma vírgula sobrando antes de } ou ].'],
  ];
  function diagnosticar(erro, codigo, linhaDada) {
    const ml = /\(linha (\d+)\)/.exec(erro);
    let linha = linhaDada || (ml ? +ml[1] : null);
    const mn = /^(?:ReferenceError: )?([\w$]+) is not defined/.exec(erro);
    if (!linha && mn && codigo) {
      const i = codigo.split('\n').findIndex((l) => new RegExp('\\b' + mn[1].replace(/\$/g, '\\$') + '\\b').test(l.replace(/\/\/.*$/, '')));
      if (i >= 0) linha = i + 1;
    }
    const c = { codigo: codigo || '', linha, texto: linha && codigo ? codigo.split('\n')[linha - 1] || '' : '' };
    let pt = null;
    for (let i = 0; i < EXPLICACOES.length && !pt; i++) {
      const m = EXPLICACOES[i][0].exec(erro);
      if (m) pt = EXPLICACOES[i][1](m, c);
    }
    const info = { bruto: erro, linha, pt };
    // quando dá pra saber o conserto, monto a linha corrigida pra mostrar o antes e o depois
    if (c.troca && c.texto) {
      const depois = trocarForaDeTexto(c.texto, c.troca[0], c.troca[1]);
      if (depois !== c.texto) {
        info.antes = c.texto.trim();
        info.depois = depois.trim();
      }
    }
    return info;
  }
  // troca a primeira ocorrência do nome que não esteja dentro de aspas nem de comentário
  function trocarForaDeTexto(linha, nome, novo) {
    let aspa = null;
    for (let i = 0; i < linha.length; i++) {
      const ch = linha[i];
      if (aspa) {
        if (ch === '\\') i++;
        else if (ch === aspa) aspa = null;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') {
        aspa = ch;
        continue;
      }
      if (ch === '#' || (ch === '/' && linha[i + 1] === '/')) break;
      if (linha.startsWith(nome, i) && !/[\w$]/.test(linha[i - 1] || '') && !/[\w$]/.test(linha[i + nome.length] || '')) {
        return linha.slice(0, i) + novo + linha.slice(i + nome.length);
      }
    }
    return linha;
  }
  function textoErro(info) {
    return info.pt ? info.bruto + '\n  Em português: ' + info.pt : info.bruto;
  }

  // ---------- Python (Lambda) ----------
  let pyPronto = null;
  const PY_APOIO = `
import json, sys, io, traceback, ast

def __beco_erro():
    tipo, exc, tb = sys.exc_info()
    if isinstance(exc, SyntaxError):
        return f"{type(exc).__name__}: {exc.msg} (linha {exc.lineno})"
    linha = None
    for quadro in traceback.extract_tb(tb):
        if quadro.filename == "lambda_function.py":
            linha = quadro.lineno
    onde = f" (linha {linha})" if linha else ""
    return f"{tipo.__name__}: {exc}{onde}"

__beco_ns = None
__beco_pedidos = 0
__beco_mapa = {}  # linha -> (primeira, última) linha do comando a que ela pertence

class LambdaContext:
    """Imitação do context que a AWS entrega: dados da execução, não do pedido."""
    def __init__(self, n):
        self.function_name = "beco-404"
        self.function_version = "$LATEST"
        self.memory_limit_in_mb = 128
        self.aws_request_id = f"3f1c9a2e-0000-4000-8000-{n:012d}"
        self.invoked_function_arn = "arn:aws:lambda:sa-east-1:123456789012:function:beco-404"
        self.log_group_name = "/aws/lambda/beco-404"
    def get_remaining_time_in_millis(self):
        return 2990
    def __repr__(self):
        return "<LambdaContext beco-404>"

def __beco_curto(v, limite=90):
    try:
        t = repr(v)
    except BaseException:
        t = "<" + type(v).__name__ + ">"
    return t if len(t) <= limite else t[:limite - 1] + "…"

def __beco_rastrear(passos, esconder=()):
    """Devolve a função de rastreio: grava cada linha do arquivo dela, como um depurador."""
    estado = {"quebrando": False}
    def locais(quadro):
        if quadro.f_code.co_name == "<module>":
            return []
        fora = []
        for nome, valor in quadro.f_locals.items():
            if nome.startswith("__") or any(valor is e for e in esconder):
                continue
            fora.append([nome, __beco_curto(valor)])
        return fora
    def rastro(quadro, tipo, arg):
        if quadro.f_code.co_filename != "lambda_function.py":
            return None
        # expressões internas (x for x in ..., lambda) não viram passo: só confundem
        if quadro.f_code.co_name.startswith("<") and quadro.f_code.co_name != "<module>":
            return None
        if len(passos) >= 400:
            return rastro
        f = quadro.f_code.co_name
        n, ate = __beco_mapa.get(quadro.f_lineno, (quadro.f_lineno, quadro.f_lineno))
        if tipo == "call":
            if f != "<module>":
                passos.append({"t": "c", "n": quadro.f_lineno, "ate": quadro.f_lineno, "f": f, "v": locais(quadro)})
        elif tipo == "line":
            estado["quebrando"] = False
            p = {"t": "l", "n": n, "ate": ate, "f": f, "v": locais(quadro)}
            if passos and passos[-1]["t"] == "l" and passos[-1]["n"] == n and passos[-1]["f"] == f:
                passos[-1] = p
            else:
                passos.append(p)
        elif tipo == "exception":
            if not estado["quebrando"]:
                estado["quebrando"] = True
                passos.append({"t": "x", "n": n, "ate": ate, "f": f, "v": locais(quadro), "e": arg[0].__name__})
        elif tipo == "return":
            if not estado["quebrando"] and f != "<module>":
                passos.append({"t": "r", "n": n, "ate": ate, "f": f, "v": locais(quadro), "r": __beco_curto(arg, 160)})
        return rastro
    return rastro

def __beco_carregar(codigo):
    global __beco_ns, __beco_pedidos
    __beco_ns = None
    __beco_pedidos = 0
    ns = {"__name__": "lambda_function"}
    passos = []
    antigo = sys.stdout
    sys.stdout = io.StringIO()
    try:
        programa = compile(codigo, "lambda_function.py", "exec")
        # um comando que ocupa várias linhas (um dict aberto, por exemplo) conta como um passo só
        __beco_mapa.clear()
        for no in ast.walk(ast.parse(codigo)):
            if isinstance(no, ast.stmt) and not hasattr(no, "body"):
                for k in range(no.lineno, no.end_lineno + 1):
                    __beco_mapa[k] = (no.lineno, no.end_lineno)
        sys.settrace(__beco_rastrear(passos))
        try:
            exec(programa, ns)
        finally:
            sys.settrace(None)
    except BaseException:
        sys.stdout = antigo
        return json.dumps({"erro": __beco_erro()})
    sys.stdout = antigo
    if not callable(ns.get("handler")):
        return json.dumps({"erro": "Não achei a função handler(event, context) no seu código."})
    __beco_ns = ns
    return json.dumps({"erro": "", "rastro": passos})

def __beco_invocar(event_json):
    global __beco_pedidos
    ns = __beco_ns
    event = json.loads(event_json)
    __beco_pedidos += 1
    context = LambdaContext(__beco_pedidos)
    ctx = {
        "function_name": context.function_name,
        "memory_limit_in_mb": context.memory_limit_in_mb,
        "aws_request_id": context.aws_request_id,
        "get_remaining_time_in_millis()": context.get_remaining_time_in_millis(),
    }
    passos = []
    buf = io.StringIO()
    antigo = sys.stdout
    sys.stdout = buf
    try:
        sys.settrace(__beco_rastrear(passos, (event, context)))
        try:
            retorno = ns["handler"](event, context)
        finally:
            sys.settrace(None)
        sys.stdout = antigo
        try:
            return json.dumps({"ok": True, "retorno": retorno, "saida": buf.getvalue(), "rastro": passos, "context": ctx})
        except TypeError as e:
            return json.dumps({"ok": False, "saida": buf.getvalue(), "rastro": passos, "context": ctx,
                "erro": f"O retorno do handler não vira JSON ({e}). Lambda só devolve dict, lista, texto e número."})
    except BaseException:
        sys.stdout = antigo
        return json.dumps({"ok": False, "erro": __beco_erro(), "saida": buf.getvalue(), "rastro": passos, "context": ctx})
`;

  function carregarPython() {
    if (!pyPronto) {
      pyPronto = (async () => {
        await carregarScript(CDN.pyodide + 'pyodide.js');
        const py = await window.loadPyodide({ indexURL: CDN.pyodide });
        py.runPython(PY_APOIO);
        return py;
      })().catch((e) => {
        pyPronto = null;
        throw e;
      });
    }
    return pyPronto;
  }

  // Traduz o retorno do handler do jeito que o API Gateway (payload 2.0) faria.
  function interpretarResposta(retorno) {
    if (retorno && typeof retorno === 'object' && !Array.isArray(retorno) && 'statusCode' in retorno) {
      const r = { status: retorno.statusCode, body: retorno.body, headers: retorno.headers || {} };
      if (typeof r.status !== 'number') r.problema = 'statusCode tem que ser número (ex.: 200), veio ' + mostra(r.status) + '.';
      else if (r.body !== undefined && r.body !== null && typeof r.body !== 'string')
        r.problema = 'body tem que ser texto. Você devolveu um ' + (Array.isArray(r.body) ? 'list' : 'dict') + ': passe por json.dumps(...).';
      return r;
    }
    // sem statusCode: o gateway assume 200 e manda o retorno inteiro como JSON
    return { status: 200, body: JSON.stringify(retorno === undefined ? null : retorno), headers: { 'content-type': 'application/json' }, inferido: true };
  }

  function conferirHttp(resp, espera) {
    if (resp.problema) return resp.problema;
    if (resp.status !== espera.status) {
      let extra = '';
      if (resp.inferido) extra = ' Seu retorno não tem statusCode, então o gateway assumiu 200 e mandou o retorno inteiro como corpo.';
      return 'Esperava status ' + espera.status + ', veio ' + resp.status + '.' + extra;
    }
    if (espera.texto !== undefined && resp.body !== espera.texto) {
      return 'Esperava o corpo ' + mostra(espera.texto) + ', veio ' + mostra(resp.body) + '.';
    }
    if (espera.json !== undefined || espera.chave) {
      let dados;
      try {
        dados = JSON.parse(resp.body);
      } catch (e) {
        return 'O corpo deveria ser JSON, mas veio ' + mostra(resp.body) + '.';
      }
      if (espera.json !== undefined && !igual(dados, espera.json)) {
        return 'Corpo diferente.\n  esperava: ' + mostra(espera.json) + '\n  veio:     ' + mostra(dados);
      }
      if (espera.chave && !(dados && typeof dados === 'object' && espera.chave in dados)) {
        return 'O corpo deveria ser um objeto JSON com a chave "' + espera.chave + '". Veio ' + mostra(dados) + '.';
      }
    }
    if (espera.tipoJson) {
      const ct = Object.keys(resp.headers).find((k) => k.toLowerCase() === 'content-type');
      if (!ct || String(resp.headers[ct]).toLowerCase().indexOf('application/json') < 0) {
        return 'Faltou avisar que o corpo é JSON: headers = {"content-type": "application/json"}.';
      }
    }
    return null;
  }

  async function rodarPython(codigo, nivel) {
    const py = await carregarPython();
    const carregar = py.globals.get('__beco_carregar');
    const invocar = py.globals.get('__beco_invocar');
    const carga = JSON.parse(carregar(codigo));
    if (carga.erro) {
      const info = diagnosticar(carga.erro, codigo);
      return { erroGeral: textoErro(info), erroInfo: info, resultados: [] };
    }

    const resultados = nivel.visitantes.map((v) => {
      const bruto = JSON.parse(invocar(JSON.stringify(v.event)));
      // o que entrou, por onde o código passou e o que saiu: é isso que o depurador da tela mostra
      const exec = { event: v.event, context: bruto.context, rastro: bruto.rastro || [] };
      if (!bruto.ok) {
        const info = diagnosticar(bruto.erro, codigo);
        return { ok: false, rotulo: '500', saida: bruto.saida, erro: info, exec, detalhe: 'Seu código quebrou, e pra quem está na porta isso é um 500.\n  ' + textoErro(info) };
      }
      const resp = interpretarResposta(bruto.retorno);
      const falha = conferirHttp(resp, v.espera);
      exec.retorno = bruto.retorno;
      exec.temRetorno = true;
      return { ok: !falha, rotulo: String(resp.status), saida: bruto.saida, detalhe: falha, resposta: resp, exec };
    });
    return { resultados, rastroCarga: carga.rastro || [] };
  }

  // ---------- API Gateway (simulador de HTTP API) ----------
  function casarRota(rotas, metodo, caminho) {
    const segs = caminho.split('/').filter(Boolean);
    let melhor = null;
    Object.keys(rotas).forEach((chave) => {
      if (chave === '$default') return;
      const partes = chave.trim().split(/\s+/);
      if (partes.length !== 2) return;
      const met = partes[0];
      const ps = partes[1].split('/').filter(Boolean);
      if (met !== 'ANY' && met !== metodo) return;
      if (ps.length !== segs.length) return;
      let fixos = 0;
      for (let i = 0; i < ps.length; i++) {
        if (/^\{[^}]+\}$/.test(ps[i])) continue;
        if (ps[i] !== segs[i]) return;
        fixos++;
      }
      const pontos = fixos * 2 + (met === 'ANY' ? 0 : 1);
      if (!melhor || pontos > melhor.pontos) melhor = { chave, pontos };
    });
    if (melhor) return melhor.chave;
    return Object.prototype.hasOwnProperty.call(rotas, '$default') ? '$default' : null;
  }

  function lista(v) {
    return Array.isArray(v) ? v.map((x) => String(x).toLowerCase()) : [];
  }

  function simularGateway(cfg, req, lambdas) {
    // 1) o navegador: só existe pra quem vem de uma página (tem origem)
    if (req.origem) {
      const cors = cfg.cors && typeof cfg.cors === 'object' ? cfg.cors : null;
      const origens = cors && Array.isArray(cors.allowOrigins) ? cors.allowOrigins : [];
      if (!origens.includes('*') && !origens.includes(req.origem)) {
        return { cors: 'bloqueado', motivo: cors ? 'a origem ' + req.origem + ' não está em cors.allowOrigins' : 'a API não tem "cors" configurado, então o navegador barra qualquer página' };
      }
      const cabecalhos = [];
      if (req.json) cabecalhos.push('content-type');
      if (req.token) cabecalhos.push('authorization');
      const simples = ['GET', 'HEAD', 'POST'].includes(req.metodo) && cabecalhos.length === 0;
      if (!simples) {
        const metodos = lista(cors.allowMethods);
        if (!metodos.includes('*') && !metodos.includes(req.metodo.toLowerCase())) {
          return { cors: 'bloqueado', motivo: 'o navegador perguntou antes (OPTIONS) e ' + req.metodo + ' não está em cors.allowMethods' };
        }
        const permitidos = lista(cors.allowHeaders);
        const falta = cabecalhos.find((h) => !permitidos.includes('*') && !permitidos.includes(h));
        if (falta) return { cors: 'bloqueado', motivo: 'o navegador perguntou antes (OPTIONS) e o cabeçalho ' + falta + ' não está em cors.allowHeaders' };
      }
    }
    // 2) a rota
    const chave = casarRota(cfg.rotas, req.metodo, req.caminho);
    if (!chave) return { status: 404, motivo: 'nenhuma rota casa com ' + req.metodo + ' ' + req.caminho };
    let alvo = cfg.rotas[chave];
    if (typeof alvo === 'string') alvo = { lambda: alvo };
    if (!alvo || typeof alvo.lambda !== 'string') return { status: 500, motivo: 'a rota "' + chave + '" precisa apontar pra uma Lambda (texto) ou {"lambda": "...", "auth": "jwt"}' };
    if (lambdas.indexOf(alvo.lambda) < 0) return { status: 500, motivo: 'a rota "' + chave + '" aponta pra Lambda "' + alvo.lambda + '", que não existe' };
    // 3) o crachá
    if (alvo.auth && !req.token) return { status: 401, rota: chave, motivo: 'a rota "' + chave + '" exige crachá e o visitante veio sem' };
    return { status: 200, destino: alvo.lambda, rota: chave };
  }

  async function rodarGateway(codigo, nivel) {
    let cfg;
    try {
      cfg = JSON.parse(codigo);
    } catch (e) {
      // o navegador diz a posição do erro; viro isso em número de linha
      const mp = /position (\d+)/.exec(e.message);
      const ml = /line (\d+)/.exec(e.message);
      const linha = ml ? +ml[1] : mp ? codigo.slice(0, +mp[1]).split('\n').length : null;
      const info = diagnosticar(e.message, codigo, linha);
      if (!info.pt) info.pt = 'o JSON está mal formado. Confira: aspas duplas em toda chave e todo texto, vírgula entre os itens, e nenhuma vírgula sobrando antes de } ou ].';
      return { erroGeral: 'Isso não é JSON válido' + (linha ? ' (linha ' + linha + ')' : '') + ': ' + textoErro(info), erroInfo: info, resultados: [] };
    }
    if (!cfg || typeof cfg !== 'object' || !cfg.rotas || typeof cfg.rotas !== 'object' || Array.isArray(cfg.rotas)) {
      return { erroGeral: 'A configuração precisa de um objeto "rotas".', resultados: [] };
    }
    const ruins = Object.keys(cfg.rotas).filter((k) => k !== '$default' && !/^[A-Z]+\s+\/\S*$/.test(k.trim()));
    if (ruins.length) {
      return { erroGeral: 'Chave de rota mal formada: "' + ruins[0] + '". O formato é MÉTODO + espaço + caminho, tipo "GET /gatos".', resultados: [] };
    }
    const resultados = nivel.visitantes.map((v) => {
      const r = simularGateway(cfg, v.req, nivel.lambdas);
      const e = v.espera;
      let falha = null;
      if (e.cors === 'bloqueado') {
        if (r.cors !== 'bloqueado') falha = 'Esse aqui o navegador devia ter barrado, e passou' + (r.destino ? ' (chegou em ' + r.destino + ')' : '') + '.';
      } else if (r.cors === 'bloqueado') {
        falha = 'Barrado pelo navegador (CORS): ' + r.motivo + '.';
      } else if (e.destino) {
        if (r.destino !== e.destino) falha = 'Devia chegar na Lambda ' + e.destino + ', mas ' + (r.destino ? 'chegou em ' + r.destino : 'levou ' + r.status + ' (' + r.motivo + ')') + '.';
      } else if (e.status) {
        if (r.destino) falha = 'Devia levar ' + e.status + ', mas passou e chegou em ' + r.destino + '.';
        else if (r.status !== e.status) falha = 'Devia levar ' + e.status + ', levou ' + r.status + ' (' + r.motivo + ').';
      }
      const rotulo = r.cors === 'bloqueado' ? 'CORS' : r.destino ? '→ ' + r.destino : String(r.status);
      return { ok: !falha, rotulo, detalhe: falha };
    });
    return { resultados };
  }

  // ---------- TypeScript + RxJS ----------
  async function rodarTs(codigo, nivel) {
    await Promise.all([carregarScript(CDN.ts), carregarScript(CDN.rxjs)]);
    const ts = window.ts;
    const rx = window.rxjs;
    const saida = ts.transpileModule(codigo, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
      reportDiagnostics: true,
    });
    if (saida.diagnostics && saida.diagnostics.length) {
      const d = saida.diagnostics[0];
      const linha = d.file && d.start !== undefined ? d.file.getLineAndCharacterOfPosition(d.start).line + 1 : '?';
      const info = diagnosticar(ts.flattenDiagnosticMessageText(d.messageText, ' '), codigo, linha === '?' ? null : linha);
      return { erroGeral: 'Erro de sintaxe na linha ' + linha + ': ' + textoErro(info), erroInfo: info, resultados: [] };
    }
    const logs = [];
    const consoleFalso = { log: (...a) => logs.push(a.map((x) => (typeof x === 'string' ? x : mostra(x))).join(' ')) };
    consoleFalso.info = consoleFalso.warn = consoleFalso.error = consoleFalso.log;
    const modulo = {};
    const requer = (nome) => {
      if (nome === 'rxjs') return rx;
      if (nome === 'rxjs/operators') return rx.operators;
      throw new Error('Aqui só dá pra importar de "rxjs".');
    };
    try {
      new Function('exports', 'require', 'console', saida.outputText)(modulo, requer, consoleFalso);
    } catch (e) {
      const info = diagnosticar(e.message, codigo);
      return { erroGeral: 'Seu código quebrou ao carregar: ' + textoErro(info), erroInfo: info, resultados: [] };
    }
    const resultados = nivel.visitantes.map((v) => {
      const antes = logs.length;
      let valor;
      try {
        valor = v.rodar(modulo, rx);
      } catch (e) {
        const info = diagnosticar(e.message, codigo);
        return { ok: false, rotulo: 'erro', saida: logs.slice(antes).join('\n'), erro: info, detalhe: textoErro(info) };
      }
      const ok = igual(valor, v.espera);
      return {
        ok,
        rotulo: ok ? 'ok' : 'diferente',
        saida: logs.slice(antes).join('\n'),
        detalhe: ok ? null : 'Resultado diferente.\n  esperava: ' + mostra(v.espera) + '\n  veio:     ' + mostra(valor),
      };
    });
    return { resultados };
  }

  B.rodar = function (codigo, nivel) {
    if (nivel.tipo === 'python') return rodarPython(codigo, nivel);
    if (nivel.tipo === 'gateway') return rodarGateway(codigo, nivel);
    return rodarTs(codigo, nivel);
  };
  B.explicarErro = diagnosticar;
  B.aquecer = function (tipo) {
    if (tipo === 'python') return carregarPython();
    if (tipo === 'ts') return Promise.all([carregarScript(CDN.ts), carregarScript(CDN.rxjs)]);
    return Promise.resolve();
  };
})();
