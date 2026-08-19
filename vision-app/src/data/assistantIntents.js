/**
 * Shared persona-aware AI assistant content and intent matching.
 * Used by VisionChat (sidebar companion).
 */

export const PERSONA_CONTENT = {
  rehrig: {
    eyebrow: 'Platform AI',
    heading: 'Welcome back! What would you like to work on?',
    intro:
      'I can help review service providers, start onboarding, find contacts, or open configuration tools.',
    drawerTitle: 'Vision AI',
    drawerDescription: 'Ask about providers, onboarding, contacts, or Workspace.',
    cards: [
      {
        title: 'Review Service Providers',
        description: 'See provider status, account details, and recent onboarding activity.',
        prompt: 'Show me the service provider registry',
        action: { label: 'View providers', module: 'accounts' },
      },
      {
        title: 'Onboard a New Provider',
        description: 'Start the guided onboarding flow for a new service provider.',
        prompt: 'Help me onboard a new service provider',
        action: { label: 'Start onboarding', handler: 'onboard' },
      },
      {
        title: 'Platform Configuration',
        description: 'Manage service types, integrations, notification rules, and users.',
        prompt: 'Take me to platform configuration',
        action: { label: 'Open Workspace', module: 'setup', params: { section: 'userMgmt' } },
      },
    ],
    chips: [
      'Review provider contracts',
      'Onboard new provider',
      'Find provider contacts',
      'Open Workspace',
    ],
    intents: [
      {
        terms: ['onboard', 'new provider', 'application'],
        reply:
          'I can open the guided onboarding flow. You can upload a contract or enter provider details manually.',
        action: { label: 'Start onboarding', handler: 'onboard' },
      },
      {
        terms: ['contact', 'people'],
        reply: 'The contact directory lists contacts across every service provider account.',
        action: { label: 'Open contacts', module: 'contacts' },
      },
      {
        terms: ['configure', 'configuration', 'workspace', 'user', 'permission'],
        reply:
          'Workspace contains user management, your account settings, permission profiles, and the developer console.',
        action: { label: 'Open Workspace', module: 'setup', params: { section: 'userMgmt' } },
      },
      {
        terms: ['contract'],
        reply:
          'Contract Onboarding extracts provider information from a contract and guides you through any missing fields.',
        action: { label: 'Open Contract Onboarding', module: 'contractOnboarding' },
      },
      {
        terms: ['provider', 'registry', 'account'],
        reply:
          'The Service Provider Registry shows all active and inactive providers, their contacts, and account details.',
        action: { label: 'View providers', module: 'accounts' },
      },
      {
        terms: ['qalert', 'sarasota'],
        reply:
          'QAlert lists citizen requests synced for Sarasota County and the last successful pull.',
        action: { label: 'Open QAlert', module: 'qalert' },
      },
      {
        terms: ['holiday', 'login history', 'audit'],
        reply:
          'Holiday schedule and Login History live under Configure for Rehrig administrators.',
        action: { label: 'Open holiday schedule', module: 'holidays' },
      },
    ],
    fallback:
      'I can help with service providers, onboarding, contacts, contracts, QAlert, holidays, and Workspace. Try one of the suggested prompts.',
  },
  sp: {
    eyebrow: 'Operations AI',
    heading: 'Welcome back! How can I help operations today?',
    intro:
      'Ask about work orders, dispatches, routes, fleet activity, or operational reporting.',
    drawerTitle: 'Vision AI',
    drawerDescription: 'Ask about work orders, dispatches, fleet, or analytics.',
    cards: [
      {
        title: 'Work Order Priorities',
        description: 'Review open work orders and identify tickets that need attention.',
        prompt: 'Show me work order priorities',
        action: { label: 'View work orders', module: 'workOrders' },
      },
      {
        title: 'Active Dispatches',
        description: 'Check dispatch status and work currently in route or in progress.',
        prompt: 'Show active dispatches',
        action: { label: 'View dispatches', module: 'dispatches' },
      },
      {
        title: 'Fleet & Route Health',
        description: 'Review trucks, routes, maintenance profiles, and map activity.',
        prompt: 'Review fleet and route health',
        action: { label: 'Review fleet', module: 'trucks' },
      },
    ],
    chips: [
      'Review open work orders',
      'Show active dispatches',
      'Check route activity',
      'Open analytics',
    ],
    intents: [
      {
        terms: ['work order', 'ticket', 'priority', 'breach'],
        reply:
          'Open Work Orders shows current status, request type, location, and due dates so you can prioritize the queue.',
        action: { label: 'Open work orders', module: 'workOrders' },
      },
      {
        terms: ['dispatch', 'in route'],
        reply:
          'The Dispatches view tracks work currently assigned, in route, and in progress.',
        action: { label: 'Open dispatches', module: 'dispatches' },
      },
      {
        terms: ['route', 'map'],
        reply:
          'Use Map Center for geographic activity, or open your provider Routes for collection schedules.',
        action: { label: 'Open Map Center', module: 'mapCenter' },
      },
      {
        terms: ['truck', 'fleet', 'maintenance'],
        reply:
          'The Trucks view shows fleet records and current status. Maintenance Route Profiles contain reusable service patterns.',
        action: { label: 'Review trucks', module: 'trucks' },
      },
      {
        terms: ['contact', 'people'],
        reply: 'Your account Contacts tab lists people linked to this service provider.',
        action: { label: 'Open contacts', module: 'account', params: { tab: 'contacts' } },
      },
      {
        terms: ['analytics', 'report', 'dashboard'],
        reply:
          'Analytics contains operational reports and dashboards for trends, service levels, and performance.',
        action: { label: 'Open analytics', module: 'analytics', params: { view: 'dashboards' } },
      },
      {
        terms: ['woit', 'bulk import', 'import'],
        reply:
          'WOIT Import uploads a CSV to create or close work orders for this service provider.',
        action: { label: 'Open WOIT Import', module: 'bulkImport' },
      },
      {
        terms: ['chatter', 'approval', 'sharing', 'insight'],
        reply:
          'Collaboration has Chatter, Record Sharing, and Customer Insights. Approvals sit under Operations.',
        action: { label: 'Open Chatter', module: 'chatter' },
      },
    ],
    fallback:
      'I can help with work orders, dispatches, routes, trucks, maps, WOIT, Chatter, and analytics. Try one of the suggested prompts.',
  },
  customer: {
    eyebrow: 'Service AI',
    heading: 'Welcome back! How can I help with your service?',
    intro:
      'Ask about your locations, service requests, notifications, or account information.',
    drawerTitle: 'Vision AI',
    drawerDescription: 'Ask about locations, requests, notifications, or your account.',
    cards: [
      {
        title: 'My Service Locations',
        description: 'Review linked locations, collection routes, and service details.',
        prompt: 'Show my service locations',
        action: { label: 'View locations', module: 'myLocations' },
      },
      {
        title: 'Service Requests',
        description: 'Check existing work orders or submit a new service request.',
        prompt: 'Show my service requests',
        action: { label: 'View work orders', module: 'myWorkOrders' },
      },
      {
        title: 'Recent Notifications',
        description: 'Read collection reminders, delivery updates, and service messages.',
        prompt: 'Show my recent notifications',
        action: { label: 'View notifications', module: 'myNotifications' },
      },
    ],
    chips: [
      'When is my collection?',
      'Review service requests',
      'Show notifications',
      'Open my account',
    ],
    intents: [
      {
        terms: ['location', 'collection', 'route', 'pickup', 'when'],
        reply:
          'My Locations shows the collection route and service information linked to your account.',
        action: { label: 'View locations', module: 'myLocations' },
      },
      {
        terms: ['request', 'work order', 'issue', 'missed'],
        reply:
          'My Work Orders lists your service requests and their status. You can also submit a new request there.',
        action: { label: 'View service requests', module: 'myWorkOrders' },
      },
      {
        terms: ['notification', 'message', 'reminder', 'delivery'],
        reply:
          'Notifications contains your recent collection reminders, delivery updates, and service messages.',
        action: { label: 'View notifications', module: 'myNotifications' },
      },
      {
        terms: ['account', 'profile', 'email'],
        reply:
          'My Account shows your portal profile, customer ID, and associated service provider.',
        action: { label: 'Open my account', module: 'myAccount' },
      },
    ],
    fallback:
      'I can help with service locations, collection routes, work orders, notifications, and your account. Try one of the suggested prompts.',
  },
};

