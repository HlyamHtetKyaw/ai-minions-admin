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
import { Combobox } from "@/components/ui/combobox"
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
import { useCodeValues } from "@/features/code-values/hooks/use-code-values"
import type { CodeValueListResponse } from "@/features/code-values/services/code-values.service"
import { toast } from "sonner"

export function MemberLevels() {
  const [page, setPage] = useState(0)
  const [size] = useState(10)
  const { data, loading, error, refetch } = useMemberLevels({ 
    page, 
    size, 
    sortBy: "id", 
    sortDirection: "DESC" 
  })
  const { create, loading: creating } = useCreateMemberLevel()
  const { update, loading: updating } = useUpdateMemberLevel()
  const { delete: deleteMemberLevel, loading: deleting } = useDeleteMemberLevel()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingLevel, setEditingLevel] = useState<MemberLevel | null>(null)
  const [deletingLevel, setDeletingLevel] = useState<MemberLevel | null>(null)
  const [codeGenerationLevel, setCodeGenerationLevel] = useState<MemberLevel | null>(null)
  const [generatedCodes, setGeneratedCodes] = useState<string>("")
  const [isGeneratingCodes, setIsGeneratingCodes] = useState(false)
  const [isSavingCodes, setIsSavingCodes] = useState(false)
  const [codeValidationErrors, setCodeValidationErrors] = useState<Map<string, string>>(new Map())
  const { data: currencies, loading: loadingCurrencies } = useCodeValues({ constantValue: "CURRENCY" })
  
  const [formData, setFormData] = useState<MemberLevelRequest>({
    name: "",
    durationDays: undefined,
    durationMonths: undefined,
    maxJob: undefined,
    amount: undefined,
    currencyId: null,
  })

  // Helper functions for formatting amount with commas
  const formatAmount = (value: number | undefined): string => {
    if (value === undefined || value === null) return ""
    // Format with commas and handle decimals
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
  }

  const parseAmount = (value: string): number | undefined => {
    if (!value.trim()) return undefined
    // Remove commas and parse
    const cleaned = value.replace(/,/g, '')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? undefined : parsed
  }

  const handleCreate = async () => {
    try {
      await create(formData)
      toast.success("Member level created successfully")
      setIsCreateDialogOpen(false)
      setFormData({ name: "", durationDays: undefined, durationMonths: undefined, maxJob: undefined, amount: undefined, currencyId: null })
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create member level")
    }
  }

  const handleEdit = (level: MemberLevel) => {
    setEditingLevel(level)
    setFormData({
      name: level.name,
      durationDays: level.durationDays ?? undefined,
      durationMonths: level.durationMonths ?? undefined,
      maxJob: level.maxJob ?? undefined,
      amount: level.amount ?? undefined,
      currencyId: level.currency?.id || null,
    })
  }

  const handleUpdate = async () => {
    if (!editingLevel) return
    try {
      await update(editingLevel.id, formData)
      toast.success("Member level updated successfully")
      setEditingLevel(null)
      setFormData({ name: "", durationDays: undefined, durationMonths: undefined, maxJob: undefined, amount: undefined, currencyId: null })
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
    // Auto-generate 5 codes by default
    const codes = generateMultipleCodes(5, 12)
    setGeneratedCodes(codes)
  }

  const handleRegenerateCodes = () => {
    const codeCount = generatedCodes.split("\n").filter(line => line.trim()).length || 5
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
        .map(line => line.trim())
        .filter(line => line.length > 0)

      if (codeLines.length === 0) {
        toast.error("No valid codes to save")
        setIsSavingCodes(false)
        return
      }

      // Save each code individually and track errors
      const userId = 1 // TODO: Get from auth context
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
        // Keep only failed codes in textarea for user to fix
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
            Manage member subscription levels and their features
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
                  <TableHead>Duration Days</TableHead>
                  <TableHead>Duration Months</TableHead>
                  <TableHead>Max Jobs</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.content && data.content.length > 0 ? (
                  data.content.map((level) => (
                    <TableRow key={level.id}>
                      <TableCell className="font-medium">{level.name}</TableCell>
                      <TableCell>{level.durationDays ?? "-"}</TableCell>
                      <TableCell>{level.durationMonths ?? "-"}</TableCell>
                      <TableCell>{level.maxJob ?? "-"}</TableCell>
                      <TableCell>{level.amount ? formatAmount(level.amount) : "-"}</TableCell>
                      <TableCell>{level.currency ? `${level.currency.codeValue} - ${level.currency.description}` : "-"}</TableCell>
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
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No member levels found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Member Level</DialogTitle>
            <DialogDescription>
              Add a new member level to your system
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter level name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="durationDays">Duration Days</Label>
              <Input
                id="durationDays"
                type="number"
                value={formData.durationDays ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    durationDays: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="Enter duration in days"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="durationMonths">Duration Months</Label>
              <Input
                id="durationMonths"
                type="number"
                value={formData.durationMonths ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    durationMonths: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="Enter duration in months"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="maxJob">Max Jobs</Label>
              <Input
                id="maxJob"
                type="number"
                value={formData.maxJob ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxJob: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="Enter maximum number of jobs"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="text"
                value={formatAmount(formData.amount)}
                onChange={(e) => {
                  const parsed = parseAmount(e.target.value)
                  setFormData({
                    ...formData,
                    amount: parsed,
                  })
                }}
                placeholder="Enter amount"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currency">Currency</Label>
              <Combobox
                options={currencies.map((currency) => ({
                  value: currency.id.toString(),
                  label: `${currency.codeValue} - ${currency.description}`,
                }))}
                value={formData.currencyId?.toString() || ""}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    currencyId: value ? parseInt(value) : null,
                  })
                }
                placeholder="Select currency"
                searchPlaceholder="Search currency..."
                disabled={loadingCurrencies}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating || !formData.name}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingLevel} onOpenChange={(open) => !open && setEditingLevel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member Level</DialogTitle>
            <DialogDescription>
              Update member level information
            </DialogDescription>
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
              <Label htmlFor="edit-durationDays">Duration Days</Label>
              <Input
                id="edit-durationDays"
                type="number"
                value={formData.durationDays ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    durationDays: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="Enter duration in days"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-durationMonths">Duration Months</Label>
              <Input
                id="edit-durationMonths"
                type="number"
                value={formData.durationMonths ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    durationMonths: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="Enter duration in months"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-maxJob">Max Jobs</Label>
              <Input
                id="edit-maxJob"
                type="number"
                value={formData.maxJob ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxJob: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="Enter maximum number of jobs"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-amount">Amount</Label>
              <Input
                id="edit-amount"
                type="text"
                value={formatAmount(formData.amount)}
                onChange={(e) => {
                  const parsed = parseAmount(e.target.value)
                  setFormData({
                    ...formData,
                    amount: parsed,
                  })
                }}
                placeholder="Enter amount"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-currency">Currency</Label>
              <Combobox
                options={currencies.map((currency) => ({
                  value: currency.id.toString(),
                  label: `${currency.codeValue} - ${currency.description}`,
                }))}
                value={formData.currencyId?.toString() || ""}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    currencyId: value ? parseInt(value) : null,
                  })
                }
                placeholder="Select currency"
                searchPlaceholder="Search currency..."
                disabled={loadingCurrencies}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingLevel(null)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updating || !formData.name}>
              {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingLevel} onOpenChange={(open) => !open && setDeletingLevel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the member level
              "{deletingLevel?.name}".
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

      {/* Code Generation Dialog */}
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
                  {generatedCodes.split("\n").filter(line => line.trim()).length} code(s) ready to save
                </p>
                {codeValidationErrors.size > 0 && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded p-3 space-y-1">
                    <p className="text-xs font-semibold text-destructive">Validation Errors:</p>
                    {Array.from(codeValidationErrors.entries()).map(([code, error]) => (
                      <p key={code} className="text-xs text-destructive">
                        <span className="font-mono">{code}</span>: {error}
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
            <Button
              onClick={handleSaveCodes}
              disabled={isSavingCodes || !generatedCodes.trim()}
            >
              {isSavingCodes && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Codes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
