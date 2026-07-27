import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { onboardingService } from '../../../services/onboardingService.js';
import { useAuth } from '../../../state/authContextBase.js';

export function useDrafts() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['drafts'],
    queryFn: () => onboardingService.listDrafts(),
    enabled: isAuthenticated,
  });
}

export function useSaveDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (draft) => onboardingService.saveDraft(draft),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drafts'] }),
  });
}

export function useDeleteDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => onboardingService.deleteDraft(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drafts'] }),
  });
}

export function useCompleteOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => onboardingService.complete(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['drafts'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['routes'] });
    },
  });
}

export function useExtractContract() {
  return useMutation({
    mutationFn: (file) => onboardingService.extractContract(file),
  });
}
