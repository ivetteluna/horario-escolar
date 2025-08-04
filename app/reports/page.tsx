// NUEVO HORARIO/app/reports/page.tsx

"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { initDB, getCourses, getTeachers, getSubjects, getSubjectTimeSlots, getGeneratedCourseSchedules, getGeneratedTeacherSchedules } from "@/lib/db"
import type { Course, Teacher, SubjectTimeSlot } from "@/types"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ScheduleView } from "@/components/schedule-view"
import { UserX, BookX, CheckCircle, Clock } from "lucide-react"

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]
const MAX_WEEKLY_HOURS_PER_COURSE = 40;

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [timeSlots, setTimeSlots] = useState<SubjectTimeSlot[]>([])
  const [courseSchedules, setCourseSchedules] = useState<any[]>([])
  const [teacherSchedules, setTeacherSchedules] = useState<any[]>([])
  
  // State for advanced reports
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);

  useEffect(() => {
    const loadData = async () => {
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

  // Memoized calculations for advanced reports
  const advancedReports = useMemo(() => {
    if (loading) return null;

    const teachersWithMissingAssignments = allTeachers.filter(t => t.subjectsTaught.length === 0 || t.subjectsTaught.every(st => !st.courseIds || st.courseIds.length === 0));
    
    const coursesWithMissingSubjects = allCourses.filter(c => {
        const totalHours = c.courseSubjects.reduce((sum, cs) => sum + cs.weeklyHours, 0);
        return totalHours < MAX_WEEKLY_HOURS_PER_COURSE;
    });

    const completeCourses = allCourses.filter(c => {
        const totalHours = c.courseSubjects.reduce((sum, cs) => sum + cs.weeklyHours, 0);
        return totalHours >= MAX_WEEKLY_HOURS_PER_COURSE;
    });

    const averageHours = allTeachers.length > 0
      ? allTeachers.reduce((sum, t) => sum + t.weeklyLoad, 0) / allTeachers.length
      : 0;

    return {
      teachersWithMissingAssignments,
      coursesWithMissingSubjects,
      completeCourses,
      averageHours
    }
  }, [allCourses, allTeachers, loading]);


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
          <h1 className="text-2xl font-bold text-gray-800 text-left">Informes y Horarios</h1>
          <p className="text-sm text-gray-600 text-left">
            Analiza el estado de la configuración y visualiza los horarios generados.
          </p>
        </div>
      </header>
      
      {/* Advanced Reports Section */}
      {advancedReports && (
        <Card className="shadow-lg border-gray-100 bg-white no-print">
          <CardHeader><CardTitle className="text-xl font-bold text-gray-800">Reportes de Estado</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Carga Media Semanal</CardTitle><Clock className="h-4 w-4 text-gray-500" /></CardHeader>
                  <CardContent><div className="text-2xl font-bold">{advancedReports.averageHours.toFixed(2)}h / docente</div></CardContent>
              </Card>
              <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Cursos Completos</CardTitle><CheckCircle className="h-4 w-4 text-green-500" /></CardHeader>
                  <CardContent><div className="text-2xl font-bold">{advancedReports.completeCourses.length}</div></CardContent>
              </Card>
              <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Cursos Incompletos</CardTitle><BookX className="h-4 w-4 text-orange-500" /></CardHeader>
                  <CardContent><div className="text-2xl font-bold">{advancedReports.coursesWithMissingSubjects.length}</div></CardContent>
              </Card>
              <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Docentes Sin Asignación</CardTitle><UserX className="h-4 w-4 text-red-500" /></CardHeader>
                  <CardContent><div className="text-2xl font-bold">{advancedReports.teachersWithMissingAssignments.length}</div></CardContent>
              </Card>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {courseSchedules.length === 0 && teacherSchedules.length === 0 ? (
          <Card className="shadow-lg border-gray-100 bg-white no-print">
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>No hay horarios generados para mostrar.</p>
              <p className="text-sm mt-2">Ve a la sección "Generar Horarios" para crearlos.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {courseSchedules.map((cs) => (
              <ScheduleView key={cs.courseId} title={`Horario - ${cs.courseName}`} schedule={cs.schedule} timeSlots={timeSlots} days={DAYS}/>
            ))}
            {teacherSchedules.map((ts) => (
              <ScheduleView key={ts.teacherId} title={`Horario - ${ts.teacherName}`} schedule={ts.schedule} timeSlots={timeSlots} days={DAYS} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}