import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function Comercial() {
  const { perfil, loading } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !perfil.is_comercial && !perfil.is_admin) {
      navigate("/app/dashboard");
    }
  }, [perfil, loading, navigate]);

  useEffect(() => {
    if (!containerRef.current) return;
    const scripts = containerRef.current.querySelectorAll("script");
    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
  }, []);

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className="sim-painel"
        dangerouslySetInnerHTML={{ __html: SIMULADOR_HTML }}
      />
      <style>{SIMULADOR_CSS}</style>
    </div>
  );
}

const SIMULADOR_CSS = `
.sim-painel {
  --bg: hsl(226, 60%, 8%);
  --card: hsl(226, 40%, 12%);
  --card-alt: hsl(226, 35%, 15%);
  --border: rgba(255,255,255,0.08);
  --text: rgba(255,255,255,0.92);
  --text-muted: rgba(255,255,255,0.5);
  --blue: hsl(217, 91%, 60%);
  --violet: hsl(263, 84%, 58%);
  --green: hsl(142, 71%, 45%);
  --amber: hsl(38, 92%, 50%);
  --red: hsl(0, 84%, 60%);
  font-family: 'DM Sans', sans-serif;
  color: var(--text);
}

.sim-painel h2, .sim-painel h3, .sim-painel h4 {
  font-family: 'Syne', sans-serif;
  font-weight: 700;
}

.sim-painel .sim-section {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
}

.sim-painel .sim-section-alt {
  background: var(--card-alt);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
}

.sim-painel .sim-title {
  font-size: 1.1rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--blue);
  margin-bottom: 4px;
}

.sim-painel .sim-subtitle {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 20px;
}

/* Stepper control */
.sim-painel .sim-stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin: 1.5rem auto;
  width: fit-content;
}
.sim-painel .sim-stepper button {
  width: 48px;
  height: 56px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  color: #fff;
  font-size: 1.4rem;
  font-family: 'Syne', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  user-select: none;
}
.sim-painel .sim-stepper button:first-child { border-radius: 10px 0 0 10px; }
.sim-painel .sim-stepper button:last-child  { border-radius: 0 10px 10px 0; }
.sim-painel .sim-stepper button:hover { background: rgba(255,255,255,0.12); }
.sim-painel .sim-stepper button:active { background: rgba(255,255,255,0.18); }
.sim-painel .sim-stepper input {
  width: 120px;
  height: 56px;
  background: rgba(255,255,255,0.04);
  border-top: 1px solid rgba(255,255,255,0.12);
  border-bottom: 1px solid rgba(255,255,255,0.12);
  border-left: none;
  border-right: none;
  color: #fff;
  font-family: 'Syne', sans-serif;
  font-size: 1.6rem;
  font-weight: 700;
  text-align: center;
  outline: none;
  -moz-appearance: textfield;
}
.sim-painel .sim-stepper input::-webkit-outer-spin-button,
.sim-painel .sim-stepper input::-webkit-inner-spin-button { -webkit-appearance: none; }

/* Result cards */
.sim-painel .result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-top: 20px;
}

.sim-painel .result-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
  text-align: center;
}

.sim-painel .result-card .label {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  margin-bottom: 6px;
  font-family: 'DM Sans', sans-serif;
}

.sim-painel .result-card .value {
  font-size: 1.6rem;
  font-weight: 700;
  font-family: 'Syne', sans-serif;
}

.sim-painel .result-card .sub {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 2px;
  font-family: 'DM Sans', sans-serif;
}

.sim-painel .badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-family: 'DM Sans', sans-serif;
}

.sim-painel .badge-blue { background: rgba(59,130,246,0.15); color: var(--blue); }
.sim-painel .badge-violet { background: rgba(139,92,246,0.15); color: var(--violet); }
.sim-painel .badge-green { background: rgba(34,197,94,0.15); color: var(--green); }
.sim-painel .badge-amber { background: rgba(245,158,11,0.15); color: var(--amber); }

/* Price table */
.sim-painel table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
  font-family: 'DM Sans', sans-serif;
}

.sim-painel table th {
  text-align: left;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
}

.sim-painel table td {
  padding: 12px;
  border-bottom: 1px solid var(--border);
  vertical-align: top;
  font-family: 'DM Sans', sans-serif;
}

.sim-painel table tr:last-child td {
  border-bottom: none;
}

.sim-painel table .seg-name {
  font-weight: 700;
  font-family: 'Syne', sans-serif;
}

.sim-painel table .seg-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.sim-painel table .price-main {
  font-weight: 700;
  font-size: 0.95rem;
}

.sim-painel table .price-detail {
  font-size: 0.72rem;
  color: var(--text-muted);
}

/* Feature matrix */
.sim-painel .feat-check { color: var(--green); font-weight: 700; }
.sim-painel .feat-x { color: rgba(255,255,255,0.2); }
.sim-painel .feat-highlight { color: var(--blue); font-weight: 600; font-size: 0.8rem; }

/* Discount ruler */
.sim-painel .discount-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.sim-painel .discount-card {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.sim-painel .discount-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
}

.sim-painel .discount-card.dc-10::before { background: var(--green); }
.sim-painel .discount-card.dc-20::before { background: var(--blue); }
.sim-painel .discount-card.dc-30::before { background: var(--amber); }
.sim-painel .discount-card.dc-40::before { background: var(--red); }
.sim-painel .discount-card.dc-50::before { background: var(--red); }

.sim-painel .discount-pct {
  font-size: 1.8rem;
  font-weight: 800;
  font-family: 'Syne', sans-serif;
  margin-bottom: 4px;
}

.sim-painel .discount-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 12px;
  font-family: 'DM Sans', sans-serif;
}

.sim-painel .discount-card dt {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin-top: 8px;
  font-family: 'DM Sans', sans-serif;
}

.sim-painel .discount-card dd {
  font-size: 0.82rem;
  margin: 2px 0 0 0;
  font-family: 'DM Sans', sans-serif;
}

/* Case studies */
.sim-painel .case-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.sim-painel .case-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 20px;
}

.sim-painel .case-card h4 {
  font-size: 0.9rem;
  margin-bottom: 4px;
}

.sim-painel .case-card .case-desc {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.sim-painel .case-line {
  display: flex;
  justify-content: space-between;
  font-size: 0.82rem;
  padding: 4px 0;
  border-bottom: 1px solid var(--border);
}

.sim-painel .case-line:last-child { border-bottom: none; }

.sim-painel .case-line .cl-label { color: var(--text-muted); }
.sim-painel .case-line .cl-value { font-weight: 600; }
.sim-painel .case-line .cl-strike { text-decoration: line-through; color: var(--text-muted); }

.sim-painel .case-arg {
  margin-top: 12px;
  padding: 12px;
  background: rgba(59,130,246,0.06);
  border-radius: 8px;
  font-size: 0.78rem;
  font-style: italic;
  color: var(--text-muted);
  line-height: 1.5;
}

.sim-painel .case-note {
  margin-top: 8px;
  font-size: 0.7rem;
  color: var(--text-muted);
}

.sim-painel .warn-box {
  margin-top: 12px;
  padding: 12px 16px;
  background: rgba(245,158,11,0.08);
  border: 1px solid rgba(245,158,11,0.2);
  border-radius: 8px;
  font-size: 0.78rem;
  color: var(--amber);
}

.sim-painel .tip-box {
  margin-top: 16px;
  padding: 12px 16px;
  background: rgba(59,130,246,0.06);
  border: 1px solid rgba(59,130,246,0.15);
  border-radius: 8px;
  font-size: 0.78rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.sim-painel .note-footer {
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

/* Discount result row */
.sim-painel .discount-results {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  margin-top: 16px;
}

.sim-painel .dr-item {
  text-align: center;
  padding: 10px 8px;
  border-radius: 8px;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border);
}

.sim-painel .dr-item .dr-pct {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin-bottom: 4px;
  font-family: 'DM Sans', sans-serif;
}

.sim-painel .dr-item .dr-val {
  font-size: 1rem;
  font-weight: 700;
  font-family: 'Syne', sans-serif;
}
`;

