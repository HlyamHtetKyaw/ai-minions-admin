import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Mic, MicOff, Square, Sparkles, FileText, Globe, X, Loader2,ArrowLeft, Clock, Calendar, Play, Pause, Volume2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useVoiceTranscription, useJobStatus } from "../hooks/use-voice-transcription"
import { useVoiceNotes, useVoiceNoteDetails } from "../hooks/use-voice-notes"
import { useCodeValues } from "@/features/code-values/hooks/use-code-values"
import type { TaskType, SummaryStyle } from "../types/voice-notes.types"
import type { VoiceNote } from "../types/voice-notes-list.types"
import { toast } from "sonner"

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

export function VoiceNotes() {
  const navigate = useNavigate()
  const [isRecording, setIsRecording] = useState(false)
  const [isHolding, setIsHolding] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [outputMode, setOutputMode] = useState<"transcribe" | "summarize">("transcribe")
  const [summaryStyle, setSummaryStyle] = useState<string>("")
  const { data: summaryStyles } = useCodeValues({ constantValue: "SUMMARY_STYLE" })
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [processingJobId, setProcessingJobId] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [size] = useState(10)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playingNoteId, setPlayingNoteId] = useState<number | null>(null)
  const [noteCurrentTimes, setNoteCurrentTimes] = useState<Map<number, number>>(new Map())
  const [noteDurations, setNoteDurations] = useState<Map<number, number>>(new Map())
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioRefsMap = useRef<Map<number, HTMLAudioElement>>(new Map())

  const { uploadAudio, loading: uploading, error: uploadError, jobId } = useVoiceTranscription()
  const { status: jobStatus, loading: checkingStatus, checkStatus } = useJobStatus(processingJobId)
  const { data: voiceNotesData, loading: loadingVoiceNotes, refetch: refetchVoiceNotes } = useVoiceNotes({
    page,
    size,
    sortBy: "createdAt",
    sortDirection: "DESC",
    autoFetch: true,
  })

  // Set default summary style when styles are loaded
  useEffect(() => {
    if (summaryStyles.length > 0 && !summaryStyle) {
      setSummaryStyle(summaryStyles[0].codeValue)
    }
  }, [summaryStyles, summaryStyle])

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording])

  useEffect(() => {
    if (!processingJobId) return

    let pollInterval: NodeJS.Timeout | null = null

    const startPolling = async () => {
      try {
        const initialStatus = await checkStatus()
        if (initialStatus?.status === "COMPLETED" || initialStatus?.status === "FAILED") {
          return
        }
      } catch (err) {
        console.error("Failed to check initial status:", err)
        return
      }

      pollInterval = setInterval(async () => {
        try {
          const status = await checkStatus()
          if (status?.status === "COMPLETED" || status?.status === "FAILED") {
            if (pollInterval) clearInterval(pollInterval)
          }
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
  }, [processingJobId, checkStatus])

  useEffect(() => {
    if (jobStatus?.status === "COMPLETED" && jobStatus.result) {
      toast.success("Transcription completed successfully!")
      setProcessingJobId(null)
      refetchVoiceNotes()
    } else if (jobStatus?.status === "FAILED") {
      toast.error(jobStatus.error || "Transcription failed")
      setProcessingJobId(null)
    }
  }, [jobStatus, refetchVoiceNotes])

  // Create audio URL when audioBlob changes
  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob)
      setAudioUrl(url)
      return () => {
        URL.revokeObjectURL(url)
      }
    } else {
      setAudioUrl((prevUrl) => {
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl)
        }
        return null
      })
    }
  }, [audioBlob])

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
    const handleLoadedData = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration)
      }
    }

    // Load audio metadata
    audio.load()

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("loadeddata", handleLoadedData)
    audio.addEventListener("canplay", updateDuration)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("loadeddata", handleLoadedData)
      audio.removeEventListener("canplay", updateDuration)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
    }
  }, [audioUrl])

  // Reset audio when dialog opens
  useEffect(() => {
    if (showOptions && audioRef.current) {
      audioRef.current.currentTime = 0
      setCurrentTime(0)
      setIsPlaying(false)
    }
  }, [showOptions])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        setAudioBlob(audioBlob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsHolding(true)
      setIsRecording(true)
      setRecordingTime(0)
    } catch (err) {
      toast.error("Failed to access microphone. Please check permissions.")
      console.error("Error accessing microphone:", err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }
    setIsHolding(false)
    setIsRecording(false)
    if (recordingTime > 0) {
      setShowOptions(true)
    }
  }

  const handleStartRecording = () => {
    startRecording()
  }

  const handleStopRecording = () => {
    stopRecording()
  }

  const handleProcessRecording = async () => {
    if (!audioBlob) {
      toast.error("No recording found")
      return
    }

    const taskType: TaskType = outputMode === "transcribe" ? "TRANSCRIBE" : "SUMMARIZE"
    let style: SummaryStyle | undefined = undefined

    if (outputMode === "summarize") {
      style = (summaryStyle || summaryStyles[0]?.codeValue || "FORMAL") as SummaryStyle
    }

    try {
      const file = new File([audioBlob], `recording-${Date.now()}.webm`, {
        type: "audio/webm",
      })

      const response = await uploadAudio(file, taskType, style)
      setProcessingJobId(response.jobId)
      setShowOptions(false)
      // Stop audio if playing
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      setIsPlaying(false)
      setAudioBlob(null)
      setRecordingTime(0)
      toast.success("Recording uploaded. Processing...")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload recording")
    }
  }

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown date"
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = diffInMs / (1000 * 60 * 60)
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24)

    if (diffInHours < 1) {
      return "Just now"
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours)
      return `${hours} hour${hours > 1 ? "s" : ""} ago`
    } else if (diffInDays < 2) {
      return "Yesterday"
    } else if (diffInDays < 7) {
      const days = Math.floor(diffInDays)
      return `${days} days ago`
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined })
    }
  }
  const handleViewDetails = (id: number) => {
    navigate(`/voice-notes/${id}`)
  }

  const toggleNotePlayback = async (noteId: number, audioUrl: string) => {
    const audio = audioRefsMap.current.get(noteId)
    if (!audio) return

    // Stop any currently playing audio
    if (playingNoteId && playingNoteId !== noteId) {
      const currentAudio = audioRefsMap.current.get(playingNoteId)
      if (currentAudio) {
        currentAudio.pause()
        currentAudio.currentTime = 0
      }
    }

    try {
      if (playingNoteId === noteId && !audio.paused) {
        audio.pause()
        setPlayingNoteId(null)
      } else {
        await audio.play()
        setPlayingNoteId(noteId)
      }
    } catch (error) {
      console.error("Error playing audio:", error)
      toast.error("Failed to play audio. Please try again.")
    }
  }

  const handleAudioEnded = (noteId: number) => {
    setPlayingNoteId(null)
    setNoteCurrentTimes(prev => {
      const newMap = new Map(prev)
      newMap.set(noteId, 0)
      return newMap
    })
  }

  const handleNoteSeek = (noteId: number, newTime: number) => {
    const audio = audioRefsMap.current.get(noteId)
    if (!audio) return
    audio.currentTime = newTime
    setNoteCurrentTimes(prev => {
      const newMap = new Map(prev)
      newMap.set(noteId, newTime)
      return newMap
    })
  }

  // Set up audio event listeners for each note
  useEffect(() => {
    const audioElements = audioRefsMap.current
    const updateHandlers = new Map<number, () => void>()
    const durationHandlers = new Map<number, () => void>()

    audioElements.forEach((audio, noteId) => {
      const updateTime = () => {
        setNoteCurrentTimes(prev => {
          const newMap = new Map(prev)
          newMap.set(noteId, audio.currentTime)
          return newMap
        })
      }

      const updateDuration = () => {
        if (audio.duration && isFinite(audio.duration)) {
          setNoteDurations(prev => {
            const newMap = new Map(prev)
            newMap.set(noteId, audio.duration)
            return newMap
          })
        }
      }

      audio.addEventListener("timeupdate", updateTime)
      audio.addEventListener("loadedmetadata", updateDuration)
      audio.addEventListener("canplay", updateDuration)
      audio.load()

      updateHandlers.set(noteId, updateTime)
      durationHandlers.set(noteId, updateDuration)
    })

    return () => {
      audioElements.forEach((audio, noteId) => {
        const updateTime = updateHandlers.get(noteId)
        const updateDuration = durationHandlers.get(noteId)
        if (updateTime) audio.removeEventListener("timeupdate", updateTime)
        if (updateDuration) {
          audio.removeEventListener("loadedmetadata", updateDuration)
          audio.removeEventListener("canplay", updateDuration)
        }
      })
    }
  }, [voiceNotesData?.content])
  
  return (
    <div className="space-y-6 pb-32">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Voice Notes</h1>
          <p className="text-muted-foreground">
            Record and transcribe your voice notes
          </p>
        </div>
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          150 Credits
        </Badge>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Globe className="h-4 w-4" />
        <span>Myanmar + English</span>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">RECENT</h2>
        <Button variant="ghost" size="sm">
          See all
        </Button>
      </div>

      <div className="grid gap-4">
        {loadingVoiceNotes ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : voiceNotesData?.content && voiceNotesData.content.length > 0 ? (
          voiceNotesData.content.map((note: VoiceNote) => {
            const noteAudioUrl = note.voiceNoteUrl 
              ? (note.voiceNoteUrl.startsWith("supabase://") 
                  ? convertSupabaseUrl(note.voiceNoteUrl) 
                  : note.voiceNoteUrl)
              : null
            const isNotePlaying = playingNoteId === note.id

            return (
              <Card key={note.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(note.masterData?.createdAt)}
                        </span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          EN/MM
                        </Badge>
                      </div>
                      <p className="text-sm font-medium mb-3">{note.title}</p>
                      
                      {/* Audio Player */}
                      {noteAudioUrl && (
                        <div className="mb-3 p-2.5 bg-primary/5 rounded-lg border border-primary/20">
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => noteAudioUrl && toggleNotePlayback(note.id, noteAudioUrl)}
                            >
                              {isNotePlaying ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            <div className="flex-1 space-y-1">
                              <input
                                type="range"
                                min="0"
                                max={noteDurations.get(note.id) || 0}
                                value={noteCurrentTimes.get(note.id) || 0}
                                onChange={(e) => handleNoteSeek(note.id, parseFloat(e.target.value))}
                                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                              />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{formatTime(Math.floor(noteCurrentTimes.get(note.id) || 0))}</span>
                                <span>{formatTime(Math.floor(noteDurations.get(note.id) || 0))}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(note.id)}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
                {/* Hidden audio element for this note */}
                {noteAudioUrl && (
                  <audio
                    ref={(el) => {
                      if (el) {
                        audioRefsMap.current.set(note.id, el)
                      } else {
                        audioRefsMap.current.delete(note.id)
                      }
                    }}
                    src={noteAudioUrl}
                    preload="none"
                    onEnded={() => handleAudioEnded(note.id)}
                    className="hidden"
                  />
                )}
              </Card>
            )
          })
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No voice notes yet. Start recording to create your first note!</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recording Button Section */}
      <div className="sticky bottom-6 mt-12 flex flex-col items-center gap-4">
        {isRecording && (
          <div className="flex items-center gap-2 bg-background/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border">
            <div className="flex gap-1">
              <div className="w-1 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
              <div className="w-1 h-6 bg-primary rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
              <div className="w-1 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-sm font-medium ml-2">
              {formatTime(recordingTime)}
            </span>
          </div>
        )}

        <div className="relative flex items-center gap-4">
          {isRecording && !isHolding && (
            <button
              onClick={handleStopRecording}
              className="w-14 h-14 rounded-full bg-destructive hover:bg-destructive/90 flex items-center justify-center shadow-lg transition-all"
            >
              <Square className="h-6 w-6 text-destructive-foreground fill-current" />
            </button>
          )}
          
          <button
            onMouseDown={handleStartRecording}
            onMouseUp={() => {
              if (isHolding) {
                handleStopRecording()
              }
            }}
            onMouseLeave={() => {
              if (isHolding) {
                setIsHolding(false)
                setIsRecording(false)
              }
            }}
            onTouchStart={(e) => {
              e.preventDefault()
              handleStartRecording()
            }}
            onTouchEnd={(e) => {
              e.preventDefault()
              if (isHolding) {
                handleStopRecording()
              }
            }}
            className={`
              w-20 h-20 rounded-full flex items-center justify-center
              transition-all duration-200 shadow-lg
              ${isRecording
                ? "bg-primary scale-110"
                : "bg-primary hover:bg-primary/90 scale-100"
              }
            `}
          >
            {isRecording ? (
              <MicOff className="h-8 w-8 text-primary-foreground" />
            ) : (
              <Mic className="h-8 w-8 text-primary-foreground" />
            )}
          </button>
        </div>

        <p className="text-sm text-muted-foreground text-center">
          {processingJobId
            ? `Processing... ${jobStatus?.status || "PROCESSING"}`
            : isHolding
            ? "Release to send"
            : isRecording
            ? "Recording... Tap stop when done"
            : "Hold to record"
          }
        </p>
        {processingJobId && checkingStatus && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Checking status...</span>
          </div>
        )}
      </div>

      {/* Recording Options Dialog */}
      <Dialog open={showOptions} onOpenChange={setShowOptions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Recording Options</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowOptions(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription>
              Configure how your recording will be processed
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Audio Playback Section */}
            {audioBlob && audioUrl && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Preview Recording</span>
                </div>
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
              </div>
            )}

            {/* Language Detection */}
            <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
              <Globe className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">
                Mixed Language Detection Active (Myanmar + English)
              </span>
            </div>

            {/* Output Mode */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Output Mode</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={outputMode === "transcribe" ? "default" : "outline"}
                  className="justify-start h-auto py-3"
                  onClick={() => setOutputMode("transcribe")}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">Transcribe</div>
                    <div className="text-xs opacity-70">Word-by-word</div>
                  </div>
                </Button>
                <Button
                  variant={outputMode === "summarize" ? "default" : "outline"}
                  className="justify-start h-auto py-3"
                  onClick={() => setOutputMode("summarize")}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">Summarize</div>
                    <div className="text-xs opacity-70">AI condensed</div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Summary Style (only show if summarize is selected) */}
            {outputMode === "summarize" && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Summary Style</h3>
                <div className="grid grid-cols-3 gap-2">
                  {summaryStyles.length > 0 ? (
                    summaryStyles.map((style) => (
                      <Button
                        key={style.id}
                        variant={summaryStyle === style.codeValue ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSummaryStyle(style.codeValue)}
                      >
                        {style.description || style.codeValue}
                      </Button>
                    ))
                  ) : (
                    <div className="col-span-3 text-sm text-muted-foreground">
                      Loading styles...
                    </div>
                  )}
                </div>
              </div>
            )}

            <Separator />

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  // Stop audio if playing
                  if (audioRef.current) {
                    audioRef.current.pause()
                    audioRef.current.currentTime = 0
                  }
                  setIsPlaying(false)
                  setShowOptions(false)
                  setAudioBlob(null)
                }}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleProcessRecording}
                disabled={uploading || !audioBlob}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Process Recording"
                )}
              </Button>
            </div>
          </div>
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
