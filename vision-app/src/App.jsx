import React, { useState } from 'react';
import { useStore } from './state/AppStore.jsx';
import { useAuth } from './state/AuthContext.jsx';
import { useAccounts } from './hooks/useAccounts.js';
import { useCompleteOnboarding } from './hooks/useOnboarding.js';
import Sidebar from './components/Sidebar.jsx';
import TopBar from './components/TopBar.jsx';
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
import { appModeLabel, isDemoMode } from './config/appMode.js';

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
      return persona === 'rehrig' ? <RegistryHome onOnboard={onOnboard} /> : <Dashboard />;
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
  const { state } = useStore();
  const { bootstrapping } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [resumeDraftId, setResumeDraftId] = useState(null);

  const openOnboard = (draftId = null) => {
    setResumeDraftId(typeof draftId === 'string' ? draftId : null);
    setWizardOpen(true);
  };

  const closeWizard = () => {
    setWizardOpen(false);
    setResumeDraftId(null);
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

  const toggleSidebar = () => {
    if (window.matchMedia('(max-width: 767px)').matches) {
      setMobileSidebarOpen((open) => !open);
    } else {
      setCollapsed((value) => !value);
    }
  };

  return (
    <div className="app-shell flex h-full w-full font-sans text-ink">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <div className="border-b border-line bg-elevated/80 px-3 py-1 text-center text-[11px] font-medium uppercase tracking-wide text-ink-muted sm:px-5">
          {appModeLabel()} instance
          {isDemoMode()
            ? ' · local seed · no backend'
            : ' · connected to vision-api'}
        </div>
        <TopBar onToggleSidebar={toggleSidebar} />
        <main
          id="main-content"
          tabIndex={-1}
          className="min-h-0 flex-1 overflow-y-auto scroll-thin"
        >
          <Router onOnboard={openOnboard} />
        </main>
      </div>
      {wizardOpen && (
        <Wizard key={resumeDraftId || 'new'} draftId={resumeDraftId} onClose={closeWizard} />
      )}
      <Toast message={state.toast} />
    </div>
  );
}
