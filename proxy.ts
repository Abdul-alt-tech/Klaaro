import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Proxy file replaces the old `middleware.ts` convention. It protects routes
// and ensures Supabase `getUser` calls time out gracefully instead of
// hanging the request pipeline.
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Try to fetch the user but fail fast after 3s so the middleware doesn't hang
  // on slow Supabase responses. If the call times out or errors, treat as not
  // authenticated and let the redirect logic handle it.
  let user = null
  try {
    const getUserPromise = supabase.auth.getUser()
    const res = await Promise.race([
      getUserPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('supabase-getUser-timeout')), 3000)
      ),
    ])
    // `res` should be { data: { user } } when successful
    // Guard defensively in case of unexpected shape
    // @ts-ignore
    user = res?.data?.user ?? null
  } catch (err) {
    user = null
  }

  // If not logged in and trying to access a protected page, redirect to login
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/signup')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
