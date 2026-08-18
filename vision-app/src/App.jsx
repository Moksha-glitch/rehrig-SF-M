import React, { useEffect, useRef, useState } from 'react';
import { useStore } from './state/AppStore.jsx';
import { useAuth } from './state/AuthContext.jsx';
import { useAccounts } from './hooks/useAccounts.js';
import { useCompleteOnboarding } from './hooks/useOnboarding.js';
import TopBar from './components/TopBar.jsx';
import SideNav from './components/SideNav.jsx';
import VisionChat from './components/VisionChat.jsx';
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
import ProfileManagement from './screens/ProfileManagement.jsx';
import { GenericList } from './screens/RecordScreens.jsx';
import ContactsDirectory from './screens/ContactsDirectory.jsx';
import CustomersDirectory from './screens/CustomersDirectory.jsx';
import MapCenter from './screens/MapCenter.jsx';
import BulkImport from './screens/BulkImport.jsx';
import ContractOnboarding from './screens/ContractOnboarding.jsx';
import Activity from './screens/Activity.jsx';
import Notifications from './screens/Notifications.jsx';
import Devices from './screens/Devices.jsx';
import ReportSubscriptions from './screens/ReportSubscriptions.jsx';
import UserAccount from './screens/UserAccount.jsx';
import V13Workstreams from './screens/V13Workstreams.jsx';
import { getErrorMessage } from './lib/errors.js';
import { onboardingNavParams, parseOnboardingReturn } from './utils/appNavigation.js';

const SIDEBAR_COLLAPSED_KEY = 'vision.ui.sidebarCollapsed';

function readSidebarOpen() {
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) !== '1';
  } catch {
    return true;
  }
}

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
    customers: 'customers',
    serviceTypes: 'serviceTypes',
    locationTypes: 'locationTypes',
    assetTypes: 'assetTypes',
    productTypes: 'productTypes',
    device: 'device',
    truck: 'truck',
    apiIntegrations: 'apiIntegrations',
    notificationConfig: 'notificationConfig',
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
    devices: 'devices',
    activity: 'activity',
    notifications: 'notifications',
    reportSubscriptions: 'reportSubscriptions',
    analytics: 'analytics',
    myLocations: 'myLocations',
    myWorkOrders: 'myWorkOrders',
    myNotifications: 'myNotifications',
    myAccount: 'userAccount',
    userAccount: 'userAccount',
    chatter: 'chatter',
    approvals: 'approvals',
    qalert: 'qalert',
    customerInsights: 'customerInsights',
    recordSharing: 'recordSharing',
    holidays: 'holidays',
    automationCenter: 'automationCenter',
    loginHistory: 'loginHistory',
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
    case 'customers':
      return <CustomersDirectory />;
    case 'serviceTypes':
      return <MasterConfig configKey="serviceTypes" />;
    case 'locationTypes':
      return <MasterConfig configKey="locationTypes" />;
    case 'assetTypes':
      return <MasterConfig configKey="assetTypes" />;
    case 'productTypes':
      return <MasterConfig configKey="productTypes" />;
    case 'device':
      return <MasterConfig configKey="device" />;
    case 'truck':
      return <MasterConfig configKey="truck" />;
    case 'apiIntegrations':
      return <MasterConfig configKey="apiIntegrations" />;
    case 'notificationConfig':
      return <MasterConfig configKey="notificationConfig" />;
    case 'setup':
      if (params.section === 'profileMgmt') return <ProfileManagement />;
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
    case 'devices':
      return <Devices />;
    case 'activity':
      return <Activity />;
    case 'notifications':
      return <Notifications />;
    case 'reportSubscriptions':
      return <ReportSubscriptions />;
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
      return <CustomerHome view={module} />;
    case 'myAccount':
    case 'userAccount':
      return <UserAccount />;
    case 'chatter':
    case 'approvals':
    case 'qalert':
    case 'customerInsights':
    case 'recordSharing':
    case 'holidays':
    case 'automationCenter':
    case 'loginHistory':
      return <V13Workstreams kind={module} />;
    default:
      return <NoAccess />;
  }
}

export default function App() {
  const { state, navigate, assistantOpen, openAssistant, closeAssistant } = useStore();
  const { bootstrapping } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(readSidebarOpen);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, sidebarOpen ? '0' : '1');
    } catch {
      /* ignore quota / private-mode failures */
    }
  }, [sidebarOpen]);

  const prevModuleRef = useRef(state.nav.module);
  const wasLoggedIn = useRef(false);

  useEffect(() => {
    if (!state.currentUser) {
      wasLoggedIn.current = false;
      return;
    }

    const loggedInNow = !wasLoggedIn.current;
    wasLoggedIn.current = true;

    const previous = prevModuleRef.current;
    prevModuleRef.current = state.nav.module;

    if (loggedInNow) {
      openAssistant();
      return;
    }
    if (previous !== state.nav.module) closeAssistant();
  }, [state.currentUser, state.nav.module, openAssistant, closeAssistant]);

  const toggleSidebar = () => setSidebarOpen((open) => !open);

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
    <div className="app-shell flex h-full min-h-0 min-w-0 w-full overflow-x-hidden font-sans text-ink">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      {!isOnboarding && <SideNav open={sidebarOpen} onToggle={toggleSidebar} />}
      {!isOnboarding && assistantOpen && (
        <VisionChat onOnboard={openOnboard} onClose={closeAssistant} />
      )}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
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
      </div>
      <Toast message={state.toast} />
    </div>
  );
}
