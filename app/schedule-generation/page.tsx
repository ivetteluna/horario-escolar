// NUEVO HORARIO/app/schedule-generation/page.tsx

"use client"

import { useState, useEffect } from "react"
// ... (importaciones sin cambios)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Calendar, Users, BookOpen, Clock, CheckCircle, AlertTriangle, RotateCcw, Info } from "lucide-react"
import { getCourses, getTeachers, getSubjects, getSubjectTimeSlots, getDailySchedule, initDB, saveGeneratedSchedules } from "@/lib/db"
import type { Course, Teacher, Subject, SubjectTimeSlot, DailySchedule, Restriction } from "@/types"


// ... (interfaces GeneratedSchedule y TeacherSchedule sin cambios)
interface GeneratedSchedule {
  courseId: string;
  courseName: string;
  schedule: { [day: string]: { [timeSlot: string]: { subjectId: string; subjectName: string; teacherId: string; teacherName: string; hours: number; } | null } }
}
interface TeacherSchedule {
  teacherId: string;
  teacherName: string;
  schedule: { [day: string]: { [timeSlot: string]: { subjectId: string; subjectName: string; courseId: string; courseName: string; } | null } }
}

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]

export default function ScheduleGenerationPage() {
  // ... (estados sin cambios)
  const [courses, setCourses] = useState<Course[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [timeSlots, setTimeSlots] = useState<SubjectTimeSlot[]>([])
  const [dailySchedule, setDailySchedule] = useState<DailySchedule | undefined>()
  const [loading, setLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStatus, setGenerationStatus] = useState("")
  const [courseSchedules, setCourseSchedules] = useState<GeneratedSchedule[]>([])
  const [teacherSchedules, setTeacherSchedules] = useState<TeacherSchedule[]>([])
  const [generationErrors, setGenerationErrors] = useState<string[]>([])
  const [generationWarnings, setGenerationWarnings] = useState<string[]>([])
  const [generationSuccess, setGenerationSuccess] = useState(false)

  // ... (useEffect para cargar datos, sin cambios)
   useEffect(() => {
    const loadData = async () => {
      await initDB()
      const [coursesData, teachersData, subjectsData, timeSlotsData, scheduleData] = await Promise.all([
        getCourses(), getTeachers(), getSubjects(), getSubjectTimeSlots(), getDailySchedule(),
      ])
      setCourses(coursesData)
      setTeachers(teachersData)
      setSubjects(subjectsData)
      setTimeSlots(timeSlotsData.sort((a, b) => a.startTime.localeCompare(b.startTime)))
      setDailySchedule(scheduleData)
      setLoading(false)
    }
    loadData()
  }, [])
  
  const getCourseName = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId)
    return course ? `${course.level} ${course.grade}º ${course.section}` : "Desconocido"
  }

  // FUNCIÓN DE RESTRICCIONES ACTUALIZADA
  const checkTeacherRestrictions = (teacher: Teacher, day: string, timeSlot: SubjectTimeSlot): boolean => {
    if (!teacher.restrictions || teacher.restrictions.length === 0) return true;

    for (const restriction of teacher.restrictions) {
      if (restriction.day === day) {
        // Comprobar si el bloque de la clase se solapa con el de la restricción
        const slotStart = timeSlot.startTime;
        const slotEnd = timeSlot.endTime;
        const restrictionStart = restriction.startTime;
        const restrictionEnd = restriction.endTime;
        
        // (slotStart < restrictionEnd) y (slotEnd > restrictionStart)
        if (slotStart < restrictionEnd && slotEnd > restrictionStart) {
          return false; // Hay conflicto
        }
      }
    }
    return true; // No hay conflicto
  };
  
  // FUNCIÓN DE GENERACIÓN ACTUALIZADA
  const generateSchedules = async () => {
    setIsGenerating(true)
    setGenerationProgress(0)
    setGenerationStatus("Iniciando generación...")
    setGenerationErrors([])
    setGenerationWarnings([])
    setCourseSchedules([]);
    setTeacherSchedules([]);

    // Simulación de proceso para feedback visual
    await new Promise(res => setTimeout(res, 500));

    const newCourseSchedules: GeneratedSchedule[] = [];
    const newTeacherSchedules: TeacherSchedule[] = teachers.map(t => ({
      teacherId: t.id,
      teacherName: t.fullName,
      schedule: Object.fromEntries(DAYS.map(day => [day, {}]))
    }));

    const subjectPool = courses.flatMap(course => 
        course.courseSubjects.flatMap(cs => 
            Array(cs.weeklyHours).fill({
                courseId: course.id,
                subjectId: cs.subjectId,
            })
        )
    );
    
    // Asignar docentes al pool
    const assignmentPool = subjectPool.map(item => {
        const teacher = teachers.find(t => t.subjectsTaught.some(st => st.subjectId === item.subjectId && st.courseIds.includes(item.courseId)));
        return { ...item, teacherId: teacher?.id };
    }).filter(item => item.teacherId); // Filtrar asignaturas que no tienen docente

    let progress = 0;
    for (const course of courses) {
        progress++;
        setGenerationProgress((progress / courses.length) * 100);
        setGenerationStatus(`Procesando ${getCourseName(course.id)}`);
        
        const schedule: GeneratedSchedule['schedule'] = Object.fromEntries(DAYS.map(day => [day, {}]));
        
        const courseAssignments = assignmentPool.filter(a => a.courseId === course.id);

        for (const day of DAYS) {
            for (const slot of timeSlots) {
                if (courseAssignments.length > 0) {
                    let assigned = false;
                    for (let i = 0; i < courseAssignments.length; i++) {
                        const assignment = courseAssignments[i];
                        const teacher = teachers.find(t => t.id === assignment.teacherId);
                        const teacherSchedule = newTeacherSchedules.find(ts => ts.teacherId === assignment.teacherId);

                        if (teacher && teacherSchedule && !teacherSchedule.schedule[day][slot.id] && checkTeacherRestrictions(teacher, day, slot)) {
                           const subject = subjects.find(s => s.id === assignment.subjectId);
                           
                           schedule[day][slot.id] = {
                               subjectId: subject!.id,
                               subjectName: subject!.name,
                               teacherId: teacher.id,
                               teacherName: teacher.fullName,
                               hours: 1
                           };
                           
                           teacherSchedule.schedule[day][slot.id] = {
                               subjectId: subject!.id,
                               subjectName: subject!.name,
                               courseId: course.id,
                               courseName: getCourseName(course.id)
                           };
                           
                           courseAssignments.splice(i, 1);
                           assigned = true;
                           break;
                        }
                    }
                    if (!assigned) {
                       schedule[day][slot.id] = { subjectId: 'libre', subjectName: 'Hora Libre', teacherId: '', teacherName: '', hours: 1 };
                    }
                } else {
                     schedule[day][slot.id] = { subjectId: 'libre', subjectName: 'Hora Libre', teacherId: '', teacherName: '', hours: 1 };
                }
            }
        }
        newCourseSchedules.push({ courseId: course.id, courseName: getCourseName(course.id), schedule });
    }

    await saveGeneratedSchedules(newCourseSchedules, newTeacherSchedules);
    setCourseSchedules(newCourseSchedules);
    setTeacherSchedules(newTeacherSchedules);
    setGenerationStatus("¡Generación completada!");
    setGenerationSuccess(true);
    setIsGenerating(false);
  }

  // ... (renderizado del componente sin cambios, excepto el botón de generación)
   if (loading) return <div className="text-center py-12">Cargando datos...</div>

  return (
      <div className="flex flex-col gap-4 p-4">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white rounded-lg shadow-sm pl-4 pr-6">
              <SidebarTrigger className="mr-2" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <div>
                  <h1 className="text-2xl font-bold text-gray-800">Generación de Horarios</h1>
                  <p className="text-sm text-gray-600">Genera los horarios para todos los cursos y docentes.</p>
              </div>
          </header>

          <Card>
              <CardHeader>
                  <CardTitle>Panel de Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  <Button onClick={generateSchedules} disabled={isGenerating}>
                      {isGenerating ? "Generando..." : "Iniciar Generación de Horarios"}
                  </Button>
                  {isGenerating && (
                      <div className="space-y-2">
                           <Progress value={generationProgress} />
                           <p className="text-sm text-muted-foreground">{generationStatus}</p>
                      </div>
                  )}
                  {generationSuccess && <Alert><AlertDescription>¡Horarios generados y guardados con éxito!</AlertDescription></Alert>}
              </CardContent>
          </Card>
      </div>
  )
}