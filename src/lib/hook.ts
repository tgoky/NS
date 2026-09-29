import useSWR, { mutate } from 'swr';
import useSWRInfinite from 'swr/infinite';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useItems(params: Record<string, string | undefined> = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]
  ).toString();
  const getKey = (pageIndex: number, prev: { meta?: { nextCursor?: string | null } } | null) => {
    if (prev && !prev.meta?.nextCursor) return null;
    const cursor = pageIndex === 0 ? '' : `&cursor=${prev!.meta!.nextCursor}`;
    return `/api/items${qs ? `?${qs}` : ''}${cursor}`;
  };
  const { data, size, setSize, isLoading } = useSWRInfinite(getKey, fetcher, {
    revalidateFirstPage: false,
    dedupingInterval: 30_000,
  });

  const pages = data ?? [];
  const items = pages.flatMap((p) => p?.data ?? []);
  const hasMore = pages.length > 0 && pages[pages.length - 1]?.meta?.hasMore;

  return { items, hasMore, loadMore: () => setSize(size + 1), isLoading };
}

export function useSavedItems() {
  const { data, isLoading } = useSWR('/api/saved', fetcher, { dedupingInterval: 30_000 });
  return { savedItems: data?.data ?? [], isLoading };
}

export function useWishes() {
  const { data, isLoading } = useSWR('/api/wishes', fetcher, { dedupingInterval: 30_000 });
  return { wishes: data?.data ?? [], isLoading };
}

export { mutate };