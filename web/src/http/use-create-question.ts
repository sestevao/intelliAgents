import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateQuestionRequest } from './types/create-question-request'
import type { CreateQuestionResponse } from './types/create-question-response'
import type { GetRoomQuestionsResponse } from './types/get-room-questions-response'

export function useCreateQuestion(roomId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateQuestionRequest) => {
      const response = await fetch(
        `http://localhost:3333/rooms/${roomId}/questions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      )

      const result: CreateQuestionResponse = await response.json()

      return result
    },

    onSuccess(data, variables) {
      queryClient.setQueryData<GetRoomQuestionsResponse>(
        ['get-questions', roomId],
        (questions) => {
          const questionsArray = questions ?? []

          const newQuestion = {
            id: data.questionId,
            question: variables.question,
            answer: data.answer,
            createdAt: new Date().toISOString(),
            isGeneratingAnswer: false,
          }

          return [newQuestion, ...questionsArray]
        }
      )
    },

    // onSuccess: () => {
    //   queryClient.invalidateQueries({ queryKey: ['get-questions', roomId] })
    // },
  })
}