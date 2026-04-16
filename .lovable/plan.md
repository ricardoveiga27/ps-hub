

# Header Dinâmico + Remover Títulos das Páginas

## O que muda
1. **Header do AppLayout**: O texto fixo "Painel Comercial" será substituído pelo título da página atual, derivado da rota (ex: `/app/dashboard` → "Dashboard", `/app/clientes/123` → "Clientes")
2. **Remover `<h1>` de todas as páginas**: O título já aparece no header, então remove das views internas

## Implementação

### `src/components/app/AppLayout.tsx`
- Usar `useLocation()` para ler a rota atual
- Mapear segmento da rota para título: `{ dashboard: "Dashboard", clientes: "Clientes", propostas: "Propostas", contratos: "Contratos", assinaturas: "Assinaturas", financeiro: "Financeiro", comercial: "Comercial", configuracoes: "Configurações", usuarios: "Usuários", pacotes: "Pacotes" }`
- Exibir o título mapeado no lugar de "Painel Comercial"

### Páginas — remover `<h1>` (10 arquivos)
| Arquivo | Ação |
|---|---|
| `src/pages/app/Dashboard.tsx` | Remover linha `<h1>Dashboard</h1>` |
| `src/pages/app/Comercial.tsx` | Remover `<h1>Comercial</h1>` e o `<p>` de subtítulo |
| `src/pages/app/Usuarios.tsx` | Remover `<h1>Usuários</h1>` e `<p>` subtítulo |
| `src/pages/app/Financeiro.tsx` | Remover `<h1>Financeiro</h1>` |
| `src/pages/app/Assinaturas.tsx` | Remover `<h1>Assinaturas</h1>` |
| `src/pages/app/Pacotes.tsx` | Remover `<h1>Pacotes</h1>` |
| `src/pages/app/Configuracoes.tsx` | Remover ambos `<h1>Configurações</h1>` (loading + normal) |
| `src/components/clientes/ClientesList.tsx` | Remover `<h1>Clientes</h1>` |
| `src/components/propostas/PropostasList.tsx` | Remover `<h1>Propostas</h1>` |
| `src/components/contratos/ContratosList.tsx` | Remover `<h1>Contratos</h1>` |

**Nota**: Páginas de detalhe (ClienteDetalhe, PropostaDetalhe, ContratoDetalhe) mantêm seus títulos dinâmicos (nome do cliente, número da proposta, código do contrato) pois são informação contextual, não redundante com o header.

