'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function TestDialog() {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <Button onClick={() => setOpen(!open)}>
        Test Button
      </Button>
      {open && <div>Dialog is open</div>}
    </div>
  )
}