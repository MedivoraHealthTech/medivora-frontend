import { useState, useEffect } from 'react'

export function useBreakpoint() {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1024
  )

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return {
    width,
    isMobile:      width < 640,          // phones
    isTablet:      width >= 640 && width < 1024,  // tablets
    isDesktop:     width >= 1024,         // laptop / desktop
    isSmallScreen: width < 1024,          // mobile or tablet (no sidebar)
  }
}
