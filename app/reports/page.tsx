// NUEVO HORARIO/app/reports/page.tsx

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { initDB, getCourses, getTeachers, getSubjects, getSubjectTimeSlots } from "@/lib/db"
import type { Course, Teacher, Subject, SubjectTimeSlot } from "@/types"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ScheduleView } from "@/components/schedule-view" // Importamos el nuevo componente

// Recuperamos los datos de los horarios generados desde localStorage
const getGeneratedSchedules = () => {
  if (typeof window === "undefined") {
    return { courseSchedules: [], teacherSchedules: [] }
  }
  const courseSchedules = JSON.parse(localStorage.getItem("courseSchedules") || "[]")
  const teacherSchedules = JSON.parse(localStorage.getItem("teacherSchedules") || "[]")
  return { courseSchedules, teacherSchedules }
}

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [timeSlots, setTimeSlots] = useState<SubjectTimeSlot[]>([])
  const [courseSchedules, setCourseSchedules] = useState<any[]>([])
  const [teacherSchedules, setTeacherSchedules] = useState<any[]>([])

  useEffect(() => {
    const loadData = async () => {
      await initDB()
      const slots = await getSubjectTimeSlots()
      setTimeSlots(slots.sort((a, b) => a.startTime.localeCompare(b.startTime)))
      
      const { courseSchedules, teacherSchedules } = getGeneratedSchedules()
      setCourseSchedules(courseSchedules)
      setTeacherSchedules(teacherSchedules)

      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-gray-600 text-lg">Cargando informes y horarios...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 pl-4 pr-6 bg-white rounded-lg shadow-sm no-print">
        <SidebarTrigger className="mr-2" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex flex-col flex-grow">
          <h1 className="text-2xl font-bold text-gray-800 text-left">Horarios Generados</h1>
          <p className="text-sm text-gray-600 text-left">
            Visualiza, imprime o guarda los horarios de cursos y docentes.
          </p>
        </div>
      </header>

      <div className="space-y-6">
        {courseSchedules.length === 0 && teacherSchedules.length === 0 ? (
          <Card className="shadow-lg border-gray-100 bg-white">
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>No hay horarios generados para mostrar.</p>
              <p className="text-sm mt-2">Ve a la sección "Generar Horarios" para crearlos.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Horarios por Curso */}
            {courseSchedules.map((cs) => (
              <ScheduleView
                key={cs.courseId}
                title={`Horario - ${cs.courseName}`}
                schedule={cs.schedule}
                timeSlots={timeSlots}
                days={DAYS}
              />
            ))}
            
            {/* Horarios por Docente */}
            {teacherSchedules.map((ts) => (
              <ScheduleView
                key={ts.teacherId}
                title={`Horario - ${ts.teacherName}`}
                schedule={ts.schedule}
                timeSlots={timeSlots}
                days={DAYS}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}