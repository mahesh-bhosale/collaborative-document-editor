import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { DashboardClient } from '@/components/dashboard-client'
import Link from 'next/link'

export const metadata = {
  title: 'Dashboard - DocFlow',
  description: 'Manage your collaborative documents',
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-sm group-hover:shadow-violet-500/25 transition-shadow">
              <span className="text-white text-xs font-bold">D</span>
            </div>
            <span className="font-semibold text-foreground">DocFlow</span>
          </Link>

          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-foreground leading-tight">
                {session.user.name || 'User'}
              </span>
              <span className="text-xs text-muted-foreground">{session.user.email}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
              {(session.user.name || session.user.email || 'U')[0].toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Hero / page title strip */}
      <div className="border-b border-border/40 bg-gradient-to-r from-violet-500/5 via-indigo-500/5 to-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Your Workspace
          </h1>
          <p className="text-muted-foreground mt-1.5">
            Create, edit, and collaborate on documents
          </p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardClient user={session.user} />
      </main>
    </div>
  )
}
