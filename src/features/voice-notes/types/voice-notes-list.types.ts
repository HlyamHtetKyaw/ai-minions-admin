import { MasterData, PageAndFilterDTO } from "@/types/api"

export interface VoiceNote {
  id: number
  title: string
  voiceNoteUrl: string
  userId: number
  masterData?: MasterData
}

export interface VoiceNoteRequest {
  title: string
  voiceNoteUrl: string
  userId: number
}

export interface VoiceNoteFilter {
  title?: string
  userId?: number
}

export interface VoiceNotePageAndFilter extends PageAndFilterDTO<VoiceNoteFilter> {}

export interface VoiceNoteDetail {
  id: number
  text: string
  type: "TRANSCRIBED" | "SUMMARIZED"
  outputToken?: number
  inputToken?: number
  detailType: "VOICE" | "TEXT"
  voiceNoteId: number
  masterData?: MasterData
}

export interface VoiceNoteDetailRequest {
  text: string
  type: "TRANSCRIBED" | "SUMMARIZED"
  outputToken?: number
  inputToken?: number
  detailType: "VOICE" | "TEXT"
  voiceNoteId: number
}

export interface VoiceNoteDetailFilter {
  text?: string
  type?: "TRANSCRIBED" | "SUMMARIZED"
  detailType?: "VOICE" | "TEXT"
  voiceNoteId?: number
}

export interface VoiceNoteDetailPageAndFilter extends PageAndFilterDTO<VoiceNoteDetailFilter> {}
