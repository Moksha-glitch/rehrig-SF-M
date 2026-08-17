import React, { useMemo } from 'react';
import Icon from '../components/Icon.jsx';
import { Page, PageHeader, Panel, Button, Badge, AsyncState } from '../components/UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useNotifications, useMarkNotifications } from '../hooks/useConfig.js';
import { getErrorMessage } from '../lib/errors.js';

const SEVERITY = {
  warning: { color: 'amber', icon: 'alert' },
  success: { color: 'green', icon: 'checkCircle' },
  info: { color: 'sky', icon: 'bell' },
  danger: { color: 'rose', icon: 'alert' },
};

export default function Notifications() {
  const { navigate } = useStore();
  const notificationsQuery = useNotifications();
  const { markOne, markAll } = useMarkNotifications();
  const notices = useMemo(
    () =>
      [...(notificationsQuery.data || [])].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      ),
    [notificationsQuery.data]
  );
  const unread = notices.filter((notice) => !notice.read).length;

  return (
    <Page>
      <PageHeader
        overline="Inbox"
        title="Notifications"
        description={
          unread
            ? `${unread} unread · ${notices.length} total`
            : `${notices.length} notification${notices.length === 1 ? '' : 's'}`
        }
        actions={
          unread > 0 ? (
            <Button variant="secondary" onClick={() => markAll.mutate()}>
              Mark all read
            </Button>
          ) : null
        }
      />

      <AsyncState
        loading={notificationsQuery.isLoading}
        error={notificationsQuery.isError ? getErrorMessage(notificationsQuery.error) : null}
        onRetry={() => notificationsQuery.refetch()}
      >
        <Panel>
          <ul className="divide-y divide-line">
            {notices.map((notice) => {
              const tone = SEVERITY[notice.severity] || SEVERITY.info;
              return (
                <li key={notice.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!notice.read) markOne.mutate(notice.id);
                      if (notice.module) navigate(notice.module);
                    }}
                    className="flex w-full items-start gap-3 px-5 py-4 text-left interactive hover:bg-elevated/70"
                  >
                    <Icon
                      name={tone.icon}
                      size={16}
                      className={`mt-0.5 shrink-0 ${notice.read ? 'text-ink-faint' : 'text-brand'}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={`truncate text-sm ${
                            notice.read ? 'font-medium text-ink-soft' : 'font-semibold text-ink'
                          }`}
                        >
                          {notice.title}
                        </p>
                        {!notice.read && <Badge color={tone.color}>New</Badge>}
                      </div>
                      {notice.detail && (
                        <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{notice.detail}</p>
                      )}
                      {notice.createdAt && (
                        <p className="mt-1 text-[11px] text-ink-faint">
                          {new Date(notice.createdAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
            {!notices.length && (
              <li className="px-5 py-10 text-center text-sm text-ink-muted">
                You have no notifications.
              </li>
            )}
          </ul>
        </Panel>
      </AsyncState>
    </Page>
  );
}
