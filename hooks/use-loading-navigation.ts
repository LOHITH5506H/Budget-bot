"use client"

import { useRouter } from "next/navigation"
import { useLoading } from "@/contexts/loading-context"
import { useCallback } from "react"

export function useLoadingNavigation() {
  const router = useRouter()
  const { showLoading, hideLoading } = useLoading()

  const navigateWithLoading = useCallback(
    (href: string) => {
      showLoading()
      
      // Use setTimeout to ensure loading shows before navigation
      setTimeout(() => {
        router.push(href)
        // Hide loading after a short delay to ensure page has started loading
        setTimeout(() => {
          hideLoading()
        }, 500)
      }, 100)
    },
    [router, showLoading, hideLoading]
  )

  return { navigateWithLoading }
}