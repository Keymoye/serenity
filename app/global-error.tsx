"use client"
import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          gap: "16px",
          fontFamily: "sans-serif",
          textAlign: "center",
          padding: "24px"
        }}>
          <h1 style={{ fontSize: "24px",
                       fontWeight: 600 }}>
            Something went wrong
          </h1>
          <p style={{ color: "#64748b",
                      fontSize: "14px" }}>
            A critical error occurred.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#0f172a",
              color: "white",
              border: "none",
              borderRadius: "999px",
              padding: "8px 20px",
              fontSize: "14px",
              cursor: "pointer"
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
