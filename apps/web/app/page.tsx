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
      <header className="flex h-[56px] w-full items-center justify-between border-b px-10 bg-[var(--bg-surface)] border-[var(--border)] shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-[var(--accent)]" />
          <span className="text-[16px] font-bold text-[var(--text-primary)]">Morpheus</span>
        </div>
        <div className="rounded-[4px] bg-[var(--accent-light)] px-2 py-[2px] text-[11px] font-semibold uppercase text-[var(--accent)] tracking-wide">
          BETA
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <section className="flex flex-col items-center justify-center px-10 pb-[48px] pt-[80px] text-center">
          <div className="mb-6 rounded-full bg-[var(--accent-light)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)]">
            AI-POWERED WIREFRAME TO CODE
          </div>
          <h1 className="text-[56px] font-[800] leading-[1.1] tracking-[-0.03em] text-[var(--text-primary)]">
            From sketch to<br/>
            <span className="relative inline-block">
              production
              <span className="absolute bottom-2 left-0 -z-10 h-3 w-full bg-[var(--accent-light)]" />
            </span> code.
          </h1>
          <p className="mt-5 text-[18px] font-[400] text-[var(--text-secondary)]">
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

        <section className="mx-auto w-full max-w-[1200px] px-10 pb-16">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            
            <div className="flex flex-col rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] p-[28px] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
              <div className="mb-4 flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)]">01</span>
                <h2 className="text-[16px] font-semibold text-[var(--text-primary)]">Upload wireframe</h2>
              </div>

              <div
                className="group relative flex h-[200px] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[12px] border-2 border-dashed border-[var(--border)] bg-[var(--bg-page)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-light)] focus:border-[var(--accent)] focus:bg-[var(--accent-light)] outline-none"
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
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-3 text-[var(--accent)]">
                      <path d="M12 16V4M12 4l-4 4M12 4l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="text-[14px] font-medium text-[var(--text-primary)]">Drop your wireframe here</div>
                    <div className="mt-1 text-[12px] text-[var(--text-hint)]">PNG, JPG up to 10MB</div>
                  </>
                )}
              </div>
              
              {fileMeta && (
                <div className="mt-2 text-[12px] text-[var(--text-secondary)]">
                  {fileMeta.name} · {fileMeta.size}
                </div>
              )}

              <div className="mb-4 mt-8 flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)]">02</span>
                <h2 className="text-[16px] font-semibold text-[var(--text-primary)]">Describe your wireframe</h2>
              </div>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="E.g. A dashboard with a sidebar navigation and three stat cards at the top..."
                className="w-full resize-none rounded-[8px] border border-[var(--border)] bg-[var(--bg-surface)] px-[14px] py-[12px] text-[14px] text-[var(--text-primary)] outline-none transition-shadow placeholder:text-[var(--text-hint)] focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--accent)]/10"
              />

              <button
                type="button"
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="mt-6 flex h-[48px] w-full items-center justify-center gap-2 rounded-[8px] bg-[var(--accent)] text-[15px] font-semibold text-white transition-all hover:scale-[1.01] hover:bg-[var(--accent-hover)] disabled:pointer-events-none disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-[var(--accent)]"
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

            <div className="flex flex-col h-full rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] p-[28px] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
              {code.length === 0 && !isLoading ? (
                <div className="flex flex-1 flex-col items-center justify-center text-center py-[100px]">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-light)]">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[var(--accent)]">
                      <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className="text-[16px] font-medium text-[var(--text-primary)]">Your component will appear here</h3>
                  <p className="mt-1 text-[13px] text-[var(--text-hint)]">Generate a component to see the output</p>
                </div>
              ) : (
                <CodeDisplay code={code} isStreaming={isStreaming} />
              )}
            </div>
            
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-[var(--border)] bg-[var(--bg-page)] py-[40px] text-center">
        <div className="text-[12px] text-[var(--text-hint)]">
          Built with LangChain · Qdrant · Groq · Next.js
        </div>
      </footer>
    </div>
  );
}