const SIMULADOR_HTML = `
<!-- SIMULATOR -->
<div class="sim-section">
  <h3 class="sim-title">Simulador de Preços</h3>
  <p class="sim-subtitle">Calcule o ticket pelo número de funcionários — o plano e os valores são calculados automaticamente.</p>

  <div class="sim-stepper">
    <button id="btnMenos" onclick="window.__stepFunc(-10)">−</button>
    <input type="number" id="numFunc" value="30" min="10" max="2000">
    <button id="btnMais" onclick="window.__stepFunc(10)">+</button>
  </div>

  <div class="result-grid" id="sim-results">
    <!-- filled by script -->
  </div>

  <div class="discount-results" id="sim-discounts">
    <!-- filled by script -->
  </div>
</div>

<!-- PRICE TABLE -->
<div class="sim-section">
  <h3 class="sim-title">Tabela de Preços — PS Hub Bundle</h3>
  <div style="overflow-x:auto">
    <table>
      <tr>
        <th>Segmento</th>
        <th>Faixa</th>
        <th>Per Capita/Mês</th>
        <th>Cobrança</th>
        <th>Tabela</th>
        <th>−10%</th>
      </tr>
      <tr>
        <td><span class="seg-name">Micro</span><br><span class="seg-sub">Essencial</span></td>
        <td>Mín. 10 vidas</td>
        <td class="price-main">R$ 18/vida</td>
        <td>Anual 12×</td>
        <td><span class="price-main">R$ 180</span><br><span class="price-detail">R$ 2.160/ano</span></td>
        <td><span class="price-main">R$ 162</span><br><span class="price-detail">R$ 1.944/a</span></td>
      </tr>
      <tr>
        <td><span class="seg-name" style="color:hsl(217,91%,70%)">Pequena</span><br><span class="seg-sub">Essencial Plus</span></td>
        <td>11–49 vidas</td>
        <td class="price-main">R$ 10/vida</td>
        <td>Anual 12×</td>
        <td><span class="price-main">R$ 110–490</span><br><span class="price-detail">ex. 30v → R$ 300/mês</span></td>
        <td><span class="price-main">R$ 99–441</span><br><span class="price-detail">ex. 30 → R$ 270/mês</span></td>
      </tr>
      <tr>
        <td><span class="seg-name" style="color:hsl(263,84%,68%)">Média</span><br><span class="seg-sub">Profissional ★</span></td>
        <td>50–199 vidas</td>
        <td class="price-main">R$ 8/vida</td>
        <td>Mensal recorrente</td>
        <td><span class="price-main">R$ 400–1.592</span><br><span class="price-detail">ex. 80v → R$ 640/mês</span></td>
        <td><span class="price-main">R$ 360–1.433</span><br><span class="price-detail">ex. 80 → R$ 576/mês</span></td>
      </tr>
      <tr>
        <td><span class="seg-name" style="color:hsl(142,71%,55%)">Grande</span><br><span class="seg-sub">Enterprise</span></td>
        <td>200+ vidas</td>
        <td class="price-main">R$ 6/vida</td>
        <td>Mensal recorrente</td>
        <td><span class="price-main">A partir de R$ 1.200</span><br><span class="price-detail">ex. 300v → R$ 1.800/mês</span></td>
        <td><span class="price-main">A partir de R$ 1.080</span></td>
      </tr>
    </table>
  </div>
  <p class="note-footer">★ Desconto de 30% requer aprovação de Ricardo. Descontos de 10% e 20% são autonomia do vendedor com contrato mínimo de 12 meses. Nunca partir do desconto — apresentar sempre a tabela primeiro.</p>
</div>

<!-- FEATURE MATRIX -->
<div class="sim-section">
  <h3 class="sim-title">O que está incluso em cada plano</h3>
  <div style="overflow-x:auto">
    <table>
      <tr>
        <th>Funcionalidade</th>
        <th>Micro<br><span style="font-weight:400">Essencial</span></th>
        <th>Pequena<br><span style="font-weight:400">Essencial Plus</span></th>
        <th>Média<br><span style="font-weight:400">Profissional</span></th>
      </tr>
      <!-- Suporte -->
      <tr><td colspan="4" style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);padding-top:16px;border:none;">Suporte ao Cliente</td></tr>
      <tr>
        <td>Atendimento humano — chat, WhatsApp, telefone</td>
        <td class="feat-x">✕</td>
        <td class="feat-x">✕</td>
        <td class="feat-check">✓ Horário comercial</td>
      </tr>
      <tr>
        <td>Gerente de conta dedicado</td>
        <td class="feat-x">✕</td>
        <td class="feat-x">✕</td>
        <td class="feat-x">✕</td>
      </tr>
      <tr>
        <td>Link Veiga Saúde — interpretação + PGR</td>
        <td class="feat-check">✓</td>
        <td class="feat-check">✓</td>
        <td class="feat-check">✓</td>
      </tr>
      <tr><td colspan="4" style="font-size:0.65rem;color:var(--text-muted);border:none;padding-top:0">Exclusivo clientes da carteira SST</td></tr>

      <!-- PS Index -->
      <tr><td colspan="4" style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--blue);padding-top:16px;border:none;">PS Index — Avaliação Psicossocial</td></tr>
      <tr>
        <td>Tokens trimestrais<br><span style="font-size:0.7rem;color:var(--text-muted)">1 token = 1 avaliação individual · renova 90 dias · não acumula</span></td>
        <td class="feat-highlight">func + 10%</td>
        <td class="feat-highlight">func + 10%</td>
        <td class="feat-highlight">func + 10%</td>
      </tr>
      <tr>
        <td>Ciclos de aplicação gerenciados<br><span style="font-size:0.7rem;color:var(--text-muted)">Disparo + coleta + relatório consolidado</span></td>
        <td class="feat-highlight">1 / ano</td>
        <td class="feat-highlight">1 / ano</td>
        <td class="feat-highlight">2 / ano</td>
      </tr>
      <tr>
        <td>Relatório consolidado incluso</td>
        <td class="feat-check">✓</td>
        <td class="feat-check">✓</td>
        <td class="feat-check">✓</td>
      </tr>

      <!-- PS Escuta -->
      <tr><td colspan="4" style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--violet);padding-top:16px;border:none;">PS Escuta — Canal de Ética e Denúncias</td></tr>
      <tr>
        <td>Canal ativo com formulário</td>
        <td class="feat-check">✓</td>
        <td class="feat-check">✓</td>
        <td class="feat-check">✓</td>
      </tr>
      <tr>
        <td>IRIS — triagem e acolhimento por IA</td>
        <td class="feat-x">✕</td>
        <td class="feat-x">✕</td>
        <td class="feat-check">✓</td>
      </tr>
      <tr>
        <td>Franquia de relatos<br><span style="font-size:0.7rem;color:var(--text-muted)">Excedente cobrado à parte</span></td>
        <td class="feat-highlight">10 / ano</td>
        <td class="feat-highlight">1 / func / ano</td>
        <td class="feat-highlight">1 / func / ano</td>
      </tr>

      <!-- PS Cultura -->
      <tr><td colspan="4" style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--green);padding-top:16px;border:none;">PS Cultura — Treinamentos</td></tr>
      <tr>
        <td>Módulos NR-01 obrigatórios (2 módulos base)</td>
        <td class="feat-check">✓</td>
        <td class="feat-check">✓</td>
        <td class="feat-check">✓</td>
      </tr>
      <tr>
        <td>Módulo de lideranças<br><span style="font-size:0.7rem;color:var(--text-muted)">Gestores e supervisores</span></td>
        <td class="feat-x">✕</td>
        <td class="feat-check">✓</td>
        <td class="feat-check">✓</td>
      </tr>
      <tr>
        <td>Catálogo completo de treinamentos</td>
        <td class="feat-x">✕</td>
        <td class="feat-x">✕</td>
        <td class="feat-check">✓</td>
      </tr>
      <tr>
        <td>Trilhas personalizadas por função</td>
        <td class="feat-x">✕</td>
        <td class="feat-x">✕</td>
        <td class="feat-x">✕</td>
      </tr>
    </table>
  </div>
  <div class="tip-box" style="margin-top:16px">
    💡 <strong>Tokens × ciclos:</strong> os tokens garantem créditos para aplicações autônomas a qualquer momento. O ciclo gerenciado é o processo coordenado — disparo, acompanhamento e consolidação pela Veiga. Fora dos ciclos, a empresa aplica de forma independente usando os tokens disponíveis.
  </div>
  <div class="tip-box">
    ✓ <strong>Diferencial exclusivo da carteira Veiga:</strong> a integração do relatório PS Index com o PGR via equipe SST não é replicável por plataformas concorrentes. Para clientes da carteira, o PS Hub é extensão natural do serviço SST já contratado.
  </div>
</div>

<!-- DISCOUNT RULER -->
<div class="sim-section">
  <h3 class="sim-title">Régua de Uso do Desconto — Orientação ao Vendedor</h3>
  <div class="discount-grid">
    <div class="discount-card dc-10">
      <div class="discount-pct" style="color:var(--green)">−10%</div>
      <dl>
        <dt>Quando usar</dt>
        <dd>Cliente da carteira SST em primeiro contrato PS Hub</dd>
        <dt>Autoriza</dt>
        <dd>Vendedor — autonomia total</dd>
        <dt>Condição</dt>
        <dd>Pagamento anual 12× ou recorrente ativo</dd>
      </dl>
    </div>
    <div class="discount-card dc-20">
      <div class="discount-pct" style="color:var(--blue)">−20%</div>
      <dl>
        <dt>Quando usar</dt>
        <dd>Prospect com negociação travada por preço; ou carteira com contrato acima de 50 vidas</dd>
        <dt>Autoriza</dt>
        <dd>Vendedor — autonomia total</dd>
        <dt>Condição</dt>
        <dd>Contrato mínimo 12 meses assinado</dd>
      </dl>
    </div>
    <div class="discount-card dc-30">
      <div class="discount-pct" style="color:var(--amber)">−30%</div>
      <dl>
        <dt>Quando usar</dt>
        <dd>Última instância — fechamento em risco real ou cliente estratégico</dd>
        <dt>Autoriza</dt>
        <dd>Aprovação de Ricardo</dd>
        <dt>Condição</dt>
        <dd>Contrato 12 meses + justificativa registrada</dd>
      </dl>
      <div class="warn-box" style="margin-top:12px">⚠ Nunca deve ser o ponto de partida da negociação. Só entra se o de 20% não fechou.</div>
    </div>
    <div class="discount-card dc-40">
      <div class="discount-pct" style="color:var(--red)">−40%</div>
      <div class="discount-label" style="color:var(--amber)">CAMPANHA VEIGA</div>
      <dl>
        <dt>Quando usar</dt>
        <dd>Cliente ativo da carteira SST Veiga Saúde com dificuldade de fechamento mesmo com 30%</dd>
        <dt>Composição</dt>
        <dd>30% desconto Ricardo + 10% desconto fidelidade cliente Veiga</dd>
        <dt>Autoriza</dt>
        <dd>Ricardo — aprovação obrigatória + print da tela autorizado para envio ao cliente</dd>
        <dt>Condição</dt>
        <dd>Contrato anual assinado · exclusivo clientes SST ativos · não renovável automaticamente nesse valor</dd>
      </dl>
      <div class="warn-box" style="margin-top:12px">
        Este é o último recurso da régua. Acima de 500 funcionários, avalie piloto de 90 dias antes de chegar aqui.<br><br>
        Comunicar sempre como "desconto de lançamento" ou "benefício de fidelidade" — nunca como "preço especial para você". Evita criar expectativa de que esse é o preço permanente.
      </div>
    </div>
    <div class="discount-card dc-50">
      <div class="discount-pct" style="color:var(--red)">−50%</div>
      <div class="discount-label" style="color:var(--red)">TETO ABSOLUTO — DESCONTO SUPREMO</div>
      <dl>
        <dt>Quando usar</dt>
        <dd>Operação acima de 500 vidas onde nenhum desconto anterior fechou. Último recurso absoluto.</dd>
        <dt>Autoriza</dt>
        <dd>Ricardo — decisão exclusiva</dd>
        <dt>Condição</dt>
        <dd>Contrato 24 meses · pagamento anual antecipado · SLA definido em contrato · cláusula de reajuste IPCA no 2º ano</dd>
      </dl>
      <div class="warn-box" style="margin-top:12px">
        🚨 Abaixo de 50% o serviço não se paga com suporte Enterprise. Este desconto jamais deve ser mencionado proativamente ao cliente — só aplicar quando a negociação exige e Ricardo autorizar.
      </div>
    </div>
  </div>
</div>

<!-- CASE STUDIES -->
<div class="sim-section-alt">
  <h3 class="sim-title">Estudos de Caso — Clientes SST Ativos</h3>
  <div class="case-grid">
    <!-- Case 1 -->
    <div class="case-card">
      <h4>Caso 1 — 200 Funcionários</h4>
      <p class="case-desc">Cliente SST ativo. Ticket PS Hub próximo do SST.</p>
      <div class="case-line"><span class="cl-label">Tabela</span><span class="cl-value">R$ 1.200/mês</span></div>
      <div class="case-line"><span class="cl-label">Desc. 30% (Ricardo)</span><span class="cl-value">R$ 840/mês</span></div>
      <div class="case-line"><span class="cl-label">Campanha Veiga −40%</span><span class="cl-value" style="color:var(--green)">R$ 720/mês</span></div>
      <div class="case-line"><span class="cl-label">Anual (12×)</span><span class="cl-value">R$ 8.640/ano</span></div>
      <div class="case-arg">
        "R$ 720/mês para compliance psicossocial completo — menos que 60% do que você já paga em SST por vida. E sua equipe Veiga já conhece sua empresa."
      </div>
      <p class="case-note">✓ Contrato anual obrigatório · exclusivo clientes SST Veiga · não renovável automaticamente nesse valor</p>
    </div>
    <!-- Case 2 -->
    <div class="case-card">
      <h4>Caso 2 — 1.000 Funcionários</h4>
      <p class="case-desc">Cliente SST ativo. Ticket elevado exige aprovação de diretoria. Precisa de âncora de valor forte.</p>
      <div class="case-line"><span class="cl-label">Tabela</span><span class="cl-value">R$ 6.000/mês</span></div>
      <div class="case-line"><span class="cl-label">Desc. 30% (Ricardo)</span><span class="cl-value">R$ 4.200/mês</span></div>
      <div class="case-line"><span class="cl-label">Campanha Veiga −40%</span><span class="cl-value" style="color:var(--green)">R$ 3.600/mês</span></div>
      <div class="case-line"><span class="cl-label">Anual (12×)</span><span class="cl-value">R$ 43.200/ano</span></div>
      <div class="warn-box">
        ⚠️ Atenção: 40% ainda pode não fechar a 1.000 func. Se a objeção for orçamento de diretoria, considere entrada escalonada — começa com 500 funcionários e expande em 6 meses. Protege sua margem e reduz a barreira de aprovação.
      </div>
      <p class="case-note">✓ Contrato anual obrigatório · revisão de headcount semestral · cláusula de expansão prevista</p>
    </div>
    <!-- Case 3 -->
    <div class="case-card">
      <h4>Caso 3 — 2.000 Funcionários</h4>
      <p class="case-desc">Cliente SST ativo. Ticket alto — R$ 12.000/mês gera atrito. Precisa de proposta customizada além do desconto padrão.</p>
      <div class="case-line"><span class="cl-label">Tabela</span><span class="cl-value">R$ 12.000/mês</span></div>
      <div class="case-line"><span class="cl-label">Desc. 30% (Ricardo)</span><span class="cl-value">R$ 8.400/mês</span></div>
      <div class="case-line"><span class="cl-label">Campanha Veiga −40%</span><span class="cl-value" style="color:var(--green)">R$ 7.200/mês</span></div>
      <div class="case-line"><span class="cl-label">Teto absoluto −50%</span><span class="cl-value" style="color:var(--red)">R$ 6.000/mês</span></div>
      <div class="case-line"><span class="cl-label">Anual (12×)</span><span class="cl-value">R$ 72.000/ano</span></div>
      <div class="warn-box">
        🚨 50% é o teto absoluto — abaixo disso o serviço não se paga com suporte Enterprise. Condições obrigatórias: contrato 24 meses, pagamento anual antecipado, SLA definido em contrato. Decisão exclusiva de Ricardo.
      </div>
      <p class="case-note">✓ Contrato 24 meses · pagamento anual antecipado · cláusula de reajuste IPCA no 2º ano</p>
    </div>
  </div>
  <div class="tip-box">
    💡 <strong>Estratégia para cases 2 e 3:</strong> para empresas acima de 500 funcionários, o problema raramente é o preço por vida — é a percepção de risco de contratar um serviço novo. Considere oferecer um piloto de 90 dias com 50% do headcount ao preço cheio, com opção de expansão e desconto garantido na renovação anual. Isso reduz a barreira de aprovação sem comprometer sua tabela permanentemente.
  </div>
</div>

<script>
(function() {
  var numInput = document.getElementById('numFunc');
  var results = document.getElementById('sim-results');
  var discounts = document.getElementById('sim-discounts');

  function getTier(v) {
    if (v <= 10) return { name: 'Micro', sub: 'Essencial', price: 18, billing: 'Anual 12×', color: 'var(--text)' };
    if (v <= 49) return { name: 'Pequena', sub: 'Essencial Plus', price: 10, billing: 'Anual 12×', color: 'hsl(217,91%,70%)' };
    if (v <= 199) return { name: 'Média', sub: 'Profissional', price: 8, billing: 'Mensal recorrente', color: 'hsl(263,84%,68%)' };
    return { name: 'Grande', sub: 'Enterprise', price: 6, billing: 'Mensal recorrente', color: 'hsl(142,71%,55%)' };
  }

  function fmt(n) {
    return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 0 });
  }

  function sync(v) {
    v = Math.max(10, Math.min(2000, v));
    v = Math.round(v / 10) * 10;
    if (v < 10) v = 10;
    numInput.value = v;
    update(v);
  }

  function update(v) {
    var minVidas = v < 10 ? 10 : v;
    var tier = getTier(v);
    var monthly = tier.price * minVidas;
    var annual = monthly * 12;

    results.innerHTML =
      '<div class="result-card"><div class="label">Plano</div><div class="value" style="color:' + tier.color + '">' + tier.name + '</div><div class="sub">' + tier.sub + '</div></div>' +
      '<div class="result-card"><div class="label">Per Capita</div><div class="value">' + fmt(tier.price) + '</div><div class="sub">por vida/mês</div></div>' +
      '<div class="result-card"><div class="label">Ticket Mensal</div><div class="value" style="color:var(--blue)">' + fmt(monthly) + '</div><div class="sub">' + minVidas + ' vidas</div></div>' +
      '<div class="result-card"><div class="label">Anual</div><div class="value">' + fmt(annual) + '</div><div class="sub">' + tier.billing + '</div></div>';

    var pcts = [10, 20, 30, 40, 50];
    var colors = ['var(--green)', 'var(--blue)', 'var(--amber)', 'var(--red)', 'var(--red)'];
    var html = '';
    for (var i = 0; i < pcts.length; i++) {
      var disc = monthly * (1 - pcts[i] / 100);
      html += '<div class="dr-item"><div class="dr-pct">−' + pcts[i] + '%</div><div class="dr-val" style="color:' + colors[i] + '">' + fmt(Math.round(disc)) + '</div></div>';
    }
    discounts.innerHTML = html;
  }

  window.__stepFunc = function(delta) {
    var current = parseInt(numInput.value) || 10;
    sync(current + delta);
  };

  numInput.addEventListener('change', function() {
    var v = parseInt(this.value) || 10;
    sync(v);
  });

  numInput.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowUp')   { e.preventDefault(); window.__stepFunc(10); }
    if (e.key === 'ArrowDown') { e.preventDefault(); window.__stepFunc(-10); }
  });

  sync(30);
})();
</script>
`;
