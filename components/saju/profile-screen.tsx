"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSaju } from "@/lib/contexts/saju-context"
import { useLocale } from "@/lib/contexts/locale-context"
import { LOCALES, type Locale } from "@/lib/i18n"
import { User, LogOut, Calendar, Clock, MapPin, ChevronRight, Coins, Languages, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Pillars } from "@/lib/saju-core"

// ─── 오행 색상 매핑 ──────────────────────────────────────
const OHAENG_COLOR: Record<string, string> = {
  "목": "text-emerald-600 dark:text-emerald-400",
  "화": "text-rose-500 dark:text-rose-400",
  "토": "text-amber-600 dark:text-amber-400",
  "금": "text-slate-500 dark:text-slate-300",
  "수": "text-blue-500 dark:text-blue-400",
}

function getOhaengColor(ohaeng: string): string {
  for (const [key, cls] of Object.entries(OHAENG_COLOR)) {
    if (ohaeng.includes(key)) return cls
  }
  return "text-foreground"
}

// "갑(甲)" → "甲", "자(子)" → "子"
function getChinese(v: string): string {
  const m = v.match(/\((.+?)\)/)
  return m ? m[1] : v
}

// ─── 사주 명반 카드 ──────────────────────────────────────
function MMyungban({ pillars }: { pillars: Pillars }) {
  const PILLAR_LABELS = [
    { key: "년" as const, label: "年" },
    { key: "월" as const, label: "月" },
    { key: "일" as const, label: "日" },
    { key: "시" as const, label: "時" },
  ]

  return (
    <div className="grid grid-cols-4 gap-2">
      {PILLAR_LABELS.map(({ key, label }) => {
        const p = pillars[key]
        const stemColor = getOhaengColor(p.오행.천간)
        const branchColor = getOhaengColor(p.오행.지지)
        return (
          <div key={key} className="flex flex-col items-center gap-1">
            {/* 柱 이름 */}
            <span className="text-[10px] text-muted-foreground tracking-widest">{label}柱</span>
            {/* 천간 */}
            <div className={cn(
              "flex h-12 w-full items-center justify-center rounded-lg border bg-card text-xl font-bold",
              "border-border font-serif",
              stemColor
            )}>
              {getChinese(p.천간)}
            </div>
            {/* 지지 */}
            <div className={cn(
              "flex h-12 w-full items-center justify-center rounded-lg border bg-secondary/40 text-xl font-bold",
              "border-border font-serif",
              branchColor
            )}>
              {getChinese(p.지지)}
            </div>
            {/* 한글 표기 */}
            <span className="text-[9px] text-muted-foreground/70 text-center leading-tight">
              {p.천간.split("(")[0]}<br />{p.지지.split("(")[0]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── 사용자 아바타 ───────────────────────────────────────
function Avatar({ name, image }: { name: string | null; image: string | null }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt={name ?? "프로필"} className="h-16 w-16 rounded-full object-cover" />
  }
  const initial = name?.charAt(0) ?? "?"
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/40 border border-primary/30">
      <span className="text-2xl font-bold text-primary font-serif">{initial}</span>
    </div>
  )
}

// ─── 메인 컴포넌트 ───────────────────────────────────────
interface UserProfile {
  id: string
  name: string | null
  email: string | null
  image: string | null
  creditBalance: number
  language: string
  joinedAt: string | null
}

export function ProfileScreen() {
  const { birthInfo, sajuResult, clearData } = useSaju()
  const { locale, setLocale } = useLocale()
  const router = useRouter()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.json())
      .then((data: UserProfile) => setProfile(data))
      .catch(() => {})
      .finally(() => setIsLoadingProfile(false))
  }, [])

  const handleLogout = () => {
    clearData()
    router.replace("/")
  }

  const handleEditBirthInfo = () => {
    clearData()
    router.replace("/")
  }

  const pillars = sajuResult?.sajuData?.pillars

  return (
    <div className="mx-auto max-w-md px-4 pb-8">
      {/* 헤더 */}
      <header className="py-2">
        <h1 className="text-sm font-medium text-muted-foreground">내 프로필</h1>
      </header>

      {/* 사용자 정보 */}
      <section className="mt-4">
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4">
          {isLoadingProfile ? (
            <div className="h-16 w-16 rounded-full bg-secondary animate-pulse" />
          ) : (
            <Avatar name={profile?.name ?? null} image={profile?.image ?? null} />
          )}
          <div className="min-w-0 flex-1">
            {isLoadingProfile ? (
              <>
                <div className="h-5 w-28 rounded bg-secondary animate-pulse mb-2" />
                <div className="h-3.5 w-40 rounded bg-secondary animate-pulse" />
              </>
            ) : (
              <>
                <p className="text-base font-semibold text-foreground truncate">
                  {profile?.name ?? "사용자"}
                </p>
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {profile?.email ?? ""}
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 사주 명반 */}
      {pillars && (
        <section className="mt-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">내 사주 명반</h2>
              <span className="text-[10px] text-muted-foreground tracking-widest">四柱命盤</span>
            </div>
            <MMyungban pillars={pillars} />
          </div>
        </section>
      )}

      {/* 출생 정보 */}
      {birthInfo && (
        <section className="mt-4">
          <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3.5">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground">생년월일</span>
              <span className="ml-auto text-sm font-medium text-foreground">
                {birthInfo.birthDate}
              </span>
            </div>
            <div className="flex items-center gap-3 px-5 py-3.5">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground">출생시간</span>
              <span className="ml-auto text-sm font-medium text-foreground">
                {birthInfo.isTimeUnknown ? "모름" : (birthInfo.birthTime ?? "미입력")}
              </span>
            </div>
            {birthInfo.locationName && (
              <div className="flex items-center gap-3 px-5 py-3.5">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">출생지</span>
                <span className="ml-auto text-sm font-medium text-foreground">
                  {birthInfo.locationName}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3 px-5 py-3.5">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground">성별</span>
              <span className="ml-auto text-sm font-medium text-foreground">
                {birthInfo.gender === "M" ? "남성" : "여성"}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* 크레딧 */}
      {!isLoadingProfile && profile && (
        <section className="mt-4">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4">
            <Coins className="h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">크레딧 잔액</p>
              <p className="text-xs text-muted-foreground mt-0.5">AI 분석에 사용됩니다</p>
            </div>
            <span className="ml-auto text-lg font-bold tabular-nums text-foreground">
              {profile.creditBalance.toLocaleString()}
            </span>
          </div>
        </section>
      )}

      {/* 언어 설정 */}
      <section className="mt-4">
        <div className="rounded-2xl border border-border bg-card px-5 py-4">
          <div className="flex items-center gap-3">
            <Languages className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium text-foreground">언어</span>
            <div className="ml-auto flex gap-1.5">
              {LOCALES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLocale(value as Locale)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    locale === value
                      ? "bg-foreground text-background"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 계정 액션 */}
      <section className="mt-4 space-y-2">
        {birthInfo && (
          <button
            type="button"
            onClick={handleEditBirthInfo}
            className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 text-left transition-colors hover:bg-secondary/50"
          >
            <RefreshCw className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium text-foreground">출생 정보 다시 입력</span>
            <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </button>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-left transition-colors hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4 text-destructive shrink-0" />
          <span className="text-sm font-medium text-destructive">로그아웃</span>
        </button>
      </section>
    </div>
  )
}
