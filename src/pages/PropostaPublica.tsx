import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function PropostaPublica() {
  const { token } = useParams<{ token: string }>();
  const [html, setHtml] = useState<string | null>(null);
  const [linkStatus, setLinkStatus] = useState<string | null>(null);
  const [expiraEm, setExpiraEm] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState<{ nome: string; dataISO: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Focus close + ESC to dismiss the celebration modal
  useEffect(() => {
    if (!accepted) return;
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAccepted(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [accepted]);

  // Reset body background
  useEffect(() => {
    const orig = document.body.style.backgroundColor;
    const origPad = document.body.style.padding;
    document.body.style.backgroundColor = "transparent";
    document.body.style.padding = "0";
    return () => {
      document.body.style.backgroundColor = orig;
      document.body.style.padding = origPad;
    };
  }, []);

  // Fetch link data
  useEffect(() => {
    if (!token) return;
    supabase
      .rpc("get_proposta_link_by_token", { _token: token })
      .then(({ data }) => {
        const row = Array.isArray(data) ? data[0] : null;
        setHtml(row?.html_gerado ?? null);
        setLinkStatus(row?.status ?? null);
        setExpiraEm(row?.expira_em ?? null);
        setLoading(false);
      });
  }, [token]);

  // Activate print button (inline onclick is ignored by dangerouslySetInnerHTML)
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
        document.title = 'PS Hub';
      };
    }

    return () => {
      document.title = 'PS Hub';
    };
  }, [html]);

  // Bind acceptance logic after HTML renders
  useEffect(() => {
    if (!html || !containerRef.current || !token) return;
    if (linkStatus !== "aguardando") return;

    const container = containerRef.current;
    const cpfInput = container.querySelector<HTMLInputElement>("#aceite_cpf");
    const nomeInput = container.querySelector<HTMLInputElement>("#aceite_nome");
    const cargoInput = container.querySelector<HTMLInputElement>("#aceite_cargo");
    const checkbox = container.querySelector<HTMLInputElement>("#aceite_check");
    const btn = container.querySelector<HTMLButtonElement>("#aceite_btn");

    if (!cpfInput || !btn) return;

    // CPF mask
    function maskCPF(e: Event) {
      const input = e.target as HTMLInputElement;
      let v = input.value.replace(/\D/g, "").slice(0, 11);
      if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
      else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
      else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, "$1.$2");
      input.value = v;
    }
    cpfInput.addEventListener("input", maskCPF);

    // Checkbox toggle
    function toggleBtn() {
      if (btn && checkbox) {
        btn.disabled = !checkbox.checked;
        btn.style.opacity = checkbox.checked ? "1" : "0.5";
      }
    }
    checkbox?.addEventListener("change", toggleBtn);
    toggleBtn();

    // Accept click
    async function handleAccept(e: Event) {
      e.preventDefault();
      e.stopPropagation();
      if (!btn || !cpfInput) return;

      const nome = nomeInput?.value?.trim() || "";
      const cpf = cpfInput.value?.trim() || "";
      const cargo = cargoInput?.value?.trim() || "";

      if (!nome) { alert("Preencha o nome completo."); return; }
      if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf)) { alert("CPF inválido. Use o formato 000.000.000-00."); return; }

      btn.disabled = true;
      btn.textContent = "Enviando...";

      const { error } = await supabase.rpc("aceitar_proposta_link", {
        _token: token!,
        _nome: nome,
        _cpf: cpf,
        _cargo: cargo || "",
        _ip: "",
      });

      if (error) {
        alert("Erro ao registrar aceite. Tente novamente.");
        btn.disabled = false;
        btn.textContent = "Confirmar Aceite";
        return;
      }

      // Dispatch custom event for compatibility
      window.dispatchEvent(new CustomEvent("aceite_proposta", { detail: { nome, cpf, cargo } }));

      // Open celebration modal
      setAccepted({ nome, dataISO: new Date().toISOString() });

      // Replace acceptance section with confirmation
      const aceiteSection = container.querySelector("#aceite-section") ||
        btn.closest("section") || btn.closest("div[style]") || btn.parentElement?.parentElement;
      if (aceiteSection) {
        (aceiteSection as HTMLElement).innerHTML = `
          <div style="text-align:center;padding:40px 20px;background:linear-gradient(135deg,#059669,#10b981);border-radius:12px;margin:20px 0;">
            <div style="font-size:48px;margin-bottom:16px;">✓</div>
            <h3 style="color:#fff;font-size:22px;margin:0 0 8px;">Proposta Aceita com Sucesso!</h3>
            <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0;">Aceite registrado por ${nome} em ${new Date().toLocaleDateString("pt-BR")}.</p>
          </div>`;
      }
    }
    btn.addEventListener("click", handleAccept);

    return () => {
      cpfInput.removeEventListener("input", maskCPF);
      checkbox?.removeEventListener("change", toggleBtn);
      btn.removeEventListener("click", handleAccept);
    };
  }, [html, linkStatus, token]);

  if (loading) return null;

  // Expired
  if (linkStatus === "aguardando" && expiraEm && new Date(expiraEm) < new Date()) {
    return <div style={{ padding: 40, textAlign: "center", color: "#888", fontFamily: "sans-serif" }}>Esta proposta expirou.</div>;
  }

  if (!html) return <div style={{ padding: 40, textAlign: "center", color: "#888", fontFamily: "sans-serif" }}>Proposta não encontrada.</div>;

  const confettiColors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6"];

  return (
    <>
      <div ref={containerRef} style={{ margin: 0, padding: 0, background: "transparent" }} dangerouslySetInnerHTML={{ __html: html }} />

      {accepted && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="celebracao-title"
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16, fontFamily: "'DM Sans', sans-serif",
            animation: "celebFadeIn 0.3s ease-out",
          }}
        >
          <style>{`
            @keyframes celebFadeIn { from { opacity: 0 } to { opacity: 1 } }
            @keyframes celebScaleIn { from { opacity: 0; transform: scale(0.9) } to { opacity: 1; transform: scale(1) } }
            @keyframes celebConfetti {
              0% { transform: translateY(-10vh) rotate(0deg); opacity: 1 }
              100% { transform: translateY(110vh) rotate(720deg); opacity: 0 }
            }
            @keyframes celebPop {
              0% { transform: scale(0) rotate(-180deg); opacity: 0 }
              60% { transform: scale(1.2) rotate(10deg); opacity: 1 }
              100% { transform: scale(1) rotate(0deg); opacity: 1 }
            }
          `}</style>

          {/* Confetti */}
          <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
            {Array.from({ length: 40 }).map((_, i) => {
              const left = Math.random() * 100;
              const delay = Math.random() * 1.5;
              const duration = 3 + Math.random() * 2;
              const size = 8 + Math.random() * 8;
              const color = confettiColors[i % confettiColors.length];
              return (
                <span
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${left}%`,
                    top: "-5vh",
                    width: size,
                    height: size * 0.4,
                    background: color,
                    borderRadius: 2,
                    animation: `celebConfetti ${duration}s ${delay}s linear forwards`,
                  }}
                />
              );
            })}
          </div>

          <div
            style={{
              position: "relative",
              background: "#fff",
              borderRadius: 20,
              boxShadow: "0 25px 60px -15px rgba(0,0,0,0.5)",
              maxWidth: 520,
              width: "100%",
              padding: "40px 32px 32px",
              textAlign: "center",
              animation: "celebScaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                width: 88, height: 88, margin: "0 auto 20px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #10b981, #14b8a6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 12px 30px -8px rgba(16,185,129,0.5)",
                animation: "celebPop 0.6s 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) backwards",
              }}
            >
              <CheckCircle2 size={56} color="#fff" strokeWidth={2.5} />
            </div>

            <h2
              id="celebracao-title"
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 28, fontWeight: 700,
                color: "#0f172a", margin: "0 0 8px",
                lineHeight: 1.2,
              }}
            >
              🎉 Parabéns pela sua compra!
            </h2>
            <p style={{ color: "#475569", fontSize: 16, margin: "0 0 20px" }}>
              Obrigado, <strong style={{ color: "#0f172a" }}>{accepted.nome}</strong>! Sua adesão ao PS Hub foi confirmada.
            </p>

            <p style={{ color: "#334155", fontSize: 15, lineHeight: 1.6, margin: "0 0 24px" }}>
              Em breve nossa equipe de implantação entrará em contato para dar continuidade com seu onboarding.
              <br />
              <strong>Nos vemos do outro lado! 🚀</strong>
            </p>

            <div
              style={{
                background: "linear-gradient(135deg, #f0fdf4, #ecfeff)",
                border: "1px solid #d1fae5",
                borderRadius: 12,
                padding: 20,
                textAlign: "left",
                marginBottom: 24,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: "#047857", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
                Próximos passos
              </div>
              {[
                { icon: "👋", text: "Nossa equipe entrará em contato em até 1 dia útil" },
                { icon: "📋", text: "Vamos agendar uma call de kickoff do onboarding" },
                { icon: "🚀", text: "Implantação personalizada da sua empresa" },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "8px 0", color: "#1e293b", fontSize: 14 }}>
                  <span style={{ fontSize: 20, lineHeight: 1 }}>{s.icon}</span>
                  <span style={{ flex: 1 }}>{s.text}</span>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 20px" }}>
              Aceite registrado em {new Date(accepted.dataISO).toLocaleString("pt-BR")} por {accepted.nome}.
            </p>

            <button
              ref={closeBtnRef}
              onClick={() => setAccepted(null)}
              style={{
                background: "linear-gradient(135deg, #10b981, #14b8a6)",
                color: "#fff",
                border: "none",
                padding: "12px 32px",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: "0 8px 20px -8px rgba(16,185,129,0.5)",
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
