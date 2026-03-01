"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { MapPin, Globe, Search, Clock, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"

interface LocationResult {
  id: string
  name: string
  region: string
  country: string
  timezone: string
  utcOffset: string
  lat: number
  lng: number
}

const POPULAR_CITIES: LocationResult[] = [
  { id: "seoul", name: "서울", region: "서울특별시", country: "대한민국", timezone: "Asia/Seoul", utcOffset: "+09:00", lat: 37.5665, lng: 126.978 },
  { id: "busan", name: "부산", region: "부산광역시", country: "대한민국", timezone: "Asia/Seoul", utcOffset: "+09:00", lat: 35.1796, lng: 129.0756 },
  { id: "daegu", name: "대구", region: "대구광역시", country: "대한민국", timezone: "Asia/Seoul", utcOffset: "+09:00", lat: 35.8714, lng: 128.6014 },
  { id: "incheon", name: "인천", region: "인천광역시", country: "대한민국", timezone: "Asia/Seoul", utcOffset: "+09:00", lat: 37.4563, lng: 126.7052 },
  { id: "gwangju", name: "광주", region: "광주광역시", country: "대한민국", timezone: "Asia/Seoul", utcOffset: "+09:00", lat: 35.1595, lng: 126.8526 },
  { id: "daejeon", name: "대전", region: "대전광역시", country: "대한민국", timezone: "Asia/Seoul", utcOffset: "+09:00", lat: 36.3504, lng: 127.3845 },
  { id: "jeju", name: "제주", region: "제주특별자치도", country: "대한민국", timezone: "Asia/Seoul", utcOffset: "+09:00", lat: 33.4996, lng: 126.5312 },
]

const WORLD_CITIES: LocationResult[] = [
  { id: "tokyo", name: "Tokyo", region: "Kanto", country: "Japan", timezone: "Asia/Tokyo", utcOffset: "+09:00", lat: 35.6762, lng: 139.6503 },
  { id: "newyork", name: "New York", region: "New York", country: "United States", timezone: "America/New_York", utcOffset: "-05:00", lat: 40.7128, lng: -74.006 },
  { id: "london", name: "London", region: "England", country: "United Kingdom", timezone: "Europe/London", utcOffset: "+00:00", lat: 51.5074, lng: -0.1278 },
  { id: "paris", name: "Paris", region: "Ile-de-France", country: "France", timezone: "Europe/Paris", utcOffset: "+01:00", lat: 48.8566, lng: 2.3522 },
  { id: "shanghai", name: "Shanghai", region: "Shanghai", country: "China", timezone: "Asia/Shanghai", utcOffset: "+08:00", lat: 31.2304, lng: 121.4737 },
  { id: "sydney", name: "Sydney", region: "NSW", country: "Australia", timezone: "Australia/Sydney", utcOffset: "+11:00", lat: -33.8688, lng: 151.2093 },
  { id: "berlin", name: "Berlin", region: "Berlin", country: "Germany", timezone: "Europe/Berlin", utcOffset: "+01:00", lat: 52.52, lng: 13.405 },
  { id: "bangkok", name: "Bangkok", region: "Bangkok", country: "Thailand", timezone: "Asia/Bangkok", utcOffset: "+07:00", lat: 13.7563, lng: 100.5018 },
  { id: "singapore", name: "Singapore", region: "Singapore", country: "Singapore", timezone: "Asia/Singapore", utcOffset: "+08:00", lat: 1.3521, lng: 103.8198 },
  { id: "losangeles", name: "Los Angeles", region: "California", country: "United States", timezone: "America/Los_Angeles", utcOffset: "-08:00", lat: 34.0522, lng: -118.2437 },
  { id: "vancouver", name: "Vancouver", region: "British Columbia", country: "Canada", timezone: "America/Vancouver", utcOffset: "-08:00", lat: 49.2827, lng: -123.1207 },
  { id: "saopaulo", name: "Sao Paulo", region: "Sao Paulo", country: "Brazil", timezone: "America/Sao_Paulo", utcOffset: "-03:00", lat: -23.5505, lng: -46.6333 },
  { id: "dubai", name: "Dubai", region: "Dubai", country: "UAE", timezone: "Asia/Dubai", utcOffset: "+04:00", lat: 25.2048, lng: 55.2708 },
  { id: "mumbai", name: "Mumbai", region: "Maharashtra", country: "India", timezone: "Asia/Kolkata", utcOffset: "+05:30", lat: 19.076, lng: 72.8777 },
]

const ALL_CITIES = [...POPULAR_CITIES, ...WORLD_CITIES]

interface LocationSearchProps {
  value: LocationResult | null
  onChange: (location: LocationResult) => void
}

export function LocationSearch({ value, onChange }: LocationSearchProps) {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [activeTab, setActiveTab] = useState<"korea" | "current" | "world">("korea")
  const containerRef = useRef<HTMLDivElement>(null)

  const filteredCities = query.trim()
    ? ALL_CITIES.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.region.toLowerCase().includes(query.toLowerCase()) ||
          c.country.toLowerCase().includes(query.toLowerCase())
      )
    : activeTab === "korea"
      ? POPULAR_CITIES
      : WORLD_CITIES

  const handleSelect = useCallback(
    (city: LocationResult) => {
      onChange(city)
      setQuery("")
      setIsOpen(false)
    },
    [onChange]
  )

  const handleDetectLocation = () => {
    setIsDetecting(true)
    // Simulate geolocation detection
    setTimeout(() => {
      const seoul = POPULAR_CITIES[0]
      handleSelect(seoul)
      setIsDetecting(false)
    }, 1500)
  }

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      {/* Selected value display or input */}
      {value && !isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-12 w-full items-center gap-3 rounded-lg border border-border bg-card px-3 text-left transition-colors hover:bg-secondary/50"
          type="button"
        >
          <MapPin className="h-4 w-4 shrink-0 text-primary" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-foreground">
              {value.name}, {value.country}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>UTC{value.utcOffset}</span>
          </div>
        </button>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="도시 이름을 검색하세요..."
            className="h-12 rounded-lg border-border bg-card pl-10 text-foreground"
          />
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute inset-x-0 top-full z-50 mt-1 max-h-72 overflow-hidden rounded-xl border border-border bg-card shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Tab bar */}
          {!query && (
            <div className="flex border-b border-border">
              {([
                { id: "korea" as const, label: "한국", icon: MapPin },
                { id: "current" as const, label: "현재 위치", icon: Globe },
                { id: "world" as const, label: "세계", icon: Globe },
              ]).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => {
                    if (id === "current") {
                      handleDetectLocation()
                    } else {
                      setActiveTab(id)
                    }
                  }}
                  className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors ${
                    activeTab === id
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  type="button"
                >
                  {id === "current" && isDetecting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Icon className="h-3 w-3" />
                  )}
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Results */}
          <div className="max-h-56 overflow-y-auto p-1">
            {filteredCities.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                검색 결과가 없습니다
              </div>
            ) : (
              filteredCities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => handleSelect(city)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-secondary/50"
                  type="button"
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-foreground">{city.name}</span>
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      {city.region}, {city.country}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    UTC{city.utcOffset}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export type { LocationResult }