export function getPersonaAssistantContent(persona) {
  return PERSONA_CONTENT[persona] || PERSONA_CONTENT.sp;
}

/** True when the signed-in role may actually reach an assistant action's destination. */
export function canRunAssistantAction(action, { canAccessModule, canTab } = {}) {
  if (!action) return true;
  if (action.handler === 'onboard') return !!canAccessModule?.('onboarding');
  if (!action.module) return false;
  if (!canAccessModule?.(action.module)) return false;
  if (action.module === 'account' && action.params?.tab) return !!canTab?.(action.params.tab);
  return true;
}

/**
 * Drop cards, intents, and chips whose destination the current role cannot open,
 * so the assistant never routes a user into the No Access screen.
 */
export function filterAssistantContent(content, access) {
  const allowed = (action) => canRunAssistantAction(action, access);
  const intents = content.intents.filter((intent) => allowed(intent.action));
  let cards = content.cards.filter((card) => allowed(card.action));
  if (!cards.length) {
    cards = intents.slice(0, 3).map((intent) => ({
      title: intent.action.label,
      description: intent.reply,
      prompt: intent.terms[0],
      action: intent.action,
    }));
  }
  const chips = content.chips.filter((chip) => {
    const match = matchIntent(content.intents, chip);
    return !match || allowed(match.action);
  });
  return { ...content, cards, intents, chips };
}

function matchIntent(intents, prompt) {
  const value = String(prompt || '').toLowerCase();
  return intents.find((intent) => intent.terms.some((term) => value.includes(term))) || null;
}

export function resolveIntent(content, prompt) {
  return (
    matchIntent(content.intents, prompt) || {
      reply: content.fallback,
      action: null,
    }
  );
}

/** Run a shared assistant action (navigate or onboard handler). */
export function runAssistantAction(action, { navigate, onOnboard, canAccessModule, canTab }) {
  if (!action) return false;
  if (!canRunAssistantAction(action, { canAccessModule, canTab })) return false;
  if (action.handler === 'onboard') {
    onOnboard?.();
    return true;
  }
  if (action.module) {
    navigate?.(action.module, action.params);
    return true;
  }
  return false;
}
