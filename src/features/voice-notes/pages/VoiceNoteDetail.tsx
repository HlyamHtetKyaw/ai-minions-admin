import { useParams, useNavigate } from "react-router-dom"
import { useVoiceNote, useVoiceNoteDetails } from "../hooks/use-voice-notes"
import { VoiceNoteDetailView } from "../component/VoiceNoteDetailView"

export function VoiceNoteDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const voiceNoteId = id ? parseInt(id, 10) : null

  const { data: note, loading: loadingNote } = useVoiceNote(voiceNoteId)
  const { data: voiceNoteDetails, loading: loadingDetails, refetch: refetchDetails } = useVoiceNoteDetails(voiceNoteId)

  const handleBack = () => {
    navigate("/voice-notes")
  }

  if (!voiceNoteId) {
    return (
      <div className="space-y-6 pb-20">
        <p className="text-muted-foreground">Invalid voice note ID</p>
      </div>
    )
  }

  return (
    <VoiceNoteDetailView 
      note={note || undefined}
      details={voiceNoteDetails}
      isLoading={loadingDetails || loadingNote}
      onBack={handleBack}
      onRefresh={refetchDetails}
    />
  )
}
