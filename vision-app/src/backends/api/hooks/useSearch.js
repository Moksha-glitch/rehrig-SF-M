import { useQuery } from '@tanstack/react-query';
import { searchService } from '../../../services/searchService.js';
import { useAuth } from '../../../state/authContextBase.js';

export function useSearch(query) {
  const { isAuthenticated } = useAuth();
  const q = (query || '').trim();
  return useQuery({
    queryKey: ['search', q],
    queryFn: () => searchService.search(q),
    enabled: isAuthenticated && q.length >= 2,
  });
}
