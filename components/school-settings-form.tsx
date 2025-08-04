"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SchoolSettings } from "@/types"

interface SchoolSettingsFormProps {
  initialData?: SchoolSettings
  onSave: (settings: SchoolSettings) => void
}

export function SchoolSettingsForm({ initialData, onSave }: SchoolSettingsFormProps) {
  const [schoolName, setSchoolName] = useState(initialData?.schoolName || "")
  const [logoUrl, setLogoUrl] = useState(initialData?.logoUrl || "")

  useEffect(() => {
    if (initialData) {
      setSchoolName(initialData.schoolName)
      setLogoUrl(initialData.logoUrl)
    }
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ id: "school_settings", schoolName, logoUrl })
  }

  return (
    <Card className="w-full shadow-lg border-gray-100">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-800">Datos del Centro</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="schoolName" className="text-gray-700">
              Nombre del Centro
            </Label>
            <Input
              id="schoolName"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              required
              className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="logoUrl" className="text-gray-700">
              URL del Logotipo
            </Label>
            <Input
              id="logoUrl"
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://ejemplo.com/logo.png"
              className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
            />
            {logoUrl && (
              <div className="mt-4 flex justify-center items-center p-4 border border-gray-200 rounded-md bg-gray-50">
                <img
                  src={logoUrl || "/placeholder.svg"}
                  alt="Logo del Centro"
                  className="h-20 object-contain max-w-full"
                />
              </div>
            )}
          </div>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md mt-4">
            Guardar Configuración
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
