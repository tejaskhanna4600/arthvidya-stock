/**
 * Returns API actor for backend calls (replaces ICP actor).
 * Actor is available when user is logged in (identity set).
 */
import { useInternetIdentity } from './useInternetIdentity';
import { api } from '../api/client';

export function useActor() {
  const { identity, loginStatus } = useInternetIdentity();
  const actor = identity ? api : null;
  const isFetching = loginStatus === 'loading';
  return { actor, isFetching };
}
