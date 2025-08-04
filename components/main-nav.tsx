"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { getSchoolSettings, initDB } from "@/lib/db"
import type { SchoolSettings } from "@/types"

export function MainNav() {
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | undefined>(undefined)

  useEffect(() => {
    const loadSettings = async () => {
      await initDB() // Ensure DB is initialized before fetching settings
      const settings = await getSchoolSettings()
      setSchoolSettings(settings)
    }
    loadSettings()
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-md h-16">
      {" "}
      {/* Added h-16 and z-50 */}
      <div className="container flex items-center justify-center px-4 py-2 md:px-6">
        {schoolSettings?.logoUrl ? (
          <img
            src={schoolSettings.logoUrl || "/placeholder.svg"}
            alt="Logo del Centro"
            className="w-[400px] h-auto object-contain"
          />
        ) : (
          <div className="text-xl font-bold text-gray-800">
            <Link href="/dashboard">Scheduler</Link>
          </div>
        )}
      </div>
    </header>
  )
}
