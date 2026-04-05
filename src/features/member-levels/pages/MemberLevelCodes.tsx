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
import { Loader2, ChevronLeft, ChevronRight, Edit, Trash2, MoreVertical } from "lucide-react"
import { useMemberLevelsCode } from "../hooks/use-member-levels-code"
import { useMemberLevels } from "../hooks/use-member-levels"
import { memberLevelsCodeService } from "../services/member-levels-code.service"
import type { MemberLevelCodeFilter, MemberLevelCode, MemberLevelCodeRequest } from "../types/member-levels-code.types"
import { toast } from "sonner"

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

  const handleUpdate = async () => {
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

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Member Level Codes</h1>
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
          <h1 className="text-3xl font-bold tracking-tight">Member Level Codes</h1>
          <p className="text-muted-foreground">
            View and manage all member level codes
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter codes by member level or search by code</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="memberLevel">Member Level</Label>
              <Combobox
                options={[
                  { value: "all", label: "All Member Levels" },
                  ...(memberLevelsData?.content?.map((level) => ({
                    value: level.id.toString(),
                    label: level.name,
                  })) || []),
                ]}
                value={filter.memberLevelId?.toString() || "all"}
                onValueChange={handleFilterChange}
                placeholder="All Member Levels"
                searchPlaceholder="Search member level..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="codeSearch">Code Search</Label>
              <div className="flex gap-2">
                <Input
                  id="codeSearch"
                  value={codeSearch}
                  onChange={(e) => setCodeSearch(e.target.value)}
                  placeholder="Enter code to search"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCodeSearch()
                    }
                  }}
                />
                <Button onClick={handleCodeSearch} variant="outline">
                  Search
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>&nbsp;</Label>
              <Button onClick={handleClearFilter} variant="outline" className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Member Level Codes</CardTitle>
          <CardDescription>
            A list of all member level codes in your system
            {data && ` (${data.totalItems} total)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Member Level</TableHead>
                    <TableHead>Activated At</TableHead>
                    <TableHead>Activated User Name</TableHead>
                    <TableHead>Expired At</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.content && data.content.length > 0 ? (
                    data.content.map((code) => (
                      <TableRow key={code.id}>
                        <TableCell className="font-mono font-medium">
                          {code.code}
                        </TableCell>
                        <TableCell>
                          {memberLevelsData?.content?.find(
                            (level) => level.id === code.memberLevelId
                          )?.name || `Level ${code.memberLevelId}`}
                        </TableCell>
                        <TableCell>{formatDate(code.activatedAt)}</TableCell>
                        <TableCell>{code.purchasedUserName || "-"}</TableCell>
                        <TableCell>{formatDate(code.expiredAt)}</TableCell>
                        <TableCell>
                          {formatDate(code.masterData?.createdAt)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditClick(code)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(code)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No member level codes found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {page + 1} of {data.totalPages} ({data.totalItems} total items)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 0 || loading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
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
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
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
                type="datetime-local"
                value={editFormData.expiredAt || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, expiredAt: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
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
