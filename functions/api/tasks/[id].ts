import {
  getCookie,
  verifySession,
} from '../../_lib/session'

import {
  getSupabase,
  type ServerEnv,
} from '../../_lib/supabase'

interface Env extends ServerEnv {
  SESSION_SECRET: string
}

export const onRequestPatch = async (
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

  const body = await context.request.json()

  const allowedFields = [
    'title',
    'category',
    'description',
    'status',
    'assigned_to',
    'priority',
    'deadline',
    'sort_order',
  ]

  const update: Record<string, unknown> = {
    updated_by: session.actor,
  }

  for (const field of allowedFields) {
    if (field in body) {
      update[field] = body[field]
    }
  }

  const supabase =
    getSupabase(context.env)

  const { data, error } =
    await supabase
      .from('checklist_tasks')
      .update(update)
      .eq('id', context.params.id)
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
      action: 'Taak gewijzigd',
      details: data.title,
    })

  return Response.json({
    task: data,
  })
}

export const onRequestDelete = async (
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

  const supabase =
    getSupabase(context.env)

  const { data: task } =
    await supabase
      .from('checklist_tasks')
      .select('title')
      .eq('id', context.params.id)
      .single()

  const { error } =
    await supabase
      .from('checklist_tasks')
      .delete()
      .eq('id', context.params.id)

  if (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }

  await supabase
    .from('checklist_activity')
    .insert({
      actor: session.actor,
      action: 'Taak verwijderd',
      details: task?.title ?? '',
    })

  return Response.json({
    success: true,
  })
}
