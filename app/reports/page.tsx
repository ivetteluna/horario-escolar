// NUEVO HORARIO/app/reports/page.tsx

"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { initDB, getCourses, getTeachers, getSubjectTimeSlots, getGeneratedCourseSchedules, getGeneratedTeacherSchedules } from "@/lib/db"
import type { Course, Teacher, SubjectTimeSlot } from "@/types"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ScheduleView } from "@/components/schedule-view" // Asegúrate de que este componente exista
import { UserX, BookX, CheckCircle, Clock } from "lucide-react"

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]
const MAX_WEEKLY_HOURS_PER_COURSE = 40;

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [timeSlots, setTimeSlots] = useState<SubjectTimeSlot[]>([])
  const [courseSchedules, setCourseSchedules] = useState<any[]>([])
  const [teacherSchedules, setTeacherSchedules] = useState<any[]>([])
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await initDB()
      const [slots, genCourseScheds, genTeacherScheds, courses, teachers] = await Promise.all([
        getSubjectTimeSlots(),
        getGeneratedCourseSchedules(),
        getGeneratedTeacherSchedules(),
        getCourses(),
        getTeachers(),
      ]);

      setTimeSlots(slots.sort((a, b) => a.startTime.localeCompare(b.startTime)))
      setCourseSchedules(genCourseScheds)
      setTeacherSchedules(genTeacherScheds)
      setAllCourses(courses);
      setAllTeachers(teachers);
      setLoading(false)
    }
    loadData()
  }, [])

  const advancedReports = useMemo(() => {
    if (loading) return null;
    const teachersWithNoAssignments = allTeachers.filter(t => t.subjectsTaught.length === 0 || t.subjectsTaught.every(st => !st.courseIds || st.courseIds.length === 0));
    const incompleteCourses = allCourses.filter(c => c.courseSubjects.reduce((sum, cs) => sum + cs.weeklyHours, 0) < MAX_WEEKLY_HOURS_PER_COURSE);
    const completeCourses = allCourses.filter(c => c.courseSubjects.reduce((sum, cs) => sum + cs.weeklyHours, 0) >= MAX_WEEKLY_HOURS_PER_COURSE);
    const averageHours = allTeachers.length > 0 ? allTeachers.reduce((sum, t) => sum + t.weeklyLoad, 0) / allTeachers.length : 0;
    return { teachersWithNoAssignments, incompleteCourses, completeCourses, averageHours }
  }, [allCourses, allTeachers, loading]);

  if (loading) return <div className="text-center py-12">Cargando informes...</div>

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white rounded-lg shadow-sm no-print pl-4 pr-6">
        <SidebarTrigger className="mr-2" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Informes y Horarios</h1>
          <p className="text-sm text-gray-600">Analiza el estado y visualiza los horarios generados.</p>
        </div>
      </header>

      {advancedReports && (
        <Card className="no-print">
          <CardHeader><CardTitle>Reportes de Estado</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Carga Media Semanal</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{advancedReports.averageHours.toFixed(2)}h</div></CardContent>
            </Card>
             <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Cursos Completos</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{advancedReports.completeCourses.length}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Cursos Incompletos</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{advancedReports.incompleteCourses.length}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Docentes Sin Asignación</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{advancedReports.teachersWithNoAssignments.length}</div></CardContent>
            </Card>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {courseSchedules.length === 0 && teacherSchedules.length === 0 ? (
          <Card className="no-print"><CardContent className="py-8 text-center text-muted-foreground">No hay horarios generados. Ve a "Generar Horarios" para crearlos.</CardContent></Card>
        ) : (
          <>
            {courseSchedules.map((cs) => <ScheduleView key={cs.courseId} title={`Horario - ${cs.courseName}`} schedule={cs.schedule} timeSlots={timeSlots} days={DAYS} />)}
            {teacherSchedules.map((ts) => <ScheduleView key={ts.teacherId} title={`Horario - ${ts.teacherName}`} schedule={ts.schedule} timeSlots={timeSlots} days={DAYS} />)}
          </>
        )}
      </div>
    </div>
  )
}