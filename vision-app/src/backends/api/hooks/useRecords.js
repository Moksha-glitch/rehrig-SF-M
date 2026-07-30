import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { recordsService } from '../../../services/recordsService.js';
import { useAuth } from '../../../state/authContextBase.js';

export function useRecords(kind, params) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['records', kind, params || {}],
    queryFn: () => recordsService.list(kind, params),
    enabled: isAuthenticated && !!kind,
  });
}

export function useCreateRecord(kind) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (record) => recordsService.create(kind, record),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['records', kind] }),
  });
}

export function useUpdateRecord(kind) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }) => recordsService.update(kind, id, changes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['records', kind] }),
  });
}

export function useDeleteRecord(kind) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => recordsService.remove(kind, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['records', kind] }),
  });
}

export function useContacts(accountId) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['contacts', accountId || 'all'],
    queryFn: () => recordsService.contacts(accountId),
    enabled: isAuthenticated,
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contact) => recordsService.createContact(contact),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }) => recordsService.updateContact(id, changes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useRoutes(accountId) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['routes', accountId || 'all'],
    queryFn: () => recordsService.routes(accountId),
    enabled: isAuthenticated,
  });
}

export function useCreateRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (route) => recordsService.createRoute(route),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routes'] }),
  });
}

export function useBulkImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ object, rows }) => recordsService.importRows(object, rows),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['records'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['routes'] });
    },
  });
}
