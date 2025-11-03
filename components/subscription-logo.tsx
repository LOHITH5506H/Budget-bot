"use client"

import { Calendar } from "lucide-react"
import { useState } from "react"

interface SubscriptionLogoProps {
  logoUrl?: string | null
  subscriptionName: string
}

export function SubscriptionLogo({ logoUrl, subscriptionName }: SubscriptionLogoProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const handleImageError = () => {
    console.log(`Logo failed to load for ${subscriptionName}:`, logoUrl)
    setImageError(true)
  }

  const handleImageLoad = () => {
    console.log(`Logo loaded successfully for ${subscriptionName}:`, logoUrl)
    setImageLoaded(true)
  }

  return (
    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center overflow-hidden">
      {logoUrl && !imageError ? (
        <img 
          src={logoUrl} 
          alt={`${subscriptionName} logo`}
          className="w-8 h-8 object-contain"
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      ) : (
        <Calendar className="w-6 h-6 text-emerald-600" />
      )}
    </div>
  )
}