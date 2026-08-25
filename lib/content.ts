/**
 * Page copy and asset wiring.
 * Assets live in /public/assets, transferred from the source project.
 */

const A = "/assets";

export const brand = {
  /** The source ships its wordmark as a raster PNG, so it can't be recoloured or
   *  re-lettered. Set `wordmarkSrc` to your own logo file to swap it; leave it
   *  null and the wordmark renders as live text in `name`. */
  name: "peregrine",
  wordmarkSrc: null as string | null,
  tickerTag: "//PEREGRINE",
};

export const hero = {
  headlineDim: "Scale your ideas.",
  headlineLit: "Build with AI.",
  sub: "Deploy custom neural agents, LLMs, and automation in one seamless flow.",
  cta: { label: "Start Build", href: "#capabilities" },
  card: {
    title: "Digital Brain",
    meta: "// Model v4.0.2",
    poster: `${A}/i8M81i0PeB8FDxgPt1GPDik2kA.jpg`,
    video: `${A}/2WO0ZC7yTbYNkxdTbPKkcOs30s.mp4`,
  },
  trust: "+2,400 active deployments and 8,200 brands trust our high-performance architecture.",
  bgFront: `${A}/PXNhr4LbXoJRWLAHfzNTYjvdR5Y.png`,
  bgBack: `${A}/v2cZIMtgjEII7EpDnUDGGgCyuiQ.png`,
};

/**
 * The source template fills these slots with the marks of real, unaffiliated
 * companies. Publishing them would assert client relationships that may not
 * exist, so they are off by default. Flip `useDemoClientLogos` to true only if
 * these are genuinely your clients; otherwise replace the paths with your own.
 */
export const useDemoClientLogos = false;

export const demoClientLogos = [
  `${A}/FIkeNB0CMpKHgxqL0a3aPHKlAyQ.png`,
  `${A}/nJbNnh8E8FlHfzjwzNY6HTfjGnE.png`,
  `${A}/3EwtMm1CTn3V13Xu2ufZVUnW4.png`,
  `${A}/C7otSLQhZagCjkAC4M6MX1Ns.png`,
  `${A}/PNxA5d1umCQiNSezotkgCnArwqU.png`,
];

export const statement = {
  text:
    "Automate the manual, accelerate the future. Our custom AI solutions deliver measurable growth and operational excellence.",
  sub: "Empowering teams with intelligent tools that turn complex data into actionable business outcomes daily.",
  revenue: {
    value: 45,
    caption: "Revenue generated for our clients through AI-led optimizations.",
  },
  agents: {
    count: "15,400",
    label: "active agents",
    avatars: [
      `${A}/D3gag0wTRQzvb6CCfJkTShmXTPI.jpg`,
      `${A}/9AvPLCB2PkQCEoFgNdwvDaIaGGI.jpg`,
      `${A}/pktP7O1JHzk75RWizEsb0jRSjk.jpg`,
      `${A}/2418vQBGZ7CPVHaaIlQ5wuUyr4.jpg`,
    ],
  },
  speed: { value: 5, caption: "Faster speed to market." },
  inference: {
    value: 90,
    title: "Inference speed",
    caption: "Real-time processing for enterprise-grade deployments.",
  },
  quote: {
    text: "The custom LLM they built for us reduced our support tickets by 80% while increasing user satisfaction.",
    /* Attribution left unbranded: the source credits a real company that is not
       necessarily a client. Put your own reference here. */
    attribution: "CTO, enterprise health client",
    logo: null as string | null,
  },
};

export const ticker =
  "We are officially expanding our neural compute clusters to three new global regions, providing sub-50ms inference speeds for our enterprise partners across EMEA, APAC, and North America.";

export const works = {
  title: "Our Works",
  cases: [
    {
      tag: "Healthcare AI",
      cover: `${A}/sZxYLpvH56E3RznKPcnAPYlPvo.jpg`,
      logo: null as string | null,
      funds: "$45M+", growth: "700%", roi: "41x", partners: "84",
    },
    {
      tag: "Healthcare",
      cover: `${A}/4GMiBYbu9SI4dXo9ENcqlNA.jpg`,
      logo: null as string | null,
      funds: "$62M+", growth: "450%", roi: "32x", partners: "91",
    },
    {
      tag: "Healthcare",
      cover: `${A}/0g3E5eja3ueYAXkITtsy9quyYo.jpg`,
      logo: null as string | null,
      funds: "$82M+", growth: "340%", roi: "19x", partners: "56",
    },
    {
      tag: "Retail & Logistics",
      cover: `${A}/ZK0k9kMGgE21P7r3puSMYZ8548.jpg`,
      logo: null as string | null,
      funds: "$59M+", growth: "215%", roi: "73x", partners: "28",
    },
    {
      tag: "Cybersecurity",
      cover: `${A}/LYQLqywSoqlHG7KLRJM70MIk.png`,
      logo: null as string | null,
      funds: "$94M+", growth: "120%", roi: "66x", partners: "12",
    },
  ],
};

