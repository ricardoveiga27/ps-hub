

# Corrigir Título da Página na PropostaPublica

## Problema

O template HTML contém `<title>{{proposta_numero}} · {{empresa_razao_social}} · PS Hub</title>` com as variáveis já substituídas no `html_gerado`. Porém, como o React renderiza via `dangerouslySetInnerHTML` dentro do `<body>`, o `<title>` do template nunca é aplicado ao `document.title` da página — o browser continua mostrando o título padrão do app React.

## Solução

Adicionar extração e aplicação do `<title>` no `useEffect` existente (linhas 42-51). O título será extraído usando regex e aplicado ao `document.title`, com cleanup ao desmontar o componente.

## Alteração

**Arquivo:** `src/pages/PropostaPublica.tsx`

No `useEffect` das linhas 42-51 (que atualmente só ativa o botão de impressão), adicionar no início:

```typescript
useEffect(() => {
  if (!html || !containerRef.current) return;
  
  // Extrair e aplicar o <title> do template ao document.title
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  if (titleMatch?.[1]) {
    document.title = titleMatch[1];
  }
  
  // Ativar botão de impressão (lógica existente)
  const printBtn = containerRef.current.querySelector('.btn-print-wrap button') as HTMLButtonElement | null;
  if (printBtn) {
    printBtn.removeAttribute('onclick');
    const handler = () => window.print();
    printBtn.addEventListener('click', handler);
    return () => {
      printBtn.removeEventListener('click', handler);
      document.title = 'PS Hub'; // Restaurar título ao desmontar
    };
  }
  
  // Cleanup do título se não houver botão de impressão
  return () => {
    document.title = 'PS Hub';
  };
}, [html]);
```

