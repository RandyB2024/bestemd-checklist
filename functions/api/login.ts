import bcrypt from 'bcryptjs'
import { createSession } from '../_lib/session'

interface Env {
  CHECKLIST_PASSWORD_HASH: string
  SESSION_SECRET: string
}

export const onRequestPost = async (
  context: {
    request: Request
    env: Env
  }
) => {
  try {
    const body = await context.request.json() as {
      actor?: string
      password?: string
    }

    if (
      body.actor !== 'Randy' &&
      body.actor !== 'Ed'
    ) {
      return Response.json(
        { error: 'Kies Randy of Ed.' },
        { status: 400 }
      )
    }

    if (!body.password) {
      return Response.json(
        { error: 'Vul het wachtwoord in.' },
        { status: 400 }
      )
    }

    const valid = await bcrypt.compare(
      body.password,
      context.env.CHECKLIST_PASSWORD_HASH
    )

    if (!valid) {
      return Response.json(
        { error: 'Onjuist wachtwoord.' },
        {
          status: 401,
          headers: {
            'Cache-Control': 'no-store',
          },
        }
      )
    }

    const token = await createSession(
      body.actor,
      context.env.SESSION_SECRET
    )

    const secure =
      new URL(context.request.url).protocol === 'https:'

    const cookie = [
      `bestemd_session=${encodeURIComponent(token)}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Strict',
      'Max-Age=43200',
      secure ? 'Secure' : '',
    ]
      .filter(Boolean)
      .join('; ')

    return new Response(
      JSON.stringify({
        success: true,
        actor: body.actor,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': cookie,
          'Cache-Control': 'no-store',
        },
      }
    )
  } catch {
    return Response.json(
      { error: 'Ongeldig verzoek.' },
      { status: 400 }
    )
  }
}
