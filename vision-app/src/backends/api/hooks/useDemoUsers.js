import { useQuery } from '@tanstack/react-query';
import { authService } from '../../../services/authService.js';

/** Persona list for Login from vision-api. */
export function useDemoUsers() {
  return useQuery({
    queryKey: ['demo-users'],
    queryFn: () => authService.demoUsers(),
    staleTime: 60_000,
  });
}
