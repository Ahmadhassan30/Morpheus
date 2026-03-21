"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { CodeDisplay } from "../components/CodeDisplay";

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"] as const;
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const precision = unitIndex === 0 ? 0 : value < 10 ? 1 : 0;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
}

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [appLoaded, setAppLoaded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    let isCancelled = false;
    let tl: any = null;

    try {
      const saved = localStorage.getItem("morpheus-theme") as
        | "dark"
        | "light"
        | null;
      if (saved) {
        setTheme(saved);
        document.documentElement.setAttribute("data-theme", saved);
      }
    } catch (e) {}

    import("gsap").then(({ gsap }) => {
      if (isCancelled) return;

      const loaderEl = document.getElementById("morpheus-loader");
      if (loaderEl) {
        loaderEl.style.display = "flex";
        loaderEl.style.opacity = "1";
      }

      tl = gsap.timeline({ onComplete: () => setAppLoaded(true) });

      tl.fromTo(
        "#loader-progress",
        { width: "0%" },
        { width: "100%", duration: 1.4, ease: "power2.inOut" }
      );
      tl.to("#morpheus-loader", {
        opacity: 0,
        duration: 0.4,
        ease: "power2.in",
        onComplete: () => {
          const el = document.getElementById("morpheus-loader");
          if (el) el.style.display = "none";
        }
      });
      tl.from(
        "#hero-line1",
        { y: 100, opacity: 0, duration: 0.7, ease: "power3.out" },
        "-=0.1"
      );
      tl.from(
        "#hero-line2",
        { y: 100, opacity: 0, duration: 0.7, ease: "power3.out" },
        "-=0.55"
      );
      tl.from(
        "#hero-line3",
        { y: 100, opacity: 0, duration: 0.7, ease: "power3.out" },
        "-=0.55"
      );
      tl.from(
        "#hero-sub",
        { y: 30, opacity: 0, duration: 0.6, ease: "power3.out" },
        "-=0.4"
      );
      tl.from(
        "#main-panel",
        { y: 50, opacity: 0, duration: 0.8, ease: "power3.out" },
        "-=0.3"
      );
    });

    return () => {
      isCancelled = true;
      if (tl) tl.kill();
    };
  }, []);

  const fileMeta = useMemo(() => {
    if (!file) return null;
    return {
      name: file.name,
      size: formatBytes(file.size)
    };
  }, [file]);

  const canGenerate =
    !isLoading && file !== null && description.trim().length > 0;

  const setSelectedFile = (next: File | null): void => {
    setError(null);
    setCode("");

    if (preview) URL.revokeObjectURL(preview);
    setPreview("");

    if (!next) {
      setFile(null);
      return;
    }

    if (!next.type.startsWith("image/")) {
      setFile(null);
      setError("Please upload an image file.");
      return;
    }

    setFile(next);
    setPreview(URL.createObjectURL(next));
  };

  const handleBrowse = (): void => {
    fileInputRef.current?.click();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0] ?? null;
    setSelectedFile(dropped);
  };

  const handleGenerate = async (): Promise<void> => {
    if (!file || !description.trim()) return;
    setIsLoading(true);
    setIsStreaming(true);
    setCode("");
    setError(null);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("description", description.trim());

    try {
			const apiUrl = process.env.NEXT_PUBLIC_API_URL;
			if (!apiUrl) {
				throw new Error(
					"NEXT_PUBLIC_API_URL is not set. Set it in your .env.local after deploying the API."
				);
			}

      const res = await fetch(
        `${apiUrl}/api/generate`,
        { method: "POST", body: formData }
      );

      if (!res.ok) {
        const data: unknown = await res.json();
        const message =
          typeof data === "object" && data !== null && "error" in data
            ? String((data as { error?: unknown }).error ?? "Request failed")
            : "Request failed";
        throw new Error(message);
      }

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setCode((prev) => prev + chunk);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("morpheus-theme", next);
    } catch (e) {}
  };
  const logoSrc = theme === "dark" ? "/logo_dark.png" : "/logo.png";

  return (
    <>
      {/* LOADER */}
      <div
        id="morpheus-loader"
        style={{
          position: "fixed",
          inset: 0,
          background: "#0f0f0f",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28
        }}
      >
        <img
          src="/logo_dark.png"
          alt="Morpheus"
          style={{ height: 56, width: "auto", objectFit: "contain" }}
        />
        <div
          style={{
            width: 200,
            height: 1,
            background: "#242424",
            position: "relative",
            overflow: "hidden"
          }}
        >
          <div
            id="loader-progress"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: "0%",
              background: "#ff6900"
            }}
          />
        </div>
        <span
          style={{
            fontFamily: "'Roboto', sans-serif",
            fontSize: 10,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#444444"
          }}
        >
          Loading
        </span>
      </div>

      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        {/* HEADER */}
        <header
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            height: 132,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 48px",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg)"
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 48,
              top: "50%",
              transform: "translateY(-50%)",
              fontFamily: "var(--font-body)",
              fontSize: 10,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "var(--text-dim)",
              lineHeight: 1.6
            }}
          >
            Vision to Interface
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3
            }}
          >
            <img
              src={logoSrc}
              alt="Morpheus"
              style={{
                height: "clamp(78px, 8vw, 100px)",
                width: "auto",
                objectFit: "contain",
                filter: "drop-shadow(0 0 18px rgba(255,105,0,0.14))"
              }}
            />
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "var(--text-primary)",
                lineHeight: 1
              }}
            >
              Morpheus
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              right: 96,
              top: "50%",
              transform: "translateY(-50%)",
              fontFamily: "var(--font-body)",
              fontSize: 10,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "var(--text-dim)",
              lineHeight: 1.6,
              textAlign: "right"
            }}
          >
            Sketch. Generate. Ship.
          </div>
          <button
            onClick={toggleTheme}
            style={{
              position: "absolute",
              right: 48,
              width: 34,
              height: 34,
              border: "1px solid var(--border-mid)",
              background: "transparent",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "var(--font-body)",
              transition: "border-color 0.15s, color 0.15s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.color = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-mid)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            {theme === "dark" ? "◐" : "◑"}
          </button>
        </header>

        {/* HERO */}
        <section
          style={{
            paddingTop: 212,
            paddingBottom: 64,
            paddingLeft: 48,
            paddingRight: 48
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--text-dim)",
              marginBottom: 48,
              fontFamily: "var(--font-body)"
            }}
          >
            — Wireframe to Code
          </div>

          <div style={{ overflow: "hidden", marginBottom: 0 }}>
            <div
              id="hero-line1"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(80px, 13vw, 180px)",
                fontWeight: 800,
                lineHeight: 0.88,
                letterSpacing: "0.01em",
                color: "var(--text-primary)",
                textTransform: "uppercase"
              }}
            >
              SKETCH.
            </div>
          </div>

          <div style={{ overflow: "hidden" }}>
            <div
              id="hero-line2"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(80px, 13vw, 180px)",
                fontWeight: 800,
                lineHeight: 0.88,
                letterSpacing: "0.01em",
                color: "var(--accent)",
                textTransform: "uppercase"
              }}
            >
              GENERATE.
            </div>
          </div>

          <div style={{ overflow: "hidden", marginBottom: 48 }}>
            <div
              id="hero-line3"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(80px, 13vw, 180px)",
                fontWeight: 800,
                lineHeight: 0.88,
                letterSpacing: "0.01em",
                color: "var(--text-primary)",
                textTransform: "uppercase"
              }}
            >
              SHIP.
            </div>
          </div>

          <p
            id="hero-sub"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 16,
              fontWeight: 300,
              color: "var(--text-secondary)",
              maxWidth: 420,
              lineHeight: 1.75
            }}
          >
            Upload any wireframe. Get production-ready component code in
            seconds. Free forever.
          </p>
        </section>

        {/* DIVIDER */}
        <div style={{ height: 1, background: "var(--border)", margin: "0 48px" }} />

        {/* MAIN WORK AREA */}
        <section
          id="main-panel"
          style={{
            padding: "64px 48px",
            maxWidth: 1440,
            margin: "0 auto"
          }}
        >
          {/* INPUT LABEL */}
          <div
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderBottom: "none",
              padding: "10px 14px",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--text-dim)",
              fontFamily: "var(--font-body)"
            }}
          >
            01 — Input
          </div>

          {/* INPUT PANEL */}
          <div
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              padding: 40
            }}
          >
              {/* Upload zone */}
              <div
                onClick={handleBrowse}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                style={{
                  height: 196,
                  border: "1px solid var(--border-mid)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                  marginBottom: 12,
                  transition: "border-color 0.15s, background 0.15s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.background = "var(--bg-raised)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-mid)";
                  e.currentTarget.style.background = "transparent";
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleBrowse();
                }}
                aria-label="Upload wireframe"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                />
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover"
                    }}
                    draggable={false}
                  />
                ) : (
                  <>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 48,
                        color: "var(--accent)",
                        lineHeight: 1,
                        marginBottom: 10,
                        fontWeight: 800
                      }}
                    >
                      +
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-secondary)",
                        letterSpacing: "0.08em",
                        fontFamily: "var(--font-body)"
                      }}
                    >
                      Drop wireframe or click to browse
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--text-dim)",
                        marginTop: 4,
                        fontFamily: "var(--font-body)"
                      }}
                    >
                      PNG, JPG — max 10MB
                    </div>
                  </>
                )}
              </div>

              {fileMeta && (
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text-dim)",
                    marginBottom: 24,
                    letterSpacing: "0.08em",
                    fontFamily: "var(--font-body)"
                  }}
                >
                  {fileMeta.name} · {fileMeta.size}
                </div>
              )}

              {/* Describe label */}
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--text-dim)",
                  marginBottom: 10,
                  marginTop: fileMeta ? 0 : 28,
                  fontFamily: "var(--font-body)"
                }}
              >
                Describe
              </div>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="navbar with sidebar, stat cards, data table..."
                style={{
                  width: "100%",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-mid)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  padding: "12px 14px",
                  resize: "none",
                  outline: "none",
                  marginBottom: 20,
                  lineHeight: 1.6,
                  transition: "border-color 0.15s"
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border-mid)")}
              />

              {/* GENERATE BUTTON */}
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                style={{
                  width: "100%",
                  height: 52,
                  background: canGenerate ? "var(--accent)" : "var(--bg-card)",
                  color: canGenerate ? "var(--accent-text)" : "var(--text-dim)",
                  border: canGenerate ? "none" : "1px solid var(--border-mid)",
                  fontFamily: "var(--font-display)",
                  fontSize: 24,
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                  cursor: canGenerate ? "pointer" : "not-allowed",
                  transition: "background 0.15s, transform 0.1s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10
                }}
                onMouseEnter={(e) => {
                  if (canGenerate) {
                    e.currentTarget.style.background = "var(--accent-alt)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (canGenerate) e.currentTarget.style.background = "var(--accent)";
                }}
                onMouseDown={(e) => {
                  if (canGenerate) e.currentTarget.style.transform = "scale(0.99)";
                }}
                onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                {isLoading ? (
                  <>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        border: "2px solid var(--accent-text)",
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        display: "inline-block",
                        animation: "spin 0.8s linear infinite"
                      }}
                    />
                    GENERATING
                  </>
                ) : (
                  "GENERATE"
                )}
              </button>

              {error && (
                <div
                  style={{
                    marginTop: 14,
                    padding: "12px 14px",
                    border: "1px solid var(--accent-alt)",
                    background: "rgba(237,32,36,0.05)",
                    fontSize: 12,
                    color: "var(--accent-alt)",
                    fontFamily: "var(--font-body)",
                    lineHeight: 1.5
                  }}
                >
                  {error}
                </div>
              )}
          </div>

          {/* OUTPUT LABEL */}
          <div
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderTop: "none",
              borderBottom: "none",
              marginTop: 28,
              padding: "10px 14px",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--text-dim)",
              fontFamily: "var(--font-body)"
            }}
          >
            02 — Output
          </div>

          {/* FULL-WIDTH OUTPUT PANEL */}
          <div
            style={{
              width: "100%",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              minHeight: 520,
              padding: 32
            }}
          >
            {code.length === 0 && !isLoading ? (
              <div
                style={{
                  height: "100%",
                  minHeight: 420,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px dashed var(--border-mid)",
                  gap: 14
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 72,
                    color: "var(--text-dim)",
                    lineHeight: 1,
                    fontWeight: 800
                  }}
                >
                  ?
                </div>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "var(--text-dim)",
                    fontFamily: "var(--font-body)"
                  }}
                >
                  Awaiting generation
                </div>
              </div>
            ) : (
              <CodeDisplay
                code={code}
                isStreaming={isStreaming}
                autoShow={!isStreaming && code.length > 0}
              />
            )}
          </div>
        </section>

        {/* BOTTOM DIVIDER */}
        <div style={{ height: 1, background: "var(--border)", margin: "0 48px" }} />

        {/* FOOTER */}
        <footer
          style={{
            padding: "56px 48px",
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "end",
            gap: 40
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                color: "var(--text-dim)",
                lineHeight: 1.8,
                maxWidth: 160,
                fontFamily: "var(--font-body)"
              }}
            >
              Sketch to production.
              <br />
              No friction. No cost.
            </p>
          </div>

          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(36px, 5vw, 72px)",
                fontWeight: 800,
                lineHeight: 0.9,
                letterSpacing: "0.02em",
                color: "var(--text-primary)",
                textTransform: "uppercase"
              }}
            >
              DREAM.
              <br />
              <span style={{ color: "var(--accent)" }}>DEPLOY.</span>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--text-dim)",
                marginBottom: 8,
                fontFamily: "var(--font-body)"
              }}
            >
              Made by
            </div>
            <a
              href="https://ahmadhassan.engineer"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                fontWeight: 800,
                color: "var(--text-primary)",
                textDecoration: "none",
                letterSpacing: "0.05em",
                borderBottom: "1px solid var(--border-mid)",
                paddingBottom: 2,
                transition: "color 0.15s, border-color 0.15s",
                display: "inline-block"
              }}
              onMouseEnter={(e) => {
                const el = e.target as HTMLAnchorElement;
                el.style.color = "var(--accent)";
                el.style.borderColor = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                const el = e.target as HTMLAnchorElement;
                el.style.color = "var(--text-primary)";
                el.style.borderColor = "var(--border-mid)";
              }}
            >
              AHMAD HASSAN
            </a>
            <div
              style={{
                marginTop: 10,
                fontSize: 10,
                color: "var(--text-dim)",
                fontFamily: "var(--font-body)"
              }}
            >
              © 2026 Morpheus
            </div>
          </div>
        </footer>
      </div>
      <span style={{ display: "none" }} aria-hidden="true">
        {appLoaded ? "loaded" : "loading"}
      </span>
    </>
  );
}
