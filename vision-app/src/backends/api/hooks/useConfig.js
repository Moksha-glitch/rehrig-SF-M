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
