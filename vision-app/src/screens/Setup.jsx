import React, { useState } from 'react';
import { Badge, BoolCell, StatusDot, Table, Page, PageHeader, Panel } from '../components/UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useAccounts, useUsers } from '../hooks/useAccounts.js';

const SETUP_TABS = [
  { key: 'general', label: 'General' },
  { key: 'account', label: 'Your Account' },
  { key: 'dev', label: 'Dev Console' },
  { key: 'editObject', label: 'Edit Object' },
  { key: 'users', label: 'Users' },
  { key: 'profiles', label: 'Profiles' },
  { key: 'psg', label: 'Permission Set Groups' },
];

const PSGS = [
  {
    name: 'SP Admin PSG',
    applies: 'SP Admin — top-level admin for each SP',
    perms: 'Full SP account access: Contacts, Routes, Segments, Notifications, Products. No Rehrig admin.',
  },
  {
    name: 'SP Back-Office PSG',
    applies: 'Back-Office Staff at the SP',
    perms: 'Read/write: Customers, Locations, Work Orders, Contacts. No Segments / route templates.',
  },
  {
    name: 'SP Field Tech PSG',
    applies: 'Field technicians',
    perms: 'Read-only: Work Orders and Assets assigned to them. Cannot create records.',
  },
  {
    name: 'SP Dispatcher PSG',
    applies: 'Dispatch coordinators',
    perms: 'Full: Dispatches, Work Orders, Routes, Assets. No Contacts / Segments.',
  },
  {
    name: 'Rehrig Admin PSG',
    applies: 'Rehrig internal administrators',
    perms: 'Full platform access: master catalog, all SP accounts, Configure sections.',
  },
];

const PROFILE_OBJECTS = ['Account', 'Contact', 'Work Order', 'Dispatch', 'Asset', 'Route', 'Segment'];

