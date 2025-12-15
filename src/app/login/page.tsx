'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Chrome, Facebook } from 'lucide-react'

export default function LoginPage() {
  const { signInWithGoogle, signInWithFacebook, loading } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Liga Typerow ⚽</CardTitle>
          <CardDescription>
            Zaloguj się, aby typować wyniki meczów
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full h-12 text-base"
            onClick={signInWithGoogle}
            disabled={loading}
          >
            <Chrome className="mr-2 h-5 w-5" />
            Kontynuuj z Google
          </Button>
          
          <Button
            variant="outline"
            className="w-full h-12 text-base bg-[#1877F2] text-white hover:bg-[#166FE5] hover:text-white"
            onClick={signInWithFacebook}
            disabled={loading}
          >
            <Facebook className="mr-2 h-5 w-5" />
            Kontynuuj z Facebook
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-6">
            Logując się, akceptujesz regulamin i politykę prywatności.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
