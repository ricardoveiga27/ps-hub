

# Botão de Impressão na Proposta Pública

## Resumo

O template HTML já contém o botão `🖨 Versão para impressão` com `onclick="window.print()"` (linha 465 do template). Porém, React ignora atributos `onclick` inline quando renderiza via `dangerouslySetInnerHTML`. A solução é adicionar um `useEffect` que localiza o botão e substitui o handler inline por um `addEventListener`.

## Alteração

**Arquivo:** `src/pages/PropostaPublica.tsx`

Adicionar um novo `useEffect` (separado do de aceite, pois o botão de impressão deve funcionar em qualquer status):

```typescript
useEffect(() => {
  if (!html || !containerRef.current) return;
  const printBtn = containerRef.current.querySelector('.btn-print-wrap button') as HTMLButtonElement | null;
  if (printBtn) {
    printBtn.removeAttribute('onclick');
    const handler = () => window.print();
    printBtn.addEventListener('click', handler);
    return () => printBtn.removeEventListener('click', handler);
  }
}, [html]);
```

Usa o seletor `.btn-print-wrap button` (mais robusto que buscar por atributo `onclick`). Nenhum outro arquivo é alterado.

