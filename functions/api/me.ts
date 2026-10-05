import {
  getCookie,
  verifySession,
} from '../_lib/session'

interface Env {
  SESSION_SECRET: string
}

export const onRequestGet = async (
  context: {
    request: Request
    env: Env
  }
) => {
  const token = getCookie(
    context.request,
    'bestemd_session'
  )

  const session = await verifySession(
    token,
    context.env.SESSION_SECRET
  )

  if (!session) {
    return Response.json(
      {
        authenticated: false,
      },
      {
        status: 401,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
  }

  return Response.json(
    {
      authenticated: true,
      actor: session.actor,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )
}
