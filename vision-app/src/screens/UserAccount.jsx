import React, { useState } from 'react';
import {
  Page,
  PageHeader,
  Panel,
  Button,
  Field,
  FieldSection,
  TextInput,
  FormDrawer,
} from '../components/UI.jsx';
import Icon from '../components/Icon.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { useStore } from '../state/AppStore.jsx';

function SettingRow({ label, value }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-line py-2.5 last:border-0 sm:grid-cols-3 sm:gap-4">
      <div className="text-sm text-ink-muted">{label}</div>
      <div className="min-w-0 break-words text-sm text-ink sm:col-span-2">{value || '—'}</div>
    </div>
  );
}

export function UserAccountPanels() {
  const { state, toast, setTheme } = useStore();
  const user = state.currentUser;
  const [resetOpen, setResetOpen] = useState(false);
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const openReset = () => {
    setForm({ current: '', next: '', confirm: '' });
    setError('');
    setResetOpen(true);
  };

  const submitReset = async (event) => {
    event.preventDefault();
    if (!form.current.trim()) {
      setError('Enter your current password.');
      return;
    }
    if (form.next.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (form.next !== form.confirm) {
      setError('New password and confirmation do not match.');
      return;
    }
    if (form.next === form.current) {
      setError('Choose a new password that is different from the current one.');
      return;
    }
    setBusy(true);
    setError('');
    window.setTimeout(() => {
      setBusy(false);
      setResetOpen(false);
      toast('Password updated');
    }, 400);
  };

  return (
    <div className="space-y-5">
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <p className="min-w-0 flex-1 font-display text-title-sm text-ink">User details</p>
        </div>
        <div className="p-5">
          <SettingRow label="Name" value={user?.name} />
          <SettingRow label="Email" value={user?.email} />
          <SettingRow label="Alias" value={user?.alias} />
          <SettingRow label="Persona" value={user?.persona} />
          <SettingRow label="Role" value={user?.role} />
          <SettingRow label="Scope" value={user?.scopeLabel} />
        </div>
      </Panel>

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <p className="min-w-0 flex-1 font-display text-title-sm text-ink">Appearance</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="min-w-0">
            <p className="text-sm text-ink">Theme</p>
            <p className="mt-0.5 text-sm text-ink-muted">
              Apply light or dark across Vision, or follow your device setting.
            </p>
          </div>
          <ThemeToggle value={state.theme} onChange={setTheme} />
        </div>
      </Panel>

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <p className="min-w-0 flex-1 font-display text-title-sm text-ink">Password</p>
          <Button variant="secondary" onClick={openReset}>
            <Icon name="lock" size={14} /> Reset password
          </Button>
        </div>
        <div className="p-5 text-sm text-ink-muted">
          Change the password used to sign in to Vision. This does not affect service provider or
          customer accounts you manage.
        </div>
      </Panel>

      {resetOpen && (
        <FormDrawer
          onClose={() => setResetOpen(false)}
          onSubmit={submitReset}
          title="Reset password"
          description="Update the password for your signed-in user."
          dirty={Boolean(form.current || form.next || form.confirm)}
          busy={busy}
          error={error}
          submitLabel="Update password"
        >
          <FieldSection title="Password">
            <Field label="Current password" required span2>
              <TextInput
                type="password"
                autoComplete="current-password"
                value={form.current}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, current: event.target.value }));
                  setError('');
                }}
              />
            </Field>
            <Field label="New password" required span2>
              <TextInput
                type="password"
                autoComplete="new-password"
                value={form.next}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, next: event.target.value }));
                  setError('');
                }}
              />
            </Field>
            <Field label="Confirm new password" required span2>
              <TextInput
                type="password"
                autoComplete="new-password"
                value={form.confirm}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, confirm: event.target.value }));
                  setError('');
                }}
              />
            </Field>
          </FieldSection>
        </FormDrawer>
      )}
    </div>
  );
}

export default function UserAccount() {
  return (
    <Page>
      <PageHeader
        overline="Profile"
        title="Your Account"
        description="Your signed-in user details, appearance, and password. This is not the service provider or customer accounts you work with."
      />
      <UserAccountPanels />
    </Page>
  );
}
