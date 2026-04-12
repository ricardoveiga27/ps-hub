import { useParams } from "react-router-dom";
import PropostaDetalheComponent from "@/components/propostas/PropostaDetalhe";

export default function PropostaDetalhePage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return <PropostaDetalheComponent id={id} />;
}
