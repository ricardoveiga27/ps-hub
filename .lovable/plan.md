

# Ajustes visuais nos cards de desconto do simulador

## O que muda

### 1. Cards de desconto (`sim-discounts`) — visual próximo da referência
A referência mostra cards com:
- Título do desconto no topo (ex: "Desc. 10%", "Campanha Veiga", "Desconto Supremo")
- Badge colorido com a porcentagem (ex: badge verde "-10%", badge azul "-20%", etc.)
- Preço grande em cor destaque + "/mês"
- Texto "recorrente mensal" abaixo
- **Valor por vida** abaixo do preço
- Label de autorização em caps (ex: "AUTONOMIA VENDEDOR", "★ APROVAÇÃO RICARDO")
- Nota de condições nos cards 40% e 50%
- Badge "ATIVO" no card Supremo
- Bordas laterais coloridas por nível

### 2. Alterações no CSS
- Atualizar `.dr-item` para ter layout vertical com mais conteúdo, borda lateral colorida, fundo escuro diferenciado
- Ajustar grid para 5 colunas em desktop (`grid-template-columns: repeat(5, 1fr)`)
- Cards mais altos com padding adequado para o conteúdo extra

### 3. Alterações no JS (`update()`)
- Calcular `valor por vida com desconto` = `tier.price * (1 - pct/100)`
- Renderizar cada card com: título, badge %, preço/mês, "recorrente mensal", valor/vida, label de autorização, e nota de condição (para 40% e 50%)
- Cores: 10%=verde, 20%=azul, 30%=amber, 40%=vermelho/amber (Campanha Veiga), 50%=vermelho (Desconto Supremo)

## Arquivo
- `src/pages/app/Comercial.tsx` — alterações no CSS (`.dr-item` e `.discount-results`) e no JS da função `update()`

