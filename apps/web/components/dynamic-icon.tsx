"use client"

import React, { memo, useState } from "react"
import dynamic from "next/dynamic"
import dynamicIconImports from "lucide-react/dynamicIconImports"
import { Receipt } from "lucide-react"

const iconCache = new Map<string, React.ComponentType<{ className?: string }>>()

function isImageUrl(url: string): boolean {
  if (!url) return false
  const trimmed = url.trim()
  return (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("blob:")
  )
}

function getIconComponent(name: string) {
  if (!name) return Receipt

  // Convert PascalCase or camelCase or spaces to kebab-case
  const kebabName = name
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase() as keyof typeof dynamicIconImports

  if (iconCache.has(kebabName)) {
    return iconCache.get(kebabName)!
  }

  const importFn = dynamicIconImports[kebabName]
  if (!importFn) {
    iconCache.set(kebabName, Receipt)
    return Receipt
  }

  const Component = dynamic(importFn, {
    loading: () => <span className="inline-block size-4 animate-pulse rounded bg-muted/40" />,
    ssr: false,
  })

  iconCache.set(kebabName, Component)
  return Component
}

export const DynamicIcon = memo(function DynamicIcon({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const [imageError, setImageError] = useState(false)

  if (name && isImageUrl(name) && !imageError) {
    return (
      <img
        src={name}
        alt="service logo"
        onError={() => setImageError(true)}
        className={`size-full object-contain p-0.5 rounded-md ${className || ""}`}
      />
    )
  }

  const Component = getIconComponent(name)
  return <Component className={className} />
})