export default function Setup() {
  const { state } = useStore();
  const usersQuery = useUsers();
  const accountsQuery = useAccounts();
  const users = usersQuery.data || [];
  const [tab, setTab] = useState('users');

  return (
    <Page>
      <PageHeader
        overline="Administration"
        title="Setup"
        description="Read-only reference for the current permission model. Changes must be made in the identity and platform administration systems."
        actions={<Badge color="slate">Read only</Badge>}
      />

      <div className="mb-6 flex gap-0 overflow-x-auto border-b border-line bg-surface/60 scroll-thin">
        {SETUP_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-medium transition duration-snappy ${
              tab === t.key
                ? 'border-brand text-ink'
                : 'border-transparent text-ink-faint hover:text-ink-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <SetupBlock title="Platform-level settings and global defaults">
          <SettingRow label="Platform name" value="Vision 2.0" />
          <SettingRow label="Default time zone" value="America/Edmonton" />
          <SettingRow label="Session persona lock" value="Enabled" />
          <SettingRow label="Default account owner" value="Ravindra Medam" />
        </SetupBlock>
      )}

      {tab === 'account' && (
        <SetupBlock title="The signed-in user's own profile and preferences">
          <SettingRow label="Name" value={state.currentUser?.name} />
          <SettingRow label="Alias" value={state.currentUser?.alias} />
          <SettingRow label="Email" value={state.currentUser?.email} />
          <SettingRow label="Persona" value={state.currentUser?.persona} />
          <SettingRow label="Role" value={state.currentUser?.role} />
          <SettingRow label="Scope" value={state.currentUser?.scopeLabel} />
        </SetupBlock>
      )}

      {tab === 'dev' && (
        <SetupBlock title="Documented API examples (not an interactive console)">
          <div className="rounded-panel bg-ink p-4 font-mono text-xs text-[color:#9ae6b4]">
            <div>&gt; GET /api/v1/accounts</div>
            <div className="text-white/45">Current API dataset: {(accountsQuery.data || []).length} account records</div>
            <div className="mt-2">&gt; GET /api/v1/workorder?status=open</div>
            <div className="text-white/45">Example only · no request was sent</div>
          </div>
        </SetupBlock>
      )}

      {tab === 'editObject' && (
        <SetupBlock title="Illustrative schema inventory (read only)">
          <Table columns={['Object', 'Fields', 'Custom Fields', 'Layouts']}>
            {PROFILE_OBJECTS.map((o) => (
              <tr key={o} className="interactive hover:bg-elevated/70">
                <td className="px-4 py-3 font-medium text-ink">{o}</td>
                <td className="mono px-4 py-3 text-ink-muted">{8 + o.length}</td>
                <td className="mono px-4 py-3 text-ink-muted">
                  {o === 'Asset' ? 8 : o === 'Customer' ? 6 : 0}
                </td>
                <td className="mono px-4 py-3 text-ink-muted">1</td>
              </tr>
            ))}
          </Table>
        </SetupBlock>
      )}

      {tab === 'users' && (
        <SetupBlock title="Every user across all three personas">
          <Table columns={['Name', 'Alias', 'Persona', 'Role', 'Scope', 'Active']}>
            {users.map((u) => (
              <tr key={u.id} className="interactive hover:bg-elevated/70">
                <td className="px-4 py-3 font-medium text-ink">{u.name}</td>
                <td className="mono px-4 py-3 text-ink-muted">{u.alias}</td>
                <td className="px-4 py-3">
                  <Badge
                    color={u.persona === 'rehrig' ? 'blue' : u.persona === 'sp' ? 'cyan' : 'slate'}
                  >
                    {u.persona}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-ink-muted">{u.role}</td>
                <td className="px-4 py-3 text-ink-muted">{u.scopeLabel}</td>
                <td className="px-4 py-3">
                  {u.active ? (
                    <StatusDot color="emerald" label="Active" />
                  ) : (
                    <StatusDot color="slate" label="Inactive" />
                  )}
                </td>
              </tr>
            ))}
          </Table>
        </SetupBlock>
      )}

      {tab === 'profiles' && (
        <SetupBlock title="Reference permission matrix (read only)">
          <Table columns={['Object', 'View', 'Create', 'Edit', 'Delete']}>
            {PROFILE_OBJECTS.map((o) => (
              <tr key={o} className="interactive hover:bg-elevated/70">
                <td className="px-4 py-3 font-medium text-ink">{o}</td>
                <td className="px-4 py-3">
                  <BoolCell value={true} />
                </td>
                <td className="px-4 py-3">
                  <BoolCell value={o !== 'Account'} />
                </td>
                <td className="px-4 py-3">
                  <BoolCell value={true} />
                </td>
                <td className="px-4 py-3">
                  <BoolCell value={o !== 'Account' && o !== 'Segment'} />
                </td>
              </tr>
            ))}
          </Table>
          <p className="mt-4 text-xs text-ink-muted">
            System Administrator profile shown. Rights can be extended (never reduced) by Permission
            Set Groups.
          </p>
        </SetupBlock>
      )}

      {tab === 'psg' && (
        <SetupBlock title="Additive permission bundles that stack on top of a profile">
          <Table columns={['Permission Set Group', 'Applies To', 'Key Permissions']}>
            {PSGS.map((p) => (
              <tr key={p.name} className="interactive hover:bg-elevated/70">
                <td className="px-4 py-3 font-medium text-ink">{p.name}</td>
                <td className="px-4 py-3 text-ink-muted">{p.applies}</td>
                <td className="px-4 py-3 text-ink-muted">{p.perms}</td>
              </tr>
            ))}
          </Table>
        </SetupBlock>
      )}
    </Page>
  );
}

function SetupBlock({ title, children }) {
  return (
    <Panel>
      <div className="border-b border-line px-5 py-3.5">
        <p className="font-display text-title-sm text-ink">{title}</p>
      </div>
      <div className="p-5">{children}</div>
    </Panel>
  );
}

function SettingRow({ label, value }) {
  return (
    <div className="grid grid-cols-3 gap-4 border-b border-line py-2.5 last:border-0">
      <div className="text-sm text-ink-muted">{label}</div>
      <div className="col-span-2 text-sm text-ink">{value}</div>
    </div>
  );
}
