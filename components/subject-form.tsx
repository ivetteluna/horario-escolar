"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Subject } from "@/types"
import { v4 as uuidv4 } from "uuid"
import * as LucideIcons from "lucide-react"

interface SubjectFormProps {
  initialData?: Subject
  onSave: (subject: Subject) => void
  onCancel: () => void
}

// Updated list of common icons for subjects, with more specific choices
const availableIcons = [
  { name: "BookText", label: "Lengua Española" }, // BookText for language
  { name: "Calculator", label: "Matemática" }, // Calculator for math
  { name: "Globe", label: "Ciencias Sociales" }, // Globe for social sciences
  { name: "FlaskConical", label: "Ciencias Naturales" }, // Flask for natural sciences
  { name: "Languages", label: "Inglés / Francés" }, // Languages for foreign languages
  { name: "Palette", label: "Educación Artística" }, // Palette for art
  { name: "Dumbbell", label: "Educación Física" }, // Dumbbell for physical education
  { name: "HeartHandshake", label: "Formación Integral Humana y Religiosa" }, // HeartHandshake for ethics/religion
  { name: "Hammer", label: "Talleres" }, // Hammer for workshops
  { name: "Microscope", label: "Biología" },
  { name: "Music", label: "Música" },
  { name: "Laptop", label: "Informática" },
  { name: "History", label: "Historia" },
  { name: "Gavel", label: "Derecho" },
  { name: "Brain", label: "Filosofía / Psicología" },
  { name: "Megaphone", label: "Comunicación" },
  { name: "GraduationCap", label: "Académico" },
  { name: "BookOpen", label: "General" }, // General fallback
] as const

export function SubjectForm({ initialData, onSave, onCancel }: SubjectFormProps) {
  const [name, setName] = useState(initialData?.name || "")
  const [shortCode, setShortCode] = useState(initialData?.shortCode || "") // NEW state for shortCode
  const [priority, setPriority] = useState(initialData?.priority || "media")
  const [iconColor, setIconColor] = useState(initialData?.iconColor || "#22C55E") // Default to emerald-500
  const [iconName, setIconName] = useState(initialData?.iconName || "BookOpen")

  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setShortCode(initialData.shortCode || "") // Set shortCode from initialData
      setPriority(initialData.priority)
      setIconColor(initialData.iconColor)
      setIconName(initialData.iconName)
    }
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newSubject: Subject = {
      id: initialData?.id || uuidv4(),
      name,
      shortCode: shortCode.trim() || undefined, // Save shortCode, or undefined if empty
      priority: priority as "alta" | "media" | "baja",
      iconColor,
      iconName,
    }
    onSave(newSubject)
  }

  const IconComponent = LucideIcons[iconName as keyof typeof LucideIcons] || LucideIcons.BookOpen

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-2xl font-semibold text-gray-800">
        {initialData ? "Editar Asignatura" : "Añadir Nueva Asignatura"}
      </h2>
      <div className="grid gap-2">
        <Label htmlFor="name" className="text-gray-700">
          Nombre de la Asignatura
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
        />
      </div>
      {/* NEW: Short Code Input */}
      <div className="grid gap-2">
        <Label htmlFor="shortCode" className="text-gray-700">
          Abreviatura (para horarios)
        </Label>
        <Input
          id="shortCode"
          value={shortCode}
          onChange={(e) => setShortCode(e.target.value)}
          placeholder="Ej. LE, MAT, CN"
          maxLength={5}
          className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="priority" className="text-gray-700">
          Prioridad
        </Label>
        <Select value={priority} onValueChange={(value) => setPriority(value as "alta" | "media" | "baja")}>
          <SelectTrigger id="priority" className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
            <SelectValue placeholder="Seleccionar prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="media">Media</SelectItem>
            <SelectItem value="baja">Baja</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="iconName" className="text-gray-700">
            Icono
          </Label>
          <Select value={iconName} onValueChange={setIconName}>
            <SelectTrigger id="iconName" className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
              <SelectValue placeholder="Seleccionar icono" />
            </SelectTrigger>
            <SelectContent>
              {availableIcons.map((icon) => {
                const Icon = LucideIcons[icon.name as keyof typeof LucideIcons]
                return (
                  <SelectItem key={icon.name} value={icon.name}>
                    <div className="flex items-center gap-2">
                      {Icon && <Icon className="h-6 w-6" />} {icon.label} {/* Increased icon size */}
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="iconColor" className="text-gray-700">
            Color del Icono
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="iconColor"
              type="color"
              value={iconColor}
              onChange={(e) => setIconColor(e.target.value)}
              className="h-10 w-10 p-0 border-gray-300 rounded-md cursor-pointer"
              title="Seleccionar color"
            />
            <Input
              type="text"
              value={iconColor}
              onChange={(e) => setIconColor(e.target.value)}
              className="flex-1 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="#RRGGBB"
            />
            {IconComponent && <IconComponent className="h-7 w-7" style={{ color: iconColor }} />}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-gray-300 text-gray-700 hover:bg-gray-100 bg-transparent shadow-sm"
        >
          Cancelar
        </Button>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
          {initialData ? "Guardar Cambios" : "Añadir Asignatura"}
        </Button>
      </div>
    </form>
  )
}
