

# Fix: Login travando por deadlock no useAuth

## Problema

O `onAuthStateChange` (linha 65) tem um callback `async` com `await fetchOrCreatePerfil()`. O cliente Supabase bloqueia o processamento de eventos de auth até o callback retornar, mas o callback faz queries que dependem do token — causando deadlock.

## Solução

No `src/hooks/useAuth.ts`:

1. Remover `async/await` do callback `onAuthStateChange` — usar `setTimeout` para desacoplar a busca do perfil do fluxo de auth
2. Manter o `getSession().then(...)` como está (esse não causa deadlock)

```typescript
// ANTES (deadlock):
supabase.auth.onAuthStateChange(async (_event, session) => {
  setSession(session);
  setUser(session?.user ?? null);
  if (session?.user) {
    await fetchOrCreatePerfil(session.user);  // ← bloqueia
  }
  setLoading(false);
});

// DEPOIS (fire-and-forget):
supabase.auth.onAuthStateChange((_event, session) => {
  setSession(session);
  setUser(session?.user ?? null);
  if (session?.user) {
    setTimeout(() => fetchOrCreatePerfil(session.user), 0);
  } else {
    setPerfil(PERFIL_VAZIO);
    setLoading(false);
  }
});
```

3. Mover `setLoading(false)` para dentro de `fetchOrCreatePerfil` (no final, após setPerfil)

## Arquivo editado
- `src/hooks/useAuth.ts` — remover async/await do onAuthStateChange

