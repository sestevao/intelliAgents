import { Bot, Loader2, MessageSquare } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { dayjs } from '@/lib/dayjs'

interface Question {
  id: string
  question: string
  answer?: string | null
  createdAt: string
  isGeneratingAnswer?: boolean
}

interface QuestionItemProps {
  question: Question
}

export function QuestionItem({ question }: QuestionItemProps) {
  return (
    <Card>
      <CardContent>
        <div className="space-y-4">
          {/* Question */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                <MessageSquare className="size-4 text-primary" />
              </div>
            </div>
            <div className="flex-1">
              <p className="mb-1 font-medium text-foreground">Question</p>
              <p className="whitespace-pre-line text-muted-foreground text-sm leading-relaxed">
                {question.question}
              </p>
            </div>
          </div>

          {/* Answer or Loading */}
          {(!!question.answer || question.isGeneratingAnswer) && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="size-4 text-secondary-foreground" />
                </div>
              </div>
              <div className="flex-1">
                <p className="mb-1 font-medium text-foreground">
                  Resposta da IA
                </p>
                <div className="text-muted-foreground">
                  {question.isGeneratingAnswer ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="size-4 animate-spin text-primary" />
                      <span className="text-primary text-sm italic">
                        Generating response...
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-4 text-sm leading-relaxed">
                      {question.answer ? (
                        question.answer.split('\n\n').map((section, index) => {
                          if (section.startsWith('ANSWER:')) {
                            return (
                              <div key={index} className="text-foreground">
                                <p className="font-medium mb-2">Answer:</p>
                                <p className="whitespace-pre-line">
                                  {section.replace('ANSWER:', '').trim()}
                                </p>
                              </div>
                            )
                          }

                          if (section.startsWith('RELEVANT EXCERPTS:')) {
                            return (
                              <div
                                key={index}
                                className="text-muted-foreground bg-muted/30 p-3 rounded-md"
                              >
                                <p className="font-medium mb-2">
                                  Relevant Excerpt:
                                </p>
                                <p className="whitespace-pre-line italic">
                                  {section.replace(
                                    'RELEVANT EXCERPTS:',
                                    ''
                                  ).trim()}
                                </p>
                              </div>
                            )
                          }

                          if (section.startsWith('ADDITIONAL OBSERVATIONS:')) {
                            return (
                              <div
                                key={index}
                                className="text-muted-foreground text-xs"
                              >
                                <p className="font-medium mb-1">
                                  Observations:
                                </p>
                                <p className="whitespace-pre-line">
                                  {section
                                    .replace('ADDITIONAL OBSERVATIONS:', '')
                                    .trim()}
                                </p>
                              </div>
                            )
                          }

                          return (
                            <p key={index} className="whitespace-pre-line">
                              {section}
                            </p>
                          )
                        })
                      ) : (
                        <p className="italic text-sm text-muted-foreground">
                          Nenhuma resposta encontrada.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="flex justify-end">
            <span className="text-muted-foreground text-xs">
              {dayjs(question.createdAt).toNow()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
