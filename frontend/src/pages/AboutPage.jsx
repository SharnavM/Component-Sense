import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import StatusIndicator from "../components/StatusIndicator";
import Reveal from "../components/Reveal";
import { useSidebar } from "../context/SidebarContext";

/* ─── Content  ─── */
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

/* ─── Category accent colours ─── */
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

/* ════════════════════════════════════════════════════════════ */
export default function AboutPage() {
  const [backendStatus] = useState("connected");

  const { sidebarW } = useSidebar();
  return (
    <>
      {/* ── Background — always dark on About ── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          backgroundColor: "#0A0A0A",
        }}
      />

      {/* ── Main ── */}
      <motion.main
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          flex: 1,
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
        }}
        animate={{ marginLeft: sidebarW }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
      >
        <div
          style={{
            maxWidth: 820,
            margin: "0 auto",
            padding: "72px 32px 80px",
            width: "100%",
          }}
        >
          {/* ── Page header ── */}
          <Reveal style={{ marginBottom: 64 }}>
            <p style={styles.eyebrow}>About this project</p>
            <h1 style={styles.pageTitle}>
              A RAG-powered docs assistant
              <br />
              for UI libraries.
            </h1>
            <p style={styles.lead}>
              Tired of tabbing between documentation sites while building? Meet{" "}
              <span style={{ color: "#f65294" }}>ComponentSense</span>. This
              tool lets you ask questions about{" "}
              <span style={{ color: "#2f97fe" }}>Material UI</span> and{" "}
              <span style={{ color: "#9a75f2" }}>React Native Paper</span> in
              plain English and get accurate, citation-grounded answers,
              instantly!
            </p>
          </Reveal>

          <Divider />

          {/* ── How I built it ── */}
          <Reveal style={{ marginBottom: 56 }}>
            <SectionLabel>How I built it</SectionLabel>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {HOW_I_BUILT_IT.map((item, i) => (
                <Reveal
                  key={item.step}
                  delay={i * 0.07}
                  style={styles.stepRow}
                  vertical
                >
                  {/* Step number + vertical line */}
                  <div style={styles.stepLeft}>
                    <span style={styles.stepNumber}>{item.step}</span>
                    {i < HOW_I_BUILT_IT.length - 1 && (
                      <div style={styles.stepLine} />
                    )}
                  </div>

                  {/* Content */}
                  <div style={styles.stepContent}>
                    <p style={styles.stepTitle}>{item.title}</p>
                    <p style={styles.stepDesc}>{item.description}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>

          <Divider />

          {/* ── Tech stack ── */}
          <Reveal style={{ marginBottom: 56 }}>
            <SectionLabel>Tech stack</SectionLabel>

            {/* Group by category */}
            {Object.keys(CATEGORY_COLORS).map((category, ci) => {
              const items = TECH_STACK.filter((t) => t.category === category);
              if (!items.length) return null;
              const colors = CATEGORY_COLORS[category];
              return (
                <div
                  key={category}
                  style={{
                    marginBottom: 20,
                    display: "flex",
                    alignItems: "baseline",
                    gap: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      ...styles.categoryLabel,
                      color: colors.text,
                      minWidth: 68,
                    }}
                  >
                    {category}
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {items.map((item, ii) => (
                      <Reveal key={item.label} delay={ii * 0.04}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "5px 14px",
                            borderRadius: "100px",
                            fontSize: "13px",
                            fontFamily: '"Plus Jakarta Sans", sans-serif',
                            fontWeight: 500,
                            background: colors.bg,
                            border: `1px solid ${colors.border}`,
                            color: colors.text,
                            letterSpacing: "0.01em",
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

          {/* ── Links ── */}
          <div style={{ display: "flex", flexDirection: "row", gap: "5%" }}>
            <Reveal offset={120} style={{ width: "45%" }}>
              <SectionLabel>Source code</SectionLabel>
              <p style={{ ...styles.stepDesc, marginBottom: 24 }}>
                The full source: backend ingestion pipeline, API server, and
                this frontend is available on GitHub. PRs and issues are
                welcome.
              </p>

              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none", display: "inline-block" }}
              >
                <motion.div
                  whileHover={{
                    backgroundColor: "rgba(255,255,255,0.09)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  style={styles.linkButton}
                >
                  {/* GitHub icon */}
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    style={{ flexShrink: 0 }}
                  >
                    <title>GitHub</title>
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                  <div>
                    <p style={styles.linkTitle}>View on GitHub</p>
                    <p style={styles.linkURL}>
                      {GITHUB_URL.replace("https://", "")}
                    </p>
                  </div>
                  {/* Arrow */}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    style={{ marginLeft: "auto", flexShrink: 0, opacity: 0.4 }}
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
            <Reveal reverse offset={120} style={{ width: "45%" }}>
              <SectionLabel>Socials</SectionLabel>
              <p style={{ ...styles.stepDesc, marginBottom: 20 }}>
                Find me below and explore my work.
              </p>

              {/* LinkedIn */}
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none", display: "block" }}
              >
                <motion.div
                  whileHover={{
                    backgroundColor: "rgba(10,132,255,0.10)",
                    borderColor: "rgba(10,132,255,0.28)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  style={styles.linkButton}
                >
                  {/* LinkedIn colour dot + icon */}
                  <div style={styles.iconWrap("#0A84FF")}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 128 128"
                      fill="white"
                    >
                      <path d="M21.06 48.73h18.11V107H21.06zm9.06-29a10.5 10.5 0 11-10.5 10.49 10.5 10.5 0 0110.5-10.49M50.53 48.73h17.36v8h.24c2.42-4.58 8.32-9.41 17.13-9.41C103.6 47.28 107 59.35 107 75v32H88.89V78.65c0-6.75-.12-15.44-9.41-15.44s-10.87 7.36-10.87 15V107H50.53z" />
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={styles.linkTitle}>LinkedIn</p>
                    <p style={styles.linkURL}>
                      {LINKEDIN_URL.replace("https://", "")}
                    </p>
                  </div>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 16 16"
                    fill="none"
                    style={{ flexShrink: 0, opacity: 0.35 }}
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

              {/* Portfolio */}
              <a
                href={PORTFOLIO_LINK}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none", display: "block" }}
              >
                <motion.div
                  whileHover={{
                    backgroundColor: "rgba(240,62,132,0.10)",
                    borderColor: "rgba(240,62,132,0.28)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  style={styles.linkButton}
                >
                  <div style={styles.iconWrap("#f65294")}>
                    {/* Briefcase icon */}
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
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={styles.linkTitle}>Portfolio</p>
                    <p style={styles.linkURL}>
                      {PORTFOLIO_LINK.replace("https://", "")}
                    </p>
                  </div>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 16 16"
                    fill="none"
                    style={{ flexShrink: 0, opacity: 0.35 }}
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

/* ─── Small shared components ─── */

function SectionLabel({ children }) {
  return (
    <p
      style={{
        fontFamily: "Bricolage Grotesque, sans-serif",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.25)",
        marginBottom: 20,
      }}
    >
      {children}
    </p>
  );
}

function Divider() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });

  return (
    <motion.hr
      ref={ref}
      initial={{ opacity: 0, scaleX: 0.85, originX: 0 }}
      animate={inView ? { opacity: 1, scaleX: 1 } : {}}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        border: "none",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        margin: "0 0 48px 36px",
      }}
    />
  );
}

/* ─── Style objects ─── */
const styles = {
  eyebrow: {
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#f65294",
    marginBottom: 14,
  },
  pageTitle: {
    fontFamily: "Bricolage Grotesque, sans-serif",
    fontSize: "clamp(2rem, 4vw, 3rem)",
    fontWeight: 800,
    color: "rgba(255,255,255,0.92)",
    lineHeight: 1.15,
    letterSpacing: "-0.02em",
    margin: "0 0 20px",
  },
  lead: {
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    fontSize: "1.05rem",
    color: "rgba(255,255,255,0.45)",
    lineHeight: 1.75,
    margin: 0,
    maxWidth: 600,
    textAlign: "justify",
  },
  stepRow: {
    display: "flex",
    gap: 24,
  },
  stepLeft: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flexShrink: 0,
    paddingTop: 3,
  },
  stepNumber: {
    fontFamily: "Bricolage Grotesque, sans-serif",
    fontSize: "11px",
    fontWeight: 700,
    color: "#f65294",
    letterSpacing: "0.06em",
    lineHeight: 1,
  },
  stepLine: {
    width: 1,
    flex: 1,
    minHeight: 24,
    background: "rgba(255,255,255,0.07)",
    margin: "8px 0",
  },
  stepContent: {
    paddingBottom: 28,
  },
  stepTitle: {
    fontFamily: "Bricolage Grotesque, sans-serif",
    fontSize: "15px",
    fontWeight: 700,
    color: "rgba(255,255,255,0.88)",
    margin: "0 0 6px",
  },
  stepDesc: {
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    fontSize: "14px",
    color: "rgba(255,255,255,0.42)",
    lineHeight: 1.7,
    margin: 0,
  },
  categoryLabel: {
    fontFamily: "Bricolage Grotesque, sans-serif",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },

  iconWrap: (color) => ({
    width: 34,
    height: 34,
    borderRadius: "9px",
    background: color,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  }),

  linkButton: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 18px",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.6)",
    cursor: "pointer",
    marginBottom: 10,
    width: "100%",
    boxSizing: "border-box",
  },
  linkTitle: {
    fontFamily: "Bricolage Grotesque, sans-serif",
    fontSize: "15px",
    fontWeight: 700,
    color: "rgba(255,255,255,0.88)",
    margin: "0 0 2px",
  },
  linkURL: {
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    fontSize: "12px",
    color: "rgba(255,255,255,0.35)",
    margin: 0,
  },
};
