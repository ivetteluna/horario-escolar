// NUEVO HORARIO/components/schedule-view.tsx

"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Printer } from "lucide-react"

// ... (interfaces sin cambios)
interface ScheduleItem { subjectName: string; teacherName?: string; courseName?: string; }
interface ScheduleData { [day: string]: { [timeSlot: string]: ScheduleItem | null }; }
interface ScheduleViewProps {
  title: string;
  schedule: ScheduleData;
  timeSlots: { id: string; name: string; startTime: string; endTime: string }[];
  days: string[];
  schoolName?: string;
  logoUrl?: string;
}


export const ScheduleView: React.FC<ScheduleViewProps> = ({ title, schedule, timeSlots, days, schoolName, logoUrl }) => {
  const handlePrint = () => {
    const printableArea = document.getElementById(`printable-${title}`);
    if (printableArea) {
        // Clonamos el área para no modificar el DOM original
        const clone = printableArea.cloneNode(true) as HTMLElement;
        const printWindow = window.open('', '', 'height=800,width=1200');
        
        if (printWindow) {
            printWindow.document.write('<html><head><title>Imprimir Horario</title>');
            // Importante: Enlazar los estilos de la aplicación principal y los de impresión
            const styles = Array.from(document.styleSheets).map(s => s.href ? `<link rel="stylesheet" href="${s.href}">` : '').join('');
            printWindow.document.write(styles);
            printWindow.document.write('</head><body>');
            printWindow.document.write(clone.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            
            setTimeout(() => { // Damos tiempo a que carguen los estilos
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    }
  }

  return (
    <Card className="shadow-lg">
      {/* Esta es el área que se mostrará en la página web */}
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Button onClick={handlePrint} variant="outline" size="sm"><Printer className="mr-2 h-4 w-4" />Imprimir / PDF</Button>
      </CardHeader>
      <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Bloque</TableHead>{days.map(d => <TableHead key={d}>{d}</TableHead>)}</TableRow></TableHeader>
            <TableBody>
                {timeSlots.map(slot => (
                    <TableRow key={slot.id}>
                        <TableCell className="font-medium">{slot.name}<br/><span className="text-xs text-muted-foreground">{slot.startTime}-{slot.endTime}</span></TableCell>
                        {days.map(day => {
                            const item = schedule[day]?.[slot.id];
                            return <TableCell key={day}>{item ? `${item.subjectName} (${item.teacherName || item.courseName || ''})` : '-'}</TableCell>
                        })}
                    </TableRow>
                ))}
            </TableBody>
          </Table>
      </CardContent>

      {/* ESTA ES LA SECCIÓN OCULTA QUE SE USARÁ SOLO PARA IMPRIMIR */}
      <div id={`printable-${title}`} className="printable-area" style={{ display: 'none' }}>
          <div className="print-header">
              {logoUrl && <img src={logoUrl} alt="Logo"/>}
              <h2>{schoolName || 'Horario Escolar'}</h2>
              <h3>{title}</h3>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Bloque</TableHead>{days.map(d => <TableHead key={d}>{d}</TableHead>)}</TableRow></TableHeader>
            <TableBody>
                {timeSlots.map(slot => (
                    <TableRow key={slot.id}>
                        <TableCell>{slot.name} ({slot.startTime}-{slot.endTime})</TableCell>
                        {days.map(day => {
                            const item = schedule[day]?.[slot.id];
                            return <TableCell key={day}>{item ? `${item.subjectName} (${item.teacherName || item.courseName || ''})` : '-'}</TableCell>
                        })}
                    </TableRow>
                ))}
            </TableBody>
          </Table>
      </div>
    </Card>
  )
}