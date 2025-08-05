// NUEVO HORARIO/app/reports/page.tsx

"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { initDB, getCourses, getTeachers, getSubjectTimeSlots, getGeneratedCourseSchedules, getGeneratedTeacherSchedules, getSchoolSettings } from "@/lib/db"
import type { Course, Teacher, SubjectTimeSlot, SchoolSettings } from "@/types"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ScheduleView } from "@/components/schedule-view"

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [timeSlots, setTimeSlots] = useState<SubjectTimeSlot[]>([])
  const [courseSchedules, setCourseSchedules] = useState<any[]>([])
  const [teacherSchedules, setTeacherSchedules] = useState<any[]>([])
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | undefined>(undefined);
  
  useEffect(() => {
    const loadData = async () => {
      await initDB()
      const [slots, genCourseScheds, genTeacherScheds, settings] = await Promise.all([
        getSubjectTimeSlots(),
        getGeneratedCourseSchedules(),
        getGeneratedTeacherSchedules(),
        getSchoolSettings()
      ]);

      setTimeSlots(slots.sort((a, b) => a.startTime.localeCompare(b.startTime)))
      setCourseSchedules(genCourseScheds)
      setTeacherSchedules(genTeacherScheds)
      setSchoolSettings(settings);
      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) return <div className="text-center py-12">Cargando informes...</div>

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="no-print flex h-16 shrink-0 items-center gap-2 border-b bg-white rounded-lg shadow-sm pl-4 pr-6">
        <SidebarTrigger className="mr-2" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Informes y Horarios</h1>
          <p className="text-sm text-gray-600">Visualiza los horarios generados.</p>
        </div>
      </header>

      <div className="space-y-6">
        {courseSchedules.length === 0 && teacherSchedules.length === 0 ? (
          <Card className="no-print"><CardContent className="py-8 text-center text-muted-foreground">No hay horarios generados.</CardContent></Card>
        ) : (
          <>
            {courseSchedules.map((cs) => (
              <ScheduleView
                key={cs.courseId}
                title={`Horario - ${cs.courseName}`}
                schedule={cs.schedule}
                timeSlots={timeSlots}
                days={DAYS}
                schoolName={schoolSettings?.schoolName}
                logoUrl={schoolSettings?.logoUrl}
              />
            ))}
            {teacherSchedules.map((ts) => (
              <ScheduleView
                key={ts.teacherId}
                title={`Horario - ${ts.teacherName}`}
                schedule={ts.schedule}
                timeSlots={timeSlots}
                days={DAYS}
                schoolName={schoolSettings?.schoolName}
                logoUrl={schoolSettings?.logoUrl}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}