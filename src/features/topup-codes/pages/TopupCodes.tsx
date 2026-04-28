import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { topupCodesService } from "../services/topup-codes.service"
import type { TopupCode } from "../types/topup-codes.types"
import type { PaginationDTO } from "@/types/api"

function formatDate(value?: string) {
  if (!value) return "—"
  try {
    return new Date(value).toLocaleDateString()
  } catch {
    return value
  }
}

export function TopupCodes() {
  const [page, setPage] = useState(0)
  const [size] = useState(10)
  const [data, setData] = useState<PaginationDTO<TopupCode> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchCode, setSearchCode] = useState("")
  const [activatedFilter, setActivatedFilter] = useState<"all" | "yes" | "no">("all")
  const [isGenerating, setIsGenerating] = useState(false)
  const [form, setForm] = useState({
    points: "100",
    count: "1",
    prefix: "TP",
    expiredAt: "",
  })

  const filter = useMemo(() => ({
    code: searchCode.trim() || undefined,
    activated: activatedFilter === "all" ? undefined : activatedFilter === "yes",
  }), [searchCode, activatedFilter])

  const fetchPage = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await topupCodesService.getAll({
        page,
        size,
        sortBy: "id",
        sortDirection: "DESC",
        filter,
      })
      setData(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load topup codes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchPage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, filter.code, filter.activated])

  const onGenerate = async () => {
    const points = Number.parseInt(form.points, 10)
    const count = Number.parseInt(form.count, 10)
    if (!Number.isFinite(points) || points <= 0) {
      toast.error("Points must be greater than 0")
      return
    }
    if (!Number.isFinite(count) || count <= 0) {
      toast.error("Count must be greater than 0")
      return
    }
    try {
      setIsGenerating(true)
      const payload = {
        points,
        count,
        prefix: form.prefix.trim() || undefined,
        expiredAt: form.expiredAt ? new Date(form.expiredAt).toISOString() : undefined,
      }
      const generated = await topupCodesService.generate(payload)
      toast.success(`Generated ${generated.length} topup code${generated.length === 1 ? "" : "s"}`)
      if (generated.length > 0) {
        const raw = generated.map((x) => x.code).join("\n")
        void navigator.clipboard.writeText(raw).then(() => {
          toast.success("Generated codes copied to clipboard")
        }).catch(() => {})
      }
      setPage(0)
      await fetchPage()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate topup codes")
    } finally {
      setIsGenerating(false)
    }
  }

  const totalItems = data?.totalItems ?? 0

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl dark:bg-cyan-400/10"
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Badge variant="secondary" className="rounded-lg px-2.5 font-medium">
              <KeyRound className="mr-1.5 h-3 w-3" aria-hidden />
              Credit topup
            </Badge>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Topup codes</h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Generate one-time codes that users redeem in profile to increase current credits.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-10 gap-2 rounded-xl border-border/80 bg-background/80"
            onClick={() => void fetchPage()}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
            Refresh
          </Button>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Generate codes</h2>
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="grid gap-2">
              <Label htmlFor="points">Points per code</Label>
              <Input
                id="points"
                type="number"
                min={1}
                className="rounded-xl"
                value={form.points}
                onChange={(e) => setForm((prev) => ({ ...prev, points: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="count">Count</Label>
              <Input
                id="count"
                type="number"
                min={1}
                max={500}
                className="rounded-xl"
                value={form.count}
                onChange={(e) => setForm((prev) => ({ ...prev, count: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="prefix">Prefix</Label>
              <Input
                id="prefix"
                className="rounded-xl"
                placeholder="TP"
                value={form.prefix}
                onChange={(e) => setForm((prev) => ({ ...prev, prefix: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expiredAt">Expires at (optional)</Label>
              <Input
                id="expiredAt"
                type="datetime-local"
                className="rounded-xl"
                value={form.expiredAt}
                onChange={(e) => setForm((prev) => ({ ...prev, expiredAt: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <Button className="w-full rounded-xl" onClick={onGenerate} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Generate
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">All codes</h2>
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="codeSearch">Code search</Label>
              <Input
                id="codeSearch"
                className="rounded-xl"
                placeholder="Search code…"
                value={searchCode}
                onChange={(e) => {
                  setPage(0)
                  setSearchCode(e.target.value)
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="activated">Activation status</Label>
              <Select
                value={activatedFilter}
                onValueChange={(v: "all" | "yes" | "no") => {
                  setPage(0)
                  setActivatedFilter(v)
                }}
              >
                <SelectTrigger id="activated" className="rounded-xl">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">Activated</SelectItem>
                  <SelectItem value="no">Not activated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className="text-sm text-muted-foreground">
                {totalItems} code{totalItems === 1 ? "" : "s"}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <div className="overflow-x-auto">
            {error ? (
              <div className="px-4 py-6 text-sm text-destructive">{error}</div>
            ) : loading ? (
              <div className="divide-y divide-border/60">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-4 sm:px-6" aria-hidden>
                    <Skeleton className="h-4 w-36 shrink-0 font-mono" />
                    <Skeleton className="h-4 w-16 shrink-0" />
                    <Skeleton className="h-4 w-36 shrink-0" />
                    <Skeleton className="h-4 w-24 shrink-0" />
                    <Skeleton className="h-4 w-24 shrink-0" />
                    <Skeleton className="h-4 w-20 shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/60 hover:bg-transparent">
                      <TableHead className="bg-muted/40 font-semibold">Code</TableHead>
                      <TableHead className="bg-muted/40 font-semibold">Points</TableHead>
                      <TableHead className="bg-muted/40 font-semibold">Assigned user</TableHead>
                      <TableHead className="bg-muted/40 font-semibold">Activated</TableHead>
                      <TableHead className="bg-muted/40 font-semibold">Expires</TableHead>
                      <TableHead className="bg-muted/40 font-semibold">Created</TableHead>
                      <TableHead className="bg-muted/40 font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.content && data.content.length > 0 ? (
                      data.content.map((code) => (
                        <TableRow key={code.id} className="border-border/50 transition-colors hover:bg-muted/30">
                          <TableCell className="font-mono text-sm font-medium">{code.code}</TableCell>
                          <TableCell className="tabular-nums text-sm">{code.points}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {code.assignedUserName ?? "—"}
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
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-xl"
                                title="Copy code"
                                onClick={() => {
                                  void navigator.clipboard.writeText(code.code)
                                  toast.success("Code copied")
                                }}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                          No topup codes found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {data && data.totalPages > 1 && (
                  <div className="flex flex-col gap-3 border-t border-border/60 bg-muted/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p className="text-sm text-muted-foreground">
                      Page <span className="font-medium text-foreground">{page + 1}</span> of{" "}
                      <span className="tabular-nums">{data.totalPages}</span>
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0 || loading}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => setPage((p) => p + 1)}
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
    </div>
  )
}
