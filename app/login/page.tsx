'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FiEye, FiEyeOff, FiLock, FiMail } from 'react-icons/fi';
import { getSupabaseClient } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = getSupabaseClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      router.replace('/');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-gray-50 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="flex min-h-screen flex-col justify-between px-7 py-8 sm:px-12 lg:px-20 lg:py-12">
        <a href="/" className="flex w-fit items-center gap-3" aria-label="DPWH Road Watch home">
          <Image src="/images/logo.png" alt="DPWH logo" width={96} height={96} priority unoptimized className="h-24 w-24 object-contain" />
          <span>
            <span className="block text-sm font-bold text-primary-900">DPWH Road Watch</span>
            <span className="block text-xs text-gray-500">Road condition monitoring</span>
          </span>
        </a>

        <div className="mx-auto w-full max-w-md py-14 lg:py-20">
          <p className="mb-3 text-xs font-bold uppercase text-primary-700">Secure workspace</p>
          <h1 className="text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">Welcome back</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">Sign in to review road inspections and manage reported pavement issues.</p>

          <form onSubmit={handleSubmit} className="mt-9 space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-800">Work email</label>
              <div className="flex h-12 items-center gap-3 border border-gray-300 bg-white px-3 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/15">
                <FiMail aria-hidden="true" className="shrink-0 text-gray-500" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@dpwh.gov.ph"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-gray-800">Password</label>
              <div className="flex h-12 items-center gap-3 border border-gray-300 bg-white px-3 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/15">
                <FiLock aria-hidden="true" className="shrink-0 text-gray-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  className="flex h-9 w-9 shrink-0 items-center justify-center text-gray-500 hover:text-primary-700"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="border-l-2 border-secondary-500 bg-secondary-50 px-3 py-2 text-sm text-secondary-800">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center bg-primary-700 px-4 text-sm font-bold text-white transition-colors hover:bg-primary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 disabled:cursor-wait disabled:opacity-65"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-5 text-gray-500">Access is limited to authorized personnel.</p>
        </div>

        <p className="text-xs text-gray-500">Department of Public Works and Highways</p>
      </section>

      <aside className="relative hidden overflow-hidden bg-gradient-to-b from-primary-700 to-primary-900 px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
        <div aria-hidden="true" className="absolute inset-0 opacity-25 [background-image:radial-gradient(#bfdbfe_0.7px,transparent_0.7px)] [background-size:18px_18px]" />
        <div aria-hidden="true" className="absolute -right-24 top-1/4 h-[32rem] w-[32rem] rounded-full border border-primary-200/25" />
        <div aria-hidden="true" className="absolute -right-8 top-[30%] h-[24rem] w-[24rem] rounded-full border border-primary-200/30" />

        <div className="relative flex items-center gap-2 text-xs font-semibold uppercase text-primary-100">
          <span className="h-2 w-2 rounded-full bg-secondary-400" />
          Field operations portal
        </div>

        <div className="relative max-w-lg py-16">
          <p className="text-sm font-semibold text-red-200">Safer roads start with better visibility.</p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.15] xl:text-5xl">Every report helps build a clearer picture.</h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-blue-100">Bring inspections, crack reports, and response activity together in one place.</p>

          <div className="mt-12 flex items-center gap-4 border-t border-white/15 pt-5">
            <div className="flex -space-x-2" aria-hidden="true">
              <span className="h-8 w-8 rounded-full border-2 border-primary-800 bg-blue-200" />
              <span className="h-8 w-8 rounded-full border-2 border-primary-800 bg-red-200" />
              <span className="h-8 w-8 rounded-full border-2 border-primary-800 bg-white" />
            </div>
            <p className="text-xs text-blue-100">Supporting teams in the field and on the road.</p>
          </div>
        </div>

        <p className="relative text-xs text-blue-200">Road condition monitoring system</p>
      </aside>
    </main>
  );
}