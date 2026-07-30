import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountsService } from '../../../services/accountsService.js';
import { useAuth } from '../../../state/authContextBase.js';

export function useAccounts() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsService.list(),
    enabled: isAuthenticated,
  });
}

export function useAccount(accountId) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['accounts', accountId],
    queryFn: () => accountsService.get(accountId),
    enabled: isAuthenticated && !!accountId,
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (account) => accountsService.create(account),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }) => accountsService.update(id, changes),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['accounts', vars.id] });
    },
  });
}

export function useUsers() {
  const { isAuthenticated, user } = useAuth();
  return useQuery({
    queryKey: ['users'],
    queryFn: () => accountsService.users(),
    enabled: isAuthenticated && user?.persona === 'rehrig',
  });
}

export function useSegments(accountId) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['segments', accountId || 'all'],
    queryFn: () => accountsService.segments(accountId),
    enabled: isAuthenticated,
  });
}

export function useProducts(accountId) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['products', accountId || 'all'],
    queryFn: () => accountsService.products(accountId),
    enabled: isAuthenticated,
  });
}
