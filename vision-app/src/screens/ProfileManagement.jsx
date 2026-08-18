import React, { useEffect, useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import {
  Button,
  Page,
  PageHeader,
  Panel,
  SearchField,
  Select,
  StatusDot,
  Table,
  Toolbar,
} from '../components/UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useAccounts, useSegments } from '../hooks/useAccounts.js';
import { SEED_PROFILES } from '../data/profileAccess.js';
import ProfileForm from './ProfileForm.jsx';

const PROFILES_KEY = 'vision.ui.profiles';

function readProfiles() {
  try {
    const raw = window.localStorage.getItem(PROFILES_KEY);
    if (!raw) return SEED_PROFILES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : SEED_PROFILES;
  } catch {
    return SEED_PROFILES;
  }
}

function writeProfiles(profiles) {
  try {
    window.localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch {
    /* ignore quota / private-mode failures */
  }
}

function todayLabel() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

export default function ProfileManagement() {
  const { state, toast } = useStore();
  const accountsQuery = useAccounts();
  const segmentsQuery = useSegments();
  const [profiles, setProfiles] = useState(readProfiles);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    writeProfiles(profiles);
  }, [profiles]);

  const accounts = accountsQuery.data || [];
  const segments = segmentsQuery.data || [];
  const actor = state.currentUser?.name || 'You';

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return profiles.filter((profile) => {
      if (statusFilter !== 'all' && profile.status !== statusFilter) return false;
      if (!term) return true;
      return [profile.role, profile.access, profile.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [profiles, query, statusFilter]);

  const saveProfile = (next) => {
    const stamp = {
      lastUpdatedBy: actor,
      lastUpdatedDate: todayLabel(),
    };
    setProfiles((prev) => {
      if (next.id) {
        return prev.map((profile) => (profile.id === next.id ? { ...profile, ...next, ...stamp } : profile));
      }
      return [
        {
          ...next,
          id: `vp-${Date.now().toString(36)}`,
          created: actor,
          createdDate: todayLabel(),
          ...stamp,
        },
        ...prev,
      ];
    });
    toast(next.id ? 'Profile saved' : 'Profile created');
    setEditing(null);
  };

  const deleteProfile = (profile) => {
    setProfiles((prev) => prev.filter((item) => item.id !== profile.id));
    toast('Profile deleted');
    setEditing(null);
  };

  return (
    <Page wide>
      <PageHeader
        overline="Configure"
        title="Profile Management"
        description="Existing profiles and their access. Create a new profile to define a fresh permission set."
        actions={
          <Button variant="primary" onClick={() => setEditing({})}>
            <Icon name="plus" size={14} /> New Profile
          </Button>
        }
      />

      <Panel>
        <Toolbar>
          <Select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by status"
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' },
            ]}
          />
          <SearchField
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search profiles…"
            label="Search profiles"
          />
          <div className="ml-auto shrink-0 text-sm font-medium text-ink">
            Profiles · {filtered.length}
          </div>
        </Toolbar>
        <Table columns={['Profile', 'Access', 'Status', 'Created', 'Last updated']}>
          {filtered.map((profile) => (
            <tr
              key={profile.id}
              className="cursor-pointer interactive hover:bg-elevated/70"
              onClick={() => setEditing(profile)}
            >
              <td className="max-w-[12rem] truncate px-4 py-3 font-medium text-ink">{profile.role}</td>
              <td className="max-w-[16rem] truncate px-4 py-3 text-ink-muted">{profile.access}</td>
              <td className="px-4 py-3">
                {profile.status === 'Active' ? (
                  <StatusDot color="emerald" label="Active" />
                ) : (
                  <StatusDot color="slate" label="Inactive" />
                )}
              </td>
              <td className="px-4 py-3 text-ink-muted">
                {profile.created} · {profile.createdDate}
              </td>
              <td className="px-4 py-3 text-ink-muted">
                {profile.lastUpdatedBy} · {profile.lastUpdatedDate}
              </td>
            </tr>
          ))}
        </Table>
        {!filtered.length && (
          <div className="px-4 py-10 text-center text-sm text-ink-muted">
            No profiles match these filters.
          </div>
        )}
      </Panel>

      {editing && (
        <ProfileForm
          profile={editing.id ? editing : null}
          profiles={profiles}
          accounts={accounts}
          segments={segments}
          onClose={() => setEditing(null)}
          onSave={saveProfile}
          onDelete={deleteProfile}
        />
      )}
    </Page>
  );
}
