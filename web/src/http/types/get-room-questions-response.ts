export interface Question {
  id: string
  question: string
  answer?: string | null
  roomId: string
  createdAt: string
  isGeneratingAnswer?: boolean
}

export interface GetRoomQuestionsResponse {
  questions: Question[]
}