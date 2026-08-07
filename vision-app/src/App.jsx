import React from 'react';
import { useStore } from './state/AppStore.jsx';
import { useAuth } from './state/AuthContext.jsx';
import { useAccounts } from './hooks/useAccounts.js';
import { useCompleteOnboarding } from './hooks/useOnboarding.js';
import TopBar from './components/TopBar.jsx';
import GlobalAssistant from './components/GlobalAssistant.jsx';
import { Toast } from './components/UI.jsx';
import Login from './screens/Login.jsx';
import RegistryHome from './screens/RegistryHome.jsx';
import AccountsList from './screens/AccountsList.jsx';
import NoAccess from './screens/NoAccess.jsx';
import Dashboard from './screens/Dashboard.jsx';
import CustomerHome from './screens/CustomerHome.jsx';
import AccountDetail from './screens/AccountDetail.jsx';
import Wizard from './screens/wizard/Wizard.jsx';
import { MasterConfig } from './screens/Configs.jsx';
import Setup from './screens/Setup.jsx';
import { GenericList } from './screens/RecordScreens.jsx';
import ContactsDirectory from './screens/ContactsDirectory.jsx';
import MapCenter from './screens/MapCenter.jsx';
import BulkImport from './screens/BulkImport.jsx';
import ContractOnboarding from './screens/ContractOnboarding.jsx';
import { getErrorMessage } from './lib/errors.js';
import { onboardingNavParams, parseOnboardingReturn } from './utils/appNavigation.js';

function Router({ onOnboard }) {
  const { state, persona, canAccessModule, navigate, toast } = useStore();
  const completeOnboarding = useCompleteOnboarding();
  const accountsQuery = useAccounts();
  const { module, params } = state.nav;

  const GATE = {
    home: 'home',
    accounts: 'accounts',
    accountDetail: 'accounts',
    account: 'account',
    contacts: 'contacts',
    serviceTypes: 'serviceTypes',
    locationTypes: 'locationTypes',
    assetTypes: 'assetTypes',
    productTypes: 'productTypes',
    apiIntegrations: 'apiIntegrations',
    notificationConfig: persona === 'rehrig' ? 'notificationConfig' : 'configure',
    onboarding: 'onboarding',
    contractOnboarding: 'contractOnboarding',
    setup: 'setup',
    workOrders: 'workOrders',
    dispatches: 'dispatches',
    assets: 'assets',
    trucks: 'trucks',
    locations: 'locations',
    maintenanceRouteProfiles: 'maintenanceRouteProfiles',
    notesAttachments: 'notesAttachments',
    requestTypeResolutions: 'requestTypeResolutions',
    aggregatedTips: 'aggregatedTips',
    individualTips: 'individualTips',
    mapCenter: 'mapCenter',
    bulkImport: 'bulkImport',
    analytics: 'analytics',
    myLocations: 'myLocations',
    myWorkOrders: 'myWorkOrders',
    myNotifications: 'myNotifications',
    myAccount: 'myAccount',
  };

  const gateKey = GATE[module];
  if (gateKey && !canAccessModule(gateKey)) return <NoAccess />;

  switch (module) {
    case 'home':
      if (persona === 'rehrig') return <RegistryHome onOnboard={onOnboard} />;
      if (persona === 'customer') return <CustomerHome view="home" />;
      return <Dashboard />;
    case 'accounts':
      return <AccountsList onOnboard={onOnboard} />;
    case 'accountDetail':
      return <AccountDetail accountId={params.accountId} tab={params.tab || 'details'} />;
    case 'account': {
      const accounts = accountsQuery.data || [];
      const own =
        accounts.find((a) => state.currentUser?.accountIds?.includes(a.id)) ||
        (!state.currentUser?.accountIds?.length ? accounts[0] : null);
      return <AccountDetail accountId={own?.id} tab={params.tab || 'details'} />;
    }
    case 'contacts':
      return <ContactsDirectory />;
    case 'serviceTypes':
      return <MasterConfig configKey="serviceTypes" />;
    case 'locationTypes':
      return <MasterConfig configKey="locationTypes" />;
    case 'assetTypes':
      return <MasterConfig configKey="assetTypes" />;
    case 'productTypes':
      return <MasterConfig configKey="productTypes" />;
    case 'apiIntegrations':
      return <MasterConfig configKey="apiIntegrations" />;
    case 'notificationConfig':
      return <MasterConfig configKey="notificationConfig" />;
    case 'setup':
      return <Setup />;
    case 'workOrders':
    case 'dispatches':
    case 'assets':
    case 'trucks':
    case 'locations':
    case 'maintenanceRouteProfiles':
    case 'notesAttachments':
    case 'requestTypeResolutions':
    case 'aggregatedTips':
    case 'individualTips':
      return <GenericList kind={module} />;
    case 'mapCenter':
      return <MapCenter />;
    case 'bulkImport':
      return <BulkImport />;
    case 'onboarding': {
      const returnNav = parseOnboardingReturn(params);
      return (
        <Wizard
          key={params.draftId || 'new'}
          draftId={params.draftId || null}
          onClose={() => navigate(returnNav.module, returnNav.params)}
        />
      );
    }
    case 'contractOnboarding':
      return (
        <ContractOnboarding
          onComplete={async (form) => {
            try {
              const account = await completeOnboarding.mutateAsync({ form });
              toast('Contract onboarding completed');
              navigate('accountDetail', { accountId: account.id, tab: 'details' });
            } catch (error) {
              toast(getErrorMessage(error, 'Contract onboarding failed.'), 'danger');
              throw error;
            }
          }}
        />
      );
    case 'analytics':
      return <GenericList kind="analytics" view={params.view} />;
    case 'myLocations':
    case 'myWorkOrders':
    case 'myNotifications':
    case 'myAccount':
      return <CustomerHome view={module} />;
    default:
      return <NoAccess />;
  }
}

export default function App() {
  const { state, navigate } = useStore();
  const { bootstrapping } = useAuth();

  const openOnboard = (draftId = null) => {
    navigate(
      'onboarding',
      onboardingNavParams({
        draftId: typeof draftId === 'string' ? draftId : null,
        from: state.nav,
      })
    );
  };

  if (bootstrapping) {
    return (
      <div className="flex h-full items-center justify-center bg-canvas text-sm text-ink-muted" role="status">
        <span className="loading-spinner mr-2" aria-hidden="true" />
        Restoring session…
      </div>
    );
  }

  if (!state.currentUser) return <Login />;

  const isOnboarding = state.nav.module === 'onboarding';

  return (
    <div className="app-shell flex h-full w-full flex-col font-sans text-ink">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <TopBar />
      <main
        id="main-content"
        tabIndex={-1}
        className={
          isOnboarding
            ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
            : 'min-h-0 flex-1 overflow-y-auto scroll-thin'
        }
      >
        <Router onOnboard={openOnboard} />
      </main>
      <GlobalAssistant onOnboard={openOnboard} />
      <Toast message={state.toast} />
    </div>
  );
}
