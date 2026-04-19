import { useState, useEffect } from 'react'
import { useActivityFeed } from '@/hooks/use-data'
import { FeedItem } from './feed-item'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export function ActivityFeed() {
  const [page, setPage] = useState(0)
  const [allItems, setAllItems] = useState<ReturnType<typeof useActivityFeed>['data']>()
  const { data, isLoading } = useActivityFeed(page)

  useEffect(() => {
    if (!data) return
    if (page === 0) {
      setAllItems(data)
    } else {
      setAllItems((prev) => {
        if (!prev) return data
        const existingIds = new Set(prev.items.map((i) => i.id))
        const newItems = data.items.filter((i) => !existingIds.has(i.id))
        if (newItems.length === 0) return prev
        return { ...data, items: [...prev.items, ...newItems] }
      })
    }
  }, [data, page])

  const displayItems = allItems?.items ?? []

  return (
    <div className="px-4 pb-4">
      <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
        Recent Activity
      </h2>

      {isLoading && displayItems.length === 0 ? (
        <div className="space-y-3 animate-pulse">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-black/[0.04]">
              <div className="flex items-start gap-3">
                <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-0.5">
                  <Skeleton className="h-3.5 rounded-full" style={{ width: `${55 + (i % 3) * 15}%` }} />
                  <Skeleton className="h-3 w-20 rounded-full" />
                </div>
                <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
              </div>
              {i % 2 === 0 && (
                <>
                  <Skeleton className="my-3 h-px w-full rounded-full" />
                  <div className="flex justify-between">
                    <div className="space-y-1.5">
                      <Skeleton className="h-2 w-12 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded" />
                    </div>
                    <div className="space-y-1.5 items-end flex flex-col">
                      <Skeleton className="h-2 w-16 rounded-full" />
                      <Skeleton className="h-6 w-24 rounded" />
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {displayItems.map((item) => (
            <FeedItem
              key={item.id}
              type={item.type}
              actor={item.actor}
              secondary_actor={item.secondary_actor}
              description={item.description}
              metadata={item.metadata}
              created_at={item.created_at}
            />
          ))}
        </div>
      )}

      {allItems?.hasMore && (
        <div className="mt-4">
          <Separator className="mb-4" />
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => setPage((p) => p + 1)}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      )}

      {!allItems?.hasMore && displayItems.length > 0 && (
        <p className="text-center text-xs text-muted-foreground mt-6 pb-2">
          You're all caught up
        </p>
      )}
    </div>
  )
}
