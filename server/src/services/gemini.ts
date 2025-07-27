import { GoogleGenAI } from '@google/genai'
import { env } from '../env.ts'

const gemini = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
})

// const model = 'gemini-pro'
const model = 'models/gemini-1.5-pro'

export async function transcribeAudio(audioAsBase64: string, mimeType: string) {
  const response = await gemini.models.generateContent({
    model,
    contents: [
      {
        text: 'Transcribe the audio into Brazilian Portuguese. Be accurate and natural in your transcription. Maintain proper punctuation and divide the text into paragraphs where appropriate.',
      },
      {
        inlineData: {
          mimeType,
          data: audioAsBase64,
        },
      },
    ],
  })

  if (!response.text) {
    throw new Error('Unable to convert audio')
  }

  return response.text
}

export async function generateEmbeddings(text: string) {
  const response = await gemini.models.embedContent({
    model: 'embedding-001',
    contents: [{ text }],
    config: {
      taskType: 'RETRIEVAL_DOCUMENT',
    },
  })

  if (!response.embeddings?.[0].values) {
    throw new Error('Unable to generate embeddings.')
  }

  return response.embeddings[0].values
}

export async function generateAnswer(
  question: string,
  transcriptions: string[]
) {
  const context = transcriptions.join('\n\n')
  console.log('Context:', context)

  let prompt: string

  if (transcriptions.length === 0 || context.trim() === '') {
    // If no context is provided, use general knowledge
    prompt = `
      You are an educational assistant. Answer the following question clearly and precisely in Brazilian Portuguese.
      Use your general knowledge to provide a helpful and informative response.

      STUDENT QUESTION:
      ${question}

      IMPORTANT INSTRUCTIONS:
      1. Provide a clear, direct, and helpful answer.
      2. Use Brazilian Portuguese.
      3. Keep your response educational and professional.
      4. Structure your response clearly.
      5. If the question is unclear or too broad, ask for clarification.
    `.trim()
  } else {
    // If context is provided, use it for the answer
    prompt = `
      You are an educational assistant specializing in analyzing lesson content and answering questions.
      Using the text provided below as context, answer the question clearly and precisely in Brazilian Portuguese.

      CLASS CONTEXT:
      ${context}

      STUDENT QUESTION:
      ${question}

      IMPORTANT INSTRUCTIONS:
      1. Carefully analyze the context and the question.
      2. Use EXCLUSIVELY information contained in the context provided.
      3. If the information is not explicit in the context, respond: "Based on the available lecture content, there is insufficient information to answer this question."
      4. When citing information from the context, always use the term "lecture content."
      5. Structure your response in the following format:

        ANSWER:
        [Your main answer here, objective and direct]

        RELEVANT EXCERPTS:
        [If applicable, cite specific excerpts from the lesson content that support your answer]

        ADDITIONAL NOTES:
        [If necessary, include notes about important limitations or clarifications]

      6. Keep your answers:
        - Objective and direct
        - In clear, professional language
        - Well-structured and easy to understand
        - With relevant context quotes when appropriate

      7. Avoid:
        - Adding extraneous information to the context
        - Making assumptions beyond the provided content
        - Using complex or unnecessary technical language
    `.trim()
  }

  console.log('Prompt sent to Gemini:', prompt)

  // Maximum retries for API calls
  const MAX_RETRIES = 3;
  let retryCount = 0;
  let lastError = null;

  while (retryCount < MAX_RETRIES) {
    try {
      const response = await gemini.models.generateContent({
        model,
        contents: [{ text: prompt }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
          stopSequences: ["ADDITIONAL OBSERVATIONS:"], // Ensure structured response
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
        ],
      })

      console.log('Gemini response:', response)
      if (!response.text) {
        throw new Error('Gemini\'s response is empty')
      }

      return response.text
      .replace(/\n{3,}/g, '\n\n') // Remove excess newlines
      .trim()

    } catch (error) {
      lastError = error
      retryCount++

      // Wait before retrying (exponential backoff)
      if (retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
        console.error(`Attempt ${retryCount} failed. Retrying...`)
      }
    }
  }

  // If all retries failed, throw the last error
  throw new Error(`Failed to generate response from Gemini after ${MAX_RETRIES} attempts. Last error: ${lastError?.message || 'Unknown error'}`)
}