'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { signInAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect') || '/dashboard';

  const [state, formAction, isPending] = React.useActionState(signInAction, null);
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <Card className="shadow-lg border-zinc-200">
      <CardHeader className="space-y-1 text-center pb-6">
        <CardTitle className="text-2xl font-bold tracking-tight text-zinc-900">
          Welcome back
        </CardTitle>
        <CardDescription className="text-zinc-500">
          Sign in to your business dashboard to manage appointments and reminders
        </CardDescription>
      </CardHeader>

      <form action={formAction}>
        <CardContent className="space-y-4">
          {state?.error && (
            <Alert variant="error" title="Unable to sign in">
              {state.error}
            </Alert>
          )}

          <input type="hidden" name="redirect" value={redirectParam} />

          <Input
            id="login-email"
            name="email"
            type="email"
            label="Email address"
            placeholder="you@yourbusiness.com"
            autoComplete="email"
            required
            prefixElement={<Mail className="h-4 w-4" />}
          />

          <div className="space-y-1">
            <Input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              prefixElement={<Lock className="h-4 w-4" />}
              suffixElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="cursor-pointer hover:text-zinc-800 focus:outline-none"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
            />
          </div>

          <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-3 text-xs text-zinc-600">
            <p className="font-semibold text-zinc-700 mb-0.5">Quick Testing Tip</p>
            You can sign in with any test email or password in development mode, or create a new account.
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-2">
          <Button
            id="login-submit-button"
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isPending}
          >
            Sign In
            {!isPending && <ArrowRight className="h-4 w-4 ml-1" />}
          </Button>

          <p className="text-center text-sm text-zinc-600">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
            >
              Create business account
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
