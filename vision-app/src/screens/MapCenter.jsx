import React, { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Badge, Page, PageHeader, Panel } from '../components/UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useAccounts } from '../hooks/useAccounts.js';
import { useDashboardAnalytics } from '../hooks/useConfig.js';

const PINS = [
  { id: 'SP · 1', x: 28, y: 58, label: 'Edmonton AB' },
  { id: 'SP · 2', x: 42, y: 72, label: 'Calgary Metro' },
  { id: 'SP · 3', x: 48, y: 55, label: 'Vancouver' },
  { id: 'SP · 4', x: 62, y: 48, label: 'Toronto' },
  { id: 'SP · 5', x: 74, y: 64, label: 'Winnipeg' },
  { id: 'SP · 6', x: 58, y: 70, label: 'Fairfax' },
];

export default function MapCenter() {
  const { navigate } = useStore();
  const accountsQuery = useAccounts();
  const analyticsQuery = useDashboardAnalytics();
  const [provider, setProvider] = useState('All');
  const [selected, setSelected] = useState(null);
  const accounts = accountsQuery.data || [];
  const visiblePins = PINS
    .map((pin, index) => ({ ...pin, account: accounts[index] }))
    .filter((pin) => provider === 'All' || pin.account?.id === provider);
  const liveDispatches = analyticsQuery.data?.liveDispatches || [];
  const dispatches = liveDispatches.filter(
    (d) => provider === 'All' || d.account === accounts.find((a) => a.id === provider)?.name
  );
  const updated = new Date().toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  return (
    <Page wide>
      <PageHeader
        overline="Tools"
        title="Map Center"
        description="Service-area snapshot from the current demo dataset. Filter by provider and select a pin for details."
        actions={
          <Badge color="slate">
            Last updated {updated}
          </Badge>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Panel className="lg:col-span-8" padded>
          <div className="mb-3 flex items-baseline justify-between">
            <div>
              <p className="type-overline">Geospatial</p>
              <p className="mt-1 font-display text-title-sm text-ink">Service areas</p>
            </div>
            <select className="field-input max-w-[220px]" value={provider} onChange={(e) => { setProvider(e.target.value); setSelected(null); }}>
              <option value="All">All providers</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div
            className="relative h-96 overflow-hidden rounded-panel border border-line bg-[linear-gradient(to_right,#e6ebe8_1px,transparent_1px),linear-gradient(to_bottom,#e6ebe8_1px,transparent_1px)]"
            style={{ backgroundSize: '24px 24px' }}
          >
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
              <path
                d="M5 80 Q 50 40 95 78"
                fill="rgba(11,95,73,0.06)"
                stroke="rgba(11,95,73,0.28)"
                strokeWidth="0.5"
              />
            </svg>
            {visiblePins.map((p) => (
              <button
                type="button"
                key={p.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                title={p.label}
                onClick={() => setSelected(p)}
                aria-label={`Open ${p.account?.name || p.label}`}
              >
                <span className={`block h-3 w-3 rounded-full ring-4 ${selected?.id === p.id ? 'bg-danger ring-danger/20' : 'bg-ink ring-ink/15'}`} />
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-ink-muted">
                  {p.id}
                </span>
              </button>
            ))}
          </div>
          {selected && <div className="mt-3 flex items-center justify-between rounded-panel border border-line p-3 text-sm">
            <div><strong>{selected.account?.name || selected.label}</strong><span className="ml-2 text-ink-muted">{selected.account?.billing?.city}, {selected.account?.billing?.state}</span></div>
            {selected.account && <button className="link-brand text-xs" onClick={() => navigate('accountDetail', { accountId: selected.account.id, tab: 'details' })}>Open provider</button>}
          </div>}
        </Panel>

        <div className="space-y-6 lg:col-span-4">
          <Panel padded>
            <p className="type-overline">Queue</p>
            <p className="mt-1 font-display text-title-sm text-ink">Active dispatches</p>
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {dispatches.map((d) => (
                <li key={d.id} className="py-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="mono font-medium text-ink">{d.id}</span>
                    <span className="mono text-xs font-semibold tabular-nums text-ink-soft">
                      {d.pct}%
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-ink-muted">
                    {d.account} · {d.truck}
                  </div>
                  <div className="mt-2 h-1 w-full bg-elevated">
                    <div className="h-1 bg-ink" style={{ width: `${d.pct}%` }} />
                  </div>
                </li>
              ))}
              {!dispatches.length && <li className="py-6 text-center text-sm text-ink-muted">No dispatches in this snapshot.</li>}
            </ul>
          </Panel>

          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-line bg-line">
            {[
              { icon: 'mapPin', value: visiblePins.length, label: 'Cities' },
              { icon: 'truck', value: new Set(dispatches.map((d) => d.truck)).size, label: 'Trucks shown' },
              { icon: 'activity', value: dispatches.length, label: 'Dispatches' },
              { icon: 'clock', value: 'Snapshot', label: 'Data mode' },
            ].map((s) => (
              <div key={s.label} className="bg-surface p-4">
                <Icon name={s.icon} size={14} className="text-ink-faint" />
                <div className="font-display mt-2 text-lg font-semibold text-ink">{s.value}</div>
                <div className="type-overline mt-1 !normal-case !tracking-normal">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Page>
  );
}
