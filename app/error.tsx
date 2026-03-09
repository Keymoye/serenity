"use client"
import { useEffect } from "react"
import Link from "next/link"
import { SectionWrapper } from "@/components/layout/SectionWrapper"

export default function Error({
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
    <SectionWrapper>
      <div className="flex flex-col items-center
                      justify-center py-24
                      text-center space-y-4">
        <h1 className="text-2xl font-semibold
                       text-slate-900">
          Something went wrong
        </h1>
        <p className="text-slate-600 text-sm">
          An unexpected error occurred.
          Please try again.
        </p>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="rounded-full bg-slate-900
                       px-5 py-2 text-sm font-medium
                       text-white hover:bg-slate-700"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-full border
                       border-slate-300 px-5 py-2
                       text-sm font-medium
                       text-slate-700
                       hover:bg-slate-50"
          >
            Back to home
          </Link>
        </div>
      </div>
    </SectionWrapper>
  )
}