export const capabilities = {
  label: "Capabilities",
  intro:
    "We bridge the gap between abstract machine learning and practical business utility through bespoke engineering.",
  heading: "Tailored Intelligence for Modern Enterprises.",
  cta: { label: "Start Build", href: "#faq" },
  panelBgOpen: `${A}/qWpzthqQ4FGQWP39IeKgah1OP8.png`,
  panelBgClosed: `${A}/pEct5trUmjDYAblzuKYq2MpHaA.png`,
  panels: [
    {
      n: "001",
      title: "Autonomous Agent Architecture Labs",
      body: "Architecting robust server environments and local LLM integrations to ensure data remains secure and local.",
      object: `${A}/WTuFQeqWgOcQVCks16yKxgDaefI.png`,
    },
    {
      n: "002",
      title: "Autonomous Agentic Workflows",
      body: "Multi-step agents that plan, call your internal tools, and hand work back with a complete audit trail.",
      object: `${A}/WTuFQeqWgOcQVCks16yKxgDaefI.png`,
    },
    {
      n: "003",
      title: "Data Pipelines & RAG Systems",
      body: "Ingestion, chunking and vector retrieval tuned to your corpus so answers stay grounded in your own sources.",
      object: `${A}/WTuFQeqWgOcQVCks16yKxgDaefI.png`,
    },
  ],
};

export const vision = {
  label: "Our Vision",
  text:
    "We believe that AI should not just automate tasks, but amplify the creative and strategic potential of every human.",
  body:
    "By merging technical rigor with intuitive design, we build systems that don't just solve problems—they create entirely new opportunities for growth.",
  person: {
    name: "Alexander Vacca",
    role: "Founder & Lead Engineer",
    photo: `${A}/jnIpVvHAXWiAGa8gLEmWtRuDwQ.png`,
  },
};

export const neural = {
  mono:
    "Engineering systems that scale with your ambition. We leverage industry-leading models to deploy custom neural solutions tailored to your stack.",
  chip: "Digital Brain v4.0.2",
  models: [
    `${A}/SMyO8DDP1JPIhoq2Ak1dNFDpGIo.png`,
    `${A}/ss2Osfd5P1AGF1NpgQhGgyGabA.png`,
    `${A}/fQ71Xa5nLv0lmW62RjPI68rMDcU.png`,
    `${A}/Yhx5rRmY8EDv8iMIG0L554Xx3k.png`,
  ],
  features: [
    { icon: "search", body: "Semantic vector search for hyper-accurate retrieval" },
    { icon: "orbit", body: "Unified data lakes for expansive model context." },
    { icon: "faders", body: "Token-optimized flows for high speed processing" },
    { icon: "lang", body: "Global LLM deployment. Support for 95+ languages." },
  ],
};

export const faq = {
  label: "Common Queries",
  intro:
    "Find answers to technical specifications, deployment timelines, and our data security protocols.",
  heading: "Everything you need to know about our AI.",
  cta: { label: "Contact Support", href: "#footer" },
  items: [
    {
      q: "How do you ensure our data remains secure?",
      a: "We utilize SOC2-compliant local vector databases and on-premise LLM hosting to ensure your proprietary data never leaves your infrastructure.",
    },
    {
      q: "What is the typical deployment timeline?",
      a: "Initial neural audits take 1 week, followed by a 4-week rapid prototyping phase before full-scale production deployment.",
    },
    {
      q: "Can we integrate with our existing CRM?",
      a: "Yes, our cognitive pipelines are built with native API connectors for Salesforce, HubSpot, and custom enterprise ERP systems.",
    },
    {
      q: "Do you provide model fine-tuning?",
      a: "Absolutely. We offer bespoke fine-tuning services to align open-source models with your specific industry terminology and logic.",
    },
    {
      q: "How do you calculate ROI for automation?",
      a: "We track inference-to-impact metrics, measuring hours saved and accuracy gains against your previous baseline manual workflows.",
    },
    {
      q: "Do we own the custom code you build?",
      a: "Yes. All custom neural architectures and integration code developed for your firm are 100% owned by you upon project completion.",
    },
    {
      q: "What models do you specialize in?",
      a: "We are model-agnostic, specializing in frontier hosted models as well as local deployments of high-performance open-source LLMs.",
    },
  ],
};

export const footer = {
  blurb:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam ac ultrices massa. Vivamus faucibus egestas nulla",
  bg: `${A}/v2cZIMtgjEII7EpDnUDGGgCyuiQ.png`,
  columns: [
    {
      title: "Quick Links",
      links: [
        { label: "Home", href: "#top" },
        { label: "Digital Brain", href: "#neural" },
        { label: "Projects", href: "#works" },
        { label: "Articles", href: "#neural" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "#vision" },
        { label: "Contact Us", href: "#faq" },
        { label: "Book A Call", href: "#faq" },
        { label: "More Templates", href: "#footer" },
      ],
    },
    {
      title: "Policies",
      links: [
        { label: "Terms & Conditions", href: "#footer" },
        { label: "Privacy Policy", href: "#footer" },
      ],
    },
  ],
};
