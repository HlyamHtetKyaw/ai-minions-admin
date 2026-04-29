import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  Plus,
  Edit,
  Trash2,
  Loader2,
  MoreVertical,
  Sparkles,
  RefreshCw,
  Key,
  UserCog,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useMemberLevels, useCreateMemberLevel, useUpdateMemberLevel, useDeleteMemberLevel } from "../hooks/use-member-levels"
import type { MemberLevel, MemberLevelRequest } from "../types/member-levels.types"
import { memberLevelsCodeService, generateMultipleCodes } from "../services/member-levels-code.service"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

function emptyMemberLevelForm(): MemberLevelRequest {
  return {
    name: "",
    durationDays: 0,
    creditPoints: 0,
    isBestValue: false,
    isTopup: false,
    price: 0,
  }
}

function formatPrice(value: number | undefined): string {
  if (value === undefined || value === null || Number.isNaN(value)) return ""
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

function parsePrice(value: string): number {
  const cleaned = value.replace(/,/g, "").trim()
  if (!cleaned) return 0
  const n = parseFloat(cleaned)
  return Number.isNaN(n) ? 0 : n
}

/** Table/list display: amounts are stored and shown as Myanmar Kyat only. */
function formatPriceMmk(value: number | undefined): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "—"
  return `${formatPrice(value)} MMK`
}

