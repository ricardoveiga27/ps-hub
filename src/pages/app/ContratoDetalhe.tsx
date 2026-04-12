import { useParams } from "react-router-dom";
import ContratoDetalheComponent from "@/components/contratos/ContratoDetalhe";

export default function ContratoDetalhe() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return <ContratoDetalheComponent id={id} />;
}
