'use client';

import React from 'react';
import Link from 'next/link';
import { Train, Search, Heart, Route, Activity } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/cn';
import { useFavoritesStore } from '@/store/favorites';

export function Navbar() {
  const pathname = usePathname();
  const { favorites } = useFavoritesStore();

  const links = [
    { href: '/', label: 'Search', icon: Search, exact: true },
    { href: '/between', label: 'Routes', icon: Route, exact: false },
    { href: '/favorites', label: 'Favorites', icon: Heart, exact: false },
  ];

  return (
    <header className="sticky top-0 z-50 w-full px-4 pt-4 pb-2 bg-slate-50 dark:bg-slate-950">
      <div className="glass-panel mx-auto flex max-w-7xl items-center justify-between rounded-2xl px-6 py-3 shadow-glass">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-rail-blue to-blue-700 shadow-glow transition-transform group-hover:scale-105">
            <Activity className="absolute -right-2 top-0 h-12 w-12 text-white/20" strokeWidth={3} />
            <Train className="relative z-10 h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex items-center">
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Rail<span className="text-rail-blue">Pulse</span>
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            const isFav = href === '/favorites';

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all',
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
                {isFav && favorites.length > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                    {favorites.length > 9 ? '9+' : favorites.length}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

