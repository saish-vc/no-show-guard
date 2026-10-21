'use client';

import * as React from 'react';
import Link from 'next/link';
import { signUpAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';

export default function SignupPage() {
  const [state, formAction, isPending] = React.useActionState(signUpAction, null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [passwordValue, setPasswordValue] = React.useState('');

  const isPasswordValid = passwordValue.length >= 6;

  return (
    <Card className="shadow-lg border-zinc-200">
      <CardHeader className="space-y-1 text-center pb-6">
        <div className="mx-auto h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-zinc-900">
          Create business account
        </CardTitle>
        <CardDescription className="text-zinc-500">
          Get your public booking link and automated 24h & 2h appointment reminders
        </CardDescription>
      </CardHeader>

      <form action={formAction}>
        <CardContent className="space-y-4">
          {state?.error && (
            <Alert variant="error" title="Signup failed">
              {state.error}
            </Alert>
          )}

          <Input
            id="signup-email"
            name="email"
            type="email"
            label="Work email"
            placeholder="owner@yourstudio.com"
            autoComplete="email"
            required
            prefixElement={<Mail className="h-4 w-4" />}
          />

          <div className="space-y-1">
            <Input
              id="signup-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              label="Choose password"
              placeholder="At least 6 characters"
              autoComplete="new-password"
              required
              value={passwordValue}
              onChange={(e) => setPasswordValue(e.target.value)}
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
            {passwordValue && (
              <p
                className={`text-xs ${
                  isPasswordValid ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {isPasswordValid
                  ? '✓ Password length requirement met'
                  : '• Must be at least 6 characters'}
              </p>
            )}
          </div>

          <Input
            id="signup-confirm-password"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            label="Confirm password"
            placeholder="Re-enter your password"
            autoComplete="new-password"
            required
            prefixElement={<Lock className="h-4 w-4" />}
          />
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-2">
          <Button
            id="signup-submit-button"
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isPending}
          >
            Continue to Business Setup
            {!isPending && <ArrowRight className="h-4 w-4 ml-1" />}
          </Button>

          <p className="text-center text-sm text-zinc-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-emerald-600 hover:text-emerald-500 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
