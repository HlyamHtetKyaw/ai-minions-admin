import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Combobox } from "@/components/ui/combobox"
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
  Loader2,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  MoreVertical,
  RefreshCw,
  Key,
  UserCog,
} from "lucide-react"
import { useMemberLevelsCode } from "../hooks/use-member-levels-code"
import { useMemberLevels } from "../hooks/use-member-levels"
import { memberLevelsCodeService } from "../services/member-levels-code.service"
import type { MemberLevelCodeFilter, MemberLevelCode, MemberLevelCodeRequest } from "../types/member-levels-code.types"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function MemberLevelCodes() {
  const [page, setPage] = useState(0)
  const [size] = useState(10)
  const [filter, setFilter] = useState<MemberLevelCodeFilter>({})
  const [codeSearch, setCodeSearch] = useState("")
  const [editingCode, setEditingCode] = useState<MemberLevelCode | null>(null)
  const [deletingCode, setDeletingCode] = useState<MemberLevelCode | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [updateConfirmOpen, setUpdateConfirmOpen] = useState(false)
  const [editFormData, setEditFormData] = useState<Partial<MemberLevelCodeRequest>>({
    code: "",
    activatedAt: "",
    expiredAt: "",
  })

  const { data, loading, error, refetch } = useMemberLevelsCode({
    page,
    size,
    sortBy: "id",
    sortDirection: "DESC",
    filter,
    autoFetch: true,
  })

  const { data: memberLevelsData } = useMemberLevels({
    page: 0,
    size: 100, // Get all member levels for the filter
    autoFetch: true,
  })

  const handleFilterChange = (value: string) => {
    const memberLevelId = value === "all" ? undefined : parseInt(value)
    setFilter({
      ...filter,
      memberLevelId: memberLevelId,
    })
    setPage(0) // Reset to first page when filter changes
  }

  const handleCodeSearch = () => {
    setFilter({
      ...filter,
      code: codeSearch.trim() || undefined,
    })
    setPage(0)
  }

  const handleClearFilter = () => {
    setFilter({})
    setCodeSearch("")
    setPage(0)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && data && newPage < data.totalPages) {
      setPage(newPage)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-"
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  const handleEditClick = (code: MemberLevelCode) => {
    setEditingCode(code)
    setEditFormData({
      code: code.code,
      activatedAt: code.activatedAt || "",
      expiredAt: code.expiredAt || "",
      memberLevelId: code.memberLevelId,
    })
    setIsEditDialogOpen(true)
  }

  const openUpdateConfirm = () => {
    if (!editingCode) return
    setUpdateConfirmOpen(true)
  }

  const performCodeUpdate = async () => {
    if (!editingCode || !editFormData) return
    try {
      setIsUpdating(true)
      const updatePayload: Parameters<typeof memberLevelsCodeService.update>[1] = {
        code: editFormData.code ?? editingCode.code,
        activatedAt: editFormData.activatedAt,
        expiredAt: editFormData.expiredAt,
        memberLevelId: editFormData.memberLevelId ?? editingCode.memberLevelId,
      }
      await memberLevelsCodeService.update(editingCode.id, updatePayload)
      toast.success("Member level code updated successfully")
      setIsEditDialogOpen(false)
      setEditingCode(null)
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update member level code")
    } finally {
      setIsUpdating(false)
    }
  }

  const onConfirmCodeUpdate = async () => {
    setUpdateConfirmOpen(false)
    await performCodeUpdate()
  }

  const handleDeleteClick = (code: MemberLevelCode) => {
    setDeletingCode(code)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingCode) return
    try {
      setIsDeleting(true)
      await memberLevelsCodeService.delete(deletingCode.id)
      toast.success("Member level code deleted successfully")
      setIsDeleteDialogOpen(false)
      setDeletingCode(null)
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete member level code")
    } finally {
      setIsDeleting(false)
    }
  }

  const totalCodes = data?.totalItems ?? 0

  if (error) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Level codes</h1>
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

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl dark:bg-amber-400/10"
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-lg px-2.5 font-medium">
                <Key className="mr-1.5 h-3 w-3" aria-hidden />
                Provisioning
              </Badge>
              {!loading && data != null && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {totalCodes} code{totalCodes === 1 ? "" : "s"}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Level codes</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
                Filter, search, and maintain codes tied to member tiers. Generate new codes from{" "}
                <span className="font-medium text-foreground">Member levels</span>.
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
            <Button variant="outline" asChild className="h-10 rounded-xl border-border/80 bg-background/80">
              <Link to="/member-levels" className="gap-2">
                <UserCog className="h-4 w-4" aria-hidden />
                Member levels
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Filters</h2>
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
          <p className="mb-4 text-sm text-muted-foreground">
            Narrow the table by tier or exact code string, then search.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="memberLevel">Member level</Label>
              <Combobox
                options={[
                  { value: "all", label: "All member levels" },
                  ...(memberLevelsData?.content?.map((level) => ({
                    value: level.id.toString(),
                    label: level.name,
                  })) || []),
                ]}
                value={filter.memberLevelId?.toString() || "all"}
                onValueChange={handleFilterChange}
                placeholder="All member levels"
                searchPlaceholder="Search tier…"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="codeSearch">Code search</Label>
              <div className="flex gap-2">
                <Input
                  id="codeSearch"
                  className="rounded-xl"
                  value={codeSearch}
                  onChange={(e) => setCodeSearch(e.target.value)}
                  placeholder="Enter code…"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCodeSearch()
                    }
                  }}
                />
                <Button onClick={handleCodeSearch} variant="outline" className="shrink-0 rounded-xl">
                  Search
                </Button>
              </div>
            </div>
            <div className="flex flex-col justify-end gap-2">
              <Label className="invisible hidden md:block" aria-hidden>
                Actions
              </Label>
              <Button onClick={handleClearFilter} variant="outline" className="w-full rounded-xl">
                Clear filters
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">All codes</h2>
          <p className="text-sm text-muted-foreground">
            {data != null && (
              <span className="tabular-nums">
                {totalCodes} total · page {page + 1}
                {data.totalPages > 1 ? ` of ${data.totalPages}` : ""}
              </span>
            )}
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="divide-y divide-border/60">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-4 sm:px-6" aria-hidden>
                    <Skeleton className="h-4 w-32 shrink-0 font-mono" />
                    <Skeleton className="h-4 w-24 shrink-0" />
                    <Skeleton className="h-4 flex-1 max-w-[120px]" />
                    <Skeleton className="h-4 w-20 shrink-0" />
                    <Skeleton className="h-4 w-20 shrink-0" />
                    <Skeleton className="h-4 w-20 shrink-0" />
                    <Skeleton className="ml-auto h-9 w-9 shrink-0 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/60 hover:bg-transparent">
                      <TableHead className="bg-muted/40 font-semibold">Code</TableHead>
                      <TableHead className="bg-muted/40 font-semibold">Member level</TableHead>
                      <TableHead className="bg-muted/40 font-semibold">Purchased user</TableHead>
                      <TableHead className="bg-muted/40 font-semibold">Activated</TableHead>
                      <TableHead className="bg-muted/40 font-semibold">Expired</TableHead>
                      <TableHead className="bg-muted/40 font-semibold">Created</TableHead>
                      <TableHead className="bg-muted/40 font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.content && data.content.length > 0 ? (
                      data.content.map((code) => (
                        <TableRow
                          key={code.id}
                          className="border-border/50 transition-colors hover:bg-muted/30"
                        >
                          <TableCell className="font-mono text-sm font-medium">{code.code}</TableCell>
                          <TableCell className="text-sm">
                            {memberLevelsData?.content?.find(
                              (level) => level.id === code.memberLevelId,
                            )?.name || `Level ${code.memberLevelId}`}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {code.purchasedUserName || "—"}
                          </TableCell>
                          <TableCell className="tabular-nums text-sm text-muted-foreground">
                            {formatDate(code.activatedAt)}
                          </TableCell>
                          <TableCell className="tabular-nums text-sm text-muted-foreground">
                            {formatDate(code.expiredAt)}
                          </TableCell>
                          <TableCell className="tabular-nums text-sm text-muted-foreground">
                            {formatDate(code.masterData?.createdAt)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-xl">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl">
                                <DropdownMenuItem onClick={() => handleEditClick(code)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClick(code)}
                                  className="text-destructive focus:text-destructive"
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
                        <TableCell colSpan={7} className="py-16 text-center">
                          <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                              <Key className="h-6 w-6 text-muted-foreground" aria-hidden />
                            </div>
                            <p className="font-medium">No codes match</p>
                            <p className="text-sm text-muted-foreground">
                              Clear filters or generate codes from a member level.
                            </p>
                            <Button variant="outline" asChild className="mt-2 rounded-xl">
                              <Link to="/member-levels">Open member levels</Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {data && data.totalPages > 1 && (
                  <div className="flex flex-col gap-3 border-t border-border/60 bg-muted/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p className="text-sm text-muted-foreground">
                      Page <span className="font-medium text-foreground">{page + 1}</span> of{" "}
                      <span className="tabular-nums">{data.totalPages}</span>{" "}
                      <span className="text-muted-foreground/80">({data.totalItems} items)</span>
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 0 || loading}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page >= data.totalPages - 1 || loading}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Member Level Code</DialogTitle>
            <DialogDescription>
              Update the details of this member level code
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="memberLevel">Member Level</Label>
              <Combobox
                options={
                  memberLevelsData?.content?.map((level) => ({
                    value: level.id.toString(),
                    label: level.name,
                  })) || []
                }
                value={editFormData.memberLevelId?.toString() || ""}
                onValueChange={(value) =>
                  setEditFormData({ ...editFormData, memberLevelId: parseInt(value) })
                }
                placeholder="Select a member level"
                searchPlaceholder="Search member level..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                className="rounded-xl font-mono text-sm"
                value={editFormData.code || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, code: e.target.value })
                }
                placeholder="Enter code"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="activatedAt">Activated At</Label>
              <Input
                id="activatedAt"
                className="rounded-xl"
                type="datetime-local"
                value={editFormData.activatedAt || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, activatedAt: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expiredAt">Expired At</Label>
              <Input
                id="expiredAt"
                className="rounded-xl"
                type="datetime-local"
                value={editFormData.expiredAt || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, expiredAt: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button className="rounded-xl" onClick={openUpdateConfirm} disabled={isUpdating}>
              {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={updateConfirmOpen} onOpenChange={setUpdateConfirmOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Save code changes?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left">
                <p className="text-sm text-muted-foreground">
                  Confirm the following before updating this member level code.
                </p>
                <ul className="list-inside list-disc space-y-1 text-sm text-foreground">
                  <li>Code: {editFormData.code ?? editingCode?.code ?? "—"}</li>
                  <li>
                    Member level:{" "}
                    {memberLevelsData?.content?.find((l) => l.id === editFormData.memberLevelId)?.name ??
                      `ID ${editFormData.memberLevelId ?? "—"}`}
                  </li>
                  <li>Activated at: {editFormData.activatedAt?.trim() || "—"}</li>
                  <li>Expired at: {editFormData.expiredAt?.trim() || "—"}</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void onConfirmCodeUpdate()
              }}
              disabled={isUpdating}
            >
              {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Member Level Code?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the code "{deletingCode?.code}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
