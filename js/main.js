/* Telas do jogo: mapa dos turnos, fase com editor, estrelas e progresso (localStorage). */
(function () {
  const B = window.BECO;
  const CHAVE = 'beco404:v1';
  const LIVRE = /[?&]livre\b/.test(location.search);
  const $ = (s, raiz) => (raiz || document).querySelector(s);

  const EM_OBRA = [
    { nome: 'A Vitrine', assunto: 'Angular: componentes, templates e HttpClient', retrato: 'assets/analista.webp', fala: 'A tela que consome a API dos turnos 1 e 2.' },
    { nome: 'O Vigia', assunto: 'ECS Fargate: a mesma API em container', retrato: 'assets/vigia.webp', fala: 'Nunca dorme. Por isso não tem cold start, e por isso cobra a noite inteira.' },
  ];
  const PATENTES = [
    [0, 'Recém-chegada'],
    [8, 'Plantonista'],
    [20, 'Dona do turno'],
    [34, 'Chefe do beco'],
    [48, 'Lenda do Beco 404'],
  ];

  // ---------- estado ----------
  let estado = { niveis: {}, rapido: false };
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE));
    if (salvo && salvo.niveis) estado = salvo;
  } catch (e) {}
  function salvar() {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(estado));
    } catch (e) {}
  }
  function dados(id) {
    if (!estado.niveis[id]) estado.niveis[id] = { estrelas: 0, tentativas: 0, dicas: 0, solucaoVista: false };
    return estado.niveis[id];
  }
  function feito(nivel) {
    return dados(nivel.id).estrelas > 0;
  }
  function liberado(mi, ni) {
    if (LIVRE) return true;
    if (ni > 0) return feito(B.mundos[mi].niveis[ni - 1]);
    if (mi === 0) return true;
    return B.mundos[mi - 1].niveis.every(feito);
  }
  function totalEstrelas() {
    let t = 0;
    B.mundos.forEach((m) => m.niveis.forEach((n) => (t += dados(n.id).estrelas)));
    return t;
  }
  function maxEstrelas() {
    return B.mundos.reduce((s, m) => s + m.niveis.length * 3, 0);
  }
  function patente(total) {
    let nome = PATENTES[0][1];
    let proxima = null;
    PATENTES.forEach((p, i) => {
      if (total >= p[0]) {
        nome = p[1];
        proxima = PATENTES[i + 1] || null;
      }
    });
    return { nome, proxima };
  }
  function estrelasHtml(n, de) {
    let h = '';
    for (let i = 0; i < (de || 3); i++) h += '<span class="estrela' + (i < n ? ' cheia' : '') + '">★</span>';
    return h;
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  const icones = {};
  function iconeGato(pelo) {
    if (!icones[pelo]) icones[pelo] = B.sprite('anda1', pelo).toDataURL();
    return icones[pelo];
  }

  // ---------- mapa ----------
  function mostrarMapa() {
    if (atual) sairDaFase();
    const total = totalEstrelas();
    const pat = patente(total);
    const mundos = B.mundos
      .map((m, mi) => {
        const aberto = liberado(mi, 0);
        const feitos = m.niveis.filter(feito).length;
        const fases = m.niveis
          .map((n, ni) => {
            const lib = liberado(mi, ni);
            const d = dados(n.id);
            return (
              '<button class="no' + (lib ? '' : ' trancado') + (d.estrelas ? ' feito' : '') + (n.chefe ? ' chefe' : '') + '" ' + (lib ? '' : 'disabled ') +
              'data-m="' + mi + '" data-n="' + ni + '" title="' + esc(n.titulo) + '">' +
              '<span class="no-num">' + (n.chefe ? 'CHEFE' : ni + 1) + '</span>' +
              '<span class="no-titulo">' + esc(n.titulo) + '</span>' +
              '<span class="no-estrelas">' + (lib ? estrelasHtml(d.estrelas) : 'trancada') + '</span></button>'
            );
          })
          .join('');
        return (
          '<section class="mundo' + (aberto ? '' : ' fechado') + '">' +
          '<div class="mundo-cabeca"><img class="retrato" src="' + m.retrato + '" alt="">' +
          '<div><div class="mundo-turno">TURNO ' + (mi + 1) + ' · ' + feitos + '/' + m.niveis.length + '</div>' +
          '<h2>' + esc(m.nome) + '</h2><div class="mundo-assunto">' + esc(m.assunto) + '</div>' +
          '<p class="mundo-fala">' + esc(m.fala) + '</p></div></div>' +
          '<div class="trilha">' + fases + '</div></section>'
        );
      })
      .join('');
    const obras = EM_OBRA.map(
      (m, i) =>
        '<section class="mundo fechado obra"><div class="mundo-cabeca"><img class="retrato" src="' + m.retrato + '" alt="">' +
        '<div><div class="mundo-turno">TURNO ' + (B.mundos.length + i + 1) + ' · EM OBRA</div><h2>' + esc(m.nome) + '</h2>' +
        '<div class="mundo-assunto">' + esc(m.assunto) + '</div><p class="mundo-fala">' + esc(m.fala) + '</p></div></div></section>'
    ).join('');

    $('#app').innerHTML =
      '<header class="topo"><div class="marca"><span class="logo">BECO 404</span><span class="marca-sub">plantão noturno de APIs</span></div>' +
      '<div class="patente"><div class="patente-nome">' + pat.nome + '</div><div class="patente-estrelas"><span class="estrela cheia">★</span> ' + total + ' / ' + maxEstrelas() +
      (pat.proxima ? ' <span class="patente-prox">· ' + pat.proxima[1] + ' com ' + pat.proxima[0] + '</span>' : '') + '</div></div></header>' +
      '<main class="mapa"><section class="intro"><h1>Cada gato na porta é uma requisição.</h1>' +
      '<p>Você é a plantonista nova. Escreve o código, aperta <b>Rodar</b> e descobre quem entra e quem fica do lado de fora. ' +
      'Código de verdade: Python de Lambda, rotas de API Gateway e TypeScript com RxJS, tudo rodando aqui no navegador.</p>' +
      '<p class="intro-regra"><span class="estrela cheia">★★★</span> no máximo 1 dica e 5 tentativas &nbsp; <span class="estrela cheia">★★</span> pediu a segunda dica ou passou de 5 tentativas &nbsp; <span class="estrela cheia">★</span> resolveu de algum jeito</p></section>' +
      mundos + obras + '</main>';
    document.body.className = 'no-mapa';
    $('#app').querySelectorAll('.no:not([disabled])').forEach((b) => b.addEventListener('click', () => abrirNivel(+b.dataset.m, +b.dataset.n)));
    window.scrollTo(0, 0);
  }

  // ---------- fase ----------
  let passoAPasso = false; // aba "Por dentro": a cena para a cada mudança e espera um clique
  let atual = null; // { mi, ni, mundo, nivel, editor, cena, resultados, mostrados, revelado, rodando, aba, aberto }

  function criarEditor(el, mundo, valor) {
    const recuo = mundo.linguagem === 'python' ? 4 : 2;
    if (window.CodeMirror) {
      const modo = mundo.linguagem === 'python' ? 'python' : mundo.linguagem === 'json' ? { name: 'javascript', json: true } : 'text/typescript';
      const cm = window.CodeMirror(el, {
        value: valor,
        mode: modo,
        theme: 'beco',
        lineNumbers: true,
        indentUnit: recuo,
        tabSize: recuo,
        indentWithTabs: false,
        lineWrapping: false,
        extraKeys: {
          'Ctrl-Enter': () => rodar(),
          'Cmd-Enter': () => rodar(),
          Tab: (c) => (c.somethingSelected() ? c.indentSelection('add') : c.replaceSelection(' '.repeat(recuo), 'end')),
          'Shift-Tab': (c) => c.indentSelection('subtract'),
        },
      });
      // erro na própria linha: fundo vermelho e um recado logo abaixo, que some quando ela mexe no código
      let marca = null;
      const desmarcar = () => {
        if (!marca) return;
        cm.removeLineClass(marca.linha, 'background', 'linha-erro');
        cm.removeLineClass(marca.linha, 'gutter', 'calha-erro');
        marca.recado.clear();
        marca = null;
      };
      const marcar = (n, texto, depois) => {
        desmarcar();
        const i = Math.max(0, Math.min(cm.lineCount() - 1, n - 1));
        const linha = cm.getLineHandle(i);
        const no = document.createElement('div');
        no.className = 'recado-erro';
        no.textContent = '▲ ' + texto;
        if (depois) {
          const t = document.createElement('div');
          t.className = 'recado-tente';
          t.textContent = 'Tente assim:  ' + depois;
          no.appendChild(t);
        }
        cm.addLineClass(linha, 'background', 'linha-erro');
        cm.addLineClass(linha, 'gutter', 'calha-erro');
        marca = { linha, recado: cm.addLineWidget(linha, no, { coverGutter: false, noHScroll: true }) };
        cm.scrollIntoView({ line: i, ch: 0 }, 60);
      };
      cm.on('change', () => {
        desmarcar();
        guardarCodigo();
      });
      setTimeout(() => cm.refresh(), 0);
      return { ler: () => cm.getValue(), escrever: (v) => cm.setValue(v), focar: () => cm.focus(), marcar, desmarcar };
    }
    const ta = document.createElement('textarea');
    ta.className = 'editor-simples';
    ta.spellcheck = false;
    ta.value = valor;
    ta.addEventListener('input', () => guardarCodigo());
    el.appendChild(ta);
    return { ler: () => ta.value, escrever: (v) => (ta.value = v), focar: () => ta.focus(), marcar: () => {}, desmarcar: () => {} };
  }

  let relogio = null;
  function guardarCodigo() {
    clearTimeout(relogio);
    relogio = setTimeout(() => {
      if (!atual) return;
      dados(atual.nivel.id).codigo = atual.editor.ler();
      salvar();
    }, 400);
  }

  function sairDaFase() {
    if (!atual) return;
    clearTimeout(relogio);
    dados(atual.nivel.id).codigo = atual.editor.ler();
    salvar();
    atual.cena.limpar();
    cancelAnimationFrame(atual.cena.raf);
    atual = null;
  }

  function abrirNivel(mi, ni) {
    if (atual) sairDaFase();
    const mundo = B.mundos[mi];
    const nivel = mundo.niveis[ni];
    const d = dados(nivel.id);
    document.body.className = 'na-fase';
    $('#app').innerHTML =
      '<header class="topo topo-fase"><button class="btn btn-fantasma" id="voltar">← Mapa</button>' +
      '<div class="fase-titulo"><span class="fase-turno">TURNO ' + (mi + 1) + ' · ' + esc(mundo.nome) + '</span>' +
      '<h1>' + (nivel.chefe ? '<span class="selo-chefe">CHEFE</span> ' : 'Fase ' + (ni + 1) + ': ') + esc(nivel.titulo) + '</h1></div>' +
      '<div class="fase-recorde" id="recorde"></div></header>' +
      '<div class="fase"><section class="col-esq">' +
      '<div class="palco" id="palco"><canvas id="cena"></canvas><div class="sobre" id="sobre"><div class="placa">BECO 404</div></div></div>' +
      '<div class="abas"><button class="aba" data-aba="missao">Missão</button><button class="aba" data-aba="visitantes">Visitantes <span id="placar"></span></button>' +
      '<button class="aba aba-dentro" data-aba="dentro" title="Mostra as tags HTML da cena e o JavaScript mexendo nelas">&lt;/&gt; Por dentro</button></div>' +
      '<div class="painel" id="painel"></div></section>' +
      '<section class="col-dir"><div class="barra-editor"><span class="arquivo">' + esc(mundo.arquivo) + '</span><span class="espaco"></span>' +
      '<button class="btn btn-fantasma" id="dica">Dica</button><button class="btn btn-fantasma" id="reiniciar">Reiniciar</button>' +
      '<button class="btn btn-fantasma oculto" id="solucao">Ver solução</button>' +
      '<label class="rapido" title="Velocidade dos gatos na cena">velocidade <select id="velocidade"><option value="lento">lenta</option><option value="normal">normal</option><option value="rapido">rápida</option></select></label>' +
      '<button class="btn btn-rodar" id="rodar">▶ Rodar <kbd>Ctrl</kbd>+<kbd>Enter</kbd></button></div>' +
      '<div id="editor"></div></section></div>';

    atual = { mi, ni, mundo, nivel, resultados: null, mostrados: 0, revelado: false, rodando: false, aba: 'missao', aberto: -1, erroGeral: null, logJs: [], htmlAntes: [] };
    atual.cena = new B.Cena($('#cena'), $('#sobre'));
    const sessaoCena = atual;
    atual.cena.aoMexer = (js, nota) => {
      if (atual !== sessaoCena) return;
      atual.logJs.push({ js, nota });
      if (atual.logJs.length > 12) atual.logJs.shift();
      if (atual.aba === 'dentro') painelDentro();
    };
    atual.cena.passoAPasso = passoAPasso;
    atual.cena.aoPausar = (pausada) => {
      if (atual === sessaoCena) marcarPausa(pausada);
    };
    atual.cena.definirMundo(mundo.mascote);
    atual.editor = criarEditor($('#editor'), mundo, d.codigo !== undefined ? d.codigo : nivel.inicial);

    $('#voltar').addEventListener('click', mostrarMapa);
    $('#rodar').addEventListener('click', rodar);
    $('#dica').addEventListener('click', pedirDica);
    $('#reiniciar').addEventListener('click', reiniciar);
    $('#solucao').addEventListener('click', verSolucao);
    $('#velocidade').value = velocidade();
    $('#velocidade').addEventListener('change', (e) => {
      estado.velocidade = e.target.value;
      salvar();
    });
    $('#app').querySelectorAll('.aba').forEach((a) => a.addEventListener('click', () => trocarAba(a.dataset.aba)));
    atualizarBarra();
    trocarAba('missao');
    B.aquecer(nivel.tipo).catch(() => {});
    window.scrollTo(0, 0);
  }

  function atualizarBarra() {
    const d = dados(atual.nivel.id);
    $('#recorde').innerHTML = d.estrelas ? 'seu recorde ' + estrelasHtml(d.estrelas) : 'tentativas: ' + d.tentativas;
    $('#dica').textContent = d.dicas >= atual.nivel.dicas.length ? 'Dicas (' + d.dicas + ')' : 'Dica' + (d.dicas ? ' (' + d.dicas + '/' + atual.nivel.dicas.length + ')' : '');
    $('#solucao').classList.toggle('oculto', !(LIVRE || d.solucaoVista || (d.tentativas >= 3 && !d.estrelas)));
    const vis = atual.nivel.visitantes;
    const ok = atual.resultados ? atual.resultados.slice(0, atual.mostrados).filter((r) => r.ok).length : 0;
    $('#placar').textContent = atual.resultados ? ok + '/' + vis.length : '(' + vis.length + ')';
  }

  const RITMOS = { lento: 3.2, normal: 1.8, rapido: 0.3 };
  function velocidade() {
    return RITMOS[estado.velocidade] ? estado.velocidade : estado.rapido ? 'rapido' : 'normal';
  }

  function trocarAba(aba) {
    if (aba !== 'dentro' && atual.aba === 'dentro') atual.cena.avancar(); // não deixa a cena presa numa pausa
    atual.aba = aba;
    $('#app').querySelectorAll('.aba').forEach((a) => a.classList.toggle('ativa', a.dataset.aba === aba));
    $('#palco').classList.toggle('raio-x', aba === 'dentro');
    atual.cena.raioX = aba === 'dentro';
    if (aba === 'missao') painelMissao();
    else if (aba === 'dentro') painelDentro();
    else painelVisitantes();
  }

  /* Aba "Por dentro": as tags HTML da cena lidas da página de verdade, e o JavaScript
     que a cena acabou de rodar. Serve pra explicar o que é frontend. */
  function linhasHtml() {
    const tag = (el) => {
      if (!el) return '(você apagou esta tag: use o botão Desfazer)';
      const classe = el.className ? ' class="' + el.className + '"' : '';
      const estilo = el.getAttribute('style') ? ' style="' + el.getAttribute('style') + '"' : '';
      return '<div' + classe + estilo + '>' + el.textContent + '</div>';
    };
    const sobre = $('#sobre');
    return [
      { t: '<div class="palco">', alvo: '#palco' },
      { t: '  <canvas id="cena" width="256" height="120"></canvas>', alvo: '#cena', nota: 'o beco e os gatos são pixels pintados aqui dentro pelo JavaScript' },
      { t: '  <div class="sobre">', alvo: '#sobre' },
      { t: '    ' + tag($('.placa', sobre)), alvo: '.placa' },
      { t: '    ' + tag($('.balao-pedido', sobre)), alvo: '.balao-pedido' },
      { t: '    ' + tag($('.balao-porta', sobre)), alvo: '.balao-porta' },
      { t: '  </div>' },
      { t: '</div>' },
    ];
  }
  function pintarHtml(t) {
    return esc(t)
      .replace(/(&lt;\/?)([a-z]+)/g, '$1<span class="h-tag">$2</span>')
      .replace(/([a-z]+)=(&quot;.*?&quot;)/g, '<span class="h-atr">$1</span>=<span class="h-val">$2</span>');
  }
  const EXEMPLOS_CONSOLE = [
    'placa.textContent = "BECO DA ANA"',
    'placa.style.color = "hotpink"',
    'balaoPedido.textContent = "GET /sardinha"',
    'balaoPedido.classList.remove("oculto")',
    'balaoPorta.className = "balao balao-porta ok"',
    'placa.textContent',
  ];

  // O painel é montado uma vez; depois só o HTML ao vivo e o log são trocados,
  // senão o que ela estiver digitando no console sumiria a cada quadro.
  function painelDentro() {
    if (!$('#dentro-html')) montarDentro();
    atualizarDentro();
  }

  function montarDentro() {
    $('#painel').innerHTML =
      '<div class="caixa caixa-aqui"><div class="rotulo">A CENA É UMA PÁGINA WEB</div><p><b>HTML</b> diz o que existe na tela (as tags). <b>CSS</b> diz como cada tag aparece. <b>JavaScript</b> muda as tags com a página aberta. Passe o mouse numa linha do HTML pra ver a tag acender lá em cima.</p></div>' +
      '<div class="caixa passo-caixa"><label class="passo-liga"><input type="checkbox" id="passo"' + (passoAPasso ? ' checked' : '') + '> <b>passo a passo</b></label>' +
      '<span class="passo-texto">a cena para a cada mudança e espera você</span><span class="espaco"></span>' +
      '<button class="btn btn-passo" id="proximo" disabled>Próximo passo ▶</button></div>' +
      '<div class="caixa"><div class="rotulo">HTML: AS TAGS DA CENA, AGORA</div><div class="codigo" id="dentro-html"></div></div>' +
      '<div class="caixa"><div class="rotulo">JAVASCRIPT: O QUE A CENA ACABOU DE RODAR <span class="rotulo-nota">só leitura</span></div><div class="codigo" id="dentro-js"></div></div>' +
      '<div class="caixa caixa-console"><div class="rotulo">SUA VEZ: MEXA NA PÁGINA COM JAVASCRIPT</div>' +
      '<p>Digite uma linha e aperte <kbd>Enter</kbd>. Ela roda de verdade e a tag muda lá em cima. Você tem quatro variáveis, uma pra cada tag: <code>placa</code>, <code>balaoPedido</code>, <code>balaoPorta</code> e <code>palco</code>.</p>' +
      '<div class="console-linha"><span class="console-seta">&gt;</span><input id="console" type="text" spellcheck="false" autocomplete="off" autocapitalize="off" placeholder=\'placa.textContent = "miau"\'></div>' +
      '<div class="console-exemplos">' + EXEMPLOS_CONSOLE.map((e) => '<button class="chip" type="button">' + esc(e) + '</button>').join('') + '</div>' +
      '<button class="btn btn-fantasma" id="restaurar" type="button">↺ Desfazer o que eu mexi</button></div>' +
      '<div class="caixa caixa-dica"><div class="rotulo">E NO ANGULAR?</div><p>Você não escreve <code>textContent = ...</code> na mão. Escreve a tag com um buraco, <code>&lt;div class="balao"&gt;{{ pedido }}&lt;/div&gt;</code>, muda a variável <code>pedido</code> no TypeScript e o Angular atualiza a tag sozinho.</p></div>';

    $('#passo').addEventListener('change', (e) => {
      passoAPasso = e.target.checked;
      atual.cena.passoAPasso = passoAPasso;
      if (!passoAPasso) atual.cena.avancar();
    });
    $('#proximo').addEventListener('click', () => atual.cena.avancar());
    marcarPausa(atual.cena.pausada());
    const entrada = $('#console');
    entrada.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || !entrada.value.trim()) return;
      executarConsole(entrada.value.trim());
      entrada.select();
    });
    $('#painel').querySelectorAll('.chip').forEach((c) =>
      c.addEventListener('click', () => {
        entrada.value = c.textContent;
        entrada.focus();
      })
    );
    $('#restaurar').addEventListener('click', () => {
      const { mi, ni } = atual;
      dados(atual.nivel.id).codigo = atual.editor.ler();
      salvar();
      abrirNivel(mi, ni);
      trocarAba('dentro');
    });
  }

  function atualizarDentro() {
    const linhas = linhasHtml();
    const antes = atual.htmlAntes;
    $('#dentro-html').innerHTML = linhas
      .map((l, i) => {
        const mudou = antes.length && antes[i] !== l.t;
        return '<div class="linha' + (mudou ? ' mudou' : '') + (l.alvo ? ' aponta' : '') + '"' + (l.alvo ? ' data-alvo="' + l.alvo + '"' : '') + '>' + pintarHtml(l.t) + (l.nota ? '  <span class="h-com">&lt;!-- ' + l.nota + ' --&gt;</span>' : '') + '</div>';
      })
      .join('');
    atual.htmlAntes = linhas.map((l) => l.t);
    $('#dentro-js').innerHTML = atual.logJs.length
      ? atual.logJs
          .map((l, i) => '<div class="linha' + (i === atual.logJs.length - 1 ? ' mudou' : '') + (l.seu ? ' seu' : '') + (l.erro ? ' deu-erro' : '') + '">' + (l.seu ? '<span class="console-seta">&gt; </span>' : '') + esc(l.js) + (l.nota ? '  <span class="h-com">// ' + esc(l.nota) + '</span>' : '') + '</div>')
          .join('')
      : '<div class="linha"><span class="h-com">// aperte Rodar: as linhas que a cena executa aparecem aqui</span></div>';
    $('#dentro-html').querySelectorAll('.aponta').forEach((el) => {
      const alvo = $(el.dataset.alvo, $('#palco').parentNode);
      el.addEventListener('mouseenter', () => alvo && alvo.classList.add('destaque'));
      el.addEventListener('mouseleave', () => alvo && alvo.classList.remove('destaque'));
    });
  }

  function marcarPausa(pausada) {
    const b = $('#proximo');
    if (!b) return;
    b.disabled = !pausada;
    b.classList.toggle('chamando', pausada);
  }

  // Roda uma linha de JavaScript digitada por ela, com as tags da cena como variáveis.
  function executarConsole(codigo) {
    const sobre = $('#sobre');
    const tags = { palco: $('#palco'), placa: $('.placa', sobre), balaoPedido: $('.balao-pedido', sobre), balaoPorta: $('.balao-porta', sobre) };
    const nomes = Object.keys(tags);
    const valores = nomes.map((k) => tags[k]);
    let nota;
    let erro = false;
    try {
      let f;
      try {
        f = new Function(...nomes, 'return (' + codigo + '\n)');
      } catch (e) {
        f = new Function(...nomes, codigo);
      }
      const r = f(...valores);
      nota = r === undefined ? 'rodou' : r instanceof Element ? 'devolveu a tag <' + r.tagName.toLowerCase() + '>' : 'devolveu ' + (typeof r === 'string' ? JSON.stringify(r) : String(r));
    } catch (e) {
      erro = true;
      const info = B.explicarErro(e.message, codigo + '\n' + nomes.join(' '));
      nota = 'erro: ' + (info.pt || e.message);
    }
    atual.logJs.push({ js: codigo, nota, seu: true, erro });
    if (atual.logJs.length > 12) atual.logJs.shift();
    atualizarDentro();
  }

  function painelMissao() {
    const n = atual.nivel;
    const d = dados(n.id);
    let dicas = '';
    for (let i = 0; i < d.dicas && i < n.dicas.length; i++) dicas += '<div class="caixa caixa-dica"><div class="rotulo">DICA ' + (i + 1) + '</div><p>' + n.dicas[i] + '</p></div>';
    $('#painel').innerHTML =
      '<div class="ponte"><div class="caixa caixa-sabe"><div class="rotulo">VOCÊ JÁ SABE</div><p>' + n.sabe + '</p></div>' +
      '<div class="caixa caixa-aqui"><div class="rotulo">AQUI NO BECO</div><p>' + n.aqui + '</p></div></div>' +
      '<div class="caixa caixa-missao"><div class="rotulo">MISSÃO</div><p>' + n.missao + '</p></div>' +
      (n.cola ? '<details class="caixa caixa-cola"' + (atual.colaAberta ? ' open' : '') + '><summary class="rotulo">COLA <span>clique pra abrir, não custa estrela</span></summary><p>' + n.cola + '</p></details>' : '') + dicas;
    const cola = $('#painel').querySelector('.caixa-cola');
    if (cola) cola.addEventListener('toggle', () => (atual.colaAberta = cola.open));
  }

  function resumoEspera(v) {
    const n = atual.nivel;
    const e = v.espera;
    if (n.tipo === 'python') return e.status + (e.texto !== undefined ? ' "' + e.texto + '"' : e.json !== undefined ? ' + JSON' : e.chave ? ' + {"' + e.chave + '": ...}' : '');
    if (n.tipo === 'gateway') return e.cors ? 'barrado (CORS)' : e.destino ? '→ ' + e.destino : String(e.status);
    return JSON.stringify(e);
  }

  function painelVisitantes() {
    const n = atual.nivel;
    let h = '';
    if (atual.quebra && atual.quebra.pt) {
      const q = atual.quebra;
      h += '<div class="caixa caixa-erro"><div class="rotulo">' + 'ANÁLISE DO ERRO' + (q.linha ? ' · LINHA ' + q.linha : '') + '</div>' +
        '<p class="erro-pt">' + esc(q.pt.charAt(0).toUpperCase() + q.pt.slice(1)) + '</p>' +
        (q.depois ? '<div class="erro-troca"><div><span>você escreveu</span><code class="antes">' + esc(q.antes) + '</code></div><div><span>tente assim</span><code class="depois">' + esc(q.depois) + '</code></div></div>' : '') +
        '<p class="erro-bruto">O que a máquina disse: <code>' + esc(q.bruto) + '</code></p></div>';
    } else if (atual.erroGeral) h += '<div class="caixa caixa-erro"><div class="rotulo">NÃO RODOU</div><pre>' + esc(atual.erroGeral) + '</pre></div>';
    if (atual.carregando) h += '<div class="caixa caixa-dica"><p>' + esc(atual.carregando) + '</p></div>';
    n.visitantes.forEach((v, i) => {
      const escondido = v.oculto && !atual.revelado;
      const res = atual.resultados && i < atual.mostrados ? atual.resultados[i] : null;
      const marca = res ? (res.ok ? '<span class="marca-ok">✓ certo</span>' : '<span class="marca-falha">✗ errado</span>') : '<span class="marca-nada">·</span>';
      h += '<div class="visitante' + (res ? (res.ok ? ' ok' : ' falha') : '') + (atual.aberto === i ? ' aberto' : '') + '" data-i="' + i + '">';
      h += '<div class="vis-linha"><img class="vis-gato" src="' + iconeGato(escondido ? 'preto' : v.pelo) + '" alt="">';
      if (escondido) h += '<span class="vis-nome">Surpresa</span><code class="vis-pedido">??? aparece quando você rodar</code>';
      else h += '<span class="vis-nome">' + esc(v.nome) + '</span><code class="vis-pedido">' + esc(v.pedido) + '</code>';
      h += '<span class="vis-marca">' + marca + '</span></div>';
      if (atual.aberto === i && !escondido) {
        h += '<div class="vis-detalhe"><div class="vis-espera">Espera: <code>' + esc(resumoEspera(v)) + '</code></div>';
        if (res && res.erro && res.erro === atual.quebra) h += '<pre class="vis-erro">O código quebrou antes de responder, então este gato levou um 500.' + (res.erro.linha ? ' O recado está na linha ' + res.erro.linha + ' do editor.' : '') + '</pre>';
        else if (res && res.detalhe) h += '<pre class="vis-erro">' + esc(res.detalhe) + '</pre>';
        if (res && res.saida) h += '<div class="rotulo">SEUS PRINTS</div><pre>' + esc(res.saida) + '</pre>';
        if (n.tipo === 'python') {
          if (v.espera.json !== undefined) h += '<div class="rotulo">CORPO ESPERADO</div><pre>' + esc(JSON.stringify(v.espera.json)) + '</pre>';
          h += '<div class="rotulo">EVENTO QUE ELE TROUXE</div><pre>' + esc(JSON.stringify(v.event, null, 2)) + '</pre>';
        }
        h += '</div>';
      }
      h += '</div>';
    });
    $('#painel').innerHTML = h;
    $('#painel').querySelectorAll('.visitante').forEach((el) =>
      el.querySelector('.vis-linha').addEventListener('click', () => {
        const i = +el.dataset.i;
        atual.aberto = atual.aberto === i ? -1 : i;
        painelVisitantes();
      })
    );
  }

  function pedirDica() {
    const d = dados(atual.nivel.id);
    if (d.dicas < atual.nivel.dicas.length) {
      d.dicas++;
      salvar();
    }
    atualizarBarra();
    trocarAba('missao');
    const p = $('#painel');
    p.scrollTop = p.scrollHeight;
  }

  function reiniciar() {
    if (!window.confirm('Voltar o código pro começo e zerar tentativas e dicas desta fase? (Seu recorde de estrelas fica.)')) return;
    const d = dados(atual.nivel.id);
    d.tentativas = 0;
    d.dicas = 0;
    d.solucaoVista = false;
    d.codigo = atual.nivel.inicial;
    salvar();
    atual.editor.escrever(atual.nivel.inicial);
    atual.resultados = null;
    atual.erroGeral = null;
    atual.quebra = null;
    atual.editor.desmarcar();
    atual.mostrados = 0;
    atual.cena.limpar();
    atualizarBarra();
    trocarAba('missao');
  }

  function verSolucao() {
    const d = dados(atual.nivel.id);
    if (!d.solucaoVista && !window.confirm('Ver a solução deixa esta fase valendo 1 estrela (até você reiniciar). Ver mesmo assim?')) return;
    d.solucaoVista = true;
    salvar();
    atual.editor.escrever(atual.nivel.solucao);
    atualizarBarra();
  }

  async function rodar() {
    if (!atual || atual.rodando) return;
    const sessao = atual;
    const nivel = atual.nivel;
    const d = dados(nivel.id);
    const codigo = atual.editor.ler();
    atual.rodando = true;
    d.codigo = codigo;
    d.tentativas++;
    salvar();
    $('#rodar').disabled = true;
    atual.erroGeral = null;
    atual.quebra = null;
    atual.editor.desmarcar();
    atual.resultados = null;
    atual.mostrados = 0;
    atual.aberto = -1;
    atual.cena.limpar();
    atual.carregando = nivel.tipo === 'python' ? 'Acordando o Python… (na primeira vez demora uns segundos, igual cold start)' : nivel.tipo === 'ts' ? 'Preparando o TypeScript…' : null;
    atual.logJs = [];
    if (atual.aba !== 'dentro') trocarAba('visitantes');
    else painelDentro();
    atualizarBarra();

    let r;
    try {
      r = await B.rodar(codigo, nivel);
    } catch (e) {
      r = { erroGeral: e.message || String(e), resultados: [] };
    }
    if (atual !== sessao) return;
    atual.carregando = null;
    // o primeiro erro de código (com linha) vai pro editor e pro topo do painel
    const comErro = r.erroInfo || (r.resultados.find((x) => x.erro) || {}).erro || null;
    if (comErro) {
      atual.quebra = comErro;
      if (comErro.linha && comErro.pt) atual.editor.marcar(comErro.linha, comErro.pt.charAt(0).toUpperCase() + comErro.pt.slice(1), comErro.depois);
    }
    if (r.erroGeral) {
      atual.erroGeral = r.erroGeral;
      atual.cena.lampada = 'falha';
      trocarAba('visitantes');
    } else {
      atual.revelado = true;
      atual.resultados = r.resultados;
      if (comErro && atual.aba === 'dentro') trocarAba('visitantes');
      if (atual.aba === 'visitantes') painelVisitantes();
      const fila = nivel.visitantes.map((v) => ({
        pelo: v.pelo,
        pedido: v.pedido,
        entra: nivel.tipo === 'python' ? v.espera.status < 400 : nivel.tipo === 'gateway' ? !!v.espera.destino : true,
      }));
      await atual.cena.tocar(fila, r.resultados, {
        ritmo: RITMOS[velocidade()],
        aoResolver: (i) => {
          if (atual !== sessao) return;
          atual.mostrados = i + 1;
          if (atual.aba === 'visitantes') painelVisitantes();
          atualizarBarra();
        },
      });
      if (atual !== sessao) return;
      atual.mostrados = r.resultados.length;
      const primeiraFalha = r.resultados.findIndex((x) => !x.ok);
      atual.aberto = primeiraFalha;
      if (primeiraFalha < 0) vitoria();
    }
    atual.rodando = false;
    $('#rodar').disabled = false;
    if (atual.aba === 'visitantes') painelVisitantes();
    atualizarBarra();
  }

  function vitoria() {
    const { mi, ni, mundo, nivel } = atual;
    const d = dados(nivel.id);
    let n = 3;
    const motivos = [];
    if (d.dicas > 1) {
      n--;
      motivos.push('pediu ' + d.dicas + ' dicas');
    }
    if (d.tentativas > 5) {
      n--;
      motivos.push(d.tentativas + ' tentativas');
    }
    if (d.solucaoVista) {
      n = 1;
      motivos.length = 0;
      motivos.push('viu a solução');
    }
    const antes = patente(totalEstrelas()).nome;
    d.estrelas = Math.max(d.estrelas, n);
    salvar();
    const depois = patente(totalEstrelas()).nome;
    const temProxima = ni + 1 < mundo.niveis.length;
    const fimDoTurno = !temProxima;
    const proxMundo = B.mundos[mi + 1];

    const m = document.createElement('div');
    m.className = 'modal';
    m.innerHTML =
      '<div class="modal-caixa"><div class="modal-estrelas">' + estrelasHtml(n) + '</div>' +
      '<h2>' + (fimDoTurno ? 'Turno encerrado' : 'Porta limpa') + '</h2>' +
      '<p class="modal-sub">' + (motivos.length ? motivos.join(', ') + '. Dá pra buscar as 3 estrelas com <b>Reiniciar</b>.' : 'Resolvido em ' + d.tentativas + (d.tentativas === 1 ? ' tentativa.' : ' tentativas.')) + '</p>' +
      (depois !== antes ? '<p class="modal-patente">Nova patente: <b>' + depois + '</b></p>' : '') +
      '<div class="caixa caixa-relatorio"><div class="rotulo">RELATÓRIO DO PLANTÃO</div><p>' + nivel.relatorio + '</p></div>' +
      (fimDoTurno ? '<div class="modal-colecao"><img class="retrato" src="' + mundo.retrato + '" alt=""><p><b>' + esc(mundo.nome) + '</b> agora te respeita.' + (proxMundo ? ' O turno de <b>' + esc(proxMundo.nome) + '</b> está aberto.' : ' Os próximos turnos estão em obra.') + '</p></div>' : '') +
      '<div class="modal-botoes"><button class="btn btn-fantasma" id="m-ficar">Ficar aqui</button><button class="btn btn-fantasma" id="m-mapa">Mapa</button>' +
      (temProxima ? '<button class="btn btn-rodar" id="m-prox">Próxima fase →</button>' : proxMundo ? '<button class="btn btn-rodar" id="m-prox">Próximo turno →</button>' : '') + '</div></div>';
    document.body.appendChild(m);
    const fechar = () => m.remove();
    $('#m-ficar', m).addEventListener('click', fechar);
    $('#m-mapa', m).addEventListener('click', () => {
      fechar();
      mostrarMapa();
    });
    const prox = $('#m-prox', m);
    if (prox)
      prox.addEventListener('click', () => {
        fechar();
        if (temProxima) abrirNivel(mi, ni + 1);
        else abrirNivel(mi + 1, 0);
      });
  }

  document.addEventListener('keydown', (e) => {
    if (atual && (e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      rodar();
    }
  });

  /* Conferência das fases: roda a solução (tem que passar em tudo) e o código inicial
     (tem que falhar em alguma coisa). No console: await BECO.testarTudo() */
  B.testarTudo = async function () {
    const saida = [];
    for (const m of B.mundos) {
      for (const n of m.niveis) {
        const s = await B.rodar(n.solucao, n);
        const i = await B.rodar(n.inicial, n);
        const falhas = s.resultados.map((r, k) => (r.ok ? null : n.visitantes[k].nome + ': ' + r.detalhe)).filter(Boolean);
        saida.push({
          id: n.id,
          solucaoPassa: !s.erroGeral && s.resultados.length === n.visitantes.length && falhas.length === 0,
          inicialFalha: !!i.erroGeral || i.resultados.some((r) => !r.ok),
          problema: s.erroGeral || falhas.join(' | ') || null,
        });
      }
    }
    return saida;
  };
  B.abrirNivel = abrirNivel;
  B.mostrarMapa = mostrarMapa;

  mostrarMapa();
})();
