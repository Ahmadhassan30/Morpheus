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

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

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

  return (
    <div className="min-h-screen relative flex flex-col font-sans">
      <header
        className="fixed top-0 left-0 right-0 z-50 flex h-[120px] w-full items-center justify-center px-10 shrink-0"
        style={{ background: "transparent" }}
      >
        <img
          src="/logo.png"
          alt="Morpheus"
          className="h-[96px] w-auto max-h-full object-contain"
        />
      </header>

      <main className="flex-1 flex flex-col pt-[120px]">
        <section className="flex flex-col items-center justify-center px-[40px] pb-[32px] pt-[48px] text-center">
          <div className="mb-6 rounded-full bg-[var(--accent-light)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)]">
            AI-POWERED WIREFRAME TO CODE
          </div>
          <h1 className="text-[64px] font-[800] leading-[1.05] tracking-[-0.03em] text-[var(--text-primary)]">
            From sketch to<br/>
            <span
              className="relative inline-block"
              style={{
                background: "linear-gradient(135deg, #7C3AED, #A855F7)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}
            >
              production
            </span> code.
          </h1>
          <p className="mt-5 text-[20px] font-[400] text-[var(--text-secondary)]">
            Upload a wireframe. Get clean Next.js + Tailwind code instantly.
          </p>
          <div className="mt-8 flex items-center gap-2 text-[12px] text-[var(--text-hint)]">
            <span>Powered by Groq</span>
            <span>·</span>
            <span>RAG with Qdrant</span>
            <span>·</span>
            <span>Free forever</span>
          </div>
        </section>

        <section className="w-full px-[32px] pb-[48px]">
          <div className="grid grid-cols-5 gap-6">
            
            <div className="col-span-2 flex flex-col glass-panel p-[28px]">
              <div className="mb-4 flex items-center gap-2">
                <span className="text-[13px] font-semibold uppercase tracking-widest text-[var(--accent)]">01</span>
                <h2 className="text-[18px] font-[700] text-[var(--text-primary)]">Upload wireframe</h2>
              </div>

              <div
                className="group relative flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden transition-all outline-none"
                style={{
                  height: "220px",
                  borderRadius: "12px",
                  border: "2px dashed rgba(124, 58, 237, 0.25)",
                  background: "rgba(124, 58, 237, 0.03)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.border = "2px dashed rgba(124, 58, 237, 0.5)";
                  e.currentTarget.style.background = "rgba(124, 58, 237, 0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.border = "2px dashed rgba(124, 58, 237, 0.25)";
                  e.currentTarget.style.background = "rgba(124, 58, 237, 0.03)";
                }}
                onClick={handleBrowse}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleBrowse();
                }}
                aria-label="Upload wireframe image"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const next = e.target.files?.[0] ?? null;
                    setSelectedFile(next);
                  }}
                />
                {preview ? (
                  <img src={preview} alt="Preview" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
                ) : (
                  <>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-3 text-[var(--accent)]">
                      <path d="M12 16V4M12 4l-4 4M12 4l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="text-[16px] font-[600] text-[var(--text-primary)]">Drop your wireframe here</div>
                    <div className="mt-1 text-[13px] text-[var(--text-hint)]">PNG, JPG up to 10MB</div>
                  </>
                )}
              </div>
              
              {fileMeta && (
                <div className="mt-2 text-[12px] text-[var(--text-secondary)]">
                  {fileMeta.name} · {fileMeta.size}
                </div>
              )}

              <div className="mb-4 mt-8 flex items-center gap-2">
                <span className="text-[13px] font-semibold uppercase tracking-widest text-[var(--accent)]">02</span>
                <h2 className="text-[18px] font-[700] text-[var(--text-primary)]">Describe your wireframe</h2>
              </div>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="E.g. A dashboard with a sidebar navigation and three stat cards at the top..."
                className="w-full resize-none rounded-[8px] border border-[var(--border)] bg-white outline-none transition-shadow placeholder:text-[var(--text-hint)] focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--accent)]/10"
                style={{
                  fontSize: "15px",
                  padding: "14px 16px"
                }}
              />

              <button
                type="button"
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-[8px] text-white transition-all disabled:pointer-events-none disabled:opacity-50"
                style={{
                  height: "52px",
                  fontSize: "16px",
                  fontWeight: "700",
                  background: "linear-gradient(135deg, #7C3AED, #9333EA)"
                }}
                onMouseEnter={(e) => {
                  if (canGenerate) {
                    e.currentTarget.style.background = "linear-gradient(135deg, #6D28D9, #7C3AED)";
                    e.currentTarget.style.boxShadow = "0 4px 14px rgba(124, 58, 237, 0.35)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (canGenerate) {
                    e.currentTarget.style.background = "linear-gradient(135deg, #7C3AED, #9333EA)";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              >
                {isLoading ? (
                  <>
                    <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  "Generate component"
                )}
              </button>

              {error && (
                <div className="mt-4 rounded-[8px] border border-[#FCA5A5] bg-[#FEF2F2] p-3 text-[13px] text-[#DC2626]">
                  {error}
                </div>
              )}
            </div>

            <div className="col-span-3 flex flex-col glass-panel p-[28px]" style={{ minHeight: "calc(100vh - 280px)" }}>
              {code.length === 0 && !isLoading ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "calc(100vh - 340px)"
                  }}
                  className="text-center"
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-light)]">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[var(--accent)]">
                      <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className="text-[16px] font-[500] text-[var(--text-primary)]">Your component will appear here</h3>
                  <p className="mt-1 text-[13px] text-[var(--text-hint)]">Generate a component to see the output</p>
                </div>
              ) : (
                <CodeDisplay
                  code={code}
                  isStreaming={isStreaming}
                  autoShow={!isStreaming && code.length > 0}
                />
              )}
            </div>
            
          </div>
        </section>
      </main>

      <footer
        className="w-full py-[40px] text-center"
        style={{
          background: "rgba(255, 255, 255, 0.5)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderTop: "1px solid rgba(255, 255, 255, 0.8)",
          fontSize: "13px"
        }}
      >
        <div className="text-[var(--text-hint)]">
          Built with LangChain · Qdrant · Groq · Next.js
        </div>
      </footer>
    </div>
  );
}
