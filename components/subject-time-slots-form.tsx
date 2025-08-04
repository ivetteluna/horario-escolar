"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { XCircle, PlusCircle } from "lucide-react"

interface SubjectTimeSlot {
  id: string
  name: string
  startTime: string
  endTime: string
}

export const SubjectTimeSlotsForm: React.FC<{
  initialData?: SubjectTimeSlot[]
  onSave: (slots: SubjectTimeSlot[]) => void
}> = ({ initialData, onSave }) => {
  const [timeSlots, setTimeSlots] = useState<SubjectTimeSlot[]>(initialData || [])
  const [formErrors, setFormErrors] = useState<string[]>([]) // State for form-level errors

  useEffect(() => {
    if (initialData) {
      setTimeSlots(initialData)
    }
  }, [initialData])

  const handleAddSlot = () => {
    setTimeSlots([...timeSlots, { id: uuidv4(), name: "", startTime: "", endTime: "" }])
  }

  const handleRemoveSlot = (id: string) => {
    setTimeSlots(timeSlots.filter((slot) => slot.id !== id))
  }

  const handleSlotChange = (id: string, field: keyof SubjectTimeSlot, value: string) => {
    const newTimeSlots = timeSlots.map((slot) => (slot.id === id ? { ...slot, [field]: value } : slot))
    setTimeSlots(newTimeSlots)
  }

  const calculateDurationInMinutes = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0
    const [startH, startM] = startTime.split(":").map(Number)
    const [endH, endM] = endTime.split(":").map(Number)

    const startDate = new Date(0, 0, 0, startH, startM)
    const endDate = new Date(0, 0, 0, endH, endM)

    if (endDate < startDate) {
      // Handle cases where end time is on the next day (e.g., 23:00 - 01:00)
      endDate.setDate(endDate.getDate() + 1)
    }

    return (endDate.getTime() - startDate.getTime()) / (1000 * 60)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errors: string[] = []

    timeSlots.forEach((slot, index) => {
      if (!slot.name || !slot.startTime || !slot.endTime) {
        errors.push(`Por favor, completa todos los campos para el bloque horario en la fila ${index + 1}.`)
      } else {
        const duration = calculateDurationInMinutes(slot.startTime, slot.endTime)
        if (duration <= 0) {
          errors.push(`La hora de fin debe ser posterior a la hora de inicio para el bloque "${slot.name}".`)
        } else if (duration > 45) {
          errors.push(`El bloque horario "${slot.name}" excede la duración máxima de 45 minutos (${duration} minutos).`)
        }
      }
    })

    setFormErrors(errors)

    if (errors.length > 0) {
      return // Prevent form submission if there are errors
    }

    onSave(timeSlots)
  }

  return (
    <Card className="w-full shadow-lg border-gray-100">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-800">
          Configuración de Bloques Horarios de Asignaturas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid gap-4">
            <h3 className="text-xl font-semibold text-gray-800">Definir Bloques de Clases</h3>
            {timeSlots.length === 0 && (
              <p className="text-muted-foreground mb-4">Añade bloques horarios para las asignaturas.</p>
            )}
            {timeSlots.map((slot) => (
              <div
                key={slot.id}
                className="flex flex-col md:flex-row items-end gap-3 border border-gray-200 p-4 rounded-md bg-gray-50"
              >
                <div className="grid gap-2 flex-1 w-full">
                  <Label htmlFor={`slotName-${slot.id}`} className="text-gray-700">
                    Nombre del Bloque
                  </Label>
                  <Input
                    id={`slotName-${slot.id}`}
                    value={slot.name}
                    onChange={(e) => handleSlotChange(slot.id, "name", e.target.value)}
                    placeholder="Ej. Primera Hora, Bloque A"
                    required
                    className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div className="grid gap-2 w-full md:w-auto">
                  <Label htmlFor={`slotStartTime-${slot.id}`} className="text-gray-700">
                    Inicio
                  </Label>
                  <Input
                    id={`slotStartTime-${slot.id}`}
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => handleSlotChange(slot.id, "startTime", e.target.value)}
                    required
                    className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div className="grid gap-2 w-full md:w-auto">
                  <Label htmlFor={`slotEndTime-${slot.id}`} className="text-gray-700">
                    Fin
                  </Label>
                  <Input
                    id={`slotEndTime-${slot.id}`}
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => handleSlotChange(slot.id, "endTime", e.target.value)}
                    required
                    className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveSlot(slot.id)}
                  aria-label="Eliminar bloque horario"
                  className="text-red-500 hover:text-red-700 self-center md:self-end"
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={handleAddSlot}
              className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300 shadow-sm"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Bloque Horario
            </Button>
          </div>
          {formErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
              <p className="font-semibold mb-2">Errores en el formulario:</p>
              <ul className="list-disc list-inside">
                {formErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md mt-4">
            Guardar Bloques Horarios
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
