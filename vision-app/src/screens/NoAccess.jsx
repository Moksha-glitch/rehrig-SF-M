import React from 'react';
import Icon from '../components/Icon.jsx';
import { Button, Page } from '../components/UI.jsx';
import { useStore } from '../state/AppStore.jsx';

export default function NoAccess() {
  const { state, navigate, persona } = useStore();
  const role = state.currentUser?.role;
  const home = persona === 'customer' ? 'myLocations' : 'home';
  const requested = state.nav?.module || 'this page';
  const moduleLabel = requested.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
  const scope = state.currentUser?.scopeLabel;

  return (
    <Page>
      <div className="flex min-h-[60vh] flex-col items-start justify-center">
        <p className="type-overline">Access</p>
        <h2 className="font-display mt-2 text-display-md text-ink">You don&apos;t have access</h2>
        <div className="hairline-rule mt-5 w-24 animate-rule-draw" />
        <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-muted">
          <strong>{moduleLabel}</strong> is not available to the {role || 'current'} role
          {scope ? ` with scope “${scope}”` : ''}. Return to your permitted home page, or contact
          your administrator and include the page name above.
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => navigate(home)}>
            <Icon name="home" size={15} /> Back to home
          </Button>
          <Button variant="secondary" onClick={() => window.history.back()}>Go back</Button>
        </div>
      </div>
    </Page>
  );
}
