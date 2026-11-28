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
      // depurador: a linha (ou o comando de várias linhas) que está rodando agora
      let agora = [];
      const desapontar = () => {
        agora.forEach((h) => {
          cm.removeLineClass(h, 'background', 'linha-agora');
          cm.removeLineClass(h, 'background', 'linha-agora-erro');
          cm.removeLineClass(h, 'gutter', 'calha-agora');
        });
        agora = [];
      };
      const apontar = (ini, fim, erro) => {
        desapontar();
        for (let n = ini; n <= (fim || ini); n++) {
          if (n < 1 || n > cm.lineCount()) continue;
          const h = cm.getLineHandle(n - 1);
          cm.addLineClass(h, 'background', erro ? 'linha-agora-erro' : 'linha-agora');
          cm.addLineClass(h, 'gutter', 'calha-agora');
          agora.push(h);
        }
        cm.scrollIntoView({ line: Math.max(0, ini - 1), ch: 0 }, 50);
      };
      cm.on('change', () => {
        desmarcar();
        guardarCodigo();
      });
      setTimeout(() => cm.refresh(), 0);
      return { ler: () => cm.getValue(), escrever: (v) => cm.setValue(v), focar: () => cm.focus(), marcar, desmarcar, apontar, desapontar, ajustar: () => cm.refresh() };
    }
    const ta = document.createElement('textarea');
    ta.className = 'editor-simples';
    ta.spellcheck = false;
    ta.value = valor;
    ta.addEventListener('input', () => guardarCodigo());
    el.appendChild(ta);
    return { ler: () => ta.value, escrever: (v) => (ta.value = v), focar: () => ta.focus(), marcar: () => {}, desmarcar: () => {}, apontar: () => {}, desapontar: () => {}, ajustar: () => {} };
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
    soltarLinha();
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
      '<div id="editor"></div>' + (nivel.tipo === 'python' ? htmlDepurador() : '') + '</section></div>';

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
    ligarDepurador();

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

  /* ---------- depurador (só nas fases de Python) ----------
     Enquanto o gato espera na porta, a cena anda pelo código linha por linha e mostra
     o que entrou (event e context), o que está rodando e o que saiu. */
  let pararNaLinha = false; // "parar em cada linha": só anda quando ela clica
  let seguirLinha = null;

  const NOTAS_EVENT = {
    version: 'formato do evento (HTTP API usa o 2.0)',
    routeKey: 'a rota do gateway que casou',
    rawPath: 'o caminho que o gato pediu',
    rawQueryString: 'o que veio depois do ?, ainda como texto',
    queryStringParameters: 'o mesmo, já separado em dict',
    pathParameters: 'os pedaços {entre chaves} da rota',
    headers: 'cabeçalhos do pedido',
    requestContext: 'dados que o gateway acrescenta',
    'requestContext.http.method': 'GET, POST, DELETE…',
    body: 'o corpo: chega sempre como texto',
    isBase64Encoded: 'true só quando o corpo é arquivo binário',
  };
  const AUSENTES = {
    queryStringParameters: 'este pedido veio sem nada depois do ?',
    pathParameters: 'a rota deste pedido não tem {pedaço}',
    body: 'este pedido veio sem corpo',
  };

  function htmlDepurador() {
    return (
      '<div class="depurador" id="depurador"><div class="dep-barra"><button class="dep-dobra" id="dep-dobra" title="Recolher ou abrir o depurador">▾</button>' +
      '<span class="rotulo">DEPURADOR</span><span class="dep-quem" id="dep-quem"></span><span class="espaco"></span>' +
      '<label class="passo-liga" title="A cena para em cada linha e só continua quando você clica"><input type="checkbox" id="dep-parar"> parar em cada linha</label>' +
      '<button class="btn btn-passo" id="dep-prox" disabled>Próxima linha ▶</button></div>' +
      '<div class="dep-cols"><div class="dep-col"><div class="rotulo">1 · ENTROU</div><div class="dep-corpo" id="dep-entrou"></div></div>' +
      '<div class="dep-col"><div class="rotulo">2 · RODANDO</div><div class="dep-corpo" id="dep-agora"></div></div>' +
      '<div class="dep-col"><div class="rotulo">3 · SAIU</div><div class="dep-corpo" id="dep-saiu"></div></div></div></div>'
    );
  }

  function dobrarDepurador() {
    $('#depurador').classList.toggle('fechado', !!estado.depFechado);
    $('#dep-dobra').textContent = estado.depFechado ? '▸' : '▾';
    atual.editor.ajustar();
  }

  function ligarDepurador() {
    if (!$('#depurador')) return;
    $('#dep-parar').checked = pararNaLinha;
    $('#dep-parar').addEventListener('change', (e) => {
      pararNaLinha = e.target.checked;
      if (!pararNaLinha) soltarLinha();
    });
    $('#dep-prox').addEventListener('click', soltarLinha);
    $('#dep-dobra').addEventListener('click', () => {
      estado.depFechado = !estado.depFechado;
      salvar();
      dobrarDepurador();
    });
    atual.dep = null;
    atual.depVez = 0;
    dobrarDepurador();
    pintarDepurador();
  }

  function soltarLinha() {
    const f = seguirLinha;
    seguirLinha = null;
    const b = $('#dep-prox');
    if (b) {
      b.disabled = true;
      b.classList.remove('chamando');
    }
    if (f) f();
  }
  function esperarLinha() {
    return new Promise((ok) => {
      seguirLinha = ok;
      const b = $('#dep-prox');
      b.disabled = false;
      b.classList.add('chamando');
    });
  }

  function limparDepurador() {
    soltarLinha();
    atual.editor.desapontar();
    if (!$('#depurador')) return;
    atual.dep = null;
    atual.depVez++;
    pintarDepurador();
  }

  // Anda pelos passos gravados: acende a linha no editor e atualiza o painel.
  async function depurar(dep, ritmo, vivo) {
    if (!$('#depurador')) return;
    atual.dep = dep;
    dep.k = -1;
    const n = dep.passos.length;
    if (!n) return pintarDepurador();
    // fase com muito passo anda mais ligeiro, pra um gato só não segurar a fila
    const ms = Math.max(70, Math.min(430 * ritmo, (2800 * ritmo) / n));
    for (let k = 0; k < n; k++) {
      if (!vivo()) return;
      dep.k = k;
      const p = dep.passos[k];
      atual.editor.apontar(p.n, p.ate, p.t === 'x');
      pintarDepurador();
      if (pararNaLinha) await esperarLinha();
      else await new Promise((ok) => setTimeout(ok, k === n - 1 ? ms * 1.5 : ms));
    }
  }

  // Depois da cena: mostra, parado, o que entrou e saiu pra um visitante.
  function mostrarExec(i) {
    if (!$('#depurador')) return;
    const exec = atual.resultados[i].exec;
    atual.dep = { i, passos: exec.rastro, k: exec.rastro.length - 1, parado: true };
    pintarDepurador();
  }

  async function repassar(i) {
    if (!atual || atual.rodando || !atual.resultados) return;
    const sessao = atual;
    soltarLinha();
    const vez = ++atual.depVez;
    const vivo = () => atual === sessao && atual.depVez === vez && !atual.rodando;
    await depurar({ i, passos: atual.resultados[i].exec.rastro }, RITMOS[velocidade()], vivo);
    if (!vivo()) return;
    atual.editor.desapontar();
    atual.dep.parado = true;
    pintarDepurador();
  }

  // O event em JSON, linha por linha, com um comentário nas chaves que importam.
  function linhasEvent(event, codigo) {
    const semComentario = codigo.replace(/#.*$/gm, '');
    // "lê" = colchete ou .get com a chave: event["body"], .get("body"). Um "body": dentro do return não conta.
    const usa = (k) => new RegExp('(\\[|\\.get\\(\\s*)["\']' + k.replace(/[^\w-]/g, '\\$&') + '["\']').test(semComentario);
    const saida = [];
    const anda = (v, caminho, recuo, chave, ultimo) => {
      const antes = ' '.repeat(recuo) + (chave !== null ? JSON.stringify(chave) + ': ' : '');
      const virgula = ultimo ? '' : ',';
      const item = { nota: NOTAS_EVENT[caminho], usa: chave !== null && usa(chave) };
      if (v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length) {
        const chaves = Object.keys(v);
        saida.push(Object.assign(item, { t: antes + '{' }));
        chaves.forEach((k, j) => anda(v[k], caminho ? caminho + '.' + k : k, recuo + 2, k, j === chaves.length - 1));
        saida.push({ t: ' '.repeat(recuo) + '}' + virgula });
      } else saida.push(Object.assign(item, { t: antes + JSON.stringify(v) + virgula }));
    };
    anda(event, '', 0, null, true);
    // chave que o código procura e este pedido não trouxe: é daí que vem o KeyError
    Object.keys(AUSENTES).forEach((k) => {
      if (!(k in event) && usa(k)) saida.push({ t: '', nota: 'sem "' + k + '": ' + AUSENTES[k] + ', então a chave nem existe', falta: true });
    });
    return saida;
  }

  function htmlEntrou(dep) {
    if (dep.carga) return '<p class="dep-vazio">Ninguém entrou ainda. É o <b>cold start</b>: a Lambda estava dormindo e o Python está lendo o arquivo pela primeira vez.</p>';
    const exec = atual.resultados[dep.i].exec;
    const codigo = atual.codigoRodado || '';
    const linhas = linhasEvent(exec.event, codigo);
    const usaContext = /\bcontext\s*\./.test(codigo.replace(/#.*$/gm, ''));
    let h = '<div class="dep-mini"><code>event</code> é o pedido do gato, montado pelo API Gateway</div><div class="codigo">';
    h += linhas.map((l) => '<div class="linha' + (l.usa ? ' usa' : '') + (l.falta ? ' falta' : '') + '">' + esc(l.t) + (l.nota ? (l.t ? '  ' : '') + '<span class="h-com"># ' + esc(l.nota) + '</span>' : '') + '</div>').join('');
    h += '</div>';
    if (linhas.some((l) => l.usa)) h += '<div class="dep-legenda"><span class="dep-amostra"></span> chaves que o seu código lê</div>';
    h += '<div class="dep-mini"><code>context</code> são dados da execução, não do pedido' + (usaContext ? '' : ' (seu código não usa, e em API quase ninguém usa)') + '</div><div class="codigo">';
    const ctx = exec.context || {};
    h += Object.keys(ctx).map((k) => '<div class="linha">context.' + esc(k) + (k.endsWith('()') ? '  → ' : ' = ') + esc(JSON.stringify(ctx[k])) + '</div>').join('');
    return h + '</div>';
  }

  function htmlAgora(dep) {
    const p = dep.passos[dep.k];
    if (!p) return '<p class="dep-vazio">…</p>';
    const fonte = (atual.codigoRodado || '').split('\n');
    const trecho = (fonte[p.n - 1] || '').trim();
    let titulo;
    let texto = '';
    if (dep.carga) {
      titulo = 'Cold start · linha ' + p.n;
      texto = 'Antes do primeiro pedido o Python lê o arquivo inteiro, de cima pra baixo, uma vez só. Cria as variáveis de fora e as funções. O handler ainda não rodou.';
    } else if (p.t === 'c') {
      titulo = p.f === 'handler' ? 'A Lambda chamou handler(event, context)' : 'Entrou em ' + p.f + '()';
      texto = p.f === 'handler' ? 'Os dois chegam prontos: quem monta é a AWS, não você.' : 'Os valores passados viram as variáveis daqui de dentro.';
    } else if (p.t === 'l') {
      titulo = 'Linha ' + p.n + (p.f !== 'handler' ? ' · dentro de ' + p.f + '()' : '');
    } else if (p.t === 'x') {
      titulo = 'Linha ' + p.n + ' deu ' + p.e;
      texto = dep.passos[dep.k + 1] ? 'Tem um except esperando esse erro: o código pula pra lá.' : 'Ninguém tratou esse erro. O handler para aqui, sem devolver nada.';
    } else {
      titulo = p.f === 'handler' ? 'O handler terminou' : p.f + '() devolveu';
      texto = p.f === 'handler' ? 'O que ele devolveu está na coluna 3.' : '';
    }
    let h = '<div class="dep-titulo' + (p.t === 'x' ? ' erro' : '') + '">' + esc(titulo) + '</div>';
    if (trecho && p.t !== 'c') h += '<pre class="dep-trecho">' + esc(trecho) + (p.ate > p.n ? '  …' : '') + '</pre>';
    if (texto) h += '<p class="dep-texto">' + esc(texto) + '</p>';
    if (p.t === 'r' && p.f !== 'handler') h += '<pre class="dep-trecho">' + esc(p.r) + '</pre>';
    if (!dep.carga) {
      const antes = {};
      const ant = dep.passos[dep.k - 1];
      if (ant && ant.f === p.f) ant.v.forEach((x) => (antes[x[0]] = x[1]));
      h += '<div class="dep-mini">variáveis' + (p.f !== 'handler' ? ' de ' + esc(p.f) + '()' : '') + '</div>';
      h += p.v.length
        ? p.v.map((x) => '<div class="dep-var' + (ant && ant.f === p.f && antes[x[0]] !== x[1] ? ' mudou' : '') + '"><b>' + esc(x[0]) + '</b> = ' + esc(x[1]) + '</div>').join('')
        : '<div class="dep-var vazio">nenhuma criada ainda (event e context estão na coluna 1)</div>';
    }
    return h + '<div class="dep-conta">passo ' + (dep.k + 1) + ' de ' + dep.passos.length + '</div>';
  }

  function htmlSaiu(dep) {
    if (dep.carga) return '<p class="dep-vazio">Ainda não tem pedido, então não tem resposta. Isto acontece uma vez, antes do primeiro gato.</p>';
    if (dep.k < dep.passos.length - 1) return '<p class="dep-vazio">O handler ainda está rodando…</p>';
    const res = atual.resultados[dep.i];
    const exec = res.exec;
    let h = '';
    if (!exec.temRetorno) {
      h += '<div class="dep-mini">o handler quebrou' + (res.erro && res.erro.linha ? ' na linha ' + res.erro.linha : '') + ' e não devolveu nada</div>';
      h += '<div class="dep-mini">o gateway entrega pro gato</div><div class="dep-http falha">HTTP 500</div><pre class="dep-trecho">{"message": "Internal Server Error"}</pre>';
      return h + '<p class="dep-texto">O gato nunca vê o seu erro. Quem vê é você, no log.</p>';
    }
    h += '<div class="dep-mini">o <code>return</code> do handler</div><pre class="dep-trecho">' + (exec.retorno === null ? 'None' : esc(JSON.stringify(exec.retorno, null, 2))) + '</pre>';
    if (exec.retorno === null) h += '<p class="dep-texto">None é o que o Python devolve quando a função acaba sem <code>return</code>.</p>';
    const r = res.resposta;
    h += '<div class="dep-mini">o gateway entrega pro gato</div><div class="dep-http ' + (res.ok ? 'ok' : 'falha') + '">HTTP ' + esc(String(r.status)) + '</div>';
    h += '<pre class="dep-trecho">' + (r.body === undefined || r.body === null ? '(corpo vazio)' : esc(typeof r.body === 'string' ? r.body : JSON.stringify(r.body))) + '</pre>';
    if (r.inferido) h += '<p class="dep-texto">Sem <code>statusCode</code> no retorno, o gateway assume 200 e manda o retorno inteiro como corpo.</p>';
    if (r.problema) h += '<p class="dep-texto">' + esc(r.problema) + '</p>';
    return h + '<div class="dep-veredito ' + (res.ok ? 'ok' : 'falha') + '">' + (res.ok ? '✓ era o que o gato esperava' : '✗ não era o esperado (o motivo está na aba Visitantes)') + '</div>';
  }

  function pintarDepurador() {
    if (!$('#depurador')) return;
    const dep = atual.dep;
    if (!dep) {
      $('#dep-quem').textContent = 'aperte Rodar';
      $('#dep-entrou').innerHTML = '<p class="dep-vazio">Cada gato chega com dois pacotes: <code>event</code> (o pedido dele) e <code>context</code> (dados da execução). Os dois aparecem aqui, do jeito que a Lambda recebe.</p>';
      $('#dep-agora').innerHTML = '<p class="dep-vazio">A linha que está rodando acende no editor. Aqui ficam as variáveis, com o valor que têm naquele momento.</p>';
      $('#dep-saiu').innerHTML = '<p class="dep-vazio">O que o <code>return</code> devolveu e o que o gateway entrega pro gato.</p>';
      atual.depEntrou = null;
      return;
    }
    const vis = dep.carga ? null : atual.nivel.visitantes[dep.i];
    $('#dep-quem').innerHTML = dep.carga
      ? 'cold start · antes do primeiro gato'
      : 'gato ' + (dep.i + 1) + ' de ' + atual.nivel.visitantes.length + ' · <b>' + esc(vis.nome) + '</b> · <code>' + esc(vis.pedido) + '</code>' +
        (dep.parado && !atual.rodando ? ' <button class="chip" id="dep-de-novo" type="button">↻ ver linha por linha</button>' : '');
    const deNovo = $('#dep-de-novo');
    if (deNovo) deNovo.addEventListener('click', () => repassar(dep.i));
    // a coluna 1 só é refeita quando muda o gato, pra não perder a rolagem a cada linha
    const chave = dep.carga ? 'carga' : dep.i;
    if (atual.depEntrou !== chave) {
      const caixa = $('#dep-entrou');
      caixa.innerHTML = htmlEntrou(dep);
      caixa.scrollTop = 0;
      // já rola até a primeira chave que o código lê, que é o que interessa nesse pedido
      const lida = $('.linha.usa, .linha.falta', caixa);
      if (lida) caixa.scrollTop = Math.max(0, lida.getBoundingClientRect().top - caixa.getBoundingClientRect().top - 70);
      atual.depEntrou = chave;
    }
    $('#dep-agora').innerHTML = htmlAgora(dep);
    $('#dep-saiu').innerHTML = htmlSaiu(dep);
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
        if (atual.aberto === i && !atual.rodando && atual.resultados && atual.resultados[i] && atual.resultados[i].exec) mostrarExec(i);
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
    limparDepurador();
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
    limparDepurador();
    atual.codigoRodado = codigo;
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
      const depura = nivel.tipo === 'python';
      const ritmo = RITMOS[velocidade()];
      const ainda = (vivo) => () => vivo() && atual === sessao && atual.resultados === r.resultados;
      await atual.cena.tocar(fila, r.resultados, {
        ritmo,
        aoAcordar: depura ? (vivo) => depurar({ i: -1, carga: true, passos: r.rastroCarga || [] }, ritmo, ainda(vivo)) : null,
        aoExecutar: depura ? (i, vivo) => depurar({ i, passos: r.resultados[i].exec.rastro }, ritmo, ainda(vivo)) : null,
        aoResolver: (i) => {
          if (atual !== sessao) return;
          atual.mostrados = i + 1;
          if (atual.aba === 'visitantes') painelVisitantes();
          atualizarBarra();
        },
      });
      if (atual !== sessao) return;
      if (atual.resultados !== r.resultados) {
        // ela apertou Reiniciar no meio da cena: esta rodada não vale mais
        atual.rodando = false;
        $('#rodar').disabled = false;
        return;
      }
      atual.editor.desapontar();
      atual.mostrados = r.resultados.length;
      const primeiraFalha = r.resultados.findIndex((x) => !x.ok);
      atual.aberto = primeiraFalha;
      if (depura) mostrarExec(primeiraFalha < 0 ? r.resultados.length - 1 : primeiraFalha);
      if (primeiraFalha < 0) vitoria();
    }
    atual.rodando = false;
    $('#rodar').disabled = false;
    if (atual.aba === 'visitantes') painelVisitantes();
    pintarDepurador(); // agora que a cena acabou, aparece o botão de rever um gato linha por linha
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
