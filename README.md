# L&A Moda e Acessórios

Loja virtual demonstrativa de roupas e acessórios, feita com HTML, CSS e JavaScript sem dependências de build.

## Como abrir

Abra `index.html` em um navegador. Para que a consulta do CEP funcione corretamente, use um servidor local simples, por exemplo:

```bash
python -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## O que está incluído

- Vitrine responsiva com produtos de exemplo e sacola persistida no navegador.
- Checkout demonstrativo com Pix, débito e crédito, incluindo seleção de 1 a 12 parcelas.
- Consulta de endereço por CEP via API pública ViaCEP.
- Estimativa ilustrativa de frete por faixa de CEP e frete grátis acima de R$ 299.

## Importante antes de vender de verdade

Este projeto é somente um protótipo de interface. Os produtos, imagens e valores são exemplos; o frete é uma estimativa, não uma cotação de transportadora. O checkout apenas simula a confirmação: não gera uma cobrança real, QR Code Pix ou transação de cartão. Não colete nem armazene dados de cartão neste site. Para lançar uma loja real, conecte um backend e um provedor de pagamentos compatível com PCI, implemente cálculo de frete com transportadora e revise políticas de privacidade, segurança, entrega e devolução.
