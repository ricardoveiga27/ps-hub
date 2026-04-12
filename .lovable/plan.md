

# Fix: Página /app/clientes não abre (504 no Vite deps)

## Diagnóstico

O erro `504 Gateway Timeout` em `react-dom_client.js` indica que o cache de dependências pré-bundled do Vite (`node_modules/.vite/deps/`) está vazio ou corrompido. O browser tenta carregar arquivos que não existem mais no servidor, causando tela branca.

Isso provavelmente aconteceu após o downgrade do `@radix-ui/react-tooltip` — o Vite tentou re-otimizar as dependências mas o cache antigo ficou referenciado.

## Plano de correção

1. **Limpar o cache do Vite** — remover `node_modules/.vite` completamente
2. **Reinstalar dependências** — `bun install` para garantir consistência
3. **Reiniciar o dev server** — forçar novo pre-bundling de todas as dependências

São apenas comandos de manutenção, sem alteração de código.

