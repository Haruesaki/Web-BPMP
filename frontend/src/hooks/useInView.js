import { useEffect, useRef, useState } from 'react'

/**
 * Hook untuk mendeteksi apakah elemen terlihat di viewport
 * Digunakan untuk scroll reveal animations
 */
export function useInView(options = {}) {
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
      { threshold: 0.1, ...options }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return { ref, isInView }
}

/**
 * Hook untuk smooth scroll ke element
 */
export function useSmoothScroll() {
  const scrollTo = (elementId, offset = 0) => {
    const element = document.getElementById(elementId)
    if (!element) return

    const top = element.offsetTop - offset
    window.scrollTo({
      top,
      behavior: 'smooth'
    })
  }

  return { scrollTo }
}

/**
 * Hook untuk animated counter
 */
export function useCounter(end, duration = 2000, start = 0) {
  const [count, setCount] = useState(start)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    let startTime = null
    let animationFrame

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      
      setCount(Math.floor(progress * (end - start) + start))
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      } else {
        setIsComplete(true)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [end, duration, start])

  return { count, isComplete }
}
