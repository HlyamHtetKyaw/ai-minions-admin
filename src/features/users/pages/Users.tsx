import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Search,
  MoreVertical,
  Loader2,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Users as UsersIcon,
  UserCog,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUsers, useDeleteUser, useCreateUserWithLoginCode, useUser } from "../hooks/use-users"
import { useMemberLevels } from "@/features/member-levels/hooks/use-member-levels"
import type { User } from "../types/users.types"
import { useDebounce } from "@/lib/use-debounce"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function Users() {
  const [page, setPage] = useState(0)
  const [size] = useState(10)
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 500)
  
  const { data, loading, error, refetch } = useUsers({ 
    page, 
    size,
    sortBy: "id",
    sortDirection: "DESC",
    filter: debouncedSearchQuery
      ? { email: debouncedSearchQuery }
      : undefined,
  })
  const { delete: deleteUser, loading: deleting } = useDeleteUser()
  const { create: createUserWithLoginCode, loading: creatingUser } = useCreateUserWithLoginCode()
  const { data: memberLevelsData } = useMemberLevels({ 
    page: 0, 
    size: 100,
    autoFetch: true 
  })
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [viewingUserId, setViewingUserId] = useState<number | null>(null)
  const { data: viewingUser, loading: loadingUserDetails } = useUser(viewingUserId)
  const [showLoginCode, setShowLoginCode] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [createUserConfirmOpen, setCreateUserConfirmOpen] = useState(false)
  const [formData, setFormData] = useState({
    loginCode: "",
    memberLevelId: "",
  })

  const selectedMemberLevelName =
    memberLevelsData?.content?.find((l) => l.id.toString() === formData.memberLevelId)?.name ?? "—"

  useEffect(() => {
    if (!viewingUserId) setShowLoginCode(false)
  }, [viewingUserId])

  const copyToClipboard = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard`)
    } catch {
      toast.error("Could not copy to clipboard")
    }
  }

  const closeUserDetail = () => {
    setViewingUserId(null)
  }

  const openDeleteFromDetail = () => {
    if (!viewingUser) return
    setDeletingUser(viewingUser)
    closeUserDetail()
  }

  const handleDelete = async () => {
    if (!deletingUser) return
    try {
      await deleteUser(deletingUser.id)
      toast.success("User deleted successfully")
      setDeletingUser(null)
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete user")
    }
  }

  const openCreateUserConfirm = () => {
    if (!formData.loginCode.trim() || !formData.memberLevelId) {
      toast.error("Please fill in all fields")
      return
    }
    setCreateUserConfirmOpen(true)
  }

  const performCreateUserWithLoginCode = async () => {
    setCreateUserConfirmOpen(false)
    try {
      await createUserWithLoginCode({
        loginCode: formData.loginCode.trim(),
        memberLevelId: parseInt(formData.memberLevelId, 10),
      })
      toast.success("User created successfully with login code")
      setIsCreateDialogOpen(false)
      setFormData({ loginCode: "", memberLevelId: "" })
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user with login code")
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

  const totalUsers = data?.totalItems ?? 0

  if (error) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Users</h1>
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
          className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-violet-500/10 blur-3xl dark:bg-violet-400/10"
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-lg px-2.5 font-medium">
                <UsersIcon className="mr-1.5 h-3 w-3" aria-hidden />
                Directory
              </Badge>
              {!loading && data != null && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {totalUsers} account{totalUsers === 1 ? "" : "s"}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Users</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
                Search accounts, open details, or provision a user with a login code and member level.
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
            <Button className="h-10 rounded-xl px-4" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create with code
            </Button>
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">All users</h2>
            <p className="text-sm text-muted-foreground">
              Filter by email (debounced). Use the row menu for details or delete.
            </p>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by email…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 rounded-xl pl-9"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="divide-y divide-border/60">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-4 sm:px-6" aria-hidden>
                    <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                    <Skeleton className="h-4 flex-1 max-w-[140px]" />
                    <Skeleton className="h-4 w-24 shrink-0" />
                    <Skeleton className="h-4 w-40 shrink-0" />
                    <Skeleton className="h-4 w-20 shrink-0" />
                    <Skeleton className="h-4 w-16 shrink-0" />
                    <Skeleton className="h-4 w-24 shrink-0" />
                    <Skeleton className="ml-auto h-9 w-9 shrink-0 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead className="bg-muted/40 font-semibold">User</TableHead>
                    <TableHead className="bg-muted/40 font-semibold">Username</TableHead>
                    <TableHead className="bg-muted/40 font-semibold">Email</TableHead>
                    <TableHead className="bg-muted/40 font-semibold">Name</TableHead>
                    <TableHead className="bg-muted/40 font-semibold">Role</TableHead>
                    <TableHead className="bg-muted/40 font-semibold">Created</TableHead>
                    <TableHead className="bg-muted/40 text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.content && data.content.length > 0 ? (
                    data.content.map((user) => (
                      <TableRow
                        key={user.id}
                        className="border-border/50 transition-colors hover:bg-muted/30"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 ring-2 ring-border/60">
                              <AvatarImage src="" alt={user.email} />
                              <AvatarFallback className="text-xs font-semibold">
                                {(user.username || user.email).charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {user.name || user.username || user.email.split("@")[0]}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {user.username ?? "—"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">{user.email}</TableCell>
                        <TableCell className="text-muted-foreground">{user.name ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-md font-normal">
                            {user.roleName ?? "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="tabular-nums text-muted-foreground text-sm">
                          {formatDate(user.masterData?.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-xl">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl">
                              <DropdownMenuItem onClick={() => setViewingUserId(user.id)}>
                                View details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeletingUser(user)}
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
                            <UsersIcon className="h-6 w-6 text-muted-foreground" aria-hidden />
                          </div>
                          <p className="font-medium">No users match</p>
                          <p className="text-sm text-muted-foreground">
                            Try another email search, or create a user with a login code.
                          </p>
                          <Button className="mt-2 rounded-xl" onClick={() => setIsCreateDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create with code
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

      {/* User Details Dialog — scrollable body + fixed footer so actions stay on screen */}
      <Dialog open={!!viewingUserId} onOpenChange={(open) => !open && closeUserDetail()}>
        <DialogContent className="flex h-[min(90dvh,820px)] w-[calc(100%-2rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:w-full">
          <div className="shrink-0 border-b px-6 pb-4 pt-6 pr-14">
            <DialogHeader className="text-left">
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>
                Review this account. Actions are pinned below; scroll the fields if needed.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            {loadingUserDetails ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : viewingUser ? (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>User ID</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-xl border bg-muted/50 px-3 py-2 font-mono text-sm">
                      {viewingUser.id}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="rounded-xl"
                      title="Copy user ID"
                      onClick={() => copyToClipboard("User ID", String(viewingUser.id))}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Username</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-xl border bg-muted/50 px-3 py-2 font-mono text-sm">
                      {viewingUser.username ?? "—"}
                    </div>
                    {viewingUser.username && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="rounded-xl"
                        title="Copy username"
                        onClick={() => copyToClipboard("Username", viewingUser.username!)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 break-all rounded-xl border bg-muted/50 px-3 py-2 text-sm">
                      {viewingUser.email}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="rounded-xl"
                      title="Copy email"
                      onClick={() => copyToClipboard("Email", viewingUser.email)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Role</Label>
                  <div className="rounded-xl border bg-muted/50 px-3 py-2">
                    {viewingUser.roleName ?? "—"}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Name</Label>
                  <div className="rounded-xl border bg-muted/50 px-3 py-2">
                    {viewingUser.name ?? "—"}
                  </div>
                </div>
                {viewingUser.loginCode && (
                  <div className="grid gap-2">
                    <Label>Login Code</Label>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="min-w-0 flex-1 rounded-xl border bg-muted/50 px-3 py-2 font-mono text-sm">
                        {showLoginCode ? viewingUser.loginCode : "••••••••"}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="rounded-xl"
                          title={showLoginCode ? "Hide" : "Show"}
                          onClick={() => setShowLoginCode((prev) => !prev)}
                        >
                          {showLoginCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="rounded-xl"
                          title="Copy login code"
                          onClick={() => copyToClipboard("Login code", viewingUser.loginCode!)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {viewingUser.profileId != null && (
                  <div className="grid gap-2">
                    <Label>Profile ID</Label>
                    <div className="rounded-xl border bg-muted/50 px-3 py-2 font-mono text-sm">
                      {viewingUser.profileId}
                    </div>
                  </div>
                )}
                {viewingUser.masterData?.createdAt && (
                  <div className="grid gap-2">
                    <Label>Created At</Label>
                    <div className="rounded-xl border bg-muted/50 px-3 py-2">
                      {formatDate(viewingUser.masterData.createdAt)}
                    </div>
                  </div>
                )}
                {viewingUser.masterData?.updatedAt && (
                  <div className="grid gap-2">
                    <Label>Updated At</Label>
                    <div className="rounded-xl border bg-muted/50 px-3 py-2">
                      {formatDate(viewingUser.masterData.updatedAt)}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                Failed to load user details
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 flex-col gap-2 border-t bg-background px-6 py-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="rounded-xl" onClick={closeUserDetail}>
              Close
            </Button>
            {!loadingUserDetails && viewingUser ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-xl"
                  onClick={() => copyToClipboard("Email", viewingUser.email)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy email
                </Button>
                <Button type="button" variant="destructive" className="rounded-xl" onClick={openDeleteFromDetail}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete user
                </Button>
              </>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User with Login Code Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create User with Login Code</DialogTitle>
            <DialogDescription>
              Creates a user with this login code, profile + member level, and a matching member level code
              row. Email format: <span className="font-mono">codeuser&#123;id&#125;@aiminions.local</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="loginCode">Login Code</Label>
              <Input
                id="loginCode"
                className="rounded-xl"
                placeholder="Enter login code"
                value={formData.loginCode}
                onChange={(e) => setFormData({ ...formData, loginCode: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="memberLevelId">Member Level</Label>
              <Select
                value={formData.memberLevelId}
                onValueChange={(value) => setFormData({ ...formData, memberLevelId: value })}
              >
                <SelectTrigger id="memberLevelId" className="rounded-xl">
                  <SelectValue placeholder="Select member level" />
                </SelectTrigger>
                <SelectContent>
                  {memberLevelsData?.content?.map((level) => (
                    <SelectItem key={level.id} value={level.id.toString()}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setIsCreateDialogOpen(false)
                setFormData({ loginCode: "", memberLevelId: "" })
              }}
            >
              Cancel
            </Button>
            <Button className="rounded-xl" onClick={openCreateUserConfirm} disabled={creatingUser}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={createUserConfirmOpen} onOpenChange={setCreateUserConfirmOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Create this user?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left">
                <p className="text-sm text-muted-foreground">
                  A user account, profile, and member level code row will be created with these values.
                </p>
                <ul className="list-inside list-disc space-y-1 text-sm text-foreground">
                  <li>
                    Login code:{" "}
                    <span className="font-mono">{formData.loginCode.trim() || "—"}</span>
                  </li>
                  <li>Member level: {selectedMemberLevelName}</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={creatingUser}>Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void performCreateUserWithLoginCode()
              }}
              disabled={creatingUser}
            >
              {creatingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm & create
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user
              "{deletingUser?.email}".
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
    </div>
  )
}
