'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { FiBell, FiCheck, FiGlobe, FiMoon, FiSun, FiUser } from 'react-icons/fi';
import { getSupabaseClient } from '@/lib/supabase';

interface WebsitePreferences {
  theme: 'light' | 'dark';
  emailNotifications: boolean;
  detectionAlerts: boolean;
  compactTables: boolean;
}

const defaultPreferences: WebsitePreferences = {
  theme: 'light',
  emailNotifications: true,
  detectionAlerts: true,
  compactTables: false,
};

const preferenceOptions: Array<{
  key: keyof WebsitePreferences;
  title: string;
  description: string;
}> = [
  {
    key: 'emailNotifications',
    title: 'Email notifications',
    description: 'Receive updates about assigned inspections and reports.',
  },
  {
    key: 'detectionAlerts',
    title: 'New detection alerts',
    description: 'Show an alert when a new road issue is reported.',
  },
  {
    key: 'compactTables',
    title: 'Compact data tables',
    description: 'Use tighter row spacing in data-heavy views.',
  },
];

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState('');
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    getSupabaseClient().auth.getUser().then(({ data, error }) => {
      if (error) {
        console.error('Unable to load account profile:', error);
        return;
      }
      if (!isMounted) return;
      setUser(data.user);
      setFullName(typeof data.user?.user_metadata?.full_name === 'string' ? data.user.user_metadata.full_name : '');
    });

    try {
      const storedPreferences = localStorage.getItem('dpwh-website-preferences');
      if (storedPreferences) {
        setPreferences({ ...defaultPreferences, ...JSON.parse(storedPreferences) });
      }
    } catch (error) {
      console.error('Unable to load website preferences:', error);
    }
    setPreferencesReady(true);

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (preferencesReady) {
      localStorage.setItem('dpwh-website-preferences', JSON.stringify(preferences));
    }
  }, [preferences, preferencesReady]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProfile(true);
    setProfileMessage('');

    try {
      const { data, error } = await getSupabaseClient().auth.updateUser({
        data: { full_name: fullName.trim() },
      });
      if (error) throw error;
      setUser(data.user);
      setProfileMessage('Profile updated.');
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : 'Unable to update profile.');
    } finally {
      setSavingProfile(false);
    }
  }

  function updatePreference(key: keyof WebsitePreferences, event: ChangeEvent<HTMLInputElement>) {
    setPreferences((current) => ({ ...current, [key]: event.target.checked }));
  }

  function updateTheme(theme: WebsitePreferences['theme']) {
    setPreferences((current) => ({ ...current, theme }));
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }

  const role = typeof user?.app_metadata?.role === 'string' ? user.app_metadata.role : 'User';

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-10">
      <header>
        <p className="text-sm font-semibold text-primary-700">Account and workspace</p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-sm text-gray-600">Manage your profile and website preferences.</p>
      </header>

      <section className="border-b border-gray-200 pb-8" aria-labelledby="profile-heading">
        <div className="mb-6 flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 items-center justify-center bg-primary-50 text-primary-700"><FiUser aria-hidden="true" /></span>
          <div>
            <h2 id="profile-heading" className="text-lg font-semibold text-gray-900">Profile</h2>
            <p className="mt-1 text-sm text-gray-600">Your profile is associated with the account currently signed in.</p>
          </div>
        </div>

        <form onSubmit={saveProfile} className="grid max-w-2xl gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-gray-700">
            Display name
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Enter your name"
              className="mt-2 h-11 w-full border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Email address
            <input
              type="email"
              value={user?.email ?? ''}
              readOnly
              className="mt-2 h-11 w-full border border-gray-200 bg-gray-100 px-3 text-sm text-gray-600 outline-none"
            />
          </label>
          <div className="text-sm font-medium text-gray-700">
            Account role
            <div className="mt-2 flex h-11 items-center border border-gray-200 bg-gray-100 px-3 text-sm capitalize text-gray-700">{role}</div>
          </div>
          <div className="flex items-end gap-3">
            <button
              type="submit"
              disabled={savingProfile || !user}
              className="flex h-11 items-center gap-2 bg-primary-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiCheck aria-hidden="true" />
              {savingProfile ? 'Saving...' : 'Save profile'}
            </button>
            {profileMessage && <p role="status" className="pb-3 text-sm text-gray-600">{profileMessage}</p>}
          </div>
        </form>
      </section>

      <section aria-labelledby="website-heading">
        <div className="mb-5 flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 items-center justify-center bg-primary-50 text-primary-700"><FiGlobe aria-hidden="true" /></span>
          <div>
            <h2 id="website-heading" className="text-lg font-semibold text-gray-900">Website preferences</h2>
            <p className="mt-1 text-sm text-gray-600">Preferences are saved in this browser.</p>
          </div>
        </div>

        <div className="mb-7 max-w-2xl border-b border-gray-200 pb-6">
          <h3 className="text-sm font-semibold text-gray-900">Appearance</h3>
          <p className="mt-1 text-sm text-gray-600">Choose how the website looks on this browser.</p>
          <div className="mt-4 inline-flex border border-gray-300 bg-white p-1" role="group" aria-label="Color theme">
            <button
              type="button"
              onClick={() => updateTheme('light')}
              aria-pressed={preferences.theme === 'light'}
              className={`flex h-10 items-center gap-2 px-4 text-sm font-medium transition-colors ${preferences.theme === 'light' ? 'bg-primary-700 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <FiSun aria-hidden="true" />
              Light
            </button>
            <button
              type="button"
              onClick={() => updateTheme('dark')}
              aria-pressed={preferences.theme === 'dark'}
              className={`flex h-10 items-center gap-2 px-4 text-sm font-medium transition-colors ${preferences.theme === 'dark' ? 'bg-primary-700 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <FiMoon aria-hidden="true" />
              Dark
            </button>
          </div>
        </div>

        <div className="max-w-2xl divide-y divide-gray-200 border-y border-gray-200">
          {preferenceOptions.map(({ key, title, description }, index) => (
            <label key={key} className="flex cursor-pointer items-center justify-between gap-5 py-4">
              <span className="flex items-start gap-3">
                {index === 0 ? <FiBell aria-hidden="true" className="mt-0.5 text-gray-500" /> : <span className="mt-0.5 h-4 w-4" aria-hidden="true" />}
                <span>
                  <span className="block text-sm font-medium text-gray-900">{title}</span>
                  <span className="mt-1 block text-sm text-gray-600">{description}</span>
                </span>
              </span>
              <input
                type="checkbox"
                checked={preferences[key]}
                onChange={(event) => updatePreference(key, event)}
                className="h-4 w-4 shrink-0 accent-primary-700"
              />
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}