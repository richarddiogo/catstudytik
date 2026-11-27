# Dados e contrato

## dados-0 | ponte | Do SELECT ao GET
No Athena, você filtra linhas com WHERE. Em uma API, o cliente pede o filtro na URL e o backend decide como buscar os dados.
- ATHENA | SELECT * FROM gatos WHERE cor = 'preto';
- HTTP | GET /gatos?cor=preto

## dados-1 | armadilha | O contrato começa na resposta
No Athena você controla a consulta. No frontend, você depende dos campos e tipos que a API promete. Se id virar número sem que o cliente saiba, o card pode deixar de abrir.
- CONTRATO | {"id": "dados-0", "tipo": "ponte", "titulo": "Do SELECT ao GET"}
- LIMITE | Trate mudanças incompatíveis como uma nova versão do contrato.

## dados-2 | desafio | Modele um card
Copie este baralho e mude o tipo de dados-0 para surpresa. Gere o JSON usando sua cópia como origem. Leia o erro, corrija o tipo e gere novamente.
- COMANDO | python3 baralho.py gerar --origem sua-copia.md --saida teste.json
- CHECAGEM | O erro indica cards[0].tipo. Após a correção, valide teste.json.

## dados-3 | boss | Do Markdown ao JSON
Abra um PR com uma alteração no primeiro baralho, o JSON regenerado e a saída da validação. Mostre que mudar o título preserva o id e que repetir um id ou deixar o texto de um card vazio é rejeitado.
- ENTREGA | Markdown alterado, quatro cards em JSON e evidência da validação.
- ACEITE | O JSON é reproduzível, os ids continuam estáveis e entradas inválidas falham.
