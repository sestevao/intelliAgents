import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'
import { db } from '../../db/connection.ts'
import { schema } from '../../db/schema/index.ts'
import { generateEmbeddings, transcribeAudio } from '../../services/gemini.ts'

export const uploadAudioRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    '/rooms/:roomId/audio',
    {
      schema: {
        params: z.object({
          roomId: z.string(),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { roomId } = request.params
        const audio = await request.file()

        if (!audio) {
          return reply.status(400).send({ error: 'Audio file is required.' })
        }

        console.log('Processing audio file:', {
          filename: audio.filename,
          mimetype: audio.mimetype,
          size: audio.file.bytesRead
        })

        const audioBuffer = await audio.toBuffer()
        const audioAsBase64 = audioBuffer.toString('base64')

        console.log('Transcribing audio...')
        const transcription = await transcribeAudio(audioAsBase64, audio.mimetype)
        console.log('Transcription completed:', transcription)

        console.log('Generating embeddings...')
        const embeddings = await generateEmbeddings(transcription)
        console.log('Embeddings generated successfully')

        const result = await db
          .insert(schema.audioChunks)
          .values({
            roomId,
            transcription,
            embeddings,
          })
          .returning()

        const chunk = result[0]

        if (!chunk) {
          return reply.status(500).send({ error: 'Error saving audio chunk' })
        }

        console.log('Audio chunk saved successfully:', chunk.id)
        return reply.status(201).send({ 
          chunkId: chunk.id,
          transcription: chunk.transcription
        })
      } catch (error) {
        console.error('Error processing audio:', error)
        return reply.status(500).send({ 
          error: 'Failed to process audio',
          details: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
  )
}