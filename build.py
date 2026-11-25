"""Gera o mockup autônomo com o contrato da fase 1 e os baralhos de prévia."""

from base64 import b64encode
import json
from pathlib import Path

from baralho import ErroBaralho, FASE, ORIGEM, SAIDA, carregar_json, carregar_markdown


def main():
    raiz = Path(__file__).resolve().parent
    fases = json.loads((raiz / "trilha.json").read_text(encoding="utf-8"))
    try:
        dados = carregar_json(SAIDA, FASE)
        if dados != carregar_markdown(ORIGEM, FASE):
            raise ErroBaralho("data/dados.json desatualizado. Rode python3 baralho.py gerar.")
        for fase in fases:
            identificador = fase["id"]
            baralho = dados if identificador == FASE else carregar_markdown(
                raiz / "cards" / f"{identificador}.md", identificador
            )
            fase["cards"] = baralho["cards"]
    except (FileNotFoundError, ValueError) as erro:
        raise SystemExit(f"Erro ao gerar o mockup: {erro}") from erro

    assets = {
        arquivo.stem: "data:image/webp;base64," + b64encode(arquivo.read_bytes()).decode("ascii")
        for arquivo in sorted((raiz / "assets").glob("*.webp"))
    }
    conteudo = json.dumps({"phases": fases, "assets": assets}, ensure_ascii=False)
    pagina = (raiz / "index.template.html").read_text(encoding="utf-8")
    pagina = pagina.replace("/* STYLE */", (raiz / "styles.css").read_text(encoding="utf-8"))
    pagina = pagina.replace("/* SCRIPT */", (raiz / "app.js").read_text(encoding="utf-8"))
    pagina = pagina.replace("/* CONTENT */", conteudo.replace("<", "\\u003c"))
    (raiz / "mockup.html").write_text(pagina, encoding="utf-8")


if __name__ == "__main__":
    main()
