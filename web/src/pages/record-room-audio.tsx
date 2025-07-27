/** biome-ignore-all lint/suspicious/noConsole: <explanation> */
import { useRef, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const isRecordingSupported =
  !!navigator.mediaDevices &&
  typeof navigator.mediaDevices.getUserMedia === 'function' &&
  typeof window.MediaRecorder === 'function'

type RoomParams = {
  roomId: string
}

export function RecordRoomAudio() {
  const params = useParams<RoomParams>()
  const [isRecording, setIsRecording] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [transcriptions, setTranscriptions] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const intervalRef = useRef<NodeJS.Timeout>(null)

  function stopRecording() {
    setIsRecording(false)

    if (recorder.current && recorder.current.state !== 'inactive') {
      recorder.current.stop()
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }

  async function uploadAudio(audio: Blob) {
    try {
      setIsUploading(true)
      setError(null)
      
      const formData = new FormData()
      formData.append('file', audio, 'audio.webm')

      console.log('Uploading audio chunk...')
      const response = await fetch(
        `http://localhost:3333/rooms/${params.roomId}/audio`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('Upload result:', result)
      
      if (result.transcription) {
        setTranscriptions(prev => [...prev, result.transcription])
      }
    } catch (error) {
      console.error('Error uploading audio:', error)
      setError(error instanceof Error ? error.message : 'Failed to upload audio')
    } finally {
      setIsUploading(false)
    }
  }

  function createRecorder(audio: MediaStream) {
    recorder.current = new MediaRecorder(audio, {
      mimeType: 'audio/webm',
      audioBitsPerSecond: 64_000,
    })

    recorder.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        uploadAudio(event.data)
      }
    }

    recorder.current.onstart = () => {
      console.log('Gravação iniciada!')
    }

    recorder.current.onstop = () => {
      console.log('Gravação encerrada/pausada')
    }

    recorder.current.start()
  }

  async function startRecording() {
    if (!isRecordingSupported) {
      setError('Your browser does not support audio recording')
      return
    }

    try {
      setError(null)
      setIsRecording(true)

      console.log('Requesting microphone access...')
      const audio = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44_100,
        },
      })

      createRecorder(audio)

      intervalRef.current = setInterval(() => {
        recorder.current?.stop()
        createRecorder(audio)
      }, 5000)
    } catch (error) {
      console.error('Error starting recording:', error)
      setError(error instanceof Error ? error.message : 'Failed to start recording')
      setIsRecording(false)
    }
  }

  if (!params.roomId) {
    return <Navigate replace to="/" />
  }

  if (!isRecordingSupported) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Recording Not Supported</CardTitle>
            <CardDescription>
              Your browser doesn't support audio recording. Please use a modern browser like Chrome, Firefox, or Safari.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Audio Recording</CardTitle>
          <CardDescription>
            Record audio to automatically transcribe and make it available for questions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {isRecording ? (
              <Button onClick={stopRecording} variant="destructive">
                Stop Recording
              </Button>
            ) : (
              <Button onClick={startRecording}>
                Start Recording
              </Button>
            )}
            
            <div className="flex items-center gap-2">
              {isRecording && (
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
              <span className="text-sm text-muted-foreground">
                {isRecording ? 'Recording...' : 'Ready to record'}
                {isUploading && ' (Processing...)'}
              </span>
            </div>
          </div>
          
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
              Error: {error}
            </div>
          )}
        </CardContent>
      </Card>
      
      {transcriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Transcriptions</CardTitle>
            <CardDescription>
              Audio chunks have been processed and are available for questions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {transcriptions.slice(-5).map((transcription, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded text-sm">
                  {transcription}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}