export const siteConfig = {
  name: "Resenha e Corte",
  shortName: "Resenha",
  // Três opções testadas, escolhi a primeira por ser mais memorável e
  // afirmativa. Alternativas:
  //  - "Tradição renovada, corte por corte."
  //  - "O ofício do barbeiro, levado a sério."
  tagline: "O corte que define seu estilo.",
  description:
    "Barbearia premium em Itabira/MG. Cortes, barba e tratamentos com agendamento online.",
  city: "Itabira",
  state: "MG",
  address: {
    street: "Rua Esmeralda, 511",
    city: "Itabira",
    state: "MG",
    zip: "",
    full: "Rua Esmeralda, 511 — Itabira, MG",
    mapsEmbed:
      "https://www.google.com/maps?q=Rua+Esmeralda+511+Itabira+MG&output=embed",
    mapsLink: "https://www.google.com/maps/search/?api=1&query=Rua+Esmeralda+511+Itabira+MG",
  },
  phone: "+5531987840324",
  phoneDisplay: "(31) 9 8784-0324",
  whatsapp: "5531987840324",
  whatsappMessage: "Olá! Vim pelo site, gostaria de agendar um horário.",
  email: "contato@resenhaecorte.com.br",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  social: {
    instagram: "https://instagram.com/resenhaecorte_",
    facebook: "https://facebook.com/resenhaecorte",
  },
  hours: [
    { label: "Segunda a Sexta", value: "08h — 20h" },
    { label: "Sábado", value: "07h — 16h" },
    { label: "Domingo", value: "Fechado" },
  ],
} as const;

export const navLinks = [
  { label: "Início", href: "/" },
  { label: "Serviços", href: "/servicos" },
  { label: "Equipe", href: "/equipe" },
  { label: "Contato", href: "/contato" },
] as const;

// Métricas exibidas na faixa de credenciais — inflar números é tentação,
// mas mantenha realista e ajuste com a barbearia depois do lançamento.
export const credentials = [
  { value: "+10", label: "anos de profissão" },
  { value: "+5.000", label: "clientes atendidos" },
  { value: "4.9", label: "avaliação no Google" },
  { value: "Ter–Sáb", label: "agenda aberta" },
] as const;

// Galeria — fotos reais do estúdio. Para adicionar mais, basta soltar
// o arquivo em public/gallery/ e incluir uma entrada aqui.
export const galleryImages = [
  {
    src: "/gallery/corte1.png",
    alt: "Corte com descoloração platinada e degradê alto",
    aspect: "portrait" as const,
  },
  {
    src: "/gallery/corte2.png",
    alt: "Corte cacheado com degradê e shape-up no contorno",
    aspect: "portrait" as const,
  },
  {
    src: "/gallery/corte3.png",
    alt: "Corte cacheado moderno com degradê médio",
    aspect: "portrait" as const,
  },
];

export const testimonials = [
  {
    quote:
      "Saí da Resenha como se tivesse passado no alfaiate. Atenção ao detalhe absurda — o Henrique entendeu o que eu queria antes de eu terminar de explicar.",
    author: "Lucas Andrade",
    role: "Advogado",
  },
  {
    quote:
      "Faço o degradê com o Rafael há dois anos. Nunca um corte ficou ruim, nunca passou da hora marcada. Profissional do começo ao fim.",
    author: "Felipe Moura",
    role: "Designer",
  },
  {
    quote:
      "Barba com toalha quente é outra coisa. Saio relaxado e parecendo gente nova. Vale cada minuto que passei lá dentro.",
    author: "Bruno Caldeira",
    role: "Engenheiro civil",
  },
  {
    quote:
      "Levei meu filho de oito anos junto e os dois fomos atendidos com o mesmo cuidado. Lugar que respeita o cliente.",
    author: "Marcelo Guerra",
    role: "Cliente desde 2021",
  },
];
