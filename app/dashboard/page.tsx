import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { DashboardClient } from '@/components/dashboard-client'

export const metadata = {
  title: 'Dashboard - Document Editor',
  description: 'Manage your collaborative documents',
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session?.user) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-foreground">Documents</h1>
          <p className="mt-2 text-muted-foreground">
            Welcome, {session.user.name || session.user.email}
          </p>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <DashboardClient user={session.user} />
      </main>
    </div>
  )
}
