"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DailySchedule, BreakTime } from "@/types"
import { PlusCircle, XCircle } from "lucide-react"

interface DailyScheduleFormProps {
  initialData?: DailySchedule
  onSave: (schedule: DailySchedule) => void
}

export function DailyScheduleForm({ initialData, onSave }: DailyScheduleFormProps) {
  const [schoolStartTime, setSchoolStartTime] = useState(initialData?.schoolStartTime || "08:00")
  const [schoolEndTime, setSchoolEndTime] = useState(initialData?.schoolEndTime || "17:00")
  const [breaks, setBreaks] = useState<BreakTime[]>(initialData?.breaks || [])

  useEffect(() => {
    if (initialData) {
      setSchoolStartTime(initialData.schoolStartTime)
      setSchoolEndTime(initialData.schoolEndTime)
      setBreaks(initialData.breaks)
    }
  }, [initialData])

  const handleAddBreak = () => {
    setBreaks([...breaks, { name: "", startTime: "", endTime: "" }])
  }

  const handleRemoveBreak = (index: number) => {
    setBreaks(breaks.filter((_, i) => i !== index))
  }

  const handleBreakChange = (index: number, field: keyof BreakTime, value: string) => {
    const newBreaks = [...breaks]
    newBreaks[index] = { ...newBreaks[index], [field]: value }
    setBreaks(newBreaks)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ id: "daily_schedule", schoolStartTime, schoolEndTime, breaks })
  }

  return (
    <Card className="w-full shadow-lg border-gray-100">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-800">Configuración de Jornada Escolar</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="schoolStartTime" className="text-gray-700">
                Hora de Inicio de Jornada
              </Label>
              <Input
                id="schoolStartTime"
                type="time"
                value={schoolStartTime}
                onChange={(e) => setSchoolStartTime(e.target.value)}
                required
                className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="schoolEndTime" className="text-gray-700">
                Hora de Fin de Jornada
              </Label>
              <Input
                id="schoolEndTime"
                type="time"
                value={schoolEndTime}
                onChange={(e) => setSchoolEndTime(e.target.value)}
                required
                className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid gap-4">
            <h3 className="text-xl font-semibold text-gray-800">Tiempos de Recesos y Almuerzo</h3>
            {breaks.map((_break, index) => (
              <div
                key={index}
                className="flex flex-col md:flex-row items-end gap-3 border border-gray-200 p-4 rounded-md bg-gray-50"
              >
                <div className="grid gap-2 flex-1 w-full">
                  <Label htmlFor={`breakName-${index}`} className="text-gray-700">
                    Nombre del Receso
                  </Label>
                  <Input
                    id={`breakName-${index}`}
                    value={_break.name}
                    onChange={(e) => handleBreakChange(index, "name", e.target.value)}
                    placeholder="Ej. Almuerzo, Recreo"
                    required
                    className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div className="grid gap-2 w-full md:w-auto">
                  <Label htmlFor={`breakStartTime-${index}`} className="text-gray-700">
                    Inicio
                  </Label>
                  <Input
                    id={`breakStartTime-${index}`}
                    type="time"
                    value={_break.startTime}
                    onChange={(e) => handleBreakChange(index, "startTime", e.target.value)}
                    required
                    className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div className="grid gap-2 w-full md:w-auto">
                  <Label htmlFor={`breakEndTime-${index}`} className="text-gray-700">
                    Fin
                  </Label>
                  <Input
                    id={`breakEndTime-${index}`}
                    type="time"
                    value={_break.endTime}
                    onChange={(e) => handleBreakChange(index, "endTime", e.target.value)}
                    required
                    className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveBreak(index)}
                  aria-label="Eliminar receso"
                  className="text-red-500 hover:text-red-700 self-center md:self-end"
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={handleAddBreak}
              className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300 shadow-sm"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Receso
            </Button>
          </div>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md mt-4">
            Guardar Horario
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
