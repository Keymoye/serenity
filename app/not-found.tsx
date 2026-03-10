import Link from "next/link"
import { SectionWrapper } from "@/components/layout/SectionWrapper"

export default function NotFound() {
  return (
    <SectionWrapper>
      <div className="flex flex-col items-center
                      justify-center py-24
                      text-center space-y-4">
        <h1 className="text-4xl font-semibold
                       text-slate-900">404</h1>
        <p className="text-slate-600">
          The page you are looking for
          does not exist.
        </p>
        <Link
          href="/"
          className="rounded-full bg-slate-900
                     px-5 py-2 text-sm font-medium
                     text-white hover:bg-slate-700"
        >
          Back to home
        </Link>
      </div>
    </SectionWrapper>
  )
}
