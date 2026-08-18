import React, { useEffect, useId, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import RehrigLogo from '../components/RehrigLogo.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { useAuth } from '../state/AuthContext.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useDemoUsers } from '../hooks/useDemoUsers.js';
import { getErrorMessage } from '../lib/errors.js';

const PERSONA_TABS = [
  { key: 'rehrig', label: 'Rehrig' },
  { key: 'sp', label: 'Provider' },
  { key: 'customer', label: 'Customer' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateFields(username, password) {
  const next = {};
  const trimmed = username.trim();
  if (!trimmed) next.username = 'Enter your username.';
  else if (!EMAIL_RE.test(trimmed)) next.username = 'Use your work email as your username.';
  if (!password) next.password = 'Enter your password.';
  return next;
}

export default function Login() {
  const { login, rememberDefault } = useAuth();
  const { state, setTheme } = useStore();
  const usernameId = useId();
  const passwordId = useId();
  const formErrorId = useId();
  const usernameErrorId = useId();
  const passwordErrorId = useId();
  const formDomId = 'login-form';

  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const formErrorRef = useRef(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoTab, setDemoTab] = useState('rehrig');
  const demoPanelId = useId();
  const tablistId = useId();

  const demoUsersQuery = useDemoUsers();
  const allDemoUsers = demoUsersQuery.data || [];
  const demoUsers = allDemoUsers.filter((user) => user.persona === demoTab);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  useEffect(() => {
    if (formError) formErrorRef.current?.focus();
  }, [formError]);

  const clearErrors = () => {
    setFormError('');
    setFieldErrors({});
  };

  const finishLogin = async (loginEmail, loginPassword) => {
    setFormError('');
    setBusy(true);
    try {
      await login(loginEmail, loginPassword, { remember: rememberDefault });
    } catch (error) {
      setFormError(getErrorMessage(error, 'Unable to sign in. Check your username and password.'));
      passwordRef.current?.focus();
    } finally {
      setBusy(false);
    }
  };

  const signIn = async (event) => {
    event.preventDefault();
    const next = validateFields(username, password);
    setFieldErrors(next);
    setFormError('');

    if (next.username) {
      usernameRef.current?.focus();
      return;
    }
    if (next.password) {
      passwordRef.current?.focus();
      return;
    }

    await finishLogin(username.trim().toLowerCase(), password);
  };

  const useDemoUser = (user) => {
    if (!user.active) {
      setFormError('This account is inactive and cannot sign in.');
      return;
    }
    setUsername(user.email);
    setPassword('vision');
    setFieldErrors({});
    finishLogin(user.email, 'vision');
  };

  const startSso = () => {
    setFieldErrors({});
    setFormError(
      'Single sign-on must be enabled for your organization. Contact your administrator to request access.'
    );
  };

  return (
    <main className="box-border flex min-h-screen w-full items-center justify-center overflow-y-auto bg-canvas p-4 sm:p-6">
      <a href={`#${formDomId}`} className="skip-link">
        Skip to sign in
      </a>

      <div className="grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-2xl border border-line bg-surface shadow-float lg:h-[min(50rem,calc(100vh-2rem))] lg:max-h-[calc(100vh-2rem)] lg:grid-cols-2">
        <section
          className="relative flex min-h-[16rem] min-w-0 flex-col overflow-hidden px-6 py-8 sm:px-10 lg:min-h-0 lg:px-12 lg:py-10"
          style={{
            background:
              'linear-gradient(180deg, #eefaff 0%, #e8f6fd 42%, #b8c9e5 72%, #194a9d 100%)',
          }}
          aria-label="Rehrig Pacific Company"
        >
          <div className="mb-6 lg:absolute lg:left-12 lg:top-10 lg:mb-0">
            <span className="font-display text-[1.35rem] font-semibold tracking-tight text-[#133f73]">
              vision pulse
            </span>
          </div>
          <div className="flex flex-1 items-center justify-center py-6 lg:pb-28">
            <RehrigLogo />
          </div>
          <div className="mt-4 text-center text-white lg:absolute lg:inset-x-12 lg:bottom-10 lg:mt-0">
            <p className="font-display text-lg font-semibold sm:text-xl">
              Secure Partner Gateway
            </p>
            <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-white/75 sm:text-sm">
              Guided companion flow designed to scale your operations safely and beautifully.
            </p>
          </div>
        </section>

        <section
          className="min-h-0 min-w-0 overflow-y-auto border-t border-line bg-surface scroll-thin lg:border-l lg:border-t-0"
          aria-labelledby="signin-heading"
        >
        <div className="flex min-h-full items-center justify-center px-5 py-8 sm:px-10 lg:px-12 lg:py-10">
        <div className="w-full max-w-[25rem] animate-fade-up">
          <div className="mb-9 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-brand">
                Welcome back
              </p>
              <h2 id="signin-heading" className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                Let&apos;s get started.
              </h2>
            </div>
            <ThemeToggle compact value={state.theme} onChange={setTheme} />
          </div>

          <form
            id={formDomId}
            onSubmit={signIn}
            className="space-y-5"
            noValidate
            aria-busy={busy}
          >
            <div>
              <label htmlFor={usernameId} className="mb-2 block text-sm font-medium text-ink-soft">
                Registered Email
              </label>
              <div className="relative">
                <Icon
                  name="mail"
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
                  aria-hidden="true"
                />
                <input
                  ref={usernameRef}
                  id={usernameId}
                  type="email"
                  name="username"
                  inputMode="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    if (fieldErrors.username || formError) clearErrors();
                  }}
                  className={`login-field login-field-icon ${
                    fieldErrors.username ? 'login-field-error' : ''
                  }`}
                  placeholder="Enter your registered email"
                  required
                  disabled={busy}
                  aria-invalid={!!fieldErrors.username}
                  aria-describedby={fieldErrors.username ? usernameErrorId : undefined}
                />
              </div>
              {fieldErrors.username && (
                <p id={usernameErrorId} className="mt-1.5 text-xs text-danger" role="alert">
                  {fieldErrors.username}
                </p>
              )}
            </div>

            <div>
              <label htmlFor={passwordId} className="mb-2 block text-sm font-medium text-ink-soft">
                Password
              </label>
              <div className="relative">
                <Icon
                  name="lock"
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
                  aria-hidden="true"
                />
                <input
                  ref={passwordRef}
                  id={passwordId}
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (fieldErrors.password || formError) clearErrors();
                  }}
                  className={`login-field login-field-icon login-field-password ${
                    fieldErrors.password ? 'login-field-error' : ''
                  }`}
                  placeholder="Enter your secure password"
                  required
                  disabled={busy}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? passwordErrorId : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-ink-faint interactive hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  disabled={busy}
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} size={16} aria-hidden="true" />
                </button>
              </div>
              {fieldErrors.password && (
                <p id={passwordErrorId} className="mt-1.5 text-xs text-danger" role="alert">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div
              ref={formErrorRef}
              id={formErrorId}
              tabIndex={formError ? -1 : undefined}
              role="alert"
              aria-live="assertive"
              className={
                formError
                  ? 'flex gap-2 rounded-control border border-danger/25 bg-danger-soft px-3 py-2.5 text-sm text-danger outline-none'
                  : 'sr-only'
              }
            >
              {formError && (
                <>
                  <Icon name="alert" size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span>{formError}</span>
                </>
              )}
            </div>

            <button
              type="submit"
              disabled={busy}
              aria-busy={busy}
              className="btn-brand min-h-12 w-full"
            >
              {busy ? (
                <>
                  <span
                    className="loading-spinner border-white/30 border-t-white"
                    aria-hidden="true"
                  />
                  Signing in…
                </>
              ) : (
                <>
                  Login
                </>
              )}
            </button>
          </form>

          <div className="my-7 flex items-center gap-3" aria-hidden="true">
            <div className="h-px flex-1 bg-line" />
            <span className="text-xs font-medium uppercase tracking-wide text-ink-faint">or</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <button
            type="button"
            onClick={startSso}
            disabled={busy}
            className="btn-secondary min-h-12 w-full"
          >
            Continue with Rehrig SSO
          </button>

          <div className="mt-8 border-t border-line/80 pt-4">
            <button
              type="button"
              onClick={() => setDemoOpen((open) => !open)}
              aria-expanded={demoOpen}
              aria-controls={demoPanelId}
              className="group flex w-full items-center justify-between gap-3 text-left text-[11px] text-ink-faint interactive hover:text-ink-muted"
            >
              <span>Sample roles</span>
              <Icon
                name={demoOpen ? 'chevronDown' : 'chevronRight'}
                size={12}
                className="opacity-60"
                aria-hidden="true"
              />
            </button>

            {demoOpen && (
              <div
                id={demoPanelId}
                className="mt-3 animate-fade-in"
                role="region"
                aria-label="Sample roles"
              >
                <p className="mb-3 text-[11px] leading-relaxed text-ink-faint">
                  Sign in as a sample role · password{' '}
                  <span className="mono font-medium text-ink-muted">vision</span>
                </p>

                {demoUsersQuery.isLoading && (
                  <p className="py-2 text-xs text-ink-faint" role="status">
                    Loading accounts…
                  </p>
                )}
                {demoUsersQuery.isError && (
                  <p className="py-2 text-xs text-danger" role="alert">
                    {getErrorMessage(demoUsersQuery.error, 'Could not load sample accounts.')}
                  </p>
                )}

                <div
                  id={tablistId}
                  className="mb-2 flex gap-1"
                  role="tablist"
                  aria-label="Sample role"
                >
                  {PERSONA_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      role="tab"
                      aria-selected={demoTab === tab.key}
                      onClick={() => setDemoTab(tab.key)}
                      className={`rounded-control px-2.5 py-1 text-[11px] font-medium interactive ${
                        demoTab === tab.key
                          ? 'bg-elevated text-ink-soft'
                          : 'text-ink-faint hover:text-ink-muted'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <ul className="max-h-40 space-y-0.5 overflow-y-auto scroll-thin" role="list">
                  {demoUsers.map((user) => (
                    <li key={user.id}>
                      <button
                        type="button"
                        disabled={!user.active || busy}
                        onClick={() => useDemoUser(user)}
                        className="flex w-full items-center justify-between gap-2 rounded-control px-2 py-1.5 text-left interactive hover:bg-elevated/70 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Sign in as ${user.name}, ${user.role}${
                          user.active ? '' : ', inactive'
                        }`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-medium text-ink-soft">
                            {user.name}
                          </span>
                          <span className="block truncate text-[10px] text-ink-faint">
                            {user.role}
                            {!user.active ? ' · Inactive' : ''}
                          </span>
                        </span>
                        <Icon name="arrowRight" size={12} className="shrink-0 text-ink-faint" />
                      </button>
                    </li>
                  ))}
                  {!demoUsers.length && !demoUsersQuery.isLoading && (
                    <li className="px-2 py-3 text-[11px] text-ink-faint">No accounts in this persona.</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
        </div>
      </section>
      </div>
    </main>
  );
}
