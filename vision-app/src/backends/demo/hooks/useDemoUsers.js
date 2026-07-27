import { useAuth } from '../auth.jsx';
import { demoQuery } from './queryShape.js';

/** Seed persona list for Login — never hits a network. */
export function useDemoUsers() {
  const { demoUsers } = useAuth();
  return demoQuery(demoUsers || []);
}
