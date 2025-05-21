'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const Page = () => {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the dashboard immediately after the page loads
    router.push('/user/dashboard')
  }, [router])

  return (
    <div>Redirecting...</div>
  )
}

export default Page