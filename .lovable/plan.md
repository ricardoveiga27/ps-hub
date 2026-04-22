

## Adicionar importação CSV de funcionários

### 1. Novo componente — `src/components/funcionarios/ImportFuncionariosCsvDialog.tsx`

Dialog modal com:

**Header**
- Título: "Importar Funcionários via CSV"
- Descrição: "Importe funcionários em massa para o cliente selecionado."

**Conteúdo (em ordem)**
1. **Select de cliente** (obrigatório) — usa `useClientes({ status: "ativo" })`, ordenado por `razao_social`, label "Cliente *".
2. **Botão "Baixar Modelo CSV"** (`variant="outline"`, ícone `Download`) — gera blob com BOM UTF-8 (`\uFEFF`), separador `;`, header e 3 linhas de exemplo, nome `modelo_funcionarios.csv`.
3. **Drop zone** com borda `dashed border-white/20`, ícone `Upload` centralizado, texto "Clique para selecionar ou arraste o arquivo CSV", `accept=".csv,.txt"`. Suporta drag-and-drop (`onDrop`/`onDragOver`).
4. **Preview** após parse:
   - Badge verde: "{N} funcionários válidos"
   - Badge vermelha (se >0): "{N} erros"
   - `ScrollArea` h-48 listando "Linha X: motivo"
   - `Alert` verde "Pronto para importar" quando 0 erros e ≥1 válido

**Footer**
- "Cancelar" + "Importar {N} funcionários" (desabilitado sem cliente, sem válidos, ou enquanto `isPending`).

**Parse CSV** (helper inline `parseCsv`)
- Split por `\n`/`\r\n`, primeira linha = header, separador `;`.
- Normalizar header (lowercase + trim) e mapear índices:
  - `nome` → nome
  - `cpf` → cpf
  - `telefone|celular|whatsapp` → telefone
  - `email` → email
  - `cargo` → cargo
  - `setor` → setor
  - `data_admissao|admissao|data_de_admissao` → data_admissao
- Linhas totalmente vazias → ignoradas.

**Validações por linha** (acumular em `errors[]` com índice 1-based+1 para refletir linha do arquivo)
- `nome` vazio → "nome obrigatório"
- CPF preenchido: validar dígitos verificadores (algoritmo padrão BR, mesma lógica de `ClienteForm`/`FuncionarioForm`).
- CPF duplicado dentro do arquivo → "CPF duplicado no arquivo"
- Email preenchido + regex inválida → "email inválido"
- Data preenchida: aceita `DD/MM/AAAA` ou `AAAA-MM-DD`; converte para ISO. Inválida → "data_admissao inválida"
- Telefone: remover não-dígitos antes de salvar.

**Importação**
- `useMutation`: `supabase.from('crm_funcionarios').insert(rows.map(r => ({ cliente_id, nome, cpf: r.cpf||null, telefone: r.telefone||null, email: r.email||null, cargo: r.cargo||null, setor: r.setor||null, data_admissao: r.data_admissao||null, status: 'ativo', origem: 'importacao' })))`.
- Sem `onConflict` (não há unique constraint em `cpf` no schema atual — checar duplicidade só dentro do arquivo).
- Sucesso: `toast.success("{N} funcionários importados com sucesso")`, `qc.invalidateQueries(["funcionarios"])` e `["funcionarios-cliente"]`, fecha dialog, limpa estado.
- Erro: `toast.error(error.message)`.

### 2. Atualizar `src/components/funcionarios/FuncionariosList.tsx`

- Importar `ImportFuncionariosCsvDialog` e ícone `Upload` do lucide.
- Adicionar `const [importOpen, setImportOpen] = useState(false);`
- Substituir o botão atual "Importar do PS Index" (que dispara `toast.info`) por:
  ```tsx
  <Button variant="outline" onClick={() => setImportOpen(true)}
    className="border-white/20 text-white/80 hover:bg-white/10 hover:text-white">
    <Upload className="h-4 w-4 mr-2" /> Importar CSV
  </Button>
  ```
- Renderizar `<ImportFuncionariosCsvDialog open={importOpen} onOpenChange={setImportOpen} />` ao lado dos demais modais.

### 3. Segurança / RLS
Sem mudanças. A policy `operadores_gerenciam_funcionarios` (admin/operador) já permite o INSERT em massa. Demais usuários verão erro do Supabase ao importar.

### Arquivos
- **Criar**: `src/components/funcionarios/ImportFuncionariosCsvDialog.tsx`
- **Alterar**: `src/components/funcionarios/FuncionariosList.tsx`

### Não será alterado
- `useFuncionarios.ts`, demais páginas/componentes, autenticação, schema do banco.

