

# PS Hub — Landing Page Institucional

## Visão Geral
Landing page institucional dark mode para o PS Hub, ecossistema de compliance psicossocial com três pilares (PS Index, PS Escuta, PS Cultura). Design sofisticado com glassmorphism, gradientes e animações.

## Estrutura

### 1. Setup Visual
- Importar fontes Syne e DM Sans via Google Fonts
- Configurar paleta de cores customizada no Tailwind (azul #0C1BC9, violeta #7C3AED, verde #00D857, backgrounds escuros)
- Background principal #080D1F

### 2. Hero Section
- Logo "PSHub" com cores azul/verde
- Tagline sobre ecossistema de saúde psicossocial
- Dois CTAs: gradiente (âncora para pilares) e outline verde
- Background com mesh gradient animado sutil usando as 3 cores

### 3. Seção "Por que um Ecossistema?"
- Texto sobre NR-01 e ciclo de compliance
- Três ícones em linha (Avaliar, Acolher, Desenvolver) nas cores dos pilares
- Linha gradiente conectando os ícones

### 4. Seção "Os Três Pilares"
- 3 cards glassmorphism grandes com:
  - Borda superior colorida por pilar
  - Número marca d'água (01, 02, 03) com 5% opacidade
  - Badge, ícone, título, subtítulo e descrição
  - Hover com elevação e glow na cor do pilar
- PS Index (azul), PS Escuta (violeta), PS Cultura (verde)

### 5. Seção "Como o Ecossistema se Integra"
- Diagrama de fluxo circular/horizontal com setas
- PS Index → PS Escuta → PS Cultura → ciclo
- Cores e gradientes dos pilares nas conexões

### 6. Seção "Conformidade Regulatória"
- 3 badges grandes: NR-01, Lei 14.457/22, LGPD
- Bordas nas cores dos pilares
- Texto sobre proteção legal

### 7. CTA Final
- Background gradiente forte azul→violeta→verde
- Título e botão branco "Solicitar uma demonstração"

### 8. Footer
- Logo PSHub, créditos Veiga Saúde Ocupacional
- Links placeholder, fundo #06091A

## Detalhes de UX
- Animações de entrada ao scroll via IntersectionObserver (fade + translateY)
- Cards com hover: elevação, box-shadow colorido
- Botões com transições suaves
- 100% responsivo mobile-first
- Apenas ícones Lucide React, sem imagens externas
- Componentes separados por seção

