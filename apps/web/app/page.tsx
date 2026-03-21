"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { CodeDisplay } from "../components/CodeDisplay";

const COLORS = {
  background: "#0a0a0a",
  surface: "#111111",
  border: "#2a2a2a",
  text: "#f5f5f0",
  muted: "#888884",
  accent: "#D3FD50",
  accentHover: "#bfe847",
  error: "#ff4444"
} as const;

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
    <div
      className="min-h-screen"
      style={{
        background: COLORS.background,
        color: COLORS.text,
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}
    >
      <header className="w-full border-b px-4 py-8 sm:px-6"
        style={{ borderColor: COLORS.border }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div
                className="text-[48px] font-bold leading-none"
                style={{ letterSpacing: "-0.03em" }}
              >
                MORPHEUS
              </div>
              <div
                className="mt-3 text-[14px] uppercase"
                style={{ color: COLORS.muted, letterSpacing: "0.08em" }}
              >
                FROM DREAM TO DEPLOY
              </div>
            </div>

            <div
              className="select-none border px-3 py-1 text-[12px] font-semibold"
              style={{
                borderColor: COLORS.accent,
                color: COLORS.accent,
                borderRadius: 0
              }}
            >
              BETA
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-2">
        <section
          className="border p-6"
          style={{ background: COLORS.surface, borderColor: COLORS.border }}
        >
          <div
            className="text-[14px] uppercase"
            style={{ color: COLORS.muted, letterSpacing: "0.08em" }}
          >
            INPUT
          </div>

          <div
            className="mt-4 flex h-[240px] w-full cursor-pointer items-center justify-center border border-dashed"
            style={{ borderColor: COLORS.border, borderRadius: 0 }}
            onClick={handleBrowse}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = COLORS.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = COLORS.border;
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = COLORS.accent;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = COLORS.border;
            }}
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
              <img
                src={preview}
                alt="Wireframe preview"
                className="h-full w-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M12 16V4M12 4l-4 4M12 4l4 4"
                    stroke={COLORS.muted}
                    strokeWidth="1.5"
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                  />
                  <path
                    d="M4 20h16"
                    stroke={COLORS.muted}
                    strokeWidth="1.5"
                    strokeLinecap="square"
                  />
                </svg>
                <div className="mt-3 text-sm font-semibold">Drop your wireframe here</div>
                <div className="mt-1 text-sm" style={{ color: COLORS.muted }}>
                  or click to browse
                </div>
              </div>
            )}
          </div>

          {fileMeta ? (
            <div className="mt-3 text-sm" style={{ color: COLORS.muted }}>
              {fileMeta.name} · {fileMeta.size}
            </div>
          ) : null}

          <label className="mt-6 block">
            <div
              className="text-[14px] uppercase"
              style={{ color: COLORS.muted, letterSpacing: "0.08em" }}
            >
              DESCRIPTION
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="describe your wireframe — e.g. dashboard with sidebar navigation and stat cards at the top"
              className="mt-2 w-full border px-3 py-2 text-[14px] leading-[1.6] outline-none"
              style={{
                background: COLORS.surface,
                borderColor: COLORS.border,
                color: COLORS.text,
                borderRadius: 0,
                resize: "none"
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = COLORS.accent;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = COLORS.border;
              }}
            />
          </label>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="mt-6 flex h-12 w-full items-center justify-center gap-3 border px-4 text-sm font-semibold"
            style={{
              borderColor: isLoading ? COLORS.border : COLORS.accent,
              background: isLoading ? COLORS.surface : COLORS.accent,
              color: isLoading ? COLORS.muted : "#000000",
              borderRadius: 0,
              opacity: canGenerate ? 1 : 0.55,
              cursor: canGenerate ? "pointer" : "not-allowed"
            }}
            onMouseEnter={(e) => {
              if (e.currentTarget.disabled) return;
              if (!isLoading) e.currentTarget.style.background = COLORS.accentHover;
            }}
            onMouseLeave={(e) => {
              if (e.currentTarget.disabled) return;
              if (!isLoading) e.currentTarget.style.background = COLORS.accent;
            }}
          >
            {isLoading ? (
              <>
                <span
                  className="h-4 w-4 animate-spin"
                  style={{
                    border: `2px solid ${COLORS.border}`,
                    borderTopColor: COLORS.accent,
                    borderRadius: 0
                  }}
                />
                <span>GENERATING...</span>
              </>
            ) : (
              <span>GENERATE COMPONENT</span>
            )}
          </button>

          {error ? (
            <div
              className="mt-4 border px-4 py-3 text-sm"
              style={{ borderColor: COLORS.error, color: COLORS.error }}
            >
              {error}
            </div>
          ) : null}
        </section>

        <section
          className="border p-6"
          style={{ background: COLORS.surface, borderColor: COLORS.border }}
        >
          <div
            className="text-[14px] uppercase"
            style={{ color: COLORS.muted, letterSpacing: "0.08em" }}
          >
            OUTPUT
          </div>

          <div className="mt-4">
            {code.length === 0 && !isLoading ? (
              <div
                className="flex min-h-[300px] items-center justify-center border px-6 text-center text-sm"
                style={{ borderColor: COLORS.border, color: COLORS.muted }}
              >
                Your generated component will appear here
              </div>
            ) : (
              <CodeDisplay code={code} isStreaming={isStreaming} />
            )}
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 text-center text-sm sm:px-6">
        <div style={{ color: COLORS.muted }}>
          Built with LangChain, Qdrant, and Llama 4 Maverick · All services free tier
        </div>
      </footer>
    </div>
  );
}
