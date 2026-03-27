import { z, ZodSchema } from 'zod'
import { NextResponse } from 'next/server'

/**
 * Creates a standardised JSON error response with the given message and HTTP status.
 * All API errors use the shape: { error: string }
 */
export function createErrorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

/**
 * Validates URL search params against a Zod schema.
 * Returns parsed data on success, or a pre-built 400 error response on failure.
 */
export function validateQuery<T extends ZodSchema>(
  params: URLSearchParams,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; response: NextResponse } {
  const raw = Object.fromEntries(params.entries())
  const result = schema.safeParse(raw)
  if (!result.success) {
    return {
      success: false,
      response: createErrorResponse(
        result.error.issues.map(e => e.message).join(', '),
        400
      ),
    }
  }
  return { success: true, data: result.data }
}

/**
 * Validates a request body (already parsed JSON) against a Zod schema.
 * Returns parsed data on success, or a pre-built 400 error response on failure.
 */
export function validateBody<T extends ZodSchema>(
  body: unknown,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; response: NextResponse } {
  const result = schema.safeParse(body)
  if (!result.success) {
    return {
      success: false,
      response: createErrorResponse(
        result.error.issues.map(e => e.message).join(', '),
        400
      ),
    }
  }
  return { success: true, data: result.data }
}

/**
 * Wraps an async route handler with a try/catch that returns consistent error responses.
 * Catches all thrown errors and returns a 500 with the error message.
 * Never exposes stack traces to the client.
 */
export async function withErrorHandler(
  handler: () => Promise<NextResponse | Response>
): Promise<NextResponse | Response> {
  try {
    return await handler()
  } catch (err) {
    console.error('[API Error]', err)
    if (err instanceof Error) {
      const status = (err as Error & { status?: number }).status ?? 500
      return createErrorResponse(err.message, status)
    }
    return createErrorResponse('An unexpected error occurred', 500)
  }
}
