"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Power, PowerOff, Cpu } from "lucide-react"

// =============================================================================
// Types
// =============================================================================

interface LlmModel {
  id: string
  modelId: string
  displayName: string
  provider: string
  inputPricePer1M: number
  outputPricePer1M: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ModelFormData {
  modelId: string
  displayName: string
  provider: string
  inputPricePer1M: string
  outputPricePer1M: string
}

const EMPTY_FORM: ModelFormData = {
  modelId: "",
  displayName: "",
  provider: "openai",
  inputPricePer1M: "",
  outputPricePer1M: "",
}

// =============================================================================
// Helpers
// =============================================================================

function formatPrice(price: number): string {
  if (price >= 1) return `$${price}/1M`
  if (price >= 0.01) return `$${price.toFixed(2)}/1M`
  return `$${price.toFixed(3)}/1M`
}

// =============================================================================
// Page component
// =============================================================================

export default function AdminLlmModelsPage() {
  const [models, setModels] = useState<LlmModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ModelFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Confirm deactivation / activation
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null)
  const [activatingId, setActivatingId] = useState<string | null>(null)

  // -------------------------------------------------------------------------
  // Fetch models
  // -------------------------------------------------------------------------
  const fetchModels = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/llm-models")
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "모델 목록을 불러오지 못했습니다")
      }
      const data = (await res.json()) as { models: LlmModel[] }
      setModels(data.models)
    } catch (err) {
      setError(err instanceof Error ? err.message : "모델 목록을 불러오지 못했습니다")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchModels()
  }, [fetchModels])

  // -------------------------------------------------------------------------
  // Open dialogs
  // -------------------------------------------------------------------------
  const openAddDialog = () => {
    setDialogMode("add")
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setDialogOpen(true)
  }

  const openEditDialog = (model: LlmModel) => {
    setDialogMode("edit")
    setEditingId(model.id)
    setForm({
      modelId: model.modelId,
      displayName: model.displayName,
      provider: model.provider,
      inputPricePer1M: String(model.inputPricePer1M),
      outputPricePer1M: String(model.outputPricePer1M),
    })
    setFormError(null)
    setDialogOpen(true)
  }

  // -------------------------------------------------------------------------
  // Save (add / edit)
  // -------------------------------------------------------------------------
  const handleSave = async () => {
    setFormError(null)

    // Validation
    if (!form.modelId.trim()) {
      setFormError("모델 ID를 입력하세요")
      return
    }
    if (!form.displayName.trim()) {
      setFormError("표시명을 입력하세요")
      return
    }
    if (!form.provider.trim()) {
      setFormError("제공자를 입력하세요")
      return
    }
    const inputPrice = parseFloat(form.inputPricePer1M)
    const outputPrice = parseFloat(form.outputPricePer1M)
    if (isNaN(inputPrice) || inputPrice < 0) {
      setFormError("입력 단가를 올바르게 입력하세요")
      return
    }
    if (isNaN(outputPrice) || outputPrice < 0) {
      setFormError("출력 단가를 올바르게 입력하세요")
      return
    }

    setSaving(true)
    try {
      const method = dialogMode === "add" ? "POST" : "PUT"
      const body: Record<string, unknown> = {
        modelId: form.modelId.trim(),
        displayName: form.displayName.trim(),
        provider: form.provider.trim(),
        inputPricePer1M: inputPrice,
        outputPricePer1M: outputPrice,
      }
      if (dialogMode === "edit" && editingId) {
        body.id = editingId
      }

      const res = await fetch("/api/admin/llm-models", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "저장에 실패했습니다")
      }

      setDialogOpen(false)
      await fetchModels()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "저장에 실패했습니다")
    } finally {
      setSaving(false)
    }
  }

  // -------------------------------------------------------------------------
  // Deactivate / Activate
  // -------------------------------------------------------------------------
  const handleDeactivate = async (id: string) => {
    setDeactivatingId(null)
    setError(null)
    try {
      const res = await fetch("/api/admin/llm-models", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "비활성화에 실패했습니다")
      }
      await fetchModels()
    } catch (err) {
      setError(err instanceof Error ? err.message : "비활성화에 실패했습니다")
    }
  }

  const handleActivate = async (id: string) => {
    setActivatingId(null)
    setError(null)
    try {
      const res = await fetch("/api/admin/llm-models", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: true }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "활성화에 실패했습니다")
      }
      await fetchModels()
    } catch (err) {
      setError(err instanceof Error ? err.message : "활성화에 실패했습니다")
    }
  }

  // -------------------------------------------------------------------------
  // Form field updater
  // -------------------------------------------------------------------------
  const updateField = (key: keyof ModelFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">LLM 모델 관리</h1>
          <p className="text-sm text-muted-foreground">
            서비스에서 사용하는 LLM 모델을 관리합니다
          </p>
        </div>
        <Button onClick={openAddDialog} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          모델 추가
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Table card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            등록된 모델
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
          ) : models.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              등록된 모델이 없습니다
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">모델 ID</th>
                    <th className="pb-3 pr-4 font-medium">표시명</th>
                    <th className="pb-3 pr-4 font-medium">제공자</th>
                    <th className="pb-3 pr-4 font-medium text-right">입력 단가</th>
                    <th className="pb-3 pr-4 font-medium text-right">출력 단가</th>
                    <th className="pb-3 pr-4 font-medium">상태</th>
                    <th className="pb-3 font-medium">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((model) => (
                    <tr
                      key={model.id}
                      className="border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-3 pr-4 font-mono text-xs">{model.modelId}</td>
                      <td className="py-3 pr-4">{model.displayName}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{model.provider}</td>
                      <td className="py-3 pr-4 text-right font-mono text-xs">
                        {formatPrice(model.inputPricePer1M)}
                      </td>
                      <td className="py-3 pr-4 text-right font-mono text-xs">
                        {formatPrice(model.outputPricePer1M)}
                      </td>
                      <td className="py-3 pr-4">
                        {model.isActive ? (
                          <Badge variant="default" className="text-xs">
                            활성
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            비활성
                          </Badge>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(model)}
                            className="h-7 px-2 text-xs"
                          >
                            <Pencil className="mr-1 h-3 w-3" />
                            수정
                          </Button>
                          {model.isActive ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeactivatingId(model.id)}
                              className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                            >
                              <PowerOff className="mr-1 h-3 w-3" />
                              비활성화
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setActivatingId(model.id)}
                              className="h-7 px-2 text-xs text-green-600 hover:text-green-600"
                            >
                              <Power className="mr-1 h-3 w-3" />
                              활성화
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "add" ? "모델 추가" : "모델 수정"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {formError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="modelId">모델 ID</Label>
              <Input
                id="modelId"
                placeholder="gpt-4o-mini"
                value={form.modelId}
                onChange={(e) => updateField("modelId", e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="displayName">표시명</Label>
              <Input
                id="displayName"
                placeholder="GPT-4o Mini"
                value={form.displayName}
                onChange={(e) => updateField("displayName", e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="provider">제공자</Label>
              <Input
                id="provider"
                placeholder="openai"
                value={form.provider}
                onChange={(e) => updateField("provider", e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="inputPrice">입력 단가 ($/1M tokens)</Label>
                <Input
                  id="inputPrice"
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="0.15"
                  value={form.inputPricePer1M}
                  onChange={(e) => updateField("inputPricePer1M", e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="outputPrice">출력 단가 ($/1M tokens)</Label>
                <Input
                  id="outputPrice"
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="0.60"
                  value={form.outputPricePer1M}
                  onChange={(e) => updateField("outputPricePer1M", e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              취소
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "저장 중..." : dialogMode === "add" ? "추가" : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivation confirmation Dialog */}
      <Dialog
        open={deactivatingId !== null}
        onOpenChange={(open) => {
          if (!open) setDeactivatingId(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>모델 비활성화</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            이 모델을 비활성화하시겠습니까? 비활성화된 모델은 서비스에서 선택할 수 없습니다.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivatingId(null)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deactivatingId) handleDeactivate(deactivatingId)
              }}
            >
              비활성화
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activation confirmation Dialog */}
      <Dialog
        open={activatingId !== null}
        onOpenChange={(open) => {
          if (!open) setActivatingId(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>모델 활성화</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            이 모델을 다시 활성화하시겠습니까? 활성화된 모델은 서비스에서 다시 사용할 수 있습니다.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivatingId(null)}>
              취소
            </Button>
            <Button
              onClick={() => {
                if (activatingId) handleActivate(activatingId)
              }}
            >
              활성화
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
