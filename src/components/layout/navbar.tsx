'use client'

import Link from 'next/link'
import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { User } from '@supabase/supabase-js'
import { Menu, X, Trophy, Calendar, TreeDeciduous, LogOut, User as UserIcon } from 'lucide-react'
import { useState } from 'react'

interface NavbarProps {
  user: User | null | undefined
}

export function Navbar({ user }: NavbarProps) {
  const { signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { href: '/matches', label: 'Mecze', icon: Calendar },
    { href: '/ko-tree', label: 'Drzewko', icon: TreeDeciduous },
    { href: '/ranking', label: 'Ranking', icon: Trophy },
  ]

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-green-600">
            ⚽ Liga Typerow
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* User Actions */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600">
                  {user.email}
                </span>
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Wyloguj
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button>
                  <UserIcon className="w-4 h-4 mr-2" />
                  Zaloguj się
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}
              <div className="border-t pt-4">
                {user ? (
                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-gray-600">{user.email}</span>
                    <Button variant="outline" size="sm" onClick={signOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Wyloguj
                    </Button>
                  </div>
                ) : (
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full">
                      <UserIcon className="w-4 h-4 mr-2" />
                      Zaloguj się
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
