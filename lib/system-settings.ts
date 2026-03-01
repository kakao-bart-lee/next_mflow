import { prisma } from "@/lib/db/prisma"
import type { Prisma } from "@prisma/client"

export type SystemSettingValue = Prisma.InputJsonValue
export type StoredSystemSettingValue = Prisma.JsonValue

export async function getSystemSettingValue<T>(key: string, fallback: T): Promise<T> {
  try {
    const row = await prisma.systemSettings.findUnique({
      where: { key },
      select: { value: true },
    })
    if (!row) return fallback
    return row.value as T
  } catch (err) {
    return fallback
  }
}

export async function getStringSystemSetting(key: string, fallback: string): Promise<string> {
  const value = await getSystemSettingValue<unknown>(key, fallback)
  if (typeof value !== "string") return fallback
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : fallback
}

export async function getSystemSettingsByKeys(
  keys: string[]
): Promise<Record<string, StoredSystemSettingValue>> {
  const rows = await prisma.systemSettings.findMany({
    where: { key: { in: keys } },
    select: { key: true, value: true },
  })
  return rows.reduce<Record<string, StoredSystemSettingValue>>((acc, row) => {
    acc[row.key] = row.value as StoredSystemSettingValue
    return acc
  }, {})
}

export async function upsertSystemSettings(settings: Record<string, SystemSettingValue>) {
  const entries = Object.entries(settings)
  await Promise.all(
    entries.map(([key, value]) =>
      prisma.systemSettings.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    )
  )
}
