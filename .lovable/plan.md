

## Adicionar módulo Funcionários ao CRM

### 1. Sidebar — `src/components/app/AppSidebar.tsx`
Inserir item entre "Clientes" e "Propostas":
```ts
{ title: "Funcionários", url: "/app/funcionarios", icon: Users,
  show: perfil.is_admin || perfil.is_comercial || perfil.is_operador }
```

### 2. Roteamento — `src/App.tsx` + `AppLayout.tsx`
- Importar `Funcionarios` e adicionar `<Route path="funcionarios" element={<Funcionarios />} />`.
- Acrescentar entrada `"funcionarios": "Funcionários"` no `ROUTE_TITLES` do `AppLayout` para o título do header.

### 3. Hook — `src/hooks/useFuncionarios.ts` (novo)
Padrão dos outros hooks (React Query):
- `useFuncionarios(filters)` — `select('*, crm_clientes(razao_social, nome_fantasia)')`, ordenado por `nome`. Filtros: `cliente_id`, `status`, e busca por `nome`/`cpf`/`email` via `.or(...)`.
- `useFuncionario(id)`, `useCreateFuncionario()`, `useUpdateFuncionario()`, `useDeleteFuncionario()`.
- Tipos: `Tables<"crm_funcionarios">`, `TablesInsert`, `TablesUpdate`.

### 4. Página — `src/pages/app/Funcionarios.tsx` (novo)
Reusa o componente da lista:
```tsx
import FuncionariosList from "@/components/funcionarios/FuncionariosList";
export default function Funcionarios() { return <FuncionariosList />; }
```

### 5. Componentes novos em `src/components/funcionarios/`

**`FuncionariosList.tsx`** — segue o padrão visual de `ClientesList.tsx` (dark theme, classes `bg-white/5`, `text-white/60`, `Badge`, `Table`):
- Header: subtítulo "Base centralizada de colaboradores por cliente", botão **"Adicionar funcionário"** (ícone `UserPlus`) e botão secundário **"Importar do PS Index"** (`RefreshCw`, `variant="outline"`) que dispara `toast("Integração com PS Index em breve")`.
- Filtros: Select de Cliente (carrega `crm_clientes` ativos via `useClientes({ status: "ativo" })`), Select de Status (`ativo`/`inativo`/`afastado`/Todos), input de busca, contador `X funcionários encontrados`.
- Lê `?cliente_id=` da URL (`useSearchParams`) para pré-filtrar quando vier do drawer de clientes.
- Tabela: Nome | CPF mascarado `***.***.***-XX` (mostra só os 2 últimos dígitos) | Cliente (`razao_social`) | Cargo / Setor | Status (badge: ativo verde, inativo cinza, afastado amarelo) | Origem (badge: manual cinza, importacao azul, ps_index roxo) | Ações (Edit / Trash).
- Paginação client-side de 20 por página (`slice` + controles `Anterior`/`Próximo`).
- Modais: `FuncionarioForm` (criar/editar) e `AlertDialog` de exclusão.

**`FuncionarioForm.tsx`** — `Dialog` + `react-hook-form` + `zod` (mesmo padrão de `ClienteForm`):
- Campos: Cliente* (Select com `crm_clientes` ativos), Nome*, CPF (máscara `000.000.000-00`), Email, Telefone (máscara `(00) 00000-0000`), Cargo, Setor, Data de admissão, Status* (default `ativo`).
- Schema zod: `nome` e `cliente_id` obrigatórios; CPF opcional mas se preenchido valida 11 dígitos; email valida formato.
- No submit grava `origem: 'manual'`, `ps_index_id: null`, `ps_cultura_id: null`.

### 6. Drawer/Detalhe do cliente — `src/components/clientes/ClienteDetalhe.tsx`
Adicionar nova aba **"Funcionários"** ao `<TabsList>` (entre Contatos e Propostas):
- Query `useQuery(["funcionarios-cliente", id])` filtrando `cliente_id` e `status='ativo'`, campos: `id, nome, cargo, setor, status, telefone`.
- Cabeçalho da aba: contador "X funcionários ativos", botão **"Adicionar funcionário"** (abre `FuncionarioForm` com `lockedClienteId`) e botão **"Ver todos"** que faz `navigate(\`/app/funcionarios?cliente_id=${id}\`)`.
- Tabela simples com Nome, Cargo, Setor, Telefone, Status.
- `FuncionarioForm` ganha prop opcional `lockedClienteId` que desabilita o Select de cliente quando definido (mesma lógica que `PropostaForm` usa).

### 7. Segurança / RLS
Nenhuma migration necessária — `crm_funcionarios` já tem RLS:
- `operadores_gerenciam_funcionarios` (ALL): admin ou operador.
- `usuarios_veem_funcionarios` (SELECT): admin, operador ou comercial.

A flag `show` no sidebar respeita esses papéis (admin/comercial/operador).

### 8. Mascaramento de CPF
Função local na lista:
```ts
function maskCpf(cpf: string|null) {
  if (!cpf) return "—";
  const d = cpf.replace(/\D/g,"");
  if (d.length !== 11) return cpf;
  return `***.***.***-${d.slice(9)}`;
}
```
No formulário o CPF aparece sem máscara para edição.

### Arquivos a criar
- `src/hooks/useFuncionarios.ts`
- `src/pages/app/Funcionarios.tsx`
- `src/components/funcionarios/FuncionariosList.tsx`
- `src/components/funcionarios/FuncionarioForm.tsx`

### Arquivos a alterar
- `src/components/app/AppSidebar.tsx` — novo item de menu.
- `src/App.tsx` — nova rota.
- `src/components/app/AppLayout.tsx` — título no `ROUTE_TITLES`.
- `src/components/clientes/ClienteDetalhe.tsx` — nova aba Funcionários.

### Não será alterado
- Tabela `crm_funcionarios` (já existe com RLS adequada).
- Demais páginas, fluxo de autenticação e componentes não mencionados.

