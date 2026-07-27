/** Local query/mutation shapes — no React Query. */

export function demoQuery(data) {
  return {
    data,
    isLoading: false,
    isPending: false,
    isError: false,
    error: null,
    refetch: async () => ({ data }),
    isFetching: false,
    status: 'success',
  };
}

export function demoMutation(mutateAsyncImpl) {
  return {
    mutateAsync: mutateAsyncImpl,
    mutate: (vars, opts) => {
      Promise.resolve(mutateAsyncImpl(vars))
        .then((result) => opts?.onSuccess?.(result))
        .catch((error) => opts?.onError?.(error));
    },
    isPending: false,
    isError: false,
    error: null,
    reset: () => {},
  };
}
