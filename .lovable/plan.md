

## Melhorar feedback de erros no ImportFuncionariosCsvDialog

Atualizar `src/components/funcionarios/ImportFuncionariosCsvDialog.tsx` para que cada erro identifique o funcionário e o campo problemático.

### 1. Tipo de erro
Substituir a estrutura atual `{ line: number; message: string }` por:
```ts
interface RowError {
  linha: number;
  nome: string;          // "(sem nome)" quando vazio
  campo: string;         // "Nome" | "CPF" | "Email" | "Data de admissão"
  motivo: string;        // "obrigatório" | "inválido" | "duplicado no arquivo" | "formato inválido"
  valorInvalido?: string;
}
```
Atualizar `ParseResult.errors` para `RowError[]`.

### 2. Atualizar `parseCsv()` (validações por linha)
Manter toda a lógica de parse (split, header mapping, etc.). Trocar apenas os `result.errors.push(...)` para o novo formato:

| Situação | Objeto gerado |
|---|---|
| Nome vazio | `{ linha, nome: "(sem nome)", campo: "Nome", motivo: "obrigatório" }` |
| CPF inválido | `{ linha, nome, campo: "CPF", motivo: "inválido", valorInvalido: cpfRaw }` |
| CPF duplicado | `{ linha, nome, campo: "CPF", motivo: "duplicado no arquivo", valorInvalido: cpfRaw }` |
| Email inválido | `{ linha, nome, campo: "Email", motivo: "formato inválido", valorInvalido: email }` |
| Data inválida | `{ linha, nome, campo: "Data de admissão", motivo: "formato inválido", valorInvalido: dataRaw }` |

`nome` usa o valor da coluna `nome` da linha; quando ausente, usa `"(sem nome)"`.

### 3. Renderização no `ScrollArea`
Substituir o `<li>` atual por um item visual com badge vermelho:
```tsx
<li key={i} className="flex items-start gap-2 text-sm">
  <Badge className="bg-red-500/20 text-red-300 shrink-0">
    Linha {err.linha}
  </Badge>
  <span className="text-white/80">
    <span className="font-medium">{err.nome}</span>
    <span className="text-white/50"> — </span>
    <span className="text-white/70">{err.campo}:</span>{" "}
    <span className="text-red-300">{err.motivo}</span>
    {err.valorInvalido && (
      <span className="text-white/60"> "{err.valorInvalido}"</span>
    )}
  </span>
</li>
```
Manter `ScrollArea h-48`, borda e padding atuais.

### 4. Não alterar
- Parse de CSV (split, headers, datas, máscaras).
- Lógica de importação (`useMutation`, payload, invalidations).
- Select de cliente, template, drop zone, footer, botões.
- Nenhum outro arquivo.

### Arquivo modificado
- `src/components/funcionarios/ImportFuncionariosCsvDialog.tsx`

