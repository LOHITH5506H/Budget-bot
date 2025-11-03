import { NextRequest, NextResponse } from 'next/server'

// Logo.dev API integration for fetching service logos
interface LogoSearchResult {
  name: string
  domain: string
  logo: string
  size?: string
}

interface LogoApiResponse {
  success: boolean
  suggestions?: LogoSearchResult[]
  error?: string
}

// Popular service logos for common subscriptions - using reliable CDN sources
const POPULAR_LOGOS: { [key: string]: LogoSearchResult[] } = {
  'netflix': [
    { name: 'Netflix', domain: 'netflix.com', logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iNCIgZmlsbD0iI0UzMEUxNCIvPgo8dGV4dCB4PSIyMCIgeT0iMjYiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5OPC90ZXh0Pgo8L3N2Zz4K', size: '40' }
  ],
  'spotify': [
    { name: 'Spotify', domain: 'spotify.com', logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiMxREI5NTQiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPgo8cGF0aCBkPSJNMTIgMkM2LjQ3NyAyIDIgNi40NzcgMiAxMnM0LjQ3NyAxMCAxMCAxMCAxMC00LjQ3NyAxMC0xMFMxNy41MjMgMiAxMiAyem00LjE1IDEyLjQ1Yy0uMTcgMC0uMzUtLjA1LS41LS4xNS0xLjQ1LS45NS0zLjI1LTEuMDUtNC4yNS0xLjA1cy0yIDAtMi41IDAuM2MtLjMyLjItLjc1LjE1LTEtLjE1LS4yNS0uMzUtLjE1LS43NS4xNS0xIDEuNS0xIDMuNS0xIDQuNS0xIDEuNzUgMCAzLjMuNSA0LjUgMS40LjMuMjUuMzUuNzUuMTUgMS4wNS0uMS4yLS4zLjMtLjU1LjN6bTEuNS0zLjQ1Yy0uMjUgMC0uNS0uMS0uNy0uMjUtMS44LTEuMTUtNC0xLjI1LTUuNS0xLjI1cy0yLjI1IDAuMDUtMyAwLjM1Yy0uNC4yNS0uOS4xNS0xLjE1LS4yNS0uMjUtLjQtLjE1LS45LjI1LTEuMTUgMi0xLjI1IDQuNzUtMS4zIDYuNS0xLjMgMi4yNSAwIDQuNzUuNSA2LjUgMS44LjQuMjUuNS44LjI1IDEuMi0uMS4yNS0uMzUuNDUtLjY1LjQ1em0xLjUtMy44NWMtLjM1IDAtLjctLjE1LS45NS0uNDUtMi4yNS0xLjQ1LTUtMS42NS03LjI1LTEuNjUtMi41IDAtNSAwLjI1LTcuMjUgMS42NS0uNDUuMjUtMS4wNS4xNS0xLjMtLjMtLjI1LS40NS0uMTUtMS4wNS4zLTEuMzUgMi43NS0xLjcgNi0yLjEgOC4yNS0yLjEgMi43NSAwIDYuNS41IDguNzUgMi4xLjQuMjUuNTUuOS4zIDEuMzUtLjE1LjMtLjQzLjQ1LS43NS40NXoiLz4KPC9zdmc+Cjwvc3ZnPgo=', size: '40' }
  ],
  'disney': [
    { name: 'Disney+', domain: 'disneyplus.com', logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iNCIgZmlsbD0iIzExMkQ0RSIvPgo8dGV4dCB4PSIyMCIgeT0iMjYiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5EKzwvdGV4dD4KPC9zdmc+Cg==', size: '40' }
  ],
  'apple': [
    { name: 'Apple', domain: 'apple.com', logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iYmxhY2siLz4KPHN2ZyB4PSIxMiIgeT0iOCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMTYgMjQiIGZpbGw9IndoaXRlIj4KPHBhdGggZD0iTTEyLjUgNy41Yy0uOC0xLjEtMi4xLTEuOS0zLjUtMS45cy0yLjcuOC0zLjUgMS45QzQuNyA4LjQgNCA5LjcgNCAxMS4yYzAgMS41LjcgMi44IDEuNSAzLjcuOC45IDEuNyAxLjQgMi41IDEuNCAwIDAgMSAwIDIgMHMxIDAgMiAwYy44IDAgMS43LS41IDIuNS0xLjQuOC0uOSAxLjUtMi4yIDEuNS0zLjdzLS43LTIuOC0xLjUtMy43ek04IDEwYy0uNiAwLTEtLjQtMS0xcy40LTEgMS0xIDEgLjQgMSAxLS40IDEtMSAxeiIvPgo8L3N2Zz4KPC9zdmc+Cg==', size: '40' }
  ],
  'amazon': [
    { name: 'Amazon Prime', domain: 'amazon.com', logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iNCIgZmlsbD0iIzIzMkYzRSIvPgo8dGV4dCB4PSIyMCIgeT0iMjYiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5BbXo8L3RleHQ+Cjwvc3ZnPgo=', size: '40' }
  ],
  'youtube': [
    { name: 'YouTube Premium', domain: 'youtube.com', logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iNCIgZmlsbD0iI0ZGMDAwMCIvPgo8cG9seWdvbiBwb2ludHM9IjE1LDEzIDI3LDIwIDE1LDI3IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K', size: '40' }
  ],
  'hulu': [
    { name: 'Hulu', domain: 'hulu.com', logo: 'https://logo.dev/hulu.com?token=pk_X-E5O2wFT0GJzPXTHBGAqA&format=png&size=400', size: '400' }
  ],
  'hbo': [
    { name: 'HBO Max', domain: 'hbomax.com', logo: 'https://logo.dev/hbomax.com?token=pk_X-E5O2wFT0GJzPXTHBGAqA&format=png&size=400', size: '400' }
  ],
  'microsoft': [
    { name: 'Microsoft 365', domain: 'microsoft.com', logo: 'https://logo.dev/microsoft.com?token=pk_X-E5O2wFT0GJzPXTHBGAqA&format=png&size=400', size: '400' }
  ],
  'adobe': [
    { name: 'Adobe Creative Cloud', domain: 'adobe.com', logo: 'https://logo.dev/adobe.com?token=pk_X-E5O2wFT0GJzPXTHBGAqA&format=png&size=400', size: '400' }
  ],
  'zoom': [
    { name: 'Zoom', domain: 'zoom.us', logo: 'https://logo.dev/zoom.us?token=pk_X-E5O2wFT0GJzPXTHBGAqA&format=png&size=400', size: '400' }
  ],
  'dropbox': [
    { name: 'Dropbox', domain: 'dropbox.com', logo: 'https://logo.dev/dropbox.com?token=pk_X-E5O2wFT0GJzPXTHBGAqA&format=png&size=400', size: '400' }
  ]
}

// Additional service mappings for common subscription services
const SERVICE_MAPPINGS: { [key: string]: string } = {
  'prime': 'amazon',
  'prime video': 'amazon',
  'disney plus': 'disney',
  'disney+': 'disney',
  'office 365': 'microsoft',
  'office': 'microsoft',
  'creative cloud': 'adobe',
  'photoshop': 'adobe',
  'illustrator': 'adobe',
  'hbo max': 'hbo',
  'max': 'hbo',
  'youtube music': 'youtube',
  'yt premium': 'youtube'
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    const searchTerm = query.toLowerCase().trim()
    
    // First, try exact match with popular logos
    if (POPULAR_LOGOS[searchTerm]) {
      return NextResponse.json({
        success: true,
        suggestions: POPULAR_LOGOS[searchTerm]
      } as LogoApiResponse)
    }

    // Try service mapping
    if (SERVICE_MAPPINGS[searchTerm] && POPULAR_LOGOS[SERVICE_MAPPINGS[searchTerm]]) {
      return NextResponse.json({
        success: true,
        suggestions: POPULAR_LOGOS[SERVICE_MAPPINGS[searchTerm]]
      } as LogoApiResponse)
    }

    // Fuzzy matching - find partial matches
    const matches: LogoSearchResult[] = []
    
    Object.entries(POPULAR_LOGOS).forEach(([key, logos]) => {
      if (key.includes(searchTerm) || searchTerm.includes(key)) {
        matches.push(...logos)
      }
    })

    // Also check service mappings for partial matches
    Object.entries(SERVICE_MAPPINGS).forEach(([mapping, service]) => {
      if (mapping.includes(searchTerm) && POPULAR_LOGOS[service]) {
        const existing = matches.find(m => m.domain === POPULAR_LOGOS[service][0].domain)
        if (!existing) {
          matches.push(...POPULAR_LOGOS[service])
        }
      }
    })

    // Try Logo.dev API for better logos (if API key is configured)
    if (process.env.LOGO_DEV_API_KEY) {
      try {
        // Common domain mappings for better results
        const domainMappings: { [key: string]: string } = {
          'netflix': 'netflix.com',
          'spotify': 'spotify.com',
          'disney': 'disneyplus.com',
          'disney+': 'disneyplus.com',
          'apple': 'apple.com',
          'amazon': 'amazon.com',
          'youtube': 'youtube.com',
          'hulu': 'hulu.com',
          'hbo': 'hbomax.com',
          'microsoft': 'microsoft.com',
          'adobe': 'adobe.com',
          'zoom': 'zoom.us',
          'dropbox': 'dropbox.com'
        }
        
        const domain = domainMappings[searchTerm] || `${searchTerm.replace(/\s+/g, '')}.com`
        const logoDevUrl = `https://img.logo.dev/${domain}?token=${process.env.LOGO_DEV_API_KEY}&format=png&size=200&retina=true`
        
        // Test if logo exists and is accessible
        const logoTest = await fetch(logoDevUrl, { 
          method: 'HEAD',
          headers: {
            'User-Agent': 'Budget-Bot/1.0'
          }
        })
        
        if (logoTest.ok) {
          // Replace existing matches with better Logo.dev version
          matches.unshift({
            name: query,
            domain: domain,
            logo: logoDevUrl,
            size: '200'
          })
        }
      } catch (error) {
        console.error('Logo.dev API error:', error)
        // Continue with existing matches
      }
    }

    // If still no matches, provide a fallback with the first letter
    if (matches.length === 0) {
      const firstLetter = query.charAt(0).toUpperCase()
      const fallbackSvg = `data:image/svg+xml;base64,${Buffer.from(`
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="40" height="40" rx="8" fill="#6366f1"/>
          <text x="20" y="26" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle">${firstLetter}</text>
        </svg>
      `).toString('base64')}`
      
      matches.push({
        name: query,
        domain: 'generic.service',
        logo: fallbackSvg,
        size: '40'
      })
    }

    return NextResponse.json({
      success: true,
      suggestions: matches
    } as LogoApiResponse)

  } catch (error) {
    console.error('Logo search error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST instead.' },
    { status: 405 }
  )
}