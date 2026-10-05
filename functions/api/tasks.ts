import {
  getCookie,
  verifySession,
} from '../_lib/session'

import {
  getSupabase,
  type ServerEnv,
} from '../_lib/supabase'

interface Env extends ServerEnv {
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
      { error: 'Niet ingelogd.' },
      { status: 401 }
    )
  }

  const supabase =
    getSupabase(context.env)

  const { data, error } =
    await supabase
      .from('checklist_tasks')
      .select('*')
      .order('category')
      .order('sort_order')
      .order('created_at')

  if (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return Response.json(
    {
      tasks: data ?? [],
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )
}

export const onRequestPost = async (
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
      { error: 'Niet ingelogd.' },
      { status: 401 }
    )
  }

  const body = await context.request.json() as {
    title?: string
    category?: string
    description?: string
    status?: string
    assigned_to?: string
    priority?: string
    deadline?: string | null
  }

  if (!body.title?.trim()) {
    return Response.json(
      { error: 'Titel ontbreekt.' },
      { status: 400 }
    )
  }

  const supabase =
    getSupabase(context.env)

  const { data, error } =
    await supabase
      .from('checklist_tasks')
      .insert({
        title: body.title.trim(),
        category:
          body.category?.trim() ||
          'Algemeen',
        description:
          body.description?.trim() ||
          null,
        status:
          body.status || 'Open',
        assigned_to:
          body.assigned_to || 'Samen',
        priority:
          body.priority || 'Normaal',
        deadline:
          body.deadline || null,
        created_by: session.actor,
        updated_by: session.actor,
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
      task_id: data.id,
      actor: session.actor,
      action: 'Taak toegevoegd',
      details: data.title,
    })

  return Response.json({
    task: data,
  })
}
