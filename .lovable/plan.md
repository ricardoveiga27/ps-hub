

# Ajustes na Página Comercial

## Alterações em `src/pages/app/Comercial.tsx`

### 1. Fontes — padronizar
- Já está correto no CSS (Syne para títulos, DM Sans para corpo). Verificar se há algum `font-family` hardcoded diferente no HTML inline e remover.

### 2. Substituir slider por input +/−
- Remover o bloco `<div class="slider-wrap">` com o `<input type="range">` e labels
- Substituir pelo controle `.sim-stepper` com botões −/+ e input numérico
- No CSS: remover estilos do slider (`input[type="range"]`, `.slider-wrap`, `.slider-labels`), adicionar estilos `.sim-stepper`
- No JS: remover referência a `slider`, adicionar funções `stepFunc()` e `sync()`, listeners para `change` e `keydown` no input numérico, manter `getTier()`, `fmt()` e a lógica de `update()` adaptada

### 3. Desconto Supremo — exibir sempre
- Adicionar o 5º card de desconto (−50%) na `.discount-grid`, sempre visível, sem modal/trava
- No JS: adicionar 50% ao array de descontos no `sim-discounts`

### Arquivo
- `src/pages/app/Comercial.tsx` — único arquivo modificado

