import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { LayoutDashboard, Briefcase, LogOut } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies()
  const auth = cookieStore.get('admin_auth')

  // Allow login page without auth
  // Note: full middleware auth added via middleware.ts

  return (
    <div className="min-h-screen bg-cream">
      {/* Top nav */}
      <nav className="bg-sepia text-cream px-5 py-3 flex items-center justify-between sticky top-0 z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <Image src="/logo-white.png" alt="ACA Build" width={80} height={36} className="object-contain" />
          <span className="text-tan text-sm font-semibold hidden sm:block">Site Register</span>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/admin" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-tan hover:text-cream hover:bg-white/10 transition-all">
            <LayoutDashboard size={15} /> Dashboard
          </Link>
          <Link href="/admin/jobs" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-tan hover:text-cream hover:bg-white/10 transition-all">
            <Briefcase size={15} /> Jobs
          </Link>
          <Link href="/api/admin/logout" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-300 hover:text-red-200 hover:bg-white/10 transition-all">
            <LogOut size={15} />
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
