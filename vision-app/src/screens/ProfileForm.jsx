import React, { useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import {
  Button,
  ConfirmDialog,
  DrawerActions,
  Field,
  FormDrawer,
  Switch,
  TextArea,
  TextInput,
} from '../components/UI.jsx';
import {
  TOTAL_PROFILE_SCREENS,
  buildProviderTree,
  buildScreenModules,
  moduleAccessState,
  screenAccessState,
  summarizeProfileAccess,
} from '../data/profileAccess.js';

function ProviderTree({ providers, setProviders }) {
  const toggleParent = (id) => {
    setProviders((prev) =>
      prev.map((provider) => {
        if (provider.id !== id) return provider;
        const next = !provider.checked;
        return {
          ...provider,
          checked: next,
          segments: provider.segments.map((segment) => ({ ...segment, checked: next })),
        };
      })
    );
  };

  const toggleSegment = (providerId, segmentId) => {
    setProviders((prev) =>
      prev.map((provider) => {
        if (provider.id !== providerId) return provider;
        const segments = provider.segments.map((segment) =>
          segment.id === segmentId ? { ...segment, checked: !segment.checked } : segment
        );
        return {
          ...provider,
          segments,
          checked: segments.length ? segments.every((segment) => segment.checked) : !provider.checked,
        };
      })
    );
  };

  return (
    <div className="rounded-panel border border-line bg-elevated/40 p-2">
      {providers.map((provider) => {
        const someSegments = provider.segments.some((segment) => segment.checked);
        const allSegments = provider.segments.length
          ? provider.segments.every((segment) => segment.checked)
          : provider.checked;
        return (
          <div key={provider.id} className="mb-1 last:mb-0">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface">
              <input
                type="checkbox"
                checked={allSegments}
                ref={(node) => {
                  if (node) node.indeterminate = someSegments && !allSegments;
                }}
                onChange={() => toggleParent(provider.id)}
                className="h-4 w-4 rounded border-line-strong text-brand focus:ring-brand/30"
              />
              <span className="text-sm font-medium text-ink">{provider.name}</span>
            </label>
            {provider.segments.map((segment) => (
              <label
                key={segment.id}
                className="ml-6 flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 hover:bg-surface"
              >
                <input
                  type="checkbox"
                  checked={segment.checked}
                  onChange={() => toggleSegment(provider.id, segment.id)}
                  className="h-3.5 w-3.5 rounded border-line-strong text-brand focus:ring-brand/30"
                />
                <span className="text-[13px] text-ink-muted">{segment.name}</span>
              </label>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function applyAccess(target, value) {
  const next = { ...target, view: value, edit: value, create: value, delete: value };
  if (target.fields) {
    next.fields = target.fields.map((field) => ({ ...field, view: value, edit: value }));
  }
  return next;
}

function ScreenModulePanel({ modules, setModules }) {
  const [filter, setFilter] = useState('all');
  const visible =
    filter === 'all' ? modules : modules.filter((_, index) => String(index) === filter);

  const toggleModuleExpand = (moduleName) => {
    setModules((prev) =>
      prev.map((group) =>
        group.module === moduleName ? { ...group, expanded: !group.expanded } : group
      )
    );
  };

  const setAllForModule = (moduleName, value) => {
    setModules((prev) =>
      prev.map((group) =>
        group.module === moduleName
          ? { ...group, screens: group.screens.map((screen) => applyAccess(screen, value)) }
          : group
      )
    );
  };

  const setAllForScreen = (moduleName, screenId, value) => {
    setModules((prev) =>
      prev.map((group) =>
        group.module === moduleName
          ? {
              ...group,
              screens: group.screens.map((screen) =>
                screen.id === screenId ? applyAccess(screen, value) : screen
              ),
            }
          : group
      )
    );
  };

  const toggleScreenExpand = (moduleName, screenId) => {
    setModules((prev) =>
      prev.map((group) =>
        group.module === moduleName
          ? {
              ...group,
              screens: group.screens.map((screen) =>
                screen.id === screenId ? { ...screen, expanded: !screen.expanded } : screen
              ),
            }
          : group
      )
    );
  };

  const toggleFlag = (moduleName, screenId, key, fieldId) => {
    setModules((prev) =>
      prev.map((group) => {
        if (group.module !== moduleName) return group;
        return {
          ...group,
          screens: group.screens.map((screen) => {
            if (screen.id !== screenId) return screen;
            if (!fieldId) return { ...screen, [key]: !screen[key] };
            return {
              ...screen,
              fields: screen.fields.map((field) =>
                field.id === fieldId ? { ...field, [key]: !field[key] } : field
              ),
            };
          }),
        };
      })
    );
  };

  return (
    <div>
      <select
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        className="field-input mb-2 h-9 py-1 text-[13px]"
        aria-label="Filter screens by module"
      >
        <option value="all">All Modules · {TOTAL_PROFILE_SCREENS} screens</option>
        {modules.map((group, index) => (
          <option key={group.module} value={String(index)}>
            {group.module} · {group.screens.length} screens
          </option>
        ))}
      </select>
      <div className="max-h-[440px] space-y-1.5 overflow-y-auto pr-1 scroll-thin">
        {visible.map((group) => {
          const moduleState = moduleAccessState(group);
          const showHeaderToggle = filter === 'all';
          return (
            <div key={group.module}>
              <div className="mb-1 flex items-center justify-between px-0.5">
                {showHeaderToggle ? (
                  <button
                    type="button"
                    onClick={() => toggleModuleExpand(group.module)}
                    className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                    aria-expanded={group.expanded}
                  >
                    <Icon
                      name={group.expanded ? 'chevronDown' : 'chevronRight'}
                      size={12}
                      className="text-ink-faint"
                    />
                    <span className="truncate text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">
                      {group.module}
                    </span>
                    <span className="shrink-0 rounded bg-elevated px-1 py-0.5 text-[9px] text-ink-faint">
                      {group.screens.length} screens
                    </span>
                  </button>
                ) : (
                  <span className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">
                    {group.module}
                  </span>
                )}
                <Switch
                  state={moduleState}
                  onChange={(value) => setAllForModule(group.module, value)}
                  label={`${group.module} access`}
                />
              </div>
              {(group.expanded || filter !== 'all') && (
                <div className="mb-2 space-y-1.5">
                  {group.screens.map((screen) => {
                    const screenState = screenAccessState(screen);
                    return (
                      <div
                        key={screen.id}
                        className="overflow-hidden rounded-lg border border-line bg-surface"
                      >
                        <div className="flex items-center justify-between px-3 py-2">
                          <button
                            type="button"
                            onClick={() => toggleScreenExpand(group.module, screen.id)}
                            className="flex min-w-0 flex-1 items-center gap-2 text-left"
                            aria-expanded={screen.expanded}
                          >
                            <Icon
                              name={screen.expanded ? 'chevronDown' : 'chevronRight'}
                              size={13}
                              className="text-ink-faint"
                            />
                            <span className="truncate text-[12.5px] font-medium text-ink">
                              {screen.name}
                            </span>
                            {screen.fields && (
                              <span className="shrink-0 rounded bg-elevated px-1 py-0.5 text-[9px] text-ink-faint">
                                {screen.fields.length} fields
                              </span>
                            )}
                          </button>
                          <Switch
                            state={screenState}
                            onChange={(value) => setAllForScreen(group.module, screen.id, value)}
                            label={`${screen.name} access`}
                          />
                        </div>
                        {screen.expanded && (
                          <div className="border-t border-line px-3 pb-3 pt-2">
                            <div className="grid grid-cols-[1fr_48px_48px_48px_48px] items-center gap-1">
                              <div />
                              {['View', 'Edit', 'Create', 'Delete'].map((label) => (
                                <div
                                  key={label}
                                  className="text-center text-[9px] uppercase tracking-wider text-ink-faint"
                                >
                                  {label}
                                </div>
                              ))}
                              <div className="text-[11.5px] font-medium text-ink">Screen access</div>
                              {['view', 'edit', 'create', 'delete'].map((flag) => (
                                <div key={flag} className="flex justify-center">
                                  <Switch
                                    checked={!!screen[flag]}
                                    onChange={() => toggleFlag(group.module, screen.id, flag)}
                                    label={`${screen.name} ${flag}`}
                                  />
                                </div>
                              ))}
                            </div>
                            {screen.fields && (
                              <div className="mt-2.5 max-h-[220px] overflow-y-auto border-t border-dashed border-line pt-2.5 scroll-thin">
                                <div className="mb-1.5 text-[9.5px] font-semibold uppercase tracking-wider text-ink-faint">
                                  Fields · {screen.fields.length}
                                </div>
                                {screen.fields.map((field) => (
                                  <div
                                    key={field.id}
                                    className="grid grid-cols-[1fr_52px_52px] items-center gap-1 py-0.5"
                                  >
                                    <div className="truncate text-[11px] text-ink-muted" title={field.name}>
                                      {field.name}
                                    </div>
                                    <div className="flex justify-center">
                                      <Switch
                                        checked={field.view}
                                        onChange={() =>
                                          toggleFlag(group.module, screen.id, 'view', field.id)
                                        }
                                        label={`${field.name} view`}
                                      />
                                    </div>
                                    <div className="flex justify-center">
                                      <Switch
                                        checked={field.edit}
                                        onChange={() =>
                                          toggleFlag(group.module, screen.id, 'edit', field.id)
                                        }
                                        label={`${field.name} edit`}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ProfileForm({
  profile,
  accounts = [],
  segments = [],
  onClose,
  onSave,
  onDelete,
  busy = false,
  error = '',
}) {
  const isNew = !profile?.id;
  const [name, setName] = useState(profile?.role || '');
  const [status, setStatus] = useState(profile?.status !== 'Inactive');
  const [description, setDescription] = useState(profile?.description || '');
  const [providers, setProviders] = useState(() =>
    profile?.providers || buildProviderTree(accounts, segments)
  );
  const [screens, setScreens] = useState(() => {
    if (!profile?.screens?.length) {
      return buildScreenModules(profile?.preset || (profile?.id ? 'partial' : 'all'));
    }
    return profile.screens.map((group) => ({
      ...group,
      screens: group.screens.map((screen) => ({
        ...screen,
        view: screen.view ?? !!screen.enabled,
        edit: screen.edit ?? !!screen.enabled,
        create: screen.create ?? !!screen.enabled,
        delete: screen.delete ?? false,
        fields: screen.fields
          ? screen.fields.map((field) => ({
              ...field,
              view: field.view ?? !!field.enabled,
              edit: field.edit ?? !!field.enabled,
            }))
          : screen.fields,
      })),
    }));
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const snapshot = JSON.stringify({ name, status, description, providers, screens });
  const initialRef = useRef(snapshot);
  const dirty = snapshot !== initialRef.current;

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({
      ...(profile || {}),
      id: profile?.id,
      role: name.trim(),
      status: status ? 'Active' : 'Inactive',
      description: description.slice(0, 255),
      access: summarizeProfileAccess(providers, screens),
      providers,
      screens,
    });
  };

  return (
    <>
      <FormDrawer
        onClose={onClose}
        onSubmit={handleSubmit}
        title={isNew ? 'New Profile' : 'Edit Profile'}
        extraWide
        dirty={dirty}
        busy={busy}
        error={error}
        submitLabel="Save Profile"
        footer={
          <DrawerActions className="justify-between">
            <div>
              {!isNew && (
                <Button type="button" variant="secondary" onClick={() => setConfirmDelete(true)}>
                  <span className="text-danger">Delete</span>
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={busy || !name.trim()}>
                {busy ? 'Saving…' : 'Save Profile'}
              </Button>
            </div>
          </DrawerActions>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Profile Name" required>
            <TextInput
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Regional Manager"
            />
          </Field>
          <Field label="Status">
            <div className="flex h-10 items-center gap-2">
              <Switch checked={status} onChange={setStatus} label="Profile status" />
              <span className="text-sm text-ink-muted">{status ? 'Active' : 'Inactive'}</span>
            </div>
          </Field>
        </div>
        <Field label="Description" span2>
          <TextArea
            value={description}
            onChange={(event) => setDescription(event.target.value.slice(0, 255))}
            placeholder="What this profile is for..."
          />
        </Field>
        <div className="grid gap-5 pt-1 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">
              Service Providers
            </div>
            <ProviderTree providers={providers} setProviders={setProviders} />
          </div>
          <div>
            <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">
              Screens · grouped by module
            </div>
            <ScreenModulePanel modules={screens} setModules={setScreens} />
          </div>
        </div>
      </FormDrawer>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete this profile?"
        description={`${profile?.role || 'This profile'} will be removed. Users assigned to it keep their login but lose this permission set.`}
        confirmLabel="Delete profile"
        severity="danger"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          onDelete?.(profile);
        }}
      />
    </>
  );
}
