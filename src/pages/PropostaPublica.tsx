import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function PropostaPublica() {
  const { token } = useParams<{ token: string }>();
  const [html, setHtml] = useState<string | null>(null);
  const [linkStatus, setLinkStatus] = useState<string | null>(null);
  const [expiraEm, setExpiraEm] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

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

  return <div ref={containerRef} style={{ margin: 0, padding: 0, background: "transparent" }} dangerouslySetInnerHTML={{ __html: html }} />;
}
