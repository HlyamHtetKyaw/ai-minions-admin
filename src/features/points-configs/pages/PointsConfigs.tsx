import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Coins,
  RefreshCw,
  MoreVertical,
  Pencil,
  Trash2,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { PointsConfig, PointsConfigUpdateRequest } from "../types/points-config.types"
import { pointsConfigsService } from "../services/points-configs.service"

function normalizeDecimalInput(v: string): string {
  const raw = v.trim()
  if (raw === "") return ""
  // allow only digits and a single dot
  const cleaned = raw.replace(/[^\d.]/g, "")
  const parts = cleaned.split(".")
  if (parts.length <= 1) return cleaned
  return `${parts[0]}.${parts.slice(1).join("")}`
}

function toEditableString(v: string | number | undefined | null): string {
  if (v === null || v === undefined) return ""
  if (typeof v === "number") return String(v)
  return v
}

export function PointsConfigs() {
  const [items, setItems] = useState<PointsConfig[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editing, setEditing] = useState<PointsConfig | null>(null)
  const [form, setForm] = useState<PointsConfigUpdateRequest | null>(null)
  const [saving, setSaving] = useState(false)

  const [deleting, setDeleting] = useState<PointsConfig | null>(null)
  const [deletingBusy, setDeletingBusy] = useState(false)

  const sorted = useMemo(() => {
    const list = items ?? []
    return [...list].sort((a, b) => String(a.metricType).localeCompare(String(b.metricType)))
  }, [items])

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await pointsConfigsService.getAll()
      setItems(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load points configs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const openEdit = (cfg: PointsConfig) => {
    setEditing(cfg)
    setForm({
      metricType: cfg.metricType,
      basePointCost: toEditableString(cfg.basePointCost),
      profitMultiplier: toEditableString(cfg.profitMultiplier),
      isActive: !!cfg.isActive,
    })
  }

  const closeEdit = () => {
    setEditing(null)
    setForm(null)
    setSaving(false)
  }

  const save = async () => {
    if (!editing || !form) return
    const base = normalizeDecimalInput(form.basePointCost)
    const mul = normalizeDecimalInput(form.profitMultiplier)
    if (!base) {
      toast.error("Base point cost is required")
      return
    }
    if (!mul) {
      toast.error("Profit multiplier is required")
      return
    }

    try {
      setSaving(true)
      const updated = await pointsConfigsService.update(editing.id, {
        ...form,
        basePointCost: base,
        profitMultiplier: mul,
      })
      setItems((prev) => (prev ? prev.map((p) => (p.id === updated.id ? updated : p)) : [updated]))
      toast.success("Points config updated")
      closeEdit()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update points config")
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      setDeletingBusy(true)
      await pointsConfigsService.delete(deleting.id)
      setItems((prev) => (prev ? prev.filter((p) => p.id !== deleting.id) : prev))
      toast.success("Points config deleted")
      setDeleting(null)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete points config")
      setDeletingBusy(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-sidebar-accent/15 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Badge variant="secondary" className="rounded-lg px-2.5 font-medium">
              <Coins className="mr-1.5 h-3 w-3" aria-hidden />
              Pricing
            </Badge>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Points pricing</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
                Admin can <span className="font-medium text-foreground">update</span> base cost,
                profit multiplier, and active status. Creating new metrics is disabled in the UI.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              className="h-10 gap-2 rounded-xl border-border/80 bg-background/80"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
              Refresh
            </Button>
            <Button variant="outline" asChild className="h-10 rounded-xl border-border/80 bg-background/80">
              <Link to="/settings" className="gap-2">
                <Info className="h-4 w-4" aria-hidden />
                Settings
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Configurations</h2>
          <p className="text-sm text-muted-foreground">One row per metric type.</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="divide-y divide-border/60">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-4 sm:px-6" aria-hidden>
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="ml-auto h-9 w-9 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead className="bg-muted/40 font-semibold">Metric</TableHead>
                    <TableHead className="bg-muted/40 font-semibold">Base cost / unit</TableHead>
                    <TableHead className="bg-muted/40 font-semibold">Profit multiplier</TableHead>
                    <TableHead className="bg-muted/40 font-semibold">Active</TableHead>
                    <TableHead className="bg-muted/40 text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.length > 0 ? (
                    sorted.map((cfg) => (
                      <TableRow
                        key={cfg.id}
                        className="border-border/50 transition-colors hover:bg-muted/30"
                      >
                        <TableCell className="font-medium">{cfg.metricType}</TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {toEditableString(cfg.basePointCost) || "—"}
                        </TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {toEditableString(cfg.profitMultiplier) || "—"}
                        </TableCell>
                        <TableCell>
                          {cfg.isActive ? (
                            <Badge className="rounded-md" variant="secondary">
                              Active
                            </Badge>
                          ) : (
                            <Badge className="rounded-md" variant="outline">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-xl">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl">
                              <DropdownMenuItem onClick={() => openEdit(cfg)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleting(cfg)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={5} className="py-16 text-center">
                        <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                            <Coins className="h-6 w-6 text-muted-foreground" aria-hidden />
                          </div>
                          <p className="font-medium">No points configs found</p>
                          <p className="text-sm text-muted-foreground">
                            In main-service, the initializer should create defaults on startup.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </section>

      <Dialog open={!!editing} onOpenChange={(o) => !o && closeEdit()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit points config</DialogTitle>
            <DialogDescription>
              Only base cost, profit multiplier, and active status can be changed.
            </DialogDescription>
          </DialogHeader>
          {editing && form && (
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Metric type</Label>
                <div className="rounded-xl border bg-muted/30 px-3 py-2 text-sm font-medium">
                  {editing.metricType}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="basePointCost">Base point cost (per unit)</Label>
                <Input
                  id="basePointCost"
                  className="rounded-xl font-mono"
                  inputMode="decimal"
                  value={form.basePointCost}
                  onChange={(e) => setForm({ ...form, basePointCost: normalizeDecimalInput(e.target.value) })}
                  placeholder="e.g. 0.0010"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="profitMultiplier">Profit multiplier</Label>
                <Input
                  id="profitMultiplier"
                  className="rounded-xl font-mono"
                  inputMode="decimal"
                  value={form.profitMultiplier}
                  onChange={(e) => setForm({ ...form, profitMultiplier: normalizeDecimalInput(e.target.value) })}
                  placeholder="e.g. 1.5"
                />
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-border/80 bg-muted/20 p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive">Active</Label>
                  <p className="text-xs text-muted-foreground">Enable/disable this metric in pricing.</p>
                </div>
                <Switch
                  id="isActive"
                  checked={form.isActive}
                  onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={closeEdit} disabled={saving}>
              Cancel
            </Button>
            <Button className="rounded-xl" onClick={() => void save()} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this config?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the row. The UI does not allow creating new metrics, so you should only delete if you plan
              to reseed from the backend initializer or via database/admin tooling.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault()
                void confirmDelete()
              }}
              disabled={deletingBusy}
            >
              {deletingBusy ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

