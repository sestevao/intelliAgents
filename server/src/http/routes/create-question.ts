import { and, eq, sql } from 'drizzle-orm'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'
import { db } from '../../db/connection.ts'
import { schema } from '../../db/schema/index.ts'
import { generateAnswer, generateEmbeddings } from '../../services/gemini.ts'

export const createQuestionRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    '/rooms/:roomId/questions',
    {
      schema: {
        params: z.object({
          roomId: z.string(),
        }),
        body: z.object({
          question: z.string().min(1),
          context: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { roomId } = request.params
      const { question, context } = request.body

      let answer: string | null = null

      try {
        if (context) {
          // If context is provided, use it directly
          answer = await generateAnswer(question, [context])
          console.log('Generated answer from direct context:', answer)
        } else {
          // If no context, try to generate answer with empty context first
          answer = await generateAnswer(question, [])
          console.log('Generated answer from direct question:', answer)
        }
      } catch (error) {
        console.error('Error generating answer:', error)
        answer = null
      }

      // Only do vector search if no context and answer is null
      if (!context && answer === null) {
        const embeddings = await generateEmbeddings(question)
        const embeddingsAsString = `[${embeddings.join(',')}]`

        const countChunks = await db
          .select({ count: sql<number>`count(*)` })
          .from(schema.audioChunks)
          .where(eq(schema.audioChunks.roomId, roomId))

        console.log('Total chunks in room:', countChunks[0].count)

        const allChunks = await db
          .select({
            id: schema.audioChunks.id,
            transcription: schema.audioChunks.transcription,
          })
          .from(schema.audioChunks)
          .where(eq(schema.audioChunks.roomId, roomId))

        console.log('Chunks in DB for room:', allChunks.length)
        console.log('Transcriptions:', allChunks.map(c => c.transcription))

        const chunks = await db
          .select({
            id: schema.audioChunks.id,
            transcription: schema.audioChunks.transcription,
            similarity: sql<number>`1 - (${schema.audioChunks.embeddings} <=> ${embeddingsAsString}::vector)`,
          })
          .from(schema.audioChunks)
          .where(
            and(
              eq(schema.audioChunks.roomId, roomId),
              sql`1 - (${schema.audioChunks.embeddings} <=> ${embeddingsAsString}::vector) > 0.3`
            )
          )
          .orderBy(
            sql`${schema.audioChunks.embeddings} <=> ${embeddingsAsString}::vector`
          )
          .limit(3)

        console.log('Found chunks:', chunks.length)
        console.log('Chunks:', chunks.map(c => c.transcription))

        if (chunks.length > 0) {
          const transcriptions = chunks.map((chunk) => chunk.transcription)
          console.log('Transcriptions:', transcriptions)

          try {
            answer = await generateAnswer(question, transcriptions)
            console.log('Generated answer:', answer)
          } catch (error) {
            console.error('Error generating answer:', error)
            answer = null
          }
        } else {
          console.log('No matching chunks found for the question embeddings')
        }
      }

      const result = await db
        .insert(schema.questions)
        .values({ roomId, question, answer })
        .returning()

      const insertedQuestion = result[0]

      if (!insertedQuestion) {
        throw new Error('Failed to create new room.')
      }

      return reply.status(201).send({
        questionId: insertedQuestion.id,
        answer,
      })
    }
  )
}