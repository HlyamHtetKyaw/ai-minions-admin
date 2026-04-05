import { useState, useEffect, useRef, useCallback,useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { 
  ArrowLeft, Calendar, Loader2, Sparkles, FileText, 
  MoreVertical, Pencil, Check, X, Play, Pause, Volume2
} from "lucide-react"
import { toast } from "sonner"
import { useJobStatus } from "../hooks/use-voice-transcription"
import { voiceNotesService, voiceNotesDetailsService } from "../services/voice-notes.service"
import { useCodeValues } from "@/features/code-values/hooks/use-code-values"
import type { VoiceNote } from "../types/voice-notes-list.types"
import type {SummaryStyle } from "../types/voice-notes.types"
import { VoiceNoteDetail } from "../types/voice-notes-list.types"

interface VoiceNoteDetailViewProps {
  note: VoiceNote | undefined
  details: VoiceNoteDetail[] | null
  isLoading: boolean
  onBack: () => void
  onRefresh: () => void
}

// Utility function to convert supabase:// URL to public URL
const convertSupabaseUrl = (internalUrl: string): string => {
  const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID || ""
  if (!PROJECT_ID) {
    console.warn("VITE_SUPABASE_PROJECT_ID is not set in environment variables")
    return internalUrl
  }
  const cleanPath = internalUrl.replace("supabase://", "")
  return `https://${PROJECT_ID}.supabase.co/storage/v1/object/public/${cleanPath}`
}

export function VoiceNoteDetailView({ note, details, isLoading, onBack, onRefresh }: VoiceNoteDetailViewProps) {
  const [summaryJobId, setSummaryJobId] = useState<string | null>(null)
  const [activeDetailId, setActiveDetailId] = useState<number | null>(null)
  const [showStyleDialog, setShowStyleDialog] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState<SummaryStyle>("FORMAL")
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const hasRefreshedRef = useRef(false)
  const { status: jobStatus, checkStatus } = useJobStatus(summaryJobId)
  const { data: summaryStyles, loading: loadingStyles } = useCodeValues({ constantValue: "SUMMARY_STYLE" })

  // Get audio URL from note
  const audioUrl = note?.voiceNoteUrl 
    ? (note.voiceNoteUrl.startsWith("supabase://") 
        ? convertSupabaseUrl(note.voiceNoteUrl) 
        : note.voiceNoteUrl)
    : null

  const sortedDetails = useMemo(() => {
    if (!details) return []
    return [...details].sort((a, b) => b.id - a.id)
  }, [details])

  // Set default selected style to first one when styles are loaded
  useEffect(() => {
    if (summaryStyles.length > 0 && !selectedStyle) {
      setSelectedStyle(summaryStyles[0].codeValue as SummaryStyle)
    }
  }, [summaryStyles, selectedStyle])

  // Audio playback controls
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration)
      }
    }
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("canplay", updateDuration)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)

    // Load audio metadata
    audio.load()

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("canplay", updateDuration)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
    }
  }, [audioUrl])

  const togglePlayback = async () => {
    if (!audioRef.current) return

    try {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        await audioRef.current.play()
      }
    } catch (error) {
      console.error("Error playing audio:", error)
      toast.error("Failed to play audio. Please try again.")
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return
    const newTime = parseFloat(e.target.value)
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Poll job status and watch for completion
  useEffect(() => {
    if (!summaryJobId) return

    let pollInterval: NodeJS.Timeout | null = null

    const startPolling = async () => {
      try {
        // Check initial status
        const initialStatus = await checkStatus()
        if (initialStatus?.status === "COMPLETED" || initialStatus?.status === "FAILED") {
          return
        }
      } catch (err) {
        console.error("Failed to check initial status:", err)
        return
      }

      // Start polling
      pollInterval = setInterval(async () => {
        try {
          await checkStatus()
        } catch (err) {
          console.error("Failed to check status:", err)
          if (pollInterval) clearInterval(pollInterval)
        }
      }, 2000)
    }

    startPolling()

    return () => {
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [summaryJobId, checkStatus])

  // Watch jobStatus changes and auto-refresh when completed
  useEffect(() => {
    if (!jobStatus || !summaryJobId) {
      hasRefreshedRef.current = false
      return
    }

    if (jobStatus.status === "COMPLETED" && !hasRefreshedRef.current) {
      hasRefreshedRef.current = true
      toast.success("Summary generated!")
      
      // Refresh immediately and then again after a short delay to ensure we get the latest data
      onRefresh()
      
      // Clear job ID after starting refresh
      setSummaryJobId(null)
      setActiveDetailId(null)
      
      // Refresh again after a delay to ensure backend has fully processed
      const refreshTimer = setTimeout(() => {
        onRefresh()
      }, 1500)
      
      return () => clearTimeout(refreshTimer)
    } else if (jobStatus.status === "FAILED") {
      toast.error(jobStatus.error || "Summarization failed")
      setSummaryJobId(null)
      setActiveDetailId(null)
      hasRefreshedRef.current = false
    }
  }, [jobStatus, summaryJobId, onRefresh])

  const handleOpenSummarizeDialog = (id: number) => {
    setActiveDetailId(id)
    setShowStyleDialog(true)
  }

  const confirmSummarize = async () => {
    if (!activeDetailId) return
    
    try {
      setShowStyleDialog(false)
      const response = await voiceNotesService.summarizeText({
        voiceNoteDetailId: activeDetailId,
        style: selectedStyle
      })
      console.log("Response is ",response)
      if (response?.jobId) {
      console.log("Job id is ",response.jobId)
      setSummaryJobId(response.jobId)
    }
      toast.info("Generating summary...")
    } catch (err) {
      toast.error("Failed to start summarization")
      setActiveDetailId(null)
    }
  }

  const handleSaveDetail = async (id: number, newText: string) => {
    if (!details) return
    
    const detail = details.find(d => d.id === id)
    if (!detail) return

    try {
      await voiceNotesDetailsService.update(id, {
        text: newText,
        type: detail.type,
        detailType: detail.detailType,
        voiceNoteId: detail.voiceNoteId,
        inputToken: detail.inputToken,
        outputToken: detail.outputToken,
      })
      toast.success("Voice note detail updated successfully!")
      onRefresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update voice note detail")
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown date"
    return new Date(dateString).toLocaleDateString("en-US", { 
      month: "short", day: "numeric", hour: 'numeric', minute: 'numeric' 
    })
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{note?.title || "Note Details"}</h1>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Calendar className="h-3 w-3" />
            <span>{note?.masterData?.createdAt ? formatDate(note.masterData.createdAt) : "Unknown Date"}</span>
          </div>
        </div>
      </div>

      {/* Audio Playback Section */}
      {audioUrl && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Original Recording</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={togglePlayback}
                className="shrink-0"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <div className="flex-1 space-y-1">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatTime(Math.floor(currentTime))}</span>
                  <span>{formatTime(Math.floor(duration))}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {isLoading ? (
          <div className="flex flex-col items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground">Loading history...</p>
          </div>
        ) : sortedDetails.length > 0 ? (
          <div className="space-y-6">
            {sortedDetails.map((detail) => (
              <DetailItem 
                key={detail.id} 
                detail={detail} 
                onSave={handleSaveDetail}
                onSummarize={handleOpenSummarizeDialog}
              />
            ))}
            
            {summaryJobId && (
               <Card className="border-l-4 border-l-indigo-500/50 opacity-70 animate-pulse">
                 <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="animate-pulse">
                           <Sparkles className="h-3 w-3 mr-1" />
                           Generating Summary...
                        </Badge>
                    </div>
                 </CardHeader>
                 <CardContent>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                 </CardContent>
               </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">No details found.</div>
        )}
      </div>

      <Dialog open={showStyleDialog} onOpenChange={setShowStyleDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Summarize Text</DialogTitle>
            <DialogDescription>
              Choose a style for your summary. The AI will generate a new summary block below the original text.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2 py-4">
            {loadingStyles ? (
              <div className="col-span-3 flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : summaryStyles.length > 0 ? (
              summaryStyles.map((style) => (
                <Button
                  key={style.id}
                  variant={selectedStyle === style.codeValue ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStyle(style.codeValue as SummaryStyle)}
                  className="capitalize"
                >
                  {style.description || style.codeValue.toLowerCase().replace("_", " ")}
                </Button>
              ))
            ) : (
              <div className="col-span-3 text-sm text-muted-foreground text-center py-4">
                No summary styles available
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStyleDialog(false)}>Cancel</Button>
            <Button onClick={confirmSummarize}>Generate Summary</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden audio element for playback */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="auto"
          className="hidden"
        />
      )}
    </div>
  )
}

interface DetailItemProps {
  detail: VoiceNoteDetail
  onSave: (id: number, newText: string) => void
  onSummarize: (id: number) => void
}

function DetailItem({ detail, onSave, onSummarize }: DetailItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState(detail.text)

  return (
    <Card className={`border-l-4 transition-all ${detail.type === "SUMMARIZED" ? "border-l-indigo-500" : "border-l-primary"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={detail.type === "SUMMARIZED" ? "default" : "secondary"}>
              {detail.type === "SUMMARIZED" ? <Sparkles className="h-3 w-3 mr-1" /> : <FileText className="h-3 w-3 mr-1" />}
              {detail.type === "SUMMARIZED" ? "Summary" : "Transcript"}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
             {detail.inputToken && detail.outputToken && (
               <div className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded hidden sm:block">
                 {detail.inputToken + detail.outputToken} tokens
               </div>
             )}

            {!isEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSummarize(detail.id)}>
                    <Sparkles className="mr-2 h-4 w-4" /> Summarize
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <Textarea 
                value={editedText} 
                onChange={(e) => setEditedText(e.target.value)} 
                className="min-h-[150px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); setEditedText(detail.text); }}>Cancel</Button>
              <Button size="sm" onClick={() => { onSave(detail.id, editedText); setIsEditing(false); }}>Save</Button>
            </div>
          </div>
        ) : (
          <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{detail.text}</div>
        )}
      </CardContent>
    </Card>
  )
}