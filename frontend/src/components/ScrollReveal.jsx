import { useRef, useEffect, useState } from 'react'
import './ScrollReveal.css'

/**
 * Wrapper component untuk scroll reveal animations
 * Children akan muncul dengan animasi saat masuk viewport
 */
export default function ScrollReveal({
  children,
  animation = 'fadeUp',
  delay = 0,
  duration = 600,
  className = ''
}) {
  const ref = useRef(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.unobserve(element)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`scroll-reveal scroll-reveal--${animation} ${isInView ? 'in-view' : ''} ${className}`}
      style={{
        '--reveal-delay': `${delay}ms`,
        '--reveal-duration': `${duration}ms`
      }}
    >
      {children}
    </div>
  )
}