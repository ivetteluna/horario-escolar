// En: NUEVO HORARIO/components/schedule-view.tsx

"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Printer } from "lucide-react"

// Tipos de datos para los horarios (ajusta si es necesario)
interface ScheduleItem {
  subjectName: string
  teacherName?: string
  courseName?: string
}

interface ScheduleData {
  [day: string]: {
    [timeSlot: string]: ScheduleItem | null
  }
}

interface ScheduleViewProps {
  title: string
  schedule: ScheduleData
  timeSlots: { id: string; name: string; startTime: string; endTime: string }[]
  days: string[]
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ title, schedule, timeSlots, days }) => {
  const handlePrint = () => {
    window.print()
  }

  return (
    <Card className="shadow-lg border-gray-100 bg-white print-container">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 print:pb-2">
        <CardTitle className="text-xl font-bold text-gray-800">{title}</CardTitle>
        <Button
          onClick={handlePrint}
          variant="outline"
          size="sm"
          className="no-print border-gray-300 text-gray-700 hover:bg-gray-100 shadow-sm bg-transparent"
        >
          <Printer className="mr-2 h-4 w-4" />
          Imprimir / Guardar PDF
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="font-semibold text-gray-700 w-[120px]">Bloque</TableHead>
                {days.map((day) => (
                  <TableHead key={day} className="font-semibold text-gray-700 text-center">
                    {day}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeSlots.map((slot) => (
                <TableRow key={slot.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-gray-800">
                    <div className="flex flex-col">
                      <span>{slot.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {slot.startTime} - {slot.endTime}
                      </span>
                    </div>
                  </TableCell>
                  {days.map((day) => {
                    const item = schedule[day]?.[slot.id]
                    return (
                      <TableCell key={day} className="text-center p-2 h-[70px]">
                        {item ? (
                          <div className="flex flex-col items-center justify-center h-full text-xs bg-blue-50 p-1 rounded-md border border-blue-200">
                            <span className="font-bold text-blue-800">{item.subjectName}</span>
                            {item.teacherName && (
                              <span className="text-blue-700">{item.teacherName}</span>
                            )}
                            {item.courseName && (
                              <span className="text-blue-700">{item.courseName}</span>
                            )}
                          </div>
                        ) : (
                          <div className="text-muted-foreground">-</div>
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}