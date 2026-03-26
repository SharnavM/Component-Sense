import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Reveal from "../components/Reveal";
import { useSidebar } from "../context/SidebarContext";

const HOW_I_BUILT_IT = [
  {
    step: "01",
    title: "Defined the problem",
    description:
      "Identified the pain point of navigating across multiple component pages within MUI and React Native Paper docs while building apps.",
  },
  {
    step: "02",
    title: "Designed the architecture",
    description:
      "Chose a RAG (Retrieval-Augmented Generation) pipeline to ground answers in actual library documentation rather than model hallucinations.",
  },
  {
    step: "03",
    title: "Built the ingestion pipeline",
    description:
      "Scraped, chunked, and embedded the MUI and React Native Paper docs into a vector database for semantic search at query time.",
  },
  {
    step: "04",
    title: "Wired up the backend",
    description:
      "Exposed a simple REST endpoint that retrieves relevant chunks, constructs a prompt, and sends the LLM response back to the client.",
  },
  {
    step: "05",
    title: "Crafted the frontend",
    description:
      "Built this UI, focusing on smooth transitions and a clean chat experience.",
  },
];

const TECH_STACK = [
  { label: "React", category: "Frontend" },
  { label: "Vite", category: "Frontend" },
  { label: "Framer Motion", category: "Frontend" },
  { label: "Tailwind CSS", category: "Frontend" },
  { label: "Python", category: "Backend" },
  { label: "FastAPI", category: "Backend" },
  { label: "LangChain", category: "AI" },
  { label: "Google Gemini", category: "AI" },
  { label: "Pinecone", category: "AI" },
];

const GITHUB_URL = import.meta.env.VITE_GITHUB_REPO_URL ?? "#";
const LINKEDIN_URL = import.meta.env.VITE_LINKEDIN_URL ?? "#";
const PORTFOLIO_LINK = import.meta.env.VITE_PORTFOLIO_URL ?? "#";

const CATEGORY_COLORS = {
  Frontend: {
    bg: "rgba(240, 62, 132, 0.12)",
    border: "rgba(240, 62, 132, 0.35)",
    text: "#f65294",
  },
  Backend: {
    bg: "rgba(99, 179, 237, 0.10)",
    border: "rgba(99, 179, 237, 0.30)",
    text: "#63b3ed",
  },
  AI: {
    bg: "rgba(154, 117, 242, 0.12)",
    border: "rgba(154, 117, 242, 0.32)",
    text: "#9a75f2",
  },
};

