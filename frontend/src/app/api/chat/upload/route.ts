import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NODE_ENV === 'production' 
  ? process.env.NEXT_PUBLIC_PROD_BASE_URL 
  : 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Forward the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Missing auth token' },
        { status: 401 }
      )
    }
    
    const response = await fetch(`${BACKEND_URL}/api/chat/upload-pdf`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
      },
      body: formData,
    })

    // Check if response is ok and content-type is json
    const contentType = response.headers.get('content-type')
    if (!response.ok) {
      if (contentType?.includes('application/json')) {
        const errorData = await response.json()
        return NextResponse.json(
          { success: false, message: errorData.message || 'Request failed', error: errorData },
          { status: response.status }
        )
      } else {
        const errorText = await response.text()
        console.error('Non-JSON error response:', errorText)
        return NextResponse.json(
          { success: false, message: `Request failed with status ${response.status}` },
          { status: response.status }
        )
      }
    }

    if (!contentType?.includes('application/json')) {
      const text = await response.text()
      console.error('Unexpected non-JSON response:', text)
      return NextResponse.json(
        { success: false, message: 'Invalid response format from server' },
        { status: 500 }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in upload route:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to upload PDF',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 