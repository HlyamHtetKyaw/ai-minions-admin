import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Plus, Edit, Trash2, Loader2, MoreVertical, Sparkles } from "lucide-react"
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

function emptyMemberLevelForm(): MemberLevelRequest {
  return {
    name: "",
    durationDays: 0,
    creditPoints: 0,
    isBestValue: false,
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

  const [formData, setFormData] = useState<MemberLevelRequest>(emptyMemberLevelForm())

  const handleCreate = async () => {
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
      price: typeof level.price === "number" ? level.price : parseFloat(String(level.price)),
    })
  }

  const handleUpdate = async () => {
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

  const handleSaveCodes = async () => {
    if (!codeGenerationLevel || !generatedCodes.trim()) {
      toast.error("Please generate at least one code")
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Member Levels</h1>
          <p className="text-muted-foreground text-destructive mt-2">
            Error: {error.message}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Member Levels</h1>
          <p className="text-muted-foreground">
            Manage subscription tiers: duration, credit points, pricing, and highlights
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Level
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Member Levels</CardTitle>
          <CardDescription>
            A list of all member levels in your system
            {data && ` (${data.totalItems} total)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Duration (days)</TableHead>
                  <TableHead>Credit points</TableHead>
                  <TableHead>Best value</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.content && data.content.length > 0 ? (
                  data.content.map((level) => (
                    <TableRow key={level.id}>
                      <TableCell className="font-medium">{level.name}</TableCell>
                      <TableCell>{level.durationDays}</TableCell>
                      <TableCell>{level.creditPoints}</TableCell>
                      <TableCell>
                        {level.isBestValue ? (
                          <Badge variant="secondary">Best value</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{formatPrice(level.price)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleGenerateCode(level)}>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Generate Code
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(level)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
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
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No member levels found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Member Level</DialogTitle>
            <DialogDescription>Add a new member level to your system</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Gold"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="durationDays">Duration (days)</Label>
              <Input
                id="durationDays"
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
            <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
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
            <div className="grid gap-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="text"
                inputMode="decimal"
                value={formatPrice(formData.price)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parsePrice(e.target.value),
                  })
                }
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating || !formValid}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingLevel} onOpenChange={(open) => !open && setEditingLevel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member Level</DialogTitle>
            <DialogDescription>Update member level information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter level name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-durationDays">Duration (days)</Label>
              <Input
                id="edit-durationDays"
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
            <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
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
            <div className="grid gap-2">
              <Label htmlFor="edit-price">Price</Label>
              <Input
                id="edit-price"
                type="text"
                inputMode="decimal"
                value={formatPrice(formData.price)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parsePrice(e.target.value),
                  })
                }
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLevel(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updating || !formValid}>
              {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingLevel} onOpenChange={(open) => !open && setDeletingLevel(null)}>
        <AlertDialogContent>
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

      <Dialog open={!!codeGenerationLevel} onOpenChange={(open) => !open && setCodeGenerationLevel(null)}>
        <DialogContent className="max-w-2xl">
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
                className={`font-mono text-sm ${codeValidationErrors.size > 0 ? "border-destructive" : ""}`}
                disabled={isSavingCodes}
              />
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {generatedCodes.split("\n").filter((line) => line.trim()).length} code(s) ready to save
                </p>
                {codeValidationErrors.size > 0 && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded p-3 space-y-1">
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
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCodeGenerationLevel(null)
                setGeneratedCodes("")
              }}
              disabled={isSavingCodes}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveCodes} disabled={isSavingCodes || !generatedCodes.trim()}>
              {isSavingCodes && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Codes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
