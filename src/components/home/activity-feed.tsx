import { useState } from 'react'
import { useActivityFeed } from '@/hooks/use-data'
import { FeedItem } from './feed-item'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export function ActivityFeed() {
  const [page, setPage] = useState(0)
  const [allItems, setAllItems] = useState<ReturnType<typeof useActivityFeed>['data']>()
  const { data, isLoading } = useActivityFeed(page)

  // Accumulate items across pages
  if (data && (!allItems || page === 0)) {
    setAllItems(data)
  } else if (data && page > 0 && allItems) {
    const existingIds = new Set(allItems.items.map((i) => i.id))
    const newItems = data.items.filter((i) => !existingIds.has(i.id))
    if (newItems.length > 0) {
      setAllItems((prev) =>
        prev
          ? { ...data, items: [...prev.items, ...newItems] }
          : data
      )
    }
  }

  const displayItems = allItems?.items ?? []

  return (
    <div className="px-4">
      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
        Activity
      </h2>

      {isLoading && displayItems.length === 0 ? (
        <div className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-border">
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