export default function AboutPage() {
  const { sidebarW } = useSidebar();
  return (
    <>
      <div className="fixed inset-0 z-0 bg-[#0A0A0A]" />

      <motion.main
        className="relative z-10 flex flex-col flex-1 h-[100dvh] overflow-y-auto overflow-x-hidden max-md:!ml-0"
        animate={{ marginLeft: sidebarW }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
      >
        <div className="max-w-[820px] mx-auto pt-[72px] px-[32px] pb-[80px] w-full">
          <Reveal style={{ marginBottom: 64 }}>
            <p className="font-jakarta text-[0.75rem] font-semibold tracking-[0.1em] uppercase text-[#f65294] mb-[14px]">About this project</p>
            <h1 className="font-['Bricolage_Grotesque',sans-serif] text-[clamp(2rem,4vw,3rem)] font-extrabold text-white/92 leading-[1.15] tracking-[-0.02em] m-0 mb-[20px]">
              A RAG-powered docs assistant
              <br />
              for UI libraries.
            </h1>
            <p className="font-jakarta text-[1.05rem] text-white/45 leading-[1.75] m-0 max-w-[600px] text-justify">
              Tired of tabbing between documentation sites while building? Meet{" "}
              <span className="text-[#f65294]">ComponentSense</span>. This
              tool lets you ask questions about{" "}
              <span className="text-[#2f97fe]">Material UI</span> and{" "}
              <span className="text-[#9a75f2]">React Native Paper</span> in
              plain English and get accurate, citation-grounded answers,
              instantly!
            </p>
          </Reveal>

          <Divider />

          <Reveal style={{ marginBottom: 56 }}>
            <SectionLabel>How I built it</SectionLabel>

            <div className="flex flex-col">
              {HOW_I_BUILT_IT.map((item, i) => (
                <Reveal
                  key={item.step}
                  delay={i * 0.07}
                  style={{ display: "flex", gap: "24px" }}
                  vertical
                >
                  <div className="flex flex-col items-center shrink-0 pt-[3px]">
                    <span className="font-['Bricolage_Grotesque',sans-serif] text-[0.75rem] font-bold text-[#f65294] tracking-[0.06em] leading-none">{item.step}</span>
                    {i < HOW_I_BUILT_IT.length - 1 && (
                      <div className="w-[1px] flex-1 min-h-[24px] bg-white/5 my-2" />
                    )}
                  </div>

                  <div className="pb-7">
                    <p className="font-['Bricolage_Grotesque',sans-serif] text-[1rem] font-bold text-white/88 m-0 mb-1.5">{item.title}</p>
                    <p className="font-jakarta text-[0.875rem] text-white/40 leading-[1.7] m-0">{item.description}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>

          <Divider />

          <Reveal style={{ marginBottom: 56 }}>
            <SectionLabel>Tech stack</SectionLabel>

            {Object.keys(CATEGORY_COLORS).map((category, ci) => {
              const items = TECH_STACK.filter((t) => t.category === category);
              if (!items.length) return null;
              const colors = CATEGORY_COLORS[category];
              return (
                <div
                  key={category}
                  className="mb-5 flex items-baseline gap-4 flex-wrap"
                >
                  <span
                    className="font-['Bricolage_Grotesque',sans-serif] text-[0.75rem] font-bold tracking-[0.06em] uppercase min-w-[68px]"
                    style={{ color: colors.text }}
                  >
                    {category}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {items.map((item, ii) => (
                      <Reveal key={item.label} delay={ii * 0.04}>
                        <span
                          className="inline-block px-[14px] py-[5px] rounded-full text-[0.8125rem] font-jakarta font-medium tracking-[0.01em]"
                          style={{
                            background: colors.bg,
                            border: `1px solid ${colors.border}`,
                            color: colors.text,
                          }}
                        >
                          {item.label}
                        </span>
                      </Reveal>
                    ))}
                  </div>
                </div>
              );
            })}
          </Reveal>

          <Divider />

          <div className="flex flex-col md:flex-row gap-8 md:gap-[5%]">
            <Reveal offset={120} className="w-full md:w-[45%]">
              <SectionLabel>Source code</SectionLabel>
              <p className="font-jakarta text-[0.875rem] text-white/40 leading-[1.7] m-0 mb-6">
                The full source: backend ingestion pipeline, API server, and
                this frontend is available on GitHub. PRs and issues are
                welcome.
              </p>

              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline block"
              >
                <motion.div
                  whileHover={{
                    backgroundColor: "rgba(255,255,255,0.09)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-[14px] px-[18px] py-[14px] rounded-[12px] bg-white/[0.04] border border-white/[0.08] text-white/60 cursor-pointer mb-2.5 w-full box-border"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    className="shrink-0"
                  >
                    <title>GitHub</title>
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                  <div>
                    <p className="font-['Bricolage_Grotesque',sans-serif] text-[1rem] font-bold text-white/88 m-0 mb-0.5">View on GitHub</p>
                    <p className="font-jakarta text-[0.75rem] text-white/35 m-0">
                      {GITHUB_URL.replace("https://github.com/", "")}
                    </p>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="ml-auto shrink-0 opacity-40"
                  >
                    <path
                      d="M3 8h10M9 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.div>
              </a>
            </Reveal>
            <Reveal reverse offset={120} className="w-full md:w-[45%]">
              <SectionLabel>Socials</SectionLabel>
              <p className="font-jakarta text-[0.875rem] text-white/40 leading-[1.7] m-0 mb-5">
                Find me below and explore my work.
              </p>

              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline block"
              >
                <motion.div
                  whileHover={{
                    backgroundColor: "rgba(10,132,255,0.10)",
                    borderColor: "rgba(10,132,255,0.28)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-[14px] px-[18px] py-[14px] rounded-[12px] bg-white/[0.04] border border-white/[0.08] text-white/60 cursor-pointer mb-2.5 w-full box-border"
                >
                  <div className="w-[34px] h-[34px] rounded-[9px] bg-[#0A84FF] flex items-center justify-center shrink-0">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 128 128"
                      fill="white"
                    >
                      <path d="M21.06 48.73h18.11V107H21.06zm9.06-29a10.5 10.5 0 11-10.5 10.49 10.5 10.5 0 0110.5-10.49M50.53 48.73h17.36v8h.24c2.42-4.58 8.32-9.41 17.13-9.41C103.6 47.28 107 59.35 107 75v32H88.89V78.65c0-6.75-.12-15.44-9.41-15.44s-10.87 7.36-10.87 15V107H50.53z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-['Bricolage_Grotesque',sans-serif] text-[1rem] font-bold text-white/88 m-0 mb-0.5">LinkedIn</p>
                    <p className="font-jakarta text-[0.75rem] text-white/35 m-0">
                      {LINKEDIN_URL.replace("https://", "")}
                    </p>
                  </div>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="shrink-0 opacity-35"
                  >
                    <path
                      d="M3 8h10M9 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.div>
              </a>

              <a
                href={PORTFOLIO_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline block"
              >
                <motion.div
                  whileHover={{
                    backgroundColor: "rgba(240,62,132,0.10)",
                    borderColor: "rgba(240,62,132,0.28)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-[14px] px-[18px] py-[14px] rounded-[12px] bg-white/[0.04] border border-white/[0.08] text-white/60 cursor-pointer mb-2.5 w-full box-border"
                >
                  <div className="w-[34px] h-[34px] rounded-[9px] bg-[#f65294] flex items-center justify-center shrink-0">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="2" y="7" width="20" height="14" rx="2" />
                      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                      <line x1="12" y1="12" x2="12" y2="12" />
                      <path d="M2 12h20" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-['Bricolage_Grotesque',sans-serif] text-[1rem] font-bold text-white/88 m-0 mb-0.5">Portfolio</p>
                    <p className="font-jakarta text-[0.75rem] text-white/35 m-0">
                      {PORTFOLIO_LINK.replace("https://", "")}
                    </p>
                  </div>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="shrink-0 opacity-35"
                  >
                    <path
                      d="M3 8h10M9 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.div>
              </a>
            </Reveal>
          </div>
        </div>
      </motion.main>
    </>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="font-['Bricolage_Grotesque',sans-serif] text-[0.75rem] font-bold tracking-[0.1em] uppercase text-white/25 mb-[20px] m-0">
      {children}
    </p>
  );
}

function Divider() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scaleX: 0.85, originX: 0 }}
      animate={inView ? { opacity: 1, scaleX: 1 } : {}}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="h-px bg-white/[0.07] mb-12 max-md:ml-0 md:ml-9"
    />
  );
}

