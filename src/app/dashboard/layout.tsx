import Link from 'next/link';
import { ReactNode } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-6 md:gap-10">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="font-bold">License管理系统</span>
            </Link>
            <nav className="hidden gap-6 md:flex">
              <Link
                href="/dashboard/apply"
                className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                申请License
              </Link>
              <Link
                href="/dashboard/status"
                className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                查看状态
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <span className="text-xs">用户</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-6">{children}</div>
      </main>
    </div>
  );
}