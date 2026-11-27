/* A cena do beco: cada teste é um gato que anda até a porta com um pedido.
   Pixel art desenhada por código num canvas de 256x120, ampliado sem suavização. */
(function () {
  const B = (window.BECO = window.BECO || {});
  const L = 256;
  const A = 120;
  const CHAO = 100; // linha dos pés
  const PORTA_X = 184;
  const PARADA_X = 158;

  const PELOS = {
    preto: { B: '#1c1c26', K: '#050508', E: '#f0d94a', P: '#b0667a', W: '#3c3c4a' },
    laranja: { B: '#d8812a', K: '#74390f', E: '#20301a', P: '#f2a0a0', W: '#f3dcb8' },
    cinza: { B: '#8b90a0', K: '#3b3f4e', E: '#1e2c14', P: '#d99aa6', W: '#dadde6' },
    branco: { B: '#e7e7ec', K: '#77798a', E: '#2f5f9a', P: '#e69aa8', W: '#ffffff' },
    malhado: { B: '#a8744a', K: '#472c18', E: '#1c2812', P: '#e2a0a0', W: '#ecdcc2' },
  };

  const SPRITES = {
    anda1: [
      '...............K...K.',
      '..............KBK.KBK',
      '..............KBBKBBK',
      '.K............KBBBBBK',
      'KBK...........KBEBEBK',
      'KBK...........KBBBPBK',
      '.KBK.KKKKKKKKKKBBBBK.',
      '.KBBKBBBBBBBBBBBBBK..',
      '..KBBBBBBBBBBBBBBBK..',
      '..KBBBBBBBBBBBBBBK...',
      '..KBBBBBBBBBBBBBBK...',
      '..KBBKBBKKKKKBBKBBK..',
      '..KBK.KBK...KBK.KBK..',
      '..KWK.KWK...KWK.KWK..',
      '..KKK.KKK...KKK.KKK..',
    ],
    anda2: [
      '...............K...K.',
      '..............KBK.KBK',
      '..............KBBKBBK',
      '..............KBBBBBK',
      '.KK...........KBEBEBK',
      'KBBK..........KBBBPBK',
      '.KBK.KKKKKKKKKKBBBBK.',
      '.KBBKBBBBBBBBBBBBBK..',
      '..KBBBBBBBBBBBBBBBK..',
      '..KBBBBBBBBBBBBBBK...',
      '..KBBBBBBBBBBBBBBK...',
      '..KBBBKBBKKKKBBBKBK..',
      '...KBKKBK....KBKKBK..',
      '...KWKKWK....KWKKWK..',
      '...KKKKKK....KKKKKK..',
    ],
    sentado: [
      '.K.......K.',
      'KBK.....KBK',
      'KBBKKKKKBBK',
      'KBBBBBBBBBK',
      'KBEBBBBBEBK',
      'KBBBBPBBBBK',
      '.KBBBBBBBK.',
      '.KBBBBBBBK.',
      'KBBBWWWBBBK',
      'KBBWWWWWBBK',
      'KBBWWWWWBBK',
      'KBBBWWWBBBK',
      'KBBKBBBKBBK',
      '.KKWKKKWKK.',
    ],
    olhofechado: [
      '.K.......K.',
      'KBK.....KBK',
      'KBBKKKKKBBK',
      'KBBBBBBBBBK',
      'KKKBBBBBKKK',
      'KBBBBPBBBBK',
      '.KBBBBBBBK.',
      '.KBBBBBBBK.',
      'KBBBWWWBBBK',
      'KBBWWWWWBBK',
      'KBBWWWWWBBK',
      'KBBBWWWBBBK',
      'KBBKBBBKBBK',
      '.KKWKKKWKK.',
    ],
    dormindo: [
      '..K...K..........',
      '.KBK.KBK..KKKKK..',
      '.KBBKBBKKKBBBBBK.',
      'KBBBBBBBBBBBBBBBK',
      'KBKKBKKBBBBBBBBBK',
      'KBBBPBBBBBBBBBBBK',
      'KBBBBBBBBBBBBWWBK',
      '.KKKKKKKKKKKKKKK.',
    ],
  };

  const MASCOTES = {
    dorminhoco: { pelo: 'laranja', dorme: true },
    porteiro: { pelo: 'cinza', dorme: false },
    desconfiado: { pelo: 'preto', dorme: false },
  };

  const cache = {};
  function sprite(nome, pelo) {
    const chave = nome + ':' + pelo;
    if (cache[chave]) return cache[chave];
    const linhas = SPRITES[nome];
    const cores = PELOS[pelo] || PELOS.cinza;
    const c = document.createElement('canvas');
    c.width = Math.max.apply(null, linhas.map((l) => l.length));
    c.height = linhas.length;
    const x = c.getContext('2d');
    linhas.forEach((linha, j) => {
      for (let i = 0; i < linha.length; i++) {
        const cor = cores[linha[i]];
        if (!cor) continue;
        x.fillStyle = cor;
        x.fillRect(i, j, 1, 1);
      }
    });
    cache[chave] = c;
    return c;
  }

  // números pseudoaleatórios fixos, pra parede ser sempre a mesma
  function semente(s) {
    return function () {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
  }

  function desenharFundo() {
    const c = document.createElement('canvas');
    c.width = L;
    c.height = A;
    const x = c.getContext('2d');
    const r = semente(404);
    // céu
    x.fillStyle = '#0c0a15';
    x.fillRect(0, 0, L, 16);
    for (let i = 0; i < 26; i++) {
      x.fillStyle = r() > 0.7 ? '#f3e9c0' : '#6d6890';
      x.fillRect(Math.floor(r() * L), Math.floor(r() * 12), 1, 1);
    }
    x.fillStyle = '#efe6b8';
    x.fillRect(28, 3, 6, 6);
    x.fillStyle = '#0c0a15';
    x.fillRect(31, 2, 5, 5);
    // parede de tijolo
    x.fillStyle = '#3a3250';
    x.fillRect(0, 16, L, 76);
    for (let j = 0; j < 13; j++) {
      const y = 16 + j * 6;
      x.fillStyle = '#2c2540';
      x.fillRect(0, y, L, 1);
      for (let i = -1; i < 23; i++) {
        const bx = i * 12 + (j % 2 ? 6 : 0);
        x.fillStyle = '#2c2540';
        x.fillRect(bx, y, 1, 6);
        const sorte = r();
        if (sorte > 0.86) {
          x.fillStyle = '#453c5e';
          x.fillRect(bx + 1, y + 1, 11, 5);
        } else if (sorte < 0.1) {
          x.fillStyle = '#332b48';
          x.fillRect(bx + 1, y + 1, 11, 5);
        }
      }
    }
    x.fillStyle = '#1f1a2d';
    x.fillRect(0, 16, L, 2);
    // janela acesa
    x.fillStyle = '#1b1727';
    x.fillRect(58, 28, 30, 24);
    x.fillStyle = '#c9983f';
    x.fillRect(60, 30, 26, 20);
    x.fillStyle = '#e3b65a';
    x.fillRect(60, 30, 26, 6);
    x.fillStyle = '#1b1727';
    x.fillRect(72, 30, 2, 20);
    x.fillRect(60, 39, 26, 2);
    x.fillRect(56, 52, 34, 2);
    // cano
    x.fillStyle = '#231d33';
    x.fillRect(120, 16, 4, 76);
    x.fillStyle = '#4b4266';
    x.fillRect(120, 16, 1, 76);
    x.fillStyle = '#231d33';
    x.fillRect(118, 40, 8, 3);
    x.fillRect(118, 70, 8, 3);
    // chão
    x.fillStyle = '#34304a';
    x.fillRect(0, 92, L, 28);
    x.fillStyle = '#55507a';
    x.fillRect(0, 92, L, 1);
    x.fillStyle = '#2a2640';
    for (let i = 0; i < 9; i++) x.fillRect(Math.floor(r() * L), 96 + Math.floor(r() * 22), 10 + Math.floor(r() * 18), 1);
    x.fillStyle = '#2f3a5e';
    x.fillRect(86, 108, 22, 2);
    x.fillRect(90, 110, 14, 1);
    // lixeira
    x.fillStyle = '#4c5466';
    x.fillRect(18, 74, 18, 18);
    x.fillStyle = '#353b4a';
    x.fillRect(18, 74, 18, 2);
    x.fillRect(22, 78, 1, 12);
    x.fillRect(27, 78, 1, 12);
    x.fillRect(32, 78, 1, 12);
    x.fillStyle = '#5f687c';
    x.fillRect(16, 71, 22, 3);
    x.fillRect(25, 69, 4, 2);
    // placa
    x.fillStyle = '#14101e';
    x.fillRect(168, 20, 56, 14);
    x.fillStyle = '#5d4a2a';
    x.fillRect(169, 21, 54, 12);
    x.fillStyle = '#14101e';
    x.fillRect(170, 22, 52, 10);
    // porta
    x.fillStyle = '#17121f';
    x.fillRect(PORTA_X - 2, 50, 28, 42);
    x.fillStyle = '#5a3d24';
    x.fillRect(PORTA_X, 52, 24, 40);
    x.fillStyle = '#6d4b2c';
    x.fillRect(PORTA_X + 2, 54, 20, 16);
    x.fillRect(PORTA_X + 2, 73, 20, 17);
    x.fillStyle = '#4a321d';
    x.fillRect(PORTA_X + 2, 54, 20, 1);
    x.fillRect(PORTA_X + 2, 73, 20, 1);
    x.fillStyle = '#d9b45a';
    x.fillRect(PORTA_X + 19, 74, 2, 3);
    // suporte da lâmpada
    x.fillStyle = '#17121f';
    x.fillRect(PORTA_X + 11, 38, 2, 5);
    x.fillRect(PORTA_X + 8, 42, 8, 2);
    // caixote do mascote
    x.fillStyle = '#6b5233';
    x.fillRect(222, 76, 26, 16);
    x.fillStyle = '#4d3a22';
    x.fillRect(222, 76, 26, 1);
    x.fillRect(222, 91, 26, 1);
    x.fillRect(222, 76, 1, 16);
    x.fillRect(247, 76, 1, 16);
    x.fillRect(234, 76, 1, 16);
    x.fillRect(222, 83, 26, 1);
    return c;
  }

  const LAMPADAS = {
    apagada: { cor: '#8a6a2e', brilho: 'rgba(255,190,90,0.10)' },
    espera: { cor: '#ffc65a', brilho: 'rgba(255,198,90,0.22)' },
    ok: { cor: '#7be87a', brilho: 'rgba(123,232,122,0.30)' },
    falha: { cor: '#ff5a5a', brilho: 'rgba(255,90,90,0.32)' },
  };

  function Cena(canvas, sobre) {
    this.canvas = canvas;
    this.sobre = sobre;
    canvas.width = L;
    canvas.height = A;
    this.x = canvas.getContext('2d');
    this.x.imageSmoothingEnabled = false;
    this.fundo = desenharFundo();
    this.mascote = MASCOTES.dorminhoco;
    this.acordado = false;
    this.lampada = 'apagada';
    this.gato = null;
    this.rodada = 0;
    this.balaoPedido = this.criarBalao('balao balao-pedido');
    this.balaoPorta = this.criarBalao('balao balao-porta');
    this.rastro = this.criarBalao('rastro'); // só aparece no raio-X: mostra onde o JS está pintando o gato
    this.raioX = false;
    this.aoMexer = null; // avisado a cada mudança, pra aba "Por dentro" mostrar o JS rodando
    this.t0 = performance.now();
    const laco = (t) => {
      this.desenhar(t - this.t0);
      this.raf = requestAnimationFrame(laco);
    };
    this.raf = requestAnimationFrame(laco);
  }

  Cena.prototype.criarBalao = function (classe) {
    const d = document.createElement('div');
    d.className = classe + ' oculto';
    this.sobre.appendChild(d);
    return d;
  };

  Cena.prototype.diz = function (js, nota) {
    if (this.aoMexer) this.aoMexer(js, nota);
  };

  Cena.prototype.definirMundo = function (mascote) {
    this.mascote = MASCOTES[mascote] || MASCOTES.porteiro;
    this.limpar();
  };

  Cena.prototype.limpar = function () {
    this.rodada++;
    if (this._seguir) this._seguir(); // solta quem estava parado no passo a passo
    this.gato = null;
    this.lampada = 'apagada';
    this.acordado = false;
    this.balaoPedido.classList.add('oculto');
    this.balaoPorta.classList.add('oculto');
  };

  Cena.prototype.desenhar = function (t) {
    const x = this.x;
    x.drawImage(this.fundo, 0, 0);
    // lâmpada
    const lamp = LAMPADAS[this.lampada];
    const cx = PORTA_X + 12;
    const brilho = x.createRadialGradient(cx, 46, 1, cx, 46, 34);
    brilho.addColorStop(0, lamp.brilho);
    brilho.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = brilho;
    x.fillRect(cx - 34, 12, 68, 68);
    x.fillStyle = lamp.cor;
    x.fillRect(cx - 2, 44, 4, 4);
    x.fillStyle = '#fff6d8';
    if (this.lampada !== 'apagada') x.fillRect(cx - 1, 45, 1, 1);
    // mascote
    const m = this.mascote;
    if (m.dorme && !this.acordado) {
      x.drawImage(sprite('dormindo', m.pelo), 226, 68);
      const fase = Math.floor(t / 600) % 3;
      x.fillStyle = '#cfc8ee';
      x.font = '6px monospace';
      x.fillText('z', 232 - fase * 2, 62 - fase * 4);
    } else {
      const pisca = Math.floor(t / 150) % 22 === 0;
      x.drawImage(sprite(pisca ? 'olhofechado' : 'sentado', m.pelo), 229, 62);
    }
    // visitante
    const g = this.gato;
    if (g) {
      const quadro = g.andando && Math.floor(t / 110) % 2 ? 'anda2' : 'anda1';
      const img = sprite(quadro, g.pelo);
      const gx = Math.round(g.x + (g.treme ? Math.sin(t / 22) * 1.4 : 0));
      x.save();
      x.globalAlpha = g.alfa;
      if (g.viradoEsq) {
        x.translate(gx + img.width, CHAO - img.height);
        x.scale(-1, 1);
        x.drawImage(img, 0, 0);
      } else {
        x.drawImage(img, gx, CHAO - img.height);
      }
      x.restore();
      this.balaoPedido.style.left = Math.max(2, Math.min(60, ((g.x + 10) / L) * 100)) + '%';
      if (this.raioX) {
        const r = this.rastro.style;
        r.left = (gx / L) * 100 + '%';
        r.top = ((CHAO - img.height) / A) * 100 + '%';
        r.width = (img.width / L) * 100 + '%';
        r.height = (img.height / A) * 100 + '%';
        this.rastro.dataset.js = 'ctx.drawImage(gato, ' + gx + ', ' + (CHAO - img.height) + ')';
      }
    }
    this.rastro.classList.toggle('oculto', !(g && this.raioX));
  };

  Cena.prototype.animar = function (ms, passo, rodada) {
    return new Promise((ok) => {
      if (ms <= 0) {
        passo(1);
        return ok();
      }
      const ini = performance.now();
      const tick = (agora) => {
        if (rodada !== this.rodada) return ok();
        const p = Math.min(1, (agora - ini) / ms);
        passo(p);
        if (p < 1) requestAnimationFrame(tick);
        else ok();
      };
      requestAnimationFrame(tick);
    });
  };

  Cena.prototype.esperar = function (ms, rodada) {
    return new Promise((ok) => setTimeout(ok, ms)).then(() => rodada === this.rodada);
  };

  /* Passo a passo (aba "Por dentro"): a cena para aqui até alguém chamar avancar(). */
  Cena.prototype.ponto = function (rodada) {
    if (!this.passoAPasso || !this.raioX || rodada !== this.rodada) return Promise.resolve(rodada === this.rodada);
    return new Promise((ok) => {
      this._seguir = () => {
        this._seguir = null;
        if (this.aoPausar) this.aoPausar(false);
        ok(rodada === this.rodada);
      };
      if (this.aoPausar) this.aoPausar(true);
    });
  };
  Cena.prototype.avancar = function () {
    if (this._seguir) this._seguir();
  };
  Cena.prototype.pausada = function () {
    return !!this._seguir;
  };

  /* Toca a fila de visitantes. aoResolver(i) é chamado quando o gato i recebe a resposta. */
  Cena.prototype.tocar = async function (visitantes, resultados, opcoes) {
    this.limpar();
    const rodada = this.rodada;
    const v = opcoes.ritmo || (opcoes.rapido ? 0.22 : 1);
    const vivo = () => rodada === this.rodada;
    for (let i = 0; i < visitantes.length && vivo(); i++) {
      const vis = visitantes[i];
      const res = resultados[i];
      const g = (this.gato = { x: -24, pelo: vis.pelo, alfa: 1, andando: true, viradoEsq: false, treme: false });
      this.lampada = 'apagada';
      this.balaoPorta.classList.add('oculto');
      this.balaoPedido.classList.add('oculto');
      this.diz('gato = { pelo: "' + vis.pelo + '", x: -24 }', 'visitante ' + (i + 1) + ' nasce fora da tela');
      this.diz('ctx.drawImage(gato, gato.x, 85)', 'repetido a cada quadro, com x crescendo: é isso que faz ele andar');
      await this.animar(520 * v, (p) => (g.x = -24 + (PARADA_X + 24) * p), rodada);
      if (!vivo()) return;
      g.andando = false;
      this.balaoPedido.textContent = vis.pedido;
      this.balaoPedido.classList.remove('oculto');
      this.lampada = 'espera';
      this.diz('balaoPedido.textContent = ' + JSON.stringify(vis.pedido), 'troca o texto de dentro da tag');
      this.diz('balaoPedido.classList.remove("oculto")', 'tira a classe que escondia a tag: ela aparece');
      if (!(await this.ponto(rodada))) return;
      if (this.mascote.dorme && !this.acordado) {
        // partida a frio: a primeira chamada paga o tempo de levantar
        this.balaoPorta.textContent = 'cold start…';
        this.balaoPorta.className = 'balao balao-porta espera';
        this.diz('balaoPorta.className = "balao balao-porta espera"', 'a classe "espera" é o que deixa o balão amarelo (CSS)');
        if (!(await this.esperar(520 * v, rodada))) return;
        if (!(await this.ponto(rodada))) return;
        this.acordado = true;
      }
      if (!(await this.esperar(280 * v, rodada))) return;
      this.lampada = res.ok ? 'ok' : 'falha';
      this.balaoPorta.textContent = res.rotulo;
      this.balaoPorta.className = 'balao balao-porta ' + (res.ok ? 'ok' : 'falha');
      this.diz('balaoPorta.textContent = ' + JSON.stringify(res.rotulo), 'a resposta que o seu código devolveu');
      this.diz('balaoPorta.className = "balao balao-porta ' + (res.ok ? 'ok' : 'falha') + '"', res.ok ? 'classe "ok": o CSS pinta de verde' : 'classe "falha": o CSS pinta de vermelho');
      if (opcoes.aoResolver) opcoes.aoResolver(i);
      if (!(await this.ponto(rodada))) return;
      if (res.ok && vis.entra !== false) {
        if (!(await this.esperar(300 * v, rodada))) return;
        this.balaoPedido.classList.add('oculto');
        this.diz('balaoPedido.classList.add("oculto")', 'esconde a tag de novo (ela continua existindo)');
        g.andando = true;
        await this.animar(300 * v, (p) => {
          g.x = PARADA_X + (PORTA_X + 2 - PARADA_X) * p;
          g.alfa = 1 - p;
        }, rodada);
      } else {
        // barrado: se era pra barrar mesmo (res.ok), ele só dá meia-volta; se não, reclama antes
        g.treme = !res.ok;
        if (!(await this.esperar((res.ok ? 300 : 420) * v, rodada))) return;
        g.treme = false;
        this.balaoPedido.classList.add('oculto');
        this.diz('balaoPedido.classList.add("oculto")', 'esconde a tag de novo (ela continua existindo)');
        g.viradoEsq = true;
        g.andando = true;
        await this.animar(380 * v, (p) => (g.x = PARADA_X - (PARADA_X + 26) * p), rodada);
      }
      if (!vivo()) return;
      this.gato = null;
    }
    if (vivo()) {
      this.balaoPedido.classList.add('oculto');
      const todos = resultados.every((r) => r.ok);
      this.lampada = todos ? 'ok' : 'falha';
      this.balaoPorta.textContent = todos ? 'turno limpo' : 'tem gato do lado de fora';
      this.balaoPorta.className = 'balao balao-porta ' + (todos ? 'ok' : 'falha');
    }
  };

  B.Cena = Cena;
  B.PELOS = PELOS;
  B.sprite = sprite;
})();
