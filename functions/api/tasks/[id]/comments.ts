import {
  getCookie,
  verifySession,
} from '../../../_lib/session'

import {
  getSupabase,
  type ServerEnv,
} from '../../../_lib/supabase'

interface Env extends ServerEnv {
  SESSION_SECRET: string
}

export const onRequestGet = async (
  context: {
    request: Request
    env: Env
    params: {
      id: string
    }
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
      { error: 'Niet ingelogd.' },
      { status: 401 }
    )
  }

  const supabase = getSupabase(
    context.env
  )

  const { data, error } =
    await supabase
      .from('checklist_comments')
      .select('*')
      .eq('task_id', context.params.id)
      .order('created_at', {
        ascending: true,
      })

  if (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return Response.json({
    comments: data ?? [],
  })
}

export const onRequestPost = async (
  context: {
    request: Request
    env: Env
    params: {
      id: string
    }
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
      { error: 'Niet ingelogd.' },
      { status: 401 }
    )
  }

  const body =
    await context.request.json() as {
      comment?: string
    }

  const comment =
    body.comment?.trim()

  if (!comment) {
    return Response.json(
      { error: 'Notitie is leeg.' },
      { status: 400 }
    )
  }

  if (comment.length > 5000) {
    return Response.json(
      {
        error:
          'De notitie is te lang.',
      },
      { status: 400 }
    )
  }

  const supabase = getSupabase(
    context.env
  )

  const { data: task } =
    await supabase
      .from('checklist_tasks')
      .select('id,title')
      .eq('id', context.params.id)
      .single()

  if (!task) {
    return Response.json(
      {
        error:
          'Taak niet gevonden.',
      },
      { status: 404 }
    )
  }

  const { data, error } =
    await supabase
      .from('checklist_comments')
      .insert({
        task_id: context.params.id,
        author: session.actor,
        comment,
      })
      .select()
      .single()

  if (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }

  await supabase
    .from('checklist_activity')
    .insert({
      task_id: context.params.id,
      actor: session.actor,
      action: 'Notitie toegevoegd',
      details: task.title,
    })

  return Response.json({
    comment: data,
  })
}