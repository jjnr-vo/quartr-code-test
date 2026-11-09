import { ApiError } from "@/shared/types";
import { useEffect, useState } from "react";

export function useApi<T>(path: string) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{
    path: string;
    revision: number;
    data: T | null;
    error: string | null;
    loading: boolean;
  }>({ path, revision, data: null, error: null, loading: true });

  useEffect(() => {
    const controller = new AbortController();
    setState({ path, revision, data: null, error: null, loading: true });

    async function load() {
      try {
        const response = await fetch(path, { signal: controller.signal });
        const body: T & { error?: ApiError } = await response.json();
        if (!response.ok)
          throw new Error(
            body.error?.message ?? `Request failed (HTTP ${response.status}).`,
          );
        if (!controller.signal.aborted) {
          setState({ path, revision, data: body, error: null, loading: false });
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setState({
          path,
          revision,
          data: null,
          error:
            error instanceof Error
              ? error.message
              : "Could not load data. Try again.",
          loading: false,
        });
      }
    }

    load();
    return () => controller.abort();
  }, [path, revision]);

  const current = state.path === path && state.revision === revision;
  return {
    data: current ? state.data : null,
    error: current ? state.error : null,
    loading: !current || state.loading,
    retry: () => setRevision((value) => value + 1),
  };
}
