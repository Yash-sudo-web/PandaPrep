import { NextRequest } from 'next/server'

const BACKEND_URL = process.env.NODE_ENV === 'production' 
  ? process.env.NEXT_PUBLIC_PROD_BASE_URL 
  : 'http://localhost:8000'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const documentId = searchParams.get('documentId')
  const query = searchParams.get('query')
  const token = searchParams.get('token')

  if (!token) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Unauthorized - Missing auth token' 
      }),
      { 
        status: 401,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      }
    )
  }

  if (!documentId || !query) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Missing required parameters' 
      }),
      { 
        status: 400,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      }
    )
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/chat/stream-chat-with-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        documentId,
        query,
      }),
    })

    if (!response.ok) {
      // Try to get error details
      const contentType = response.headers.get('content-type')
      let errorMessage = `Request failed with status ${response.status}`
      
      try {
        if (contentType?.includes('application/json')) {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } else {
          const errorText = await response.text()
          console.error('Non-JSON error response:', errorText)
        }
      } catch (e) {
        console.error('Error parsing error response:', e)
      }

      return new Response(
        `data: ${JSON.stringify({ 
          success: false, 
          error: errorMessage 
        })}\n\n`,
        { 
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          }
        }
      )
    }

    // Check if response is SSE
    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('text/event-stream')) {
      console.error('Unexpected response type:', contentType)
      return new Response(
        `data: ${JSON.stringify({ 
          success: false, 
          error: 'Invalid response format from server' 
        })}\n\n`,
        { 
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          }
        }
      )
    }

    // Create a new TransformStream for processing the response
    const { readable, writable } = new TransformStream()
    
    // Process the response stream
    response.body?.pipeTo(writable)

    // Return the readable stream with proper headers
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error in stream route:', error)
    return new Response(
      `data: ${JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })}\n\n`,
      { 
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      }
    )
  }
} 