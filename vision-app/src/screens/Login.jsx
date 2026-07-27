import React, { useEffect, useId, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { useAuth } from '../state/AuthContext.jsx';
import { useDemoUsers } from '../hooks/useDemoUsers.js';
import { getErrorMessage } from '../lib/errors.js';
import { appModeLabel, isApiMode, isDemoMode } from '../config/appMode.js';

const PERSONA_TABS = [
  { key: 'rehrig', label: 'Rehrig' },
  { key: 'sp', label: 'Provider' },
  { key: 'customer', label: 'Customer' },
];

const OUTCOMES = [
  { n: '01', title: 'Service providers', body: 'Registry, onboarding, and account oversight' },
  { n: '02', title: 'Field operations', body: 'Dispatches, work orders, assets, and routes' },
  { n: '03', title: 'Resident updates', body: 'Notifications and portal requests' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateFields(email, password) {
  const next = {};
  const trimmed = email.trim();
  if (!trimmed) next.email = 'Enter your work email.';
  else if (!EMAIL_RE.test(trimmed)) next.email = 'Enter a valid email address.';
  if (!password) next.password = 'Enter your password.';
  return next;
}

export default function Login() {
  const { login, rememberDefault } = useAuth();
  const emailId = useId();
  const passwordId = useId();
  const rememberId = useId();
  const formErrorId = useId();
  const emailErrorId = useId();
  const passwordErrorId = useId();
  const demoPanelId = useId();
  const tablistId = useId();
  const formDomId = 'login-form';

  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const formErrorRef = useRef(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(rememberDefault);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoTab, setDemoTab] = useState('rehrig');

  const demoUsersQuery = useDemoUsers();
  const allDemoUsers = demoUsersQuery.data || [];
  const demoUsers = allDemoUsers.filter((u) => u.persona === demoTab);

  useEffect(() => {
    if (!formError) return;
    formErrorRef.current?.focus();
  }, [formError]);

  const clearErrors = () => {
    setFormError('');
    setFieldErrors({});
  };

  const finishLogin = async (loginEmail, loginPassword) => {
    setFormError('');
    setBusy(true);
    try {
      await login(loginEmail, loginPassword, { remember });
    } catch (err) {
      setFormError(getErrorMessage(err, 'Unable to sign in. Check your email and password.'));
      passwordRef.current?.focus();
    } finally {
      setBusy(false);
    }
  };

  const signIn = (e) => {
    e.preventDefault();
    const next = validateFields(email, password);
    setFieldErrors(next);
    setFormError('');
    if (next.email) {
      emailRef.current?.focus();
      return;
    }
    if (next.password) {
      passwordRef.current?.focus();
      return;
    }
    finishLogin(email.trim().toLowerCase(), password);
  };

  const useDemoUser = (u) => {
    if (!u.active) {
      setFormError('This demo account is inactive and cannot sign in.');
      return;
    }
    setEmail(u.email);
    setPassword('vision');
    setFieldErrors({});
    finishLogin(u.email, 'vision');
  };

  const onTabKeyDown = (event) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const index = PERSONA_TABS.findIndex((t) => t.key === demoTab);
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % PERSONA_TABS.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + PERSONA_TABS.length) % PERSONA_TABS.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = PERSONA_TABS.length - 1;
    setDemoTab(PERSONA_TABS[next].key);
    document.getElementById(`${tablistId}-${PERSONA_TABS[next].key}`)?.focus();
  };

  return (
    <div className="login-editorial flex min-h-full w-full overflow-y-auto scroll-thin">
      <a href={`#${formDomId}`} className="skip-link">
        Skip to sign in
      </a>

      <div className="mx-auto flex w-full max-w-6xl flex-col justify-center px-6 py-10 sm:px-8 lg:min-h-full lg:px-12 lg:py-12">
        <header className="animate-fade-in">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div className="min-w-0">
              <p className="type-overline">Rehrig Pacific Company · {appModeLabel()} instance</p>
              <h1 className="font-display mt-2 text-display-xl leading-none text-ink sm:text-[4.25rem]">
                vision
              </h1>
            </div>
            <p className="max-w-sm pb-1 text-sm leading-relaxed text-ink-muted sm:text-[0.95rem]">
              Operations platform for service providers, field crews, and resident programs.
            </p>
          </div>
          <div className="hairline-rule mt-7 animate-rule-draw" aria-hidden="true" />
        </header>

        <div className="mt-8 grid grid-cols-1 items-start gap-10 lg:mt-10 lg:grid-cols-12 lg:gap-10 xl:gap-14">
          <aside
            className="order-2 animate-fade-up lg:order-1 lg:col-span-5"
            style={{ animationDelay: '80ms' }}
            aria-labelledby="outcomes-heading"
          >
            <h2 id="outcomes-heading" className="type-overline">
              What you can run
            </h2>
            <ul className="mt-5 space-y-0">
              {OUTCOMES.map((item, index) => (
                <li
                  key={item.n}
                  className={`flex gap-4 py-4 ${index < OUTCOMES.length - 1 ? 'border-b border-line' : ''}`}
                >
                  <span className="mono text-xs font-medium text-brand" aria-hidden="true">
                    {item.n}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{item.title}</p>
                    <p className="mt-0.5 text-sm text-ink-muted">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </aside>

          <section
            className="order-1 animate-fade-up lg:order-2 lg:col-span-7"
            style={{ animationDelay: '120ms' }}
            aria-labelledby="signin-heading"
          >
            <div className="lg:border-l lg:border-line lg:pl-10">
              <div className="flex items-baseline gap-3">
                <span className="mono text-xs font-medium text-brand" aria-hidden="true">
                  04
                </span>
                <div>
                  <p className="type-overline">Sign in</p>
                  <h2
                    id="signin-heading"
                    className="mt-1.5 font-display text-title-lg tracking-tight text-ink sm:text-[1.85rem]"
                  >
                    Continue
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                    Use your work email to open the operations workspace.
                  </p>
                </div>
              </div>

              <div className="hairline-rule mt-6" aria-hidden="true" />

              <form
                id={formDomId}
                onSubmit={signIn}
                className="mt-6 space-y-5"
                noValidate
                aria-busy={busy}
              >
                <div>
                  <label htmlFor={emailId} className="mb-2 block text-xs font-semibold text-ink-soft">
                    Work email
                  </label>
                  <input
                    ref={emailRef}
                    id={emailId}
                    type="email"
                    name="email"
                    inputMode="email"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email || formError) clearErrors();
                    }}
                    className={`login-field ${fieldErrors.email ? 'login-field-error' : ''}`}
                    placeholder="name@company.com"
                    required
                    disabled={busy}
                    aria-invalid={!!fieldErrors.email}
                    aria-describedby={fieldErrors.email ? emailErrorId : undefined}
                  />
                  {fieldErrors.email && (
                    <p id={emailErrorId} className="mt-1.5 text-xs text-danger" role="alert">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor={passwordId}
                    className="mb-2 block text-xs font-semibold text-ink-soft"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      ref={passwordRef}
                      id={passwordId}
                      type={showPw ? 'text' : 'password'}
                      name="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password || formError) clearErrors();
                      }}
                      className={`login-field pr-12 ${fieldErrors.password ? 'login-field-error' : ''}`}
                      required
                      disabled={busy}
                      aria-invalid={!!fieldErrors.password}
                      aria-describedby={fieldErrors.password ? passwordErrorId : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-ink-faint interactive hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                      aria-pressed={showPw}
                      disabled={busy}
                    >
                      <Icon name={showPw ? 'eyeOff' : 'eye'} size={16} aria-hidden="true" />
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p id={passwordErrorId} className="mt-1.5 text-xs text-danger" role="alert">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label
                    htmlFor={rememberId}
                    className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-ink-muted"
                  >
                    <input
                      id={rememberId}
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      disabled={busy}
                      className="h-4 w-4 rounded-sm border-line-strong text-brand focus:ring-2 focus:ring-brand/40"
                    />
                    Remember me on this device
                  </label>
                </div>

                <div
                  ref={formErrorRef}
                  id={formErrorId}
                  tabIndex={formError ? -1 : undefined}
                  role="alert"
                  aria-live="assertive"
                  className={
                    formError
                      ? 'flex gap-2 border-y border-danger/30 bg-danger-soft/70 py-3 text-sm text-danger outline-none'
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
                  className="group inline-flex min-h-12 w-full items-center justify-between border-y border-ink bg-ink px-4 py-3.5 text-sm font-semibold text-white interactive hover:bg-ink-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? (
                    <span className="flex items-center gap-2">
                      <span className="loading-spinner border-white/30 border-t-white" aria-hidden="true" />
                      <span>Signing in…</span>
                    </span>
                  ) : (
                    <>
                      <span>Sign in to Vision</span>
                      <Icon
                        name="arrowRight"
                        size={16}
                        aria-hidden="true"
                        className="transition-transform duration-snappy group-hover:translate-x-0.5"
                      />
                    </>
                  )}
                </button>
                <p className="sr-only" aria-live="polite">
                  {busy ? 'Signing in, please wait.' : ''}
                </p>
              </form>

              <div className="mt-8">
                <div className="mb-4 flex items-center gap-3" aria-hidden="true">
                  <div className="h-px flex-1 bg-line" />
                  <span className="type-overline">or</span>
                  <div className="h-px flex-1 bg-line" />
                </div>
                <p className="sr-only">Alternative sign-in options</p>

                <a
                  href="mailto:helpdesk@rehrigpacific.com?subject=Vision%20SSO%20access"
                  className="flex min-h-12 w-full items-center justify-between border-y border-line py-3.5 text-sm font-semibold text-ink interactive hover:border-ink hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <span>Request Rehrig SSO access</span>
                  <Icon name="arrowRight" size={15} className="text-ink-faint" aria-hidden="true" />
                </a>
                <p className="mt-2.5 text-xs leading-relaxed text-ink-muted">
                  SSO is not available in this local build. This link opens an email to helpdesk.
                </p>
              </div>

              <div className="mt-8 border-t border-line pt-5">
                <button
                  type="button"
                  onClick={() => setDemoOpen((o) => !o)}
                  aria-expanded={demoOpen}
                  aria-controls={demoPanelId}
                  className="flex min-h-11 w-full items-start justify-between gap-4 text-left interactive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <span className="flex gap-4">
                    <span className="mono text-xs font-medium text-brand" aria-hidden="true">
                      05
                    </span>
                    <span>
                      <span className="type-overline block">Testing only</span>
                      <span className="mt-1 block text-sm text-ink-muted">
                        {isDemoMode() ? 'Local seed accounts' : 'Accounts from API'} · password{' '}
                        <span className="mono font-semibold text-ink">vision</span>
                      </span>
                    </span>
                  </span>
                  <Icon
                    name={demoOpen ? 'chevronDown' : 'chevronRight'}
                    size={15}
                    className="mt-0.5 text-ink-faint"
                    aria-hidden="true"
                  />
                </button>

                {demoOpen && (
                  <div id={demoPanelId} className="mt-4 animate-fade-in pl-8" role="region" aria-label="Demo accounts">
                    {isApiMode() && demoUsersQuery.isLoading && (
                      <p className="py-4 text-sm text-ink-muted" role="status">
                        Loading demo accounts…
                      </p>
                    )}
                    {isApiMode() && demoUsersQuery.isError && (
                      <p className="py-4 text-sm text-danger" role="alert">
                        {getErrorMessage(
                          demoUsersQuery.error,
                          'Could not load demo accounts. Is the API running?'
                        )}
                      </p>
                    )}
                    <div
                      id={tablistId}
                      className="flex gap-0 border-b border-line"
                      role="tablist"
                      aria-label="Demo persona"
                      onKeyDown={onTabKeyDown}
                    >
                      {PERSONA_TABS.map((t) => (
                        <button
                          key={t.key}
                          id={`${tablistId}-${t.key}`}
                          type="button"
                          role="tab"
                          aria-selected={demoTab === t.key}
                          tabIndex={demoTab === t.key ? 0 : -1}
                          onClick={() => setDemoTab(t.key)}
                          className={`-mb-px min-h-11 border-b-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide transition duration-snappy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                            demoTab === t.key
                              ? 'border-brand text-ink'
                              : 'border-transparent text-ink-faint hover:text-ink-muted'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                    <ul className="divide-y divide-line" role="list">
                      {demoUsers.map((u, index) => (
                        <li key={u.id}>
                          <button
                            type="button"
                            disabled={!u.active || busy}
                            onClick={() => useDemoUser(u)}
                            className="flex min-h-12 w-full items-center justify-between gap-3 py-3.5 text-left interactive hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={`Sign in as ${u.name}, ${u.role}${u.active ? '' : ', inactive'}`}
                          >
                            <span className="flex min-w-0 items-start gap-3">
                              <span className="mono shrink-0 text-xs text-ink-faint" aria-hidden="true">
                                {String(index + 1).padStart(2, '0')}
                              </span>
                              <span>
                                <span className="block text-sm font-semibold text-ink">{u.name}</span>
                                <span className="block text-xs text-ink-muted">
                                  {u.role} · {u.scopeLabel}
                                  {!u.active ? ' · Inactive' : ''}
                                </span>
                              </span>
                            </span>
                            <Icon name="arrowRight" size={14} className="text-brand" aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                      {!demoUsers.length && !demoUsersQuery.isLoading && (
                        <li className="py-6 text-sm text-ink-muted">No accounts in this persona.</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
