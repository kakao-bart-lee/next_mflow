import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { StarfieldBg } from "@/components/starfield-bg"
import { MoonIcon } from "@/components/moon-icon"

export default function NotFound() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-background px-6 text-center">
      <StarfieldBg />

      <div className="relative z-10 flex flex-col items-center">
        <MoonIcon size={64} className="mb-6 text-primary animate-float" />

        <div className="animate-glow-pulse rounded-2xl border border-border/40 bg-card/80 px-8 py-10 backdrop-blur-xl">
          <p className="text-5xl font-bold text-primary/40">404</p>
          <h2 className="mt-3 font-serif text-xl font-semibold text-foreground">
            길을 잃었나요? 별이 안내할게요
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            요청하신 페이지를 찾을 수 없습니다.
          </p>
          <Link
            href="/today"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border/40 bg-primary/10 px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            <ArrowLeft className="h-4 w-4" />
            오늘의 운세로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
}
