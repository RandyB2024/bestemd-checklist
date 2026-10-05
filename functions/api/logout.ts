export const onRequestPost = async (
  context: {
    request: Request
  }
) => {
  const secure =
    new URL(context.request.url).protocol === 'https:'

  const cookie = [
    'bestemd_session=',
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    'Max-Age=0',
    secure ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ')

  return new Response(
    JSON.stringify({
      success: true,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie,
        'Cache-Control': 'no-store',
      },
    }
  )
}