export function MemberLevels() {
  const [page] = useState(0)
  const [size] = useState(10)
  const { data, loading, error, refetch } = useMemberLevels({
    page,
    size,
    sortBy: "id",
    sortDirection: "DESC",
  })
  const { create, loading: creating } = useCreateMemberLevel()
  const { update, loading: updating } = useUpdateMemberLevel()
  const { delete: deleteMemberLevel, loading: deleting } = useDeleteMemberLevel()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingLevel, setEditingLevel] = useState<MemberLevel | null>(null)
  const [deletingLevel, setDeletingLevel] = useState<MemberLevel | null>(null)
  const [codeGenerationLevel, setCodeGenerationLevel] = useState<MemberLevel | null>(null)
  const [generatedCodes, setGeneratedCodes] = useState<string>("")
  const [isGeneratingCodes] = useState(false)
  const [isSavingCodes, setIsSavingCodes] = useState(false)
  const [codeValidationErrors, setCodeValidationErrors] = useState<Map<string, string>>(new Map())
  const [memberLevelConfirmOpen, setMemberLevelConfirmOpen] = useState(false)
  const [memberLevelConfirmKind, setMemberLevelConfirmKind] = useState<"create" | "update" | null>(null)
  const [codesSaveConfirmOpen, setCodesSaveConfirmOpen] = useState(false)

  const [formData, setFormData] = useState<MemberLevelRequest>(emptyMemberLevelForm())

  const openMemberLevelConfirm = (kind: "create" | "update") => {
    if (!formValid) return
    if (kind === "update" && !editingLevel) return
    setMemberLevelConfirmKind(kind)
    setMemberLevelConfirmOpen(true)
  }

  const performCreate = async () => {
    try {
      await create(formData)
      toast.success("Member level created successfully")
      setIsCreateDialogOpen(false)
      setFormData(emptyMemberLevelForm())
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create member level")
    }
  }

  const handleEdit = (level: MemberLevel) => {
    setEditingLevel(level)
    setFormData({
      name: level.name,
      durationDays: level.durationDays,
      creditPoints: level.creditPoints,
      isBestValue: level.isBestValue,
      isTopup: level.isTopup ?? false,
      price: typeof level.price === "number" ? level.price : parseFloat(String(level.price)),
    })
  }

  const performUpdate = async () => {
    if (!editingLevel) return
    try {
      await update(editingLevel.id, formData)
      toast.success("Member level updated successfully")
      setEditingLevel(null)
      setFormData(emptyMemberLevelForm())
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update member level")
    }
  }

  const onConfirmMemberLevelSave = async () => {
    const kind = memberLevelConfirmKind
    setMemberLevelConfirmOpen(false)
    setMemberLevelConfirmKind(null)
    if (kind === "create") await performCreate()
    else if (kind === "update") await performUpdate()
  }

  const handleDelete = async () => {
    if (!deletingLevel) return
    try {
      await deleteMemberLevel(deletingLevel.id)
      toast.success("Member level deleted successfully")
      setDeletingLevel(null)
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete member level")
    }
  }

  const handleGenerateCode = (level: MemberLevel) => {
    setCodeGenerationLevel(level)
    const codes = generateMultipleCodes(5, 12)
    setGeneratedCodes(codes)
  }

  const handleRegenerateCodes = () => {
    const codeCount = generatedCodes.split("\n").filter((line) => line.trim()).length || 5
    const codes = generateMultipleCodes(codeCount, 12)
    setGeneratedCodes(codes)
    toast.success("Codes regenerated")
  }

  const openCodesSaveConfirm = () => {
    if (!codeGenerationLevel || !generatedCodes.trim()) {
      toast.error("Please generate at least one code")
      return
    }
    const codeLines = generatedCodes
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
    if (codeLines.length === 0) {
      toast.error("No valid codes to save")
      return
    }
    setCodesSaveConfirmOpen(true)
  }

  const handleSaveCodes = async () => {
    setCodesSaveConfirmOpen(false)
    if (!codeGenerationLevel || !generatedCodes.trim()) {
      return
    }

    setIsSavingCodes(true)
    setCodeValidationErrors(new Map())

    try {
      const codeLines = generatedCodes
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)

      if (codeLines.length === 0) {
        toast.error("No valid codes to save")
        setIsSavingCodes(false)
        return
      }

      const errors = new Map<string, string>()
      let successCount = 0

      for (const code of codeLines) {
        try {
          await memberLevelsCodeService.create({
            code,
            memberLevelId: codeGenerationLevel.id,
            userId: 0,
          })
          successCount++
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Failed to save code"
          errors.set(code, errorMessage)
        }
      }

      setCodeValidationErrors(errors)

      if (errors.size > 0) {
        const failedCodes = Array.from(errors.keys()).join("\n")
        setGeneratedCodes(failedCodes)

        if (successCount > 0) {
          toast.success(`${successCount} code(s) saved. ${errors.size} code(s) failed.`)
        } else {
          toast.error(`Failed to save codes. See details below.`)
        }
      } else {
        toast.success(`Successfully saved ${successCount} code(s)`)
        setCodeGenerationLevel(null)
        setGeneratedCodes("")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save codes")
    } finally {
      setIsSavingCodes(false)
    }
  }

  const formValid =
    formData.name.trim().length > 0 &&
    formData.durationDays >= 0 &&
    formData.creditPoints >= 0 &&
    formData.price >= 0

  if (error) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Member levels</h1>
          <div
            role="alert"
            className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            {error.message}
          </div>
        </div>
      </div>
    )
  }

  const totalTiers = data?.totalItems ?? 0

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-400/10"
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-lg px-2.5 font-medium">
                <UserCog className="mr-1.5 h-3 w-3" aria-hidden />
                Catalog
              </Badge>
              {!loading && data != null && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {totalTiers} tier{totalTiers === 1 ? "" : "s"} loaded
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Member levels</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
                Define subscription tiers: duration, credits, pricing, and merchandising flags. All
                prices are{" "}
                <span className="font-medium text-foreground">MMK</span> (Myanmar Kyat) only.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              className="h-10 gap-2 rounded-xl border-border/80 bg-background/80"
              onClick={() => void refetch()}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
              Refresh
            </Button>
            <Button
              variant="outline"
              asChild
              className="h-10 rounded-xl border-border/80 bg-background/80"
            >
              <Link to="/member-level-codes" className="gap-2">
                <Key className="h-4 w-4" aria-hidden />
                Level codes
              </Link>
            </Button>
            <Button className="h-10 rounded-xl px-4" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add level
            </Button>
          </div>
        </div>
      </div>

      {/* Table panel */}
      <section className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">All tiers</h2>
            <p className="text-sm text-muted-foreground">
              Edit tiers, generate codes for a tier, or remove unused levels.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="divide-y divide-border/60">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 px-4 py-4 sm:px-6"
                    aria-hidden
                  >
                    <Skeleton className="h-4 flex-1 max-w-[200px]" />
                    <Skeleton className="h-4 w-14 shrink-0" />
                    <Skeleton className="h-4 w-16 shrink-0" />
                    <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
                    <Skeleton className="h-4 w-24 shrink-0" />
                    <Skeleton className="ml-auto h-9 w-9 shrink-0 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead className="bg-muted/40 font-semibold">Name</TableHead>
                    <TableHead className="bg-muted/40 font-semibold">Duration (days)</TableHead>
                    <TableHead className="bg-muted/40 font-semibold">Credit points</TableHead>
                    <TableHead className="bg-muted/40 font-semibold">Best value</TableHead>
                    <TableHead className="bg-muted/40 font-semibold">Price (MMK)</TableHead>
                    <TableHead className="bg-muted/40 text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.content && data.content.length > 0 ? (
                    data.content.map((level) => (
                      <TableRow
                        key={level.id}
                        className="border-border/50 transition-colors hover:bg-muted/30"
                      >
                        <TableCell className="font-medium">{level.name}</TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {level.durationDays}
                        </TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {level.creditPoints}
                        </TableCell>
                        <TableCell>
                          {level.isBestValue ? (
                            <Badge
                              variant="secondary"
                              className="rounded-md bg-violet-500/10 font-medium text-violet-700 dark:text-violet-300"
                            >
                              Best value
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium tabular-nums">
                          {formatPriceMmk(level.price)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-xl">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl">
                              <DropdownMenuItem onClick={() => handleGenerateCode(level)}>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generate code
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(level)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeletingLevel(level)}
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
                      <TableCell colSpan={6} className="py-16 text-center">
                        <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                            <UserCog className="h-6 w-6 text-muted-foreground" aria-hidden />
                          </div>
                          <p className="font-medium">No member levels yet</p>
                          <p className="text-sm text-muted-foreground">
                            Create your first tier to start selling subscriptions or top-ups.
                          </p>
                          <Button className="mt-2 rounded-xl" onClick={() => setIsCreateDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add level
                          </Button>
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

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Member Level</DialogTitle>
            <DialogDescription>Add a new member level to your system</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                className="rounded-xl"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Gold"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="durationDays">Duration (days)</Label>
              <Input
                id="durationDays"
                className="rounded-xl"
                type="number"
                min={0}
                value={formData.durationDays}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    durationDays: e.target.value === "" ? 0 : parseInt(e.target.value, 10) || 0,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="creditPoints">Credit points</Label>
              <Input
                id="creditPoints"
                className="rounded-xl"
                type="number"
                min={0}
                value={formData.creditPoints}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    creditPoints: e.target.value === "" ? 0 : parseInt(e.target.value, 10) || 0,
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border/80 bg-muted/20 p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isBestValue">Best value</Label>
                <p className="text-xs text-muted-foreground">Highlight this tier in the catalog</p>
              </div>
              <Switch
                id="isBestValue"
                checked={formData.isBestValue}
                onCheckedChange={(checked) => setFormData({ ...formData, isBestValue: checked })}
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border/80 bg-muted/20 p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isTopup">Top-up tier</Label>
                <p className="text-xs text-muted-foreground">Marks this level as a credit top-up product</p>
              </div>
              <Switch
                id="isTopup"
                checked={formData.isTopup}
                onCheckedChange={(checked) => setFormData({ ...formData, isTopup: checked })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Price (MMK)</Label>
              <p className="text-xs text-muted-foreground">
                Enter the amount in Myanmar Kyat (MMK).
              </p>
              <div className="relative">
                <Input
                  id="price"
                  className="rounded-xl pr-14"
                  type="text"
                  inputMode="decimal"
                  value={formatPrice(formData.price)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parsePrice(e.target.value),
                    })
                  }
                  placeholder="0"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  MMK
                </span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-xl"
              onClick={() => openMemberLevelConfirm("create")}
              disabled={creating || !formValid}
            >
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingLevel} onOpenChange={(open) => !open && setEditingLevel(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Member Level</DialogTitle>
            <DialogDescription>Update member level information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                className="rounded-xl"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter level name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-durationDays">Duration (days)</Label>
              <Input
                id="edit-durationDays"
                className="rounded-xl"
                type="number"
                min={0}
                value={formData.durationDays}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    durationDays: e.target.value === "" ? 0 : parseInt(e.target.value, 10) || 0,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-creditPoints">Credit points</Label>
              <Input
                id="edit-creditPoints"
                className="rounded-xl"
                type="number"
                min={0}
                value={formData.creditPoints}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    creditPoints: e.target.value === "" ? 0 : parseInt(e.target.value, 10) || 0,
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border/80 bg-muted/20 p-4">
              <div className="space-y-0.5">
                <Label htmlFor="edit-isBestValue">Best value</Label>
                <p className="text-xs text-muted-foreground">Highlight this tier in the catalog</p>
              </div>
              <Switch
                id="edit-isBestValue"
                checked={formData.isBestValue}
                onCheckedChange={(checked) => setFormData({ ...formData, isBestValue: checked })}
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border/80 bg-muted/20 p-4">
              <div className="space-y-0.5">
                <Label htmlFor="edit-isTopup">Top-up tier</Label>
                <p className="text-xs text-muted-foreground">Marks this level as a credit top-up product</p>
              </div>
              <Switch
                id="edit-isTopup"
                checked={formData.isTopup}
                onCheckedChange={(checked) => setFormData({ ...formData, isTopup: checked })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-price">Price (MMK)</Label>
              <p className="text-xs text-muted-foreground">
                Enter the amount in Myanmar Kyat (MMK) only. Other currencies are not accepted.
              </p>
              <div className="relative">
                <Input
                  id="edit-price"
                  className="rounded-xl pr-14"
                  type="text"
                  inputMode="decimal"
                  value={formatPrice(formData.price)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parsePrice(e.target.value),
                    })
                  }
                  placeholder="0"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  MMK
                </span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setEditingLevel(null)}>
              Cancel
            </Button>
            <Button
              className="rounded-xl"
              onClick={() => openMemberLevelConfirm("update")}
              disabled={updating || !formValid}
            >
              {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingLevel} onOpenChange={(open) => !open && setDeletingLevel(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the member level
              &quot;{deletingLevel?.name}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={memberLevelConfirmOpen}
        onOpenChange={(open) => {
          setMemberLevelConfirmOpen(open)
          if (!open) setMemberLevelConfirmKind(null)
        }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {memberLevelConfirmKind === "create" ? "Create this member level?" : "Save changes?"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left">
                <p className="text-sm text-muted-foreground">
                  Please confirm the values below before sending to the server.
                </p>
                <ul className="list-inside list-disc space-y-1 text-sm text-foreground">
                  <li>Name: {formData.name || "—"}</li>
                  <li>Duration (days): {formData.durationDays}</li>
                  <li>Credit points: {formData.creditPoints}</li>
                  <li>Best value: {formData.isBestValue ? "Yes" : "No"}</li>
                  <li>Top-up tier: {formData.isTopup ? "Yes" : "No"}</li>
                  <li>Price (MMK): {formatPriceMmk(formData.price)}</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void onConfirmMemberLevelSave()
              }}
              disabled={creating || updating}
            >
              {(creating || updating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={codesSaveConfirmOpen} onOpenChange={setCodesSaveConfirmOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Save generated codes?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left">
                <p className="text-sm text-muted-foreground">
                  You are about to create{" "}
                  <strong className="text-foreground">
                    {
                      generatedCodes
                        .split("\n")
                        .map((l) => l.trim())
                        .filter(Boolean).length
                    }{" "}
                    code(s)
                  </strong>{" "}
                  for tier <strong className="text-foreground">{codeGenerationLevel?.name}</strong>.
                </p>
                <pre className="max-h-32 overflow-auto rounded-md border bg-muted/50 p-2 font-mono text-xs">
                  {generatedCodes
                    .split("\n")
                    .map((l) => l.trim())
                    .filter(Boolean)
                    .slice(0, 8)
                    .join("\n")}
                  {generatedCodes.split("\n").filter((l) => l.trim()).length > 8 ? "\n…" : ""}
                </pre>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void handleSaveCodes()
              }}
              disabled={isSavingCodes}
            >
              {isSavingCodes && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!codeGenerationLevel} onOpenChange={(open) => !open && setCodeGenerationLevel(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Generate Code for {codeGenerationLevel?.name}</DialogTitle>
            <DialogDescription>
              Codes will be auto-generated. You can edit them before saving.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="codes">Generated Codes (one per line)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={handleRegenerateCodes}
                  disabled={isGeneratingCodes || isSavingCodes}
                >
                  {isGeneratingCodes ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Regenerate All"
                  )}
                </Button>
              </div>
              <Textarea
                id="codes"
                value={generatedCodes}
                onChange={(e) => setGeneratedCodes(e.target.value)}
                placeholder="Codes will appear here, one per line..."
                rows={10}
                className={cn(
                  "rounded-xl font-mono text-sm",
                  codeValidationErrors.size > 0 && "border-destructive",
                )}
                disabled={isSavingCodes}
              />
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {generatedCodes.split("\n").filter((line) => line.trim()).length} code(s) ready to save
                </p>
                {codeValidationErrors.size > 0 && (
                  <div className="space-y-1 rounded-xl border border-destructive/30 bg-destructive/10 p-3">
                    <p className="text-xs font-semibold text-destructive">Validation Errors:</p>
                    {Array.from(codeValidationErrors.entries()).map(([code, err]) => (
                      <p key={code} className="text-xs text-destructive">
                        <span className="font-mono">{code}</span>: {err}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setCodeGenerationLevel(null)
                setGeneratedCodes("")
              }}
              disabled={isSavingCodes}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl"
              onClick={openCodesSaveConfirm}
              disabled={isSavingCodes || !generatedCodes.trim()}
            >
              {isSavingCodes && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save codes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
