

# Aumentar Fonte e Destacar Cor do Título do Header

## Problema
O título da página no header está com fonte pequena (`text-sm`) e cor muito desbotada (`text-white/40`), dificultando a leitura e identificação da página atual.

## Solução
Alterar a linha 76 do `src/components/app/AppLayout.tsx`:

**Atual:**
```tsx
<div className="ml-4 text-sm text-white/40 font-medium">
  {pageTitle}
</div>
```

**Novo:**
```tsx
<div className="ml-4 text-lg text-white font-semibold font-heading">
  {pageTitle}
</div>
```

### Mudanças:
- `text-sm` → `text-lg` (aumenta tamanho da fonte)
- `text-white/40` → `text-white` (cor branca sólida, sem opacidade)
- `font-medium` → `font-semibold` (peso mais destacado)
- Adiciona `font-heading` (usa a fonte Syne, mesma dos títulos do sistema)

## Arquivo
- `src/components/app/AppLayout.tsx` — linha 76

