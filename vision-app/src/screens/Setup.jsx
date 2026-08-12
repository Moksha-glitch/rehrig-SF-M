import React, { useEffect, useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import {
  Badge,
  BoolCell,
  StatusDot,
  Table,
  Page,
  PageHeader,
  Panel,
  Button,
  FormDrawer,
  FieldSection,
  Field,
  TextInput,
  Select,
  Checkbox,
} from '../components/UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useUsers } from '../hooks/useAccounts.js';
import { useRecords } from '../hooks/useRecords.js';
import {
  useWorkspaceMutations,
  useWorkspaceSettings,
} from '../hooks/useConfig.js';
import { getErrorMessage } from '../lib/errors.js';
import { RECORD_SCHEMAS } from '../data/recordSchemas.js';
import {
  ROLE_PSG,
  canAccessModuleForUser,
  canCreateRecordsForUser,
} from '../data/rbac.js';

const SECTIONS = [
  {
    key: 'userMgmt',
    label: 'User Management',
    icon: 'users',
    title: 'User Management',
    subtitle: 'Organization info, users, and permission profiles.',
  },
  {
    key: 'account',
    label: 'Your Account',
    icon: 'user',
    title: 'Your Account',
    subtitle: 'Personal settings, preferences, and signed-in profile.',
  },
  {
    key: 'devcon',
    label: 'Developer Console',
    icon: 'layers',
    title: 'Developer Console',
    subtitle: 'Browse live records and inspect data. Results respect your active permissions and scope.',
  },
];

const USER_MGMT_TABS = [
  { key: 'general', label: 'General' },
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

const RBAC_MATRIX_MODULES = [
  { key: 'analytics', label: 'Reports' },
  { key: 'workOrders', label: 'Work Orders' },
  { key: 'assets', label: 'Assets' },
];

const RBAC_ROLES = Object.keys(ROLE_PSG).map((key) => {
  const separator = key.indexOf(':');
  const persona = key.slice(0, separator);
  const role = key.slice(separator + 1);
  return { key, persona, role, user: { persona, role, active: true } };
});

const EXPLORER_SOURCES = [
  { key: 'workOrders', label: 'Work Orders' },
  { key: 'dispatches', label: 'Dispatches' },
  { key: 'assets', label: 'Assets' },
  { key: 'trucks', label: 'Trucks' },
  { key: 'locations', label: 'Locations' },
  { key: 'aggregatedTips', label: 'Aggregated Tips' },
  { key: 'individualTips', label: 'Individual Tips' },
];

const EXPLORER_VIEWS = [
  { name: 'Open work orders', kind: 'workOrders', field: 'status', value: 'Open' },
  { name: 'Assets awaiting repair', kind: 'assets', field: 'status', value: 'Awaiting Repair' },
  { name: 'Trucks in repair', kind: 'trucks', field: 'status', value: 'Repair' },
  { name: 'Scheduled dispatches', kind: 'dispatches', field: 'status', value: 'Scheduled' },
];

const LANDING_OPTIONS = ['Home', 'Reports', 'Work Orders', 'Map Center'];
const NOTIF_OPTIONS = [
  'In-app + email digest',
  'In-app only',
  'Email only',
  'None',
];

export default function Setup() {
  const { state, navigate, persona, toast } = useStore();
  const usersQuery = useUsers();
  const settingsQuery = useWorkspaceSettings();
  const { update: updateSettings } = useWorkspaceMutations();
  const users = usersQuery.data || [];
  const settings = settingsQuery.data || {};
  const canEditWorkspace = persona === 'rehrig';
  const canEditPreferences = !!state.currentUser;

  const navSection = state.nav.params?.section || 'userMgmt';
  const navTab = state.nav.params?.tab || 'general';

  const [section, setSection] = useState(
    SECTIONS.some((s) => s.key === navSection) ? navSection : 'userMgmt'
  );
  const [tab, setTab] = useState(
    USER_MGMT_TABS.some((t) => t.key === navTab) ? navTab : 'general'
  );
  const [explorerKind, setExplorerKind] = useState('workOrders');
  const [explorerField, setExplorerField] = useState('');
  const [explorerValue, setExplorerValue] = useState('');
  const [orgDraft, setOrgDraft] = useState(null);
  const [orgBaseline, setOrgBaseline] = useState(null);
  const [prefDraft, setPrefDraft] = useState(null);
  const [prefBaseline, setPrefBaseline] = useState(null);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const next = state.nav.params?.section || 'userMgmt';
    if (SECTIONS.some((s) => s.key === next)) setSection(next);
    const nextTab = state.nav.params?.tab;
    if (nextTab && USER_MGMT_TABS.some((t) => t.key === nextTab)) setTab(nextTab);
  }, [state.nav.params?.section, state.nav.params?.tab]);

  const current = SECTIONS.find((s) => s.key === section) || SECTIONS[0];

  const goSection = (key) => {
    setSection(key);
    navigate('setup', { section: key, ...(key === 'userMgmt' ? { tab } : {}) });
  };

  const goTab = (key) => {
    setTab(key);
    navigate('setup', { section: 'userMgmt', tab: key });
  };

  const openOrgEdit = () => {
    const next = {
      organizationName: settings.organizationName || '',
      headquarters: settings.headquarters || '',
      primaryDomain: settings.primaryDomain || '',
      platformName: settings.platformName || '',
      defaultTimeZone: settings.defaultTimeZone || '',
      defaultLocale: settings.defaultLocale || '',
      defaultAccountOwner: settings.defaultAccountOwner || '',
      sessionPersonaLock: !!settings.sessionPersonaLock,
      requireMfaAdmins: !!settings.requireMfaAdmins,
      auditRetentionDays: settings.auditRetentionDays ?? 365,
    };
    setOrgDraft(next);
    setOrgBaseline(next);
    setSaveError('');
  };

  const openPrefEdit = () => {
    const next = {
      notificationPreference: settings.notificationPreference || 'In-app + email digest',
      defaultLanding: settings.defaultLanding || 'Home',
    };
    setPrefDraft(next);
    setPrefBaseline(next);
    setSaveError('');
  };

  const saveOrg = async () => {
    if (!orgDraft.organizationName?.trim()) {
      setSaveError('Organization name is required.');
      return;
    }
    try {
      await updateSettings.mutateAsync({
        ...orgDraft,
        organizationName: orgDraft.organizationName.trim(),
        auditRetentionDays: Number(orgDraft.auditRetentionDays) || 365,
      });
      toast('Organization settings saved');
      setOrgDraft(null);
      setOrgBaseline(null);
    } catch (error) {
      setSaveError(getErrorMessage(error, 'Unable to save settings.'));
    }
  };

  const savePrefs = async () => {
    try {
      await updateSettings.mutateAsync(prefDraft);
      toast('Preferences saved');
      setPrefDraft(null);
      setPrefBaseline(null);
    } catch (error) {
      setSaveError(getErrorMessage(error, 'Unable to save preferences.'));
    }
  };

  const explorerQuery = useRecords(explorerKind);
  const explorerColumns = RECORD_SCHEMAS[explorerKind]?.listColumns || [];

  const explorerResult = useMemo(() => {
    const source = Array.isArray(explorerQuery.data?.data)
      ? explorerQuery.data.data
      : Array.isArray(explorerQuery.data)
      ? explorerQuery.data
      : [];
    const started = performance.now();
    const term = explorerValue.trim().toLowerCase();
    const rows = source.filter((row) => {
      if (!term) return true;
      if (explorerField) {
        return String(row[explorerField] ?? '').toLowerCase().includes(term);
      }
      return Object.values(row).some((cell) =>
        String(cell ?? '').toLowerCase().includes(term)
      );
    });
    return {
      rows,
      elapsedMs: performance.now() - started,
      matched: rows.length,
      total: source.length,
    };
  }, [explorerQuery.data, explorerField, explorerValue]);

  return (
    <Page wide>
      <PageHeader
        overline="Configure"
        title="Workspace"
        description="Organization administration, your personal account, and developer tools."
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="w-full shrink-0 lg:w-56">
          <nav
            className="rounded-panel border border-line bg-surface p-1.5"
            aria-label="Workspace sections"
          >
            {SECTIONS.map((s) => {
              const active = section === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => goSection(s.key)}
                  className={`mb-0.5 flex w-full items-center gap-2.5 rounded-control px-3 py-2.5 text-left text-sm interactive last:mb-0 ${
                    active
                      ? 'bg-elevated font-semibold text-ink'
                      : 'text-ink-muted hover:bg-elevated/70 hover:text-ink'
                  }`}
                >
                  <Icon
                    name={s.icon}
                    size={15}
                    className={active ? 'text-ink' : 'text-ink-faint'}
                  />
                  {s.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-5">
            <h2 className="font-display text-title-md text-ink">{current.title}</h2>
            <p className="mt-1 text-sm text-ink-muted">{current.subtitle}</p>
          </div>

          {section === 'userMgmt' && (
            <>
              <div className="mb-5 flex gap-0 overflow-x-auto border-b border-line bg-surface/60 scroll-thin">
                {USER_MGMT_TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => goTab(t.key)}
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
                <div className="space-y-5">
                  <SetupBlock
                    title="Organization"
                    action={
                      canEditWorkspace && (
                        <Button variant="secondary" onClick={openOrgEdit}>
                          <Icon name="edit" size={14} /> Edit
                        </Button>
                      )
                    }
                  >
                    <SettingRow label="Organization name" value={settings.organizationName} />
                    <SettingRow label="Headquarters" value={settings.headquarters} />
                    <SettingRow label="Primary domain" value={settings.primaryDomain} />
                  </SetupBlock>
                  <SetupBlock title="Platform defaults">
                    <SettingRow label="Platform name" value={settings.platformName} />
                    <SettingRow label="Default time zone" value={settings.defaultTimeZone} />
                    <SettingRow label="Default locale" value={settings.defaultLocale} />
                    <SettingRow label="Default account owner" value={settings.defaultAccountOwner} />
                  </SetupBlock>
                  <SetupBlock title="Behavior defaults">
                    <SettingRow
                      label="Session persona lock"
                      value={settings.sessionPersonaLock ? 'Enabled' : 'Disabled'}
                    />
                    <SettingRow
                      label="Require MFA for admins"
                      value={settings.requireMfaAdmins ? 'Recommended' : 'Optional'}
                    />
                    <SettingRow
                      label="Audit retention"
                      value={`${settings.auditRetentionDays ?? 365} days`}
                    />
                  </SetupBlock>
                </div>
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
                            color={
                              u.persona === 'rehrig' ? 'blue' : u.persona === 'sp' ? 'cyan' : 'slate'
                            }
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
                <SetupBlock title="Role permission matrix (read only)">
                  <Table
                    columns={[
                      'Persona · Role',
                      'Permission Set Group',
                      ...RBAC_MATRIX_MODULES.map((m) => m.label),
                      'Create / Edit / Delete',
                    ]}
                  >
                    {RBAC_ROLES.map((r) => (
                      <tr key={r.key} className="interactive hover:bg-elevated/70">
                        <td className="px-4 py-3 font-medium text-ink capitalize">
                          {r.persona} · {r.role}
                        </td>
                        <td className="px-4 py-3 text-ink-muted">{ROLE_PSG[r.key]}</td>
                        {RBAC_MATRIX_MODULES.map((m) => (
                          <td key={m.key} className="px-4 py-3">
                            <BoolCell value={canAccessModuleForUser(r.user, m.key)} />
                          </td>
                        ))}
                        <td className="px-4 py-3">
                          <BoolCell value={canCreateRecordsForUser(r.user)} />
                        </td>
                      </tr>
                    ))}
                  </Table>
                  <p className="mt-4 text-xs text-ink-muted">
                    Derived from the platform role definitions. Permission Set Groups extend a
                    profile&apos;s rights and are never reduced below it.
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
            </>
          )}

          {section === 'account' && (
            <SetupBlock
              title="The signed-in user's own profile and preferences"
              action={
                canEditPreferences && (
                  <Button variant="secondary" onClick={openPrefEdit}>
                    <Icon name="edit" size={14} /> Edit preferences
                  </Button>
                )
              }
            >
              <SettingRow label="Name" value={state.currentUser?.name} />
              <SettingRow label="Alias" value={state.currentUser?.alias} />
              <SettingRow label="Email" value={state.currentUser?.email} />
              <SettingRow label="Persona" value={state.currentUser?.persona} />
              <SettingRow label="Role" value={state.currentUser?.role} />
              <SettingRow label="Scope" value={state.currentUser?.scopeLabel} />
              <SettingRow
                label="Notification preference"
                value={settings.notificationPreference}
              />
              <SettingRow label="Default landing" value={settings.defaultLanding} />
            </SetupBlock>
          )}

          {section === 'devcon' && (
            <div className="space-y-5">
              <SetupBlock title="Data explorer">
                <p className="mb-3 text-xs text-ink-muted">
                  Browse live workspace records by type and filter on any field. Results reflect
                  your active permissions and scope.
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Field label="Record type">
                    <Select
                      options={EXPLORER_SOURCES.map((s) => ({ value: s.key, label: s.label }))}
                      value={explorerKind}
                      onChange={(e) => {
                        setExplorerKind(e.target.value);
                        setExplorerField('');
                      }}
                    />
                  </Field>
                  <Field label="Filter field">
                    <Select
                      options={[
                        { value: '', label: 'All fields' },
                        ...explorerColumns.map((c) => ({ value: c.key, label: c.label })),
                      ]}
                      value={explorerField}
                      onChange={(e) => setExplorerField(e.target.value)}
                    />
                  </Field>
                  <Field label="Contains">
                    <TextInput
                      value={explorerValue}
                      onChange={(e) => setExplorerValue(e.target.value)}
                      placeholder="Type to filter…"
                    />
                  </Field>
                </div>
                <div className="mt-4 overflow-x-auto rounded-panel border border-line">
                  <div className="border-b border-line bg-elevated/50 px-3 py-2 text-xs text-ink-muted">
                    {explorerResult.matched} of {explorerResult.total} records ·{' '}
                    {explorerResult.elapsedMs.toFixed(2)} ms
                  </div>
                  {explorerResult.rows.length ? (
                    <Table columns={explorerColumns.map((c) => c.label)}>
                      {explorerResult.rows.slice(0, 50).map((row, index) => (
                        <tr key={row.id || row.number || row.name || index}>
                          {explorerColumns.map((c) => (
                            <td key={c.key} className="px-4 py-2 text-ink-muted">
                              {String(row[c.key] ?? '—')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </Table>
                  ) : (
                    <div className="px-4 py-8 text-center text-sm text-ink-muted">
                      No records match the current filters.
                    </div>
                  )}
                </div>
              </SetupBlock>
              <SetupBlock title="Saved views">
                <ul className="space-y-2">
                  {EXPLORER_VIEWS.map((v) => (
                    <li key={v.name}>
                      <button
                        type="button"
                        onClick={() => {
                          setExplorerKind(v.kind);
                          setExplorerField(v.field);
                          setExplorerValue(v.value);
                        }}
                        className="w-full rounded-panel border border-line px-3 py-2.5 text-left interactive hover:bg-elevated/70"
                      >
                        <div className="text-sm font-medium text-ink">{v.name}</div>
                        <div className="mt-0.5 text-[11px] text-ink-faint">
                          {EXPLORER_SOURCES.find((s) => s.key === v.kind)?.label || v.kind} · {v.field}{' '}
                          contains &ldquo;{v.value}&rdquo;
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </SetupBlock>
            </div>
          )}
        </div>
      </div>

      {orgDraft && (
        <FormDrawer
          onClose={() => {
            setOrgDraft(null);
            setOrgBaseline(null);
            setSaveError('');
          }}
          onSubmit={saveOrg}
          title="Edit organization settings"
          description="Platform defaults used across the Vision workspace."
          dirty={JSON.stringify(orgDraft) !== JSON.stringify(orgBaseline)}
          busy={updateSettings.isPending}
          error={saveError}
          submitLabel="Save settings"
          wide
        >
          <FieldSection title="Organization">
            <Field label="Organization name" required span2>
              <TextInput
                value={orgDraft.organizationName}
                onChange={(e) => {
                  setOrgDraft((d) => ({ ...d, organizationName: e.target.value }));
                  setSaveError('');
                }}
              />
            </Field>
            <Field label="Headquarters">
              <TextInput
                value={orgDraft.headquarters}
                onChange={(e) => setOrgDraft((d) => ({ ...d, headquarters: e.target.value }))}
              />
            </Field>
            <Field label="Primary domain">
              <TextInput
                value={orgDraft.primaryDomain}
                onChange={(e) => setOrgDraft((d) => ({ ...d, primaryDomain: e.target.value }))}
              />
            </Field>
          </FieldSection>
          <FieldSection title="Platform defaults">
            <Field label="Platform name">
              <TextInput
                value={orgDraft.platformName}
                onChange={(e) => setOrgDraft((d) => ({ ...d, platformName: e.target.value }))}
              />
            </Field>
            <Field label="Default time zone">
              <TextInput
                value={orgDraft.defaultTimeZone}
                onChange={(e) => setOrgDraft((d) => ({ ...d, defaultTimeZone: e.target.value }))}
              />
            </Field>
            <Field label="Default locale">
              <TextInput
                value={orgDraft.defaultLocale}
                onChange={(e) => setOrgDraft((d) => ({ ...d, defaultLocale: e.target.value }))}
              />
            </Field>
            <Field label="Default account owner">
              <TextInput
                value={orgDraft.defaultAccountOwner}
                onChange={(e) =>
                  setOrgDraft((d) => ({ ...d, defaultAccountOwner: e.target.value }))
                }
              />
            </Field>
            <Field label="Audit retention (days)">
              <TextInput
                type="number"
                min="30"
                max="2555"
                value={orgDraft.auditRetentionDays}
                onChange={(e) =>
                  setOrgDraft((d) => ({ ...d, auditRetentionDays: e.target.value }))
                }
              />
            </Field>
            <div className="space-y-2 sm:col-span-2">
              <Checkbox
                label="Session persona lock"
                checked={!!orgDraft.sessionPersonaLock}
                onChange={(e) =>
                  setOrgDraft((d) => ({ ...d, sessionPersonaLock: e.target.checked }))
                }
              />
              <Checkbox
                label="Require MFA for admins"
                checked={!!orgDraft.requireMfaAdmins}
                onChange={(e) =>
                  setOrgDraft((d) => ({ ...d, requireMfaAdmins: e.target.checked }))
                }
              />
            </div>
          </FieldSection>
        </FormDrawer>
      )}

      {prefDraft && (
        <FormDrawer
          onClose={() => {
            setPrefDraft(null);
            setPrefBaseline(null);
            setSaveError('');
          }}
          onSubmit={savePrefs}
          title="Edit personal preferences"
          description="Notification and landing preferences for your signed-in profile."
          dirty={JSON.stringify(prefDraft) !== JSON.stringify(prefBaseline)}
          busy={updateSettings.isPending}
          error={saveError}
          submitLabel="Save preferences"
        >
          <FieldSection title="Preferences">
            <Field label="Notification preference" span2>
              <Select
                options={NOTIF_OPTIONS}
                value={prefDraft.notificationPreference}
                onChange={(e) =>
                  setPrefDraft((d) => ({ ...d, notificationPreference: e.target.value }))
                }
              />
            </Field>
            <Field label="Default landing" span2>
              <Select
                options={LANDING_OPTIONS}
                value={prefDraft.defaultLanding}
                onChange={(e) =>
                  setPrefDraft((d) => ({ ...d, defaultLanding: e.target.value }))
                }
              />
            </Field>
          </FieldSection>
        </FormDrawer>
      )}
    </Page>
  );
}

function SetupBlock({ title, children, action }) {
  return (
    <Panel>
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <p className="font-display text-title-sm text-ink">{title}</p>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </Panel>
  );
}

function SettingRow({ label, value }) {
  return (
    <div className="grid grid-cols-3 gap-4 border-b border-line py-2.5 last:border-0">
      <div className="text-sm text-ink-muted">{label}</div>
      <div className="col-span-2 text-sm text-ink">{value || '—'}</div>
    </div>
  );
}
