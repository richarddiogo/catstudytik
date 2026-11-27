/* Turno 3: O Desconfiado (TypeScript e RxJS, a base do Angular).
   O TypeScript é transpilado no navegador e roda com o RxJS de verdade. */
(function () {
  const B = (window.BECO = window.BECO || {});
  B.mundos = B.mundos || [];
  const ts = String.raw;

  const G = [
    { id: 1, nome: 'Fuligem', cor: 'preto' },
    { id: 2, nome: 'Ferrugem', cor: 'laranja' },
    { id: 3, nome: 'Neblina', cor: 'cinza' },
    { id: 4, nome: 'Breu', cor: 'preto' },
  ];
  const copia = (x) => JSON.parse(JSON.stringify(x));

  function precisa(m, nome) {
    if (typeof m[nome] !== 'function') throw new Error('Não achei "export function ' + nome + '". Ela precisa do export na frente.');
    return m[nome];
  }
  function coletar(obs, rx) {
    if (!obs || typeof obs.subscribe !== 'function') throw new Error('A função tinha que devolver um Observable (não esqueça o return).');
    const saida = [];
    let erro = null;
    obs.subscribe({ next: (v) => saida.push(v), error: (e) => (erro = e) });
    if (erro) throw erro;
    return saida;
  }

  const INTERFACE = ts`interface Gato {
  id: number;
  nome: string;
  cor: string;
}`;

  B.mundos.push({
    id: 'rxjs',
    nome: 'O Desconfiado',
    assunto: 'TypeScript e RxJS, a base do Angular',
    retrato: 'assets/desconfiado.webp',
    mascote: 'desconfiado',
    fala: 'Só se mexe se tiver alguém olhando. Sem plateia, não faz nada.',
    linguagem: 'typescript',
    arquivo: 'gatos.ts',
    niveis: [
      {
        id: 'rxjs-1',
        titulo: 'Schema vira interface',
        tipo: 'ts',
        sabe: 'No Glue Catalog a tabela tem colunas e tipos: <code>id bigint, nome string, cor string</code>.',
        aqui: 'No TypeScript o formato do dado é uma <code>interface</code>. A diferença boa: o editor confere enquanto você digita, antes de rodar. <code>Gato[]</code> é "lista de Gato". Uma função precisa de <code>export</code> pra ser usada fora do arquivo.',
        missao: 'Complete a interface <code>Gato</code> e escreva <code>nomes(gatos)</code>, que devolve só os nomes, na mesma ordem.',
        inicial: ts`interface Gato {
  id: number;
  // faltam nome e cor
}

export function nomes(gatos: Gato[]): string[] {
  return []; // TODO: use gatos.map(...) pra pegar o nome de cada um
}
`,
        cola: 'Campo de interface: <code>nome: string;</code>. Transformar cada item de uma lista: <code>lista.map((item) => item.campo)</code>.',
        solucao: ts`${INTERFACE}

export function nomes(gatos: Gato[]): string[] {
  return gatos.map((g) => g.nome);
}
`,
        dicas: ['<code>.map()</code> é o <code>SELECT nome</code>: transforma cada item em outra coisa.', '<code>return gatos.map((g) => g.nome);</code>'],
        visitantes: [
          { nome: 'Fuligem', pelo: 'preto', pedido: 'nomes(os 4 gatos)', rodar: (m) => precisa(m, 'nomes')(copia(G)), espera: ['Fuligem', 'Ferrugem', 'Neblina', 'Breu'] },
          { nome: 'Neblina', pelo: 'cinza', pedido: 'nomes([Neblina])', rodar: (m) => precisa(m, 'nomes')([copia(G[2])]), espera: ['Neblina'] },
          { nome: 'Vazio', pelo: 'branco', pedido: 'nomes([])', rodar: (m) => precisa(m, 'nomes')([]), espera: [], oculto: true },
        ],
        relatorio:
          'Aviso honesto: este jogo roda seu TypeScript <b>sem conferir os tipos</b>, então a interface incompleta teria passado. No VS Code e no Angular de verdade, <code>g.nome</code> ficaria sublinhado de vermelho até você declarar o campo. Tipo no TS é checagem na hora de escrever. Na hora de rodar ele some.',
      },
      {
        id: 'rxjs-2',
        titulo: 'WHERE sem SQL',
        tipo: 'ts',
        sabe: 'PySpark: <code>df.filter(col("cor") == "preto").select("nome").orderBy("nome")</code>.',
        aqui: 'Em listas do TypeScript a cadeia é quase a mesma: <code>.filter()</code>, <code>.map()</code>, <code>.sort()</code>. Texto se compara com <code>===</code> e se ordena com <code>a.localeCompare(b)</code>.',
        missao: 'Escreva <code>pretosPorNome(gatos)</code>: os nomes dos gatos de cor <code>preto</code>, em ordem alfabética.',
        inicial: ts`${INTERFACE}

export function pretosPorNome(gatos: Gato[]): string[] {
  const pretos = gatos.filter((g) => true); // TODO 1: só os de cor 'preto'
  const nomes = pretos.map((g) => g.nome);
  return nomes; // TODO 2: em ordem alfabética
}
`,
        cola: '<code>.filter((g) => condição)</code> fica com os itens em que a condição é verdadeira. Igualdade é <code>===</code>. Ordem alfabética: <code>.sort((a, b) => a.localeCompare(b))</code>.',
        solucao: ts`${INTERFACE}

export function pretosPorNome(gatos: Gato[]): string[] {
  return gatos
    .filter((g) => g.cor === 'preto')
    .map((g) => g.nome)
    .sort((a, b) => a.localeCompare(b));
}
`,
        dicas: ['Filtre antes de mapear: depois do <code>.map()</code> você só tem o nome e perdeu a cor.', '<code>gatos.filter((g) => g.cor === \'preto\').map((g) => g.nome).sort((a, b) => a.localeCompare(b))</code>'],
        visitantes: [
          { nome: 'Fuligem', pelo: 'preto', pedido: 'pretosPorNome(os 4 gatos)', rodar: (m) => precisa(m, 'pretosPorNome')(copia(G)), espera: ['Breu', 'Fuligem'] },
          { nome: 'Ferrugem', pelo: 'laranja', pedido: 'pretosPorNome(só laranjas)', rodar: (m) => precisa(m, 'pretosPorNome')([copia(G[1])]), espera: [] },
          {
            nome: 'Graxa',
            pelo: 'preto',
            pedido: 'pretosPorNome(Sombra, Graxa, Breu)',
            rodar: (m) => precisa(m, 'pretosPorNome')([{ id: 9, nome: 'Sombra', cor: 'preto' }, { id: 8, nome: 'Graxa', cor: 'preto' }, { id: 4, nome: 'Breu', cor: 'preto' }]),
            espera: ['Breu', 'Graxa', 'Sombra'],
            oculto: true,
          },
        ],
        relatorio:
          'Parece Spark, mas tem uma diferença que morde: aqui cada <code>.filter()</code> e <code>.map()</code> <b>roda na hora</b> e cria uma lista nova. No Spark nada rodava até a action. Quem se comporta como o Spark é o Observable, na próxima fase. E cuidado: <code>.sort()</code> ordena a própria lista, não uma cópia.',
      },
      {
        id: 'rxjs-3',
        titulo: 'Só anda se alguém olhar',
        tipo: 'ts',
        sabe: 'No Spark, <code>filter</code> e <code>select</code> não fazem nada sozinhos. Só montam o plano. Quem dispara é a action: <code>.collect()</code>, <code>.write</code>.',
        aqui: 'Observable é a mesma ideia. <code>.pipe(filter(...), map(...))</code> só monta o plano. Quem dispara é o <code>.subscribe()</code>. No Angular, quase tudo que demora (chamada HTTP, clique, digitação) chega como Observable.',
        missao: 'Escreva <code>nomesPretos$(gatos$)</code>: recebe um Observable de gatos e devolve um Observable com os nomes dos pretos. <b>Não</b> dê subscribe dentro da função. Quem assina é quem vai usar.',
        inicial: ts`import { Observable, filter, map } from 'rxjs';

${INTERFACE}

export function nomesPretos$(gatos$: Observable<Gato>): Observable<string> {
  return gatos$.pipe(
    filter((g) => true), // TODO 1: só os de cor 'preto'
    map((g) => g), // TODO 2: devolva só o nome
  );
}
`,
        cola: '<code>filter((g) => condição)</code> e <code>map((g) => valor)</code> funcionam como os das listas, só que vão dentro do <code>pipe(...)</code>, separados por vírgula.',
        solucao: ts`import { Observable, filter, map } from 'rxjs';

${INTERFACE}

export function nomesPretos$(gatos$: Observable<Gato>): Observable<string> {
  return gatos$.pipe(
    filter((g) => g.cor === 'preto'),
    map((g) => g.nome),
  );
}
`,
        dicas: ['Dentro do <code>pipe</code>, cada operador recebe uma função, igual ao <code>.filter()</code> e <code>.map()</code> das listas.', '<code>filter((g) => g.cor === \'preto\'), map((g) => g.nome)</code>'],
        visitantes: [
          { nome: 'Fuligem', pelo: 'preto', pedido: 'assina nomesPretos$(4 gatos)', rodar: (m, rx) => coletar(precisa(m, 'nomesPretos$')(rx.from(copia(G))), rx), espera: ['Fuligem', 'Breu'] },
          { nome: 'Ferrugem', pelo: 'laranja', pedido: 'assina nomesPretos$(só laranja)', rodar: (m, rx) => coletar(precisa(m, 'nomesPretos$')(rx.of(copia(G[1]))), rx), espera: [] },
          {
            nome: 'Desconfiado',
            pelo: 'preto',
            pedido: 'chama a função e NÃO assina',
            rodar: (m, rx) => {
              let assinaturas = 0;
              const fonte = new rx.Observable((s) => {
                assinaturas++;
                s.complete();
              });
              precisa(m, 'nomesPretos$')(fonte);
              return assinaturas === 0 ? 'ninguém se mexeu' : 'a função assinou sozinha ' + assinaturas + 'x';
            },
            espera: 'ninguém se mexeu',
          },
        ],
        relatorio:
          'O terceiro visitante chamou sua função e foi embora sem assinar, e nada rodou. É assim que tem que ser. No Angular, quem assina costuma ser o próprio template, com <code>| async</code>, e ele também cancela a assinatura sozinho quando a tela fecha. O <code>$</code> no fim do nome é só costume pra dizer "isto é um Observable".',
      },
      {
        id: 'rxjs-4',
        titulo: 'GROUP BY no fluxo',
        tipo: 'ts',
        sabe: 'SQL: <code>SELECT cor, COUNT(*) FROM gatos GROUP BY cor</code>.',
        aqui: 'Num Observable, quem junta tudo num valor só é o <code>reduce</code>: ele vai acumulando e emite <b>uma vez</b>, quando a fonte termina. O acumulador aqui é um objeto <code>{ cor: quantidade }</code>, que no TS se escreve <code>Record&lt;string, number&gt;</code>.',
        missao: 'Escreva <code>contagemPorCor$(gatos$)</code>: emite um único objeto com a quantidade de gatos por cor.',
        inicial: ts`import { Observable, reduce } from 'rxjs';

${INTERFACE}

export function contagemPorCor$(gatos$: Observable<Gato>): Observable<Record<string, number>> {
  return gatos$.pipe(
    reduce((contagem, gato) => {
      // TODO: some 1 em contagem[gato.cor]
      return contagem;
    }, {} as Record<string, number>),
  );
}
`,
        cola: '<code>objeto[chave]</code> lê ou grava um campo pelo nome. <code>(valor || 0)</code> usa 0 quando o valor ainda não existe.',
        solucao: ts`import { Observable, reduce } from 'rxjs';

${INTERFACE}

export function contagemPorCor$(gatos$: Observable<Gato>): Observable<Record<string, number>> {
  return gatos$.pipe(
    reduce((contagem, gato) => {
      contagem[gato.cor] = (contagem[gato.cor] || 0) + 1;
      return contagem;
    }, {} as Record<string, number>),
  );
}
`,
        dicas: ['Na primeira vez que uma cor aparece, <code>contagem[gato.cor]</code> é <code>undefined</code>.', '<code>contagem[gato.cor] = (contagem[gato.cor] || 0) + 1;</code>'],
        visitantes: [
          { nome: 'Fuligem', pelo: 'preto', pedido: 'assina contagemPorCor$(4 gatos)', rodar: (m, rx) => coletar(precisa(m, 'contagemPorCor$')(rx.from(copia(G))), rx), espera: [{ preto: 2, laranja: 1, cinza: 1 }] },
          { nome: 'Neblina', pelo: 'cinza', pedido: 'assina contagemPorCor$(3 cinzas)', rodar: (m, rx) => coletar(precisa(m, 'contagemPorCor$')(rx.from([1, 2, 3].map((i) => ({ id: i, nome: 'G' + i, cor: 'cinza' })))), rx), espera: [{ cinza: 3 }] },
          { nome: 'Vazio', pelo: 'branco', pedido: 'assina contagemPorCor$(nenhum gato)', rodar: (m, rx) => coletar(precisa(m, 'contagemPorCor$')(rx.EMPTY), rx), espera: [{}], oculto: true },
        ],
        relatorio:
          '<code>reduce</code> só emite quando a fonte <b>termina</b>. Uma lista termina, uma resposta HTTP termina. Clique de botão e digitação nunca terminam, e aí o <code>reduce</code> ficaria mudo pra sempre. Pra esses existe o <code>scan</code>, que emite o acumulado a cada item. É a diferença entre batch e streaming, que você já conhece.',
      },
      {
        id: 'rxjs-5',
        titulo: 'A busca que não se atropela',
        chefe: true,
        tipo: 'ts',
        sabe: 'Num pipeline, se chega uma versão nova do arquivo enquanto a antiga ainda está processando, você não quer que o resultado velho sobrescreva o novo.',
        aqui: 'Campo de busca tem o mesmo problema: a pessoa digita <code>fu</code>, depois <code>fer</code>, e a resposta de <code>fu</code> pode chegar <b>depois</b>. O <code>switchMap</code> resolve: a cada termo novo ele troca pra chamada nova e larga a antiga. <code>distinctUntilChanged</code> ignora termo repetido em seguida.',
        missao: 'Complete <code>busca$(termos$, api)</code>: ignore termos com menos de 2 letras, ignore termo repetido em seguida, e entregue só o resultado da busca mais recente. A estrutura já está montada: são três <code>TODO</code>.',
        inicial: ts`import { Observable, filter, distinctUntilChanged, switchMap, mergeMap } from 'rxjs';

${INTERFACE}

export function busca$(
  termos$: Observable<string>,
  api: (termo: string) => Observable<Gato[]>,
): Observable<Gato[]> {
  return termos$.pipe(
    filter((termo) => true), // TODO 1: só termos com 2 letras ou mais
    // TODO 2: uma linha aqui com distinctUntilChanged(), pra ignorar termo repetido em seguida
    mergeMap((termo) => api(termo)), // TODO 3: mergeMap deixa as buscas se atropelarem. Troque por switchMap
  );
}
`,
        cola: '<code>texto.length</code> é o tamanho do texto. <code>distinctUntilChanged()</code> não recebe nada entre os parênteses. <code>switchMap</code> se usa igual ao <code>mergeMap</code>: é só trocar o nome.',
        solucao: ts`import { Observable, filter, distinctUntilChanged, switchMap, mergeMap } from 'rxjs';

${INTERFACE}

export function busca$(
  termos$: Observable<string>,
  api: (termo: string) => Observable<Gato[]>,
): Observable<Gato[]> {
  return termos$.pipe(
    filter((termo) => termo.length >= 2),
    distinctUntilChanged(),
    switchMap((termo) => api(termo)),
  );
}
`,
        dicas: [
          'A ordem dentro do <code>pipe</code> importa: primeiro corta os termos curtos, depois tira os repetidos, por último chama a API.',
          '<code>mergeMap</code> deixa todas as chamadas correndo juntas. <code>switchMap</code> fica só com a última. Troque um pelo outro e ponha <code>filter((termo) => termo.length >= 2)</code> e <code>distinctUntilChanged()</code> antes.',
        ],
        visitantes: [
          {
            nome: 'Apressado',
            pelo: 'laranja',
            pedido: 'digita f, fu, fu, fer',
            rodar: (m, rx) => {
              const chamadas = [];
              const api = (t) => {
                chamadas.push(t);
                return rx.of([]);
              };
              coletar(precisa(m, 'busca$')(rx.from(['f', 'fu', 'fu', 'fer']), api), rx);
              return { apiChamadaCom: chamadas };
            },
            espera: { apiChamadaCom: ['fu', 'fer'] },
          },
          {
            nome: 'Fuligem',
            pelo: 'preto',
            pedido: 'digita fu e recebe a resposta',
            rodar: (m, rx) => coletar(precisa(m, 'busca$')(rx.of('fu'), () => rx.of([copia(G[0])])), rx),
            espera: [[G[0]]],
          },
          {
            nome: 'Internet lenta',
            pelo: 'cinza',
            pedido: 'digita fu, depois fer; a resposta de fu chega atrasada',
            rodar: (m, rx) => {
              const termos = new rx.Subject();
              const pendentes = {};
              const api = (t) => (pendentes[t] = new rx.Subject());
              const tela = [];
              const obs = precisa(m, 'busca$')(termos, api);
              if (!obs || typeof obs.subscribe !== 'function') throw new Error('A função tinha que devolver um Observable.');
              obs.subscribe((r) => tela.push(r.map((g) => g.nome)));
              termos.next('fu');
              termos.next('fer');
              if (!pendentes.fu || !pendentes.fer) throw new Error('A api não foi chamada pros dois termos (fu e fer).');
              pendentes.fer.next([copia(G[1])]);
              pendentes.fu.next([copia(G[0])]);
              return { naTela: tela };
            },
            espera: { naTela: [['Ferrugem']] },
          },
          {
            nome: 'Indeciso',
            pelo: 'malhado',
            pedido: 'digita fu, fer, fu (voltou atrás)',
            rodar: (m, rx) => {
              const chamadas = [];
              const api = (t) => {
                chamadas.push(t);
                return rx.of([]);
              };
              coletar(precisa(m, 'busca$')(rx.from(['fu', 'fer', 'fu']), api), rx);
              return { apiChamadaCom: chamadas };
            },
            espera: { apiChamadaCom: ['fu', 'fer', 'fu'] },
            oculto: true,
          },
        ],
        relatorio:
          'O visitante da internet lenta é o bug mais comum de campo de busca: a pessoa digitou <code>fer</code> e a tela mostrou o resultado de <code>fu</code>. Com <code>switchMap</code> a resposta atrasada é descartada. No Angular de verdade esse mesmo <code>pipe</code> ganha um <code>debounceTime(300)</code> no começo, pra não chamar a API a cada tecla, e o <code>api</code> é o <code>HttpClient</code> batendo na Lambda que você escreveu no turno 1.',
      },
    ],
  });
})();
