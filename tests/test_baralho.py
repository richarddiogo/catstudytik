from html.parser import HTMLParser
import json
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory
import unittest


RAIZ = Path(__file__).resolve().parents[1]
MARKDOWN = RAIZ / "cards" / "dados.md"
JSON_VERSIONADO = RAIZ / "data" / "dados.json"


class ConteudoMockup(HTMLParser):
    def __init__(self):
        super().__init__()
        self.lendo_conteudo = False
        self.trechos = []

    def handle_starttag(self, tag, attrs):
        if tag == "script":
            self.lendo_conteudo = dict(attrs).get("id") == "content"

    def handle_endtag(self, tag):
        if tag == "script":
            self.lendo_conteudo = False

    def handle_data(self, data):
        if self.lendo_conteudo:
            self.trechos.append(data)


class BaralhoFase1Test(unittest.TestCase):
    def setUp(self):
        pasta = TemporaryDirectory()
        self.addCleanup(pasta.cleanup)
        self.pasta = Path(pasta.name)

    def executar(self, *args):
        return subprocess.run(
            [sys.executable, str(RAIZ / "baralho.py"), *map(str, args)],
            cwd=self.pasta, capture_output=True, text=True, check=False,
        )

    def test_gera_json_reproduzivel_usado_pelo_mockup(self):
        saida = self.pasta / "dados.json"
        resultado = self.executar("gerar", "--saida", saida)
        self.assertEqual(resultado.returncode, 0, resultado.stderr)
        self.assertEqual(saida.read_bytes(), JSON_VERSIONADO.read_bytes())

        resultado = self.executar("validar", saida)
        self.assertEqual(resultado.returncode, 0, resultado.stderr)
        dados = json.loads(saida.read_text(encoding="utf-8"))
        self.assertEqual([card["tipo"] for card in dados["cards"]], ["ponte", "armadilha", "desafio", "boss"])
        self.assertEqual(dados["cards"][0]["exemplos"][1]["conteudo"], "GET /gatos?cor=preto")

        html = ConteudoMockup()
        html.feed((RAIZ / "mockup.html").read_text(encoding="utf-8"))
        fases = json.loads("".join(html.trechos))["phases"]
        fase1 = next(fase for fase in fases if fase["id"] == "dados")
        self.assertEqual(fase1["cards"], dados["cards"])

    def test_rejeita_markdown_invalido_sem_substituir_saida(self):
        origem = self.pasta / "invalido.md"
        saida = self.pasta / "preservado.json"
        markdown = MARKDOWN.read_text(encoding="utf-8")
        mudancas = (
            ("dados-1 |", "dados-0 |", "id duplicado"),
            ("| ponte |", "| surpresa |", "cards[0].tipo"),
            ("\nNo Athena, você filtra linhas com WHERE. Em uma API, o cliente pede o filtro na URL e o backend decide como buscar os dados.\n",
             "\n", "cards[0].texto"),
        )
        anterior = JSON_VERSIONADO.read_bytes()
        saida.write_bytes(anterior)
        for trecho, substituto, erro in mudancas:
            with self.subTest(erro=erro):
                self.assertIn(trecho, markdown)
                origem.write_text(markdown.replace(trecho, substituto, 1), encoding="utf-8")
                resultado = self.executar("gerar", "--origem", origem, "--saida", saida)
                self.assertEqual(resultado.returncode, 1, resultado.stderr)
                self.assertIn(erro, resultado.stderr)
                self.assertEqual(saida.read_bytes(), anterior)

    def test_rejeita_json_sem_campo_obrigatorio(self):
        arquivo = self.pasta / "invalido.json"
        dados = json.loads(JSON_VERSIONADO.read_text(encoding="utf-8"))
        del dados["cards"][0]["titulo"]
        arquivo.write_text(json.dumps(dados), encoding="utf-8")
        resultado = self.executar("validar", arquivo)
        self.assertEqual(resultado.returncode, 1, resultado.stderr)
        self.assertIn("cards[0]: campo obrigatório ausente: titulo", resultado.stderr)


if __name__ == "__main__":
    unittest.main()
