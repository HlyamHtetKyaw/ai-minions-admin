import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Search, MoreVertical, Loader2, Trash2, Plus, Eye, EyeOff } from "lucide-react"
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
    filter: debouncedSearchQuery ? { email: debouncedSearchQuery } : undefined
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
  const [formData, setFormData] = useState({
    loginCode: "",
    memberLevelId: "",
  })

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

  const handleCreateUserWithLoginCode = async () => {
    if (!formData.loginCode.trim() || !formData.memberLevelId) {
      toast.error("Please fill in all fields")
      return
    }

    try {
      await createUserWithLoginCode({
        loginCode: formData.loginCode.trim(),
        memberLevelId: parseInt(formData.memberLevelId),
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

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
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
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage and view all registered users
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create User with Login Code
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                A list of all users in your system
                {data && ` (${data.totalItems} total)`}
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
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
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.content && data.content.length > 0 ? (
                  data.content.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="" alt={user.email} />
                            <AvatarFallback>
                              {user.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.email.split("@")[0]}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.name ?? "-"}</TableCell>
                      <TableCell>
                        {formatDate(user.masterData?.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewingUserId(user.id)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>Edit User</DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
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
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={!!viewingUserId} onOpenChange={(open) => !open && setViewingUserId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View detailed information about the user
            </DialogDescription>
          </DialogHeader>
          {loadingUserDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : viewingUser ? (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>User ID</Label>
                <div className="px-3 py-2 border rounded-md bg-muted/50">
                  {viewingUser.id}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <div className="px-3 py-2 border rounded-md bg-muted/50">
                  {viewingUser.email}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Name</Label>
                <div className="px-3 py-2 border rounded-md bg-muted/50">
                  {viewingUser.name ?? "-"}
                </div>
              </div>
              {viewingUser.loginCode && (
                <div className="grid gap-2">
                  <Label>Login Code</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 border rounded-md bg-muted/50 font-mono">
                      {showLoginCode ? viewingUser.loginCode : "••••••••"}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowLoginCode((prev) => !prev)}
                    >
                      {showLoginCode ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
              {viewingUser.profileId && (
                <div className="grid gap-2">
                  <Label>Profile ID</Label>
                  <div className="px-3 py-2 border rounded-md bg-muted/50">
                    {viewingUser.profileId}
                  </div>
                </div>
              )}
              {viewingUser.masterData?.createdAt && (
                <div className="grid gap-2">
                  <Label>Created At</Label>
                  <div className="px-3 py-2 border rounded-md bg-muted/50">
                    {formatDate(viewingUser.masterData.createdAt)}
                  </div>
                </div>
              )}
              {viewingUser.masterData?.updatedAt && (
                <div className="grid gap-2">
                  <Label>Updated At</Label>
                  <div className="px-3 py-2 border rounded-md bg-muted/50">
                    {formatDate(viewingUser.masterData.updatedAt)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Failed to load user details
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingUserId(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User with Login Code Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User with Login Code</DialogTitle>
            <DialogDescription>
              Create a new user with a login code. The user will be created with a random name and email format: codeuser01@gmail.com
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="loginCode">Login Code</Label>
              <Input
                id="loginCode"
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
                <SelectTrigger id="memberLevelId">
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
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false)
                setFormData({ loginCode: "", memberLevelId: "" })
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateUserWithLoginCode} disabled={creatingUser}>
              {creatingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
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
