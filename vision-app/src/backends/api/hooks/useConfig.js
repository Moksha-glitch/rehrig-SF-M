import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { configService } from '../../../services/configService.js';
import { useAuth } from '../../../state/authContextBase.js';

export function useConfigList(configKey) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['config', configKey],
    queryFn: () => configService.list(configKey),
    enabled: isAuthenticated && !!configKey,
  });
}

export function useApiIntegrations() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['api-integrations'],
    queryFn: () => configService.apiIntegrations(),
    enabled: isAuthenticated,
  });
}

export function useNotificationConfig() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['notification-config'],
    queryFn: () => configService.notificationConfig(),
    enabled: isAuthenticated,
  });
}

export function useNotifications() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => configService.notifications(),
    enabled: isAuthenticated,
  });
}

export function useDashboardAnalytics() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => configService.dashboardAnalytics(),
    enabled: isAuthenticated,
  });
}

export function useConfigMutations(configKey) {
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: (item) => configService.create(configKey, item),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['config', configKey] }),
  });
  const remove = useMutation({
    mutationFn: (id) => configService.remove(configKey, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['config', configKey] }),
  });
  return { create, remove };
}

export function useApiIntegrationMutations() {
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: (item) => configService.createApiIntegration(item),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-integrations'] }),
  });
  const update = useMutation({
    mutationFn: ({ id, changes }) => configService.updateApiIntegration(id, changes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-integrations'] }),
  });
  return { create, update };
}

export function useNotificationRuleMutations() {
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: (item) => configService.createNotificationRule(item),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification-config'] }),
  });
  const update = useMutation({
    mutationFn: ({ id, changes }) => configService.updateNotificationRule(id, changes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification-config'] }),
  });
  return { create, update };
}

export function useToggleNotificationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }) => configService.toggleNotification(id, enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification-config'] }),
  });
}

export function useMarkNotifications() {
  const qc = useQueryClient();
  const markOne = useMutation({
    mutationFn: (id) => configService.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const markAll = useMutation({
    mutationFn: () => configService.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  return { markOne, markAll };
}

export function useReportSpecs() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['report-specs'],
    queryFn: () => configService.reportSpecs(),
    enabled: isAuthenticated,
  });
}

export function useReportMutations() {
  const qc = useQueryClient();
  const upsert = useMutation({
    mutationFn: (item) => configService.upsertReportSpec(item),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['report-specs'] }),
  });
  const remove = useMutation({
    mutationFn: (id) => configService.deleteReportSpec(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['report-specs'] }),
  });
  return { upsert, remove };
}

export function useAppLicenses() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['app-licenses'],
    queryFn: () => configService.appLicenses(),
    enabled: isAuthenticated,
  });
}

export function useAppLicenseMutations() {
  const qc = useQueryClient();
  return {
    upsert: useMutation({
      mutationFn: (item) => configService.upsertAppLicense(item),
      onSuccess: () => qc.invalidateQueries({ queryKey: ['app-licenses'] }),
    }),
  };
}

export function useWorkspaceSettings() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['workspace-settings'],
    queryFn: () => configService.workspaceSettings(),
    enabled: isAuthenticated,
  });
}

export function useWorkspaceMutations() {
  const qc = useQueryClient();
  return {
    update: useMutation({
      mutationFn: (changes) => configService.updateWorkspaceSettings(changes),
      onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace-settings'] }),
    }),
  };
}

export function useImportMapping(objectKey) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['import-mapping', objectKey],
    queryFn: () => configService.importMapping(objectKey),
    enabled: isAuthenticated && !!objectKey,
  });
}

export function useImportMappingMutations() {
  const qc = useQueryClient();
  return {
    save: useMutation({
      mutationFn: ({ objectKey, mapping }) =>
        configService.saveImportMapping(objectKey, mapping),
      onSuccess: (_data, vars) =>
        qc.invalidateQueries({ queryKey: ['import-mapping', vars.objectKey] }),
    }),
  };
}
