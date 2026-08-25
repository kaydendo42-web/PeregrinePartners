/** All page copy lives here so wording can change without touching layout. */

export const hero = {
  headlineDim: "Scale your vision.",
  headlineLit: "Deploy with AI.",
  sub: "Custom neural agents, LLM infrastructure and automation, delivered as one system.",
  cta: { label: "Start Build", href: "#capabilities" },
  card: { title: "Neural Core", meta: "// Model v4.0.2" },
  trust: "+2,400 active deployments and 8,200 teams run on our architecture.",
};

export const statement = {
  text:
    "Retire the manual work, compress the timeline. Bespoke AI that returns measurable growth and lasting leverage.",
  sub: "Tooling that turns fragmented data into decisions your team can act on the same day.",
};

export const ticker =
  "Neural compute clusters now live in three new global regions, holding sub-50ms inference for enterprise partners across EMEA, APAC and North America.";

export const works = {
  title: "Our Works",
  cases: [
    { tag: "Healthcare AI", brand: "Meridian Health", funds: "$45M+", growth: "700%", roi: "41x", partners: "84" },
    { tag: "Healthcare", brand: "Northlake Care", funds: "$62M+", growth: "450%", roi: "32x", partners: "91" },
    { tag: "Healthcare", brand: "Arden Clinical", funds: "$82M+", growth: "340%", roi: "19x", partners: "56" },
    { tag: "Retail & Logistics", brand: "Portway Group", funds: "$59M+", growth: "215%", roi: "73x", partners: "28" },
    { tag: "Cybersecurity", brand: "Halcyon Secure", funds: "$94M+", growth: "120%", roi: "66x", partners: "12" },
  ],
};

export const capabilities = {
  label: "Capabilities",
  intro:
    "We close the distance between abstract machine learning and everyday business utility through bespoke engineering.",
  heading: "Purpose-built intelligence for serious operators.",
  cta: { label: "Start Build", href: "#faq" },
  panels: [
    {
      n: "001",
      title: "Private Model Infrastructure Labs",
      body: "Robust server environments and local LLM integrations, architected so your data stays private and on your own metal.",
    },
    {
      n: "002",
      title: "Agentic Workflow Engineering",
      body: "Multi-step agents that plan, call your internal tools and hand work back to your team with a full audit trail.",
    },
    {
      n: "003",
      title: "Retrieval Pipelines & Vector Stores",
      body: "Ingestion, chunking and vector retrieval tuned for your corpus, so answers stay grounded in your own sources.",
    },
  ],
};

export const vision = {
  label: "Our Vision",
  text:
    "We hold that AI earns its keep when it widens what a person can attempt, not merely when it clears the queue behind them.",
  body:
    "By pairing technical rigour with intuitive design, we build systems that do more than solve problems — they open routes to growth that were not previously available.",
  person: { name: "Alexander Vacca", role: "Founder & Lead Engineer" },
};

export const neural = {
  mono:
    "Systems engineered to grow with the work in front of you. Frontier and open-weight models, fitted to the stack you already run.",
  chip: "Neural Core v4.0.2",
  features: [
    { icon: "search", body: "Semantic vector search tuned for precise recall" },
    { icon: "orbit", body: "Unified data lakes that widen model context." },
    { icon: "faders", body: "Token-lean pipelines built for fast throughput" },
    { icon: "lang", body: "Deployed worldwide. Fluent across 95+ languages." },
  ],
};

export const faq = {
  label: "Common Queries",
  intro:
    "Answers on technical specifications, deployment timelines and the way we handle your data.",
  heading: "Everything worth asking before we start.",
  cta: { label: "Contact Support", href: "#footer" },
  items: [
    {
      q: "How do you keep our data contained?",
      a: "We run SOC2-compliant local vector databases and on-premise model hosting, so proprietary data never leaves your infrastructure.",
    },
    {
      q: "What does a realistic timeline look like?",
      a: "A scoped pilot ships in four to six weeks. Full production rollout usually lands inside a quarter, depending on data readiness.",
    },
    {
      q: "Will this sit on top of our CRM?",
      a: "Yes. We build against your existing APIs — Salesforce, HubSpot, Dynamics or an internal system — and keep the CRM as the source of truth.",
    },
    {
      q: "Can you fine-tune on our own data?",
      a: "We fine-tune open-weight models on your domain data, and use adapters where a full retrain would be more cost than it is worth.",
    },
    {
      q: "How is return on automation measured?",
      a: "We baseline the hours and error rate of the current manual process, then measure the same figures after deployment each month.",
    },
    {
      q: "Who owns the code at handover?",
      a: "You do. Every repository, weight file and pipeline we produce for you is handed over with full commercial rights.",
    },
    {
      q: "Which model families do you work in?",
      a: "Frontier hosted models for reasoning work, and open-weight families for anything that has to run inside your own perimeter.",
    },
  ],
};

export const footer = {
  blurb:
    "Applied AI engineering for teams that need systems in production, not prototypes on a slide.",
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
        { label: "Careers", href: "#footer" },
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
  wordmark: "peregrine",
};
