import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

export function SubscriptionDetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <Skeleton className="size-8 rounded-lg" />
        <h1 className="flex-1 text-base font-medium text-foreground/80">Subscription details</h1>
        <Skeleton className="size-8 rounded-lg" />
      </div>

      {/* Main Card Header */}
      <div className="surface mb-4 p-5 pt-10">
        <div className="flex items-center gap-4">
          <Skeleton className="size-14 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-40" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="surface-inset p-3 flex flex-col items-center gap-1.5">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="surface-inset p-3 flex flex-col items-center gap-1.5">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-3 w-10" />
        </div>
        <div className="surface-inset p-3 flex flex-col items-center gap-1.5">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>

      {/* Details Block */}
      <div className="space-y-4">
        <div className="surface space-y-3 p-4 sm:p-5">
          <Skeleton className="h-3.5 w-44" />

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-7 w-48 rounded-md" />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-32" />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-36" />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>

        {/* Invoice / Receipt Card */}
        <div className="surface space-y-3 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-7 w-24 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-full rounded-xl" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex gap-3">
        <Skeleton className="h-9 flex-1 rounded-xl" />
        <Skeleton className="h-9 flex-1 rounded-xl" />
      </div>

      <div className="mt-3">
        <Skeleton className="h-9 w-full rounded-xl" />
      </div>

      <div className="mt-3">
        <Skeleton className="h-9 w-full rounded-xl" />
      </div>
    </div>
  )
}
