"""Gera e valida o contrato JSON do primeiro baralho."""

import argparse
import json
from pathlib import Path
import re
import sys
from tempfile import NamedTemporaryFile


RAIZ = Path(__file__).resolve().parent
FASE = "dados"
ORIGEM = RAIZ / "cards" / "dados.md"
SAIDA = RAIZ / "data" / "dados.json"
TIPOS = ("ponte", "armadilha", "desafio", "boss")
SLUG = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*")


class ErroBaralho(ValueError):
    """O baralho não segue o formato ou o contrato esperado."""


def campos_objeto(valor, caminho, campos):
    if not isinstance(valor, dict):
        raise ErroBaralho(f"{caminho} deve ser um objeto")
    faltando = campos - valor.keys()
    if faltando:
        raise ErroBaralho(f"{caminho}: campo obrigatório ausente: {', '.join(sorted(faltando))}")
    extras = valor.keys() - campos
    if extras:
        raise ErroBaralho(f"{caminho}: campo desconhecido: {', '.join(sorted(extras))}")


def texto_obrigatorio(valor, caminho):
    if not isinstance(valor, str) or not valor.strip():
        raise ErroBaralho(f"{caminho} deve ser texto não vazio")


def validar_baralho(baralho, fase_esperada):
    campos_objeto(baralho, "baralho", {"fase", "cards"})
    if baralho["fase"] != fase_esperada:
        raise ErroBaralho(f"baralho.fase deve ser {fase_esperada!r}")

    cards = baralho["cards"]
    if not isinstance(cards, list) or len(cards) != len(TIPOS):
        raise ErroBaralho(f"baralho.cards deve conter {len(TIPOS)} cards")

    ids = set()
    for indice, (card, tipo) in enumerate(zip(cards, TIPOS)):
        caminho = f"cards[{indice}]"
        campos_objeto(card, caminho, {"id", "tipo", "titulo", "texto", "exemplos"})
        for campo in ("id", "titulo", "texto"):
            texto_obrigatorio(card[campo], f"{caminho}.{campo}")

        identificador = card["id"]
        if not SLUG.fullmatch(identificador) or not identificador.startswith(f"{fase_esperada}-"):
            raise ErroBaralho(f"{caminho}.id deve começar com {fase_esperada}- e usar minúsculas, números e hífens")
        if identificador in ids:
            raise ErroBaralho(f"{caminho}.id duplicado: {identificador}")
        ids.add(identificador)

        if card["tipo"] != tipo:
            raise ErroBaralho(f"{caminho}.tipo deve ser {tipo!r}")

        exemplos = card["exemplos"]
        if not isinstance(exemplos, list) or not exemplos:
            raise ErroBaralho(f"{caminho}.exemplos deve conter ao menos um item")
        for posicao, exemplo in enumerate(exemplos):
            local = f"{caminho}.exemplos[{posicao}]"
            campos_objeto(exemplo, local, {"rotulo", "conteudo"})
            for campo in ("rotulo", "conteudo"):
                texto_obrigatorio(exemplo[campo], f"{local}.{campo}")


def carregar_markdown(origem, fase):
    """Lê o formato dos cards e devolve o baralho validado."""
    linhas = origem.read_text(encoding="utf-8-sig").splitlines()
    if not linhas or not linhas[0].startswith("# ") or not linhas[0][2:].strip():
        raise ErroBaralho(f"{origem}:1: título do baralho obrigatório (# Título)")

    cards = []
    paragrafos = []
    card = None
    for numero, linha in enumerate(linhas[1:], start=2):
        linha = linha.strip()
        if not linha:
            continue
        if linha.startswith("## "):
            if card is not None:
                card["texto"] = " ".join(paragrafos)
            partes = [parte.strip() for parte in linha[3:].split("|", 2)]
            if len(partes) != 3:
                raise ErroBaralho(f"{origem}:{numero}: use ## id | tipo | título")
            identificador, tipo, titulo = partes
            card = {"id": identificador, "tipo": tipo, "titulo": titulo, "texto": "", "exemplos": []}
            cards.append(card)
            paragrafos = []
        elif card is None:
            raise ErroBaralho(f"{origem}:{numero}: conteúdo antes do primeiro card")
        elif linha.startswith("- "):
            rotulo, separador, conteudo = linha[2:].partition("|")
            if not separador:
                raise ErroBaralho(f"{origem}:{numero}: use - RÓTULO | exemplo")
            card["exemplos"].append({"rotulo": rotulo.strip(), "conteudo": conteudo.strip()})
        else:
            paragrafos.append(linha)

    if card is not None:
        card["texto"] = " ".join(paragrafos)
    baralho = {"fase": fase, "cards": cards}
    validar_baralho(baralho, fase)
    return baralho


def objeto_sem_chaves_duplicadas(pares):
    resultado = dict(pares)
    if len(resultado) != len(pares):
        raise ErroBaralho("JSON contém uma chave repetida em um objeto")
    return resultado


def carregar_json(arquivo, fase):
    baralho = json.loads(arquivo.read_text(encoding="utf-8"), object_pairs_hook=objeto_sem_chaves_duplicadas)
    validar_baralho(baralho, fase)
    return baralho


def gravar_json(baralho, saida):
    """Substitui a saída completa depois de escrever o arquivo temporário."""
    conteudo = json.dumps(baralho, ensure_ascii=False, indent=2) + "\n"
    saida.parent.mkdir(parents=True, exist_ok=True)
    with NamedTemporaryFile("w", encoding="utf-8", dir=saida.parent, delete=False) as arquivo:
        temporario = Path(arquivo.name)
        try:
            arquivo.write(conteudo)
            arquivo.close()
            temporario.replace(saida)
        finally:
            temporario.unlink(missing_ok=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    comandos = parser.add_subparsers(dest="comando", required=True)
    gerar = comandos.add_parser("gerar", help="transforma o Markdown validado em JSON")
    gerar.add_argument("--origem", type=Path, default=ORIGEM, help="caminho do baralho Markdown")
    gerar.add_argument("--saida", type=Path, default=SAIDA, help="caminho do JSON gerado")
    validar = comandos.add_parser("validar", help="valida um JSON existente")
    validar.add_argument("arquivo", type=Path, nargs="?", default=SAIDA, help="caminho do JSON a validar")
    args = parser.parse_args()

    entrada = args.origem if args.comando == "gerar" else args.arquivo
    try:
        if args.comando == "gerar":
            if args.origem.resolve() == args.saida.resolve():
                raise ErroBaralho("os caminhos de origem e saída precisam ser diferentes")
            baralho = carregar_markdown(args.origem, FASE)
            gravar_json(baralho, args.saida)
            print(f"Gerado: {args.saida} ({len(baralho['cards'])} cards)")
        else:
            baralho = carregar_json(args.arquivo, FASE)
            print(f"Válido: {args.arquivo} ({len(baralho['cards'])} cards)")
    except (ValueError, OSError) as erro:
        print(f"Erro ({entrada}): {erro}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
