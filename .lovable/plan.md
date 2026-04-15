

# Adicionar botão Editar para propostas em "rascunho" e "enviada"

## Alteração

No `src/components/propostas/PropostaDetalhe.tsx`, mover o botão de edição (ícone de lápis) para fora do bloco condicional `{proposta.status === "rascunho"}`, criando uma condição separada que inclua ambos os status:

```tsx
{["rascunho", "enviada"].includes(proposta.status) && (
  <Button variant="outline" size="icon" onClick={() => setEditOpen(true)} ...>
    <Edit className="h-4 w-4" />
  </Button>
)}
```

Os demais botões permanecem iguais — "Enviar" e "Excluir" continuam apenas em rascunho, "Aceitar" e "Recusar" continuam apenas em enviada.

## Arquivo editado
- `src/components/propostas/PropostaDetalhe.tsx` (1 linha movida)

