// NUEVO HORARIO/components/schedule-view.tsx

"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Printer } from "lucide-react"

interface ScheduleItem {
  subjectName: string;
  teacherName?: string;
  courseName?: string;
}

interface ScheduleData {
  [day: string]: { [timeSlot: string]: ScheduleItem | null };
}

interface ScheduleViewProps {
  title: string;
  schedule: ScheduleData;
  timeSlots: { id: string; name: string; startTime: string; endTime: string }[];
  days: string[];
  schoolName?: string; // Prop para el nombre del centro
  logoUrl?: string;    // Prop para la URL del logo
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ title, schedule, timeSlots, days, schoolName, logoUrl }) => {
  const handlePrint = () => {
    // Usamos una clase para marcar qué horario imprimir
    const allPrintables = document.querySelectorAll('.printable-area');
    allPrintables.forEach(p => p.classList.remove('printable-area'));
    
    const currentCard = document.getElementById(title); // Usamos el título como ID único
    if (currentCard) {
      currentCard.classList.add('printable-area');
    }
    window.print();
  }

  return (
    // Añadimos una clase general y un ID único a cada Card
    <Card id={title} className="shadow-lg border-gray-100 bg-white print-container">
      {/* ENCABEZADO SOLO PARA IMPRESIÓN */}
      <div className="print-header" style={{ display: 'none' }}>
        {logoUrl && <img src={logoUrl} alt="Logo del Centro" />}
        {schoolName && <h2>{schoolName}</h2>}
        <h2>{title}</h2>
      </div>

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-bold text-gray-800">{title}</CardTitle>
        <Button onClick={handlePrint} variant="outline" size="sm" className="border-gray-300">
          <Printer className="mr-2 h-4 w-4" />
          Imprimir / Guardar PDF
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="font-semibold w-[120px]">Bloque</TableHead>
                {days.map((day) => <TableHead key={day} className="font-semibold text-center">{day}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeSlots.map((slot) => (
                <TableRow key={slot.id}>
                  <TableCell className="font-medium">
                    <div>
                      <span>{slot.name}</span>
                      <span className="text-xs text-muted-foreground block">{slot.startTime} - {slot.endTime}</span>
                    </div>
                  </TableCell>
                  {days.map((day) => {
                    const item = schedule[day]?.[slot.id]
                    return (
                      <TableCell key={day} className="text-center p-1 h-[60px]">
                        {item ? (
                          <div className="flex flex-col justify-center h-full text-xs bg-blue-50 p-1 rounded-md border border-blue-200">
                            <span className="font-bold text-blue-800">{item.subjectName}</span>
                            {item.teacherName && <span className="text-blue-700">{item.teacherName}</span>}
                            {item.courseName && <span className="text-blue-700">{item.courseName}</span>}
                          </div>
                        ) : (<div className="text-muted-foreground">-</div>)}
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