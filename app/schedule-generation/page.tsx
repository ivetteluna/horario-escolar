// NUEVO HORARIO/app/schedule-generation/page.tsx

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Calendar, Users, BookOpen, Clock, CheckCircle, AlertTriangle, RotateCcw, Info } from "lucide-react"
import { getCourses, getTeachers, getSubjects, getSubjectTimeSlots, getDailySchedule, initDB } from "@/lib/db"
import type { Course, Teacher, Subject, SubjectTimeSlot, DailySchedule } from "@/types"

interface GeneratedSchedule {
  courseId: string
  courseName: string
  schedule: {
    [day: string]: {
      [timeSlot: string]: {
        subjectId: string
        subjectName: string
        teacherId: string
        teacherName: string
        hours: number
      } | null
    }
  }
}

interface TeacherSchedule {
  teacherId: string
  teacherName: string
  schedule: {
    [day: string]: {
      [timeSlot: string]: {
        subjectId: string
        subjectName: string
        courseId: string
        courseName: string
      } | null
    }
  }
}

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]

export default function ScheduleGenerationPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [timeSlots, setTimeSlots] = useState<SubjectTimeSlot[]>([])
  const [dailySchedule, setDailySchedule] = useState<DailySchedule | undefined>()
  const [loading, setLoading] = useState(true)

  // Generation states
  const [isGeneratingCourses, setIsGeneratingCourses] = useState(false)
  const [isGeneratingTeachers, setIsGeneratingTeachers] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStatus, setGenerationStatus] = useState("")

  // Results
  const [courseSchedules, setCourseSchedules] = useState<GeneratedSchedule[]>([])
  const [teacherSchedules, setTeacherSchedules] = useState<TeacherSchedule[]>([])
  const [generationErrors, setGenerationErrors] = useState<string[]>([])
  const [generationWarnings, setGenerationWarnings] = useState<string[]>([])
  const [generationSuccess, setGenerationSuccess] = useState(false)

  // Diagnostic info
  const [diagnosticInfo, setDiagnosticInfo] = useState<{
    coursesWithMissingTeachers: Array<{
      courseName: string
      missingSubjects: Array<{ subjectName: string; hours: number }>
    }>
    teachersWithoutCourses: Array<{
      teacherName: string
      subjects: Array<{ subjectName: string; hours: number }>
    }>
  }>({
    coursesWithMissingTeachers: [],
    teachersWithoutCourses: [],
  })

  useEffect(() => {
    const loadData = async () => {
      await initDB()
      const [coursesData, teachersData, subjectsData, timeSlotsData, scheduleData] = await Promise.all([
        getCourses(),
        getTeachers(),
        getSubjects(),
        getSubjectTimeSlots(),
        getDailySchedule(),
      ])

      setCourses(coursesData)
      setTeachers(teachersData)
      setSubjects(subjectsData)
      setTimeSlots(timeSlotsData.sort((a, b) => a.startTime.localeCompare(b.startTime)))
      setDailySchedule(scheduleData)
      setLoading(false)

      // Realizar diagnóstico automático
      performDiagnostic(coursesData, teachersData, subjectsData)
    }
    loadData()
  }, [])

  const performDiagnostic = (coursesData: Course[], teachersData: Teacher[], subjectsData: Subject[]) => {
    const coursesWithMissingTeachers: typeof diagnosticInfo.coursesWithMissingTeachers = []
    const teachersWithoutCourses: typeof diagnosticInfo.teachersWithoutCourses = []

    // Analizar cada curso
    coursesData.forEach((course) => {
      const courseName = `${course.level} ${course.grade}º ${course.section}`
      const missingSubjects: Array<{ subjectName: string; hours: number }> = []

      course.courseSubjects.forEach((courseSubject) => {
        const subject = subjectsData.find((s) => s.id === courseSubject.subjectId)
        const subjectName = subject ? subject.name : "Asignatura Desconocida"

        // Buscar si hay un docente asignado para esta asignatura en este curso
        const teacherForSubject = teachersData.find((teacher) =>
          teacher.subjectsTaught.some(
            (st) => st.subjectId === courseSubject.subjectId && st.courseIds && st.courseIds.includes(course.id),
          ),
        )

        if (!teacherForSubject) {
          missingSubjects.push({
            subjectName,
            hours: courseSubject.weeklyHours,
          })
        }
      })

      if (missingSubjects.length > 0) {
        coursesWithMissingTeachers.push({
          courseName,
          missingSubjects,
        })
      }
    })

    // Analizar docentes sin cursos asignados
    teachersData.forEach((teacher) => {
      const subjectsWithoutCourses: Array<{ subjectName: string; hours: number }> = []

      teacher.subjectsTaught.forEach((subjectTaught) => {
        if (!subjectTaught.courseIds || subjectTaught.courseIds.length === 0) {
          const subject = subjectsData.find((s) => s.id === subjectTaught.subjectId)
          const subjectName = subject ? subject.name : "Asignatura Desconocida"

          subjectsWithoutCourses.push({
            subjectName,
            hours: subjectTaught.weeklyHoursAssigned,
          })
        }
      })

      if (subjectsWithoutCourses.length > 0) {
        teachersWithoutCourses.push({
          teacherName: teacher.fullName,
          subjects: subjectsWithoutCourses,
        })
      }
    })

    setDiagnosticInfo({
      coursesWithMissingTeachers,
      teachersWithoutCourses,
    })
  }

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find((s) => s.id === subjectId)
    return subject ? subject.name : "Desconocida"
  }

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId)
    return teacher ? teacher.fullName : "Desconocido"
  }

  const getCourseName = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId)
    return course ? `${course.level} ${course.grade}º ${course.section}` : "Desconocido"
  }

  // Función para encontrar el docente que puede enseñar una asignatura en un curso específico
  const findTeacherForSubject = (subjectId: string, courseId: string): Teacher | null => {
    return (
      teachers.find((teacher) => {
        // Verificar si el docente enseña esta asignatura en este curso específico
        const teachesSubject = teacher.subjectsTaught.some(
          (st) => st.subjectId === subjectId && st.courseIds && st.courseIds.includes(courseId),
        )
        return teachesSubject
      }) || null
    )
  }

  // Función para verificar restricciones del docente
  const checkTeacherRestrictions = (teacher: Teacher, day: string, timeSlot: SubjectTimeSlot): boolean => {
    if (!teacher.restrictions || teacher.restrictions.trim() === "") return true

    // Parsear restricciones básicas (formato: "Lunes 8:00-10:00 no disponible")
    const restrictions = teacher.restrictions.toLowerCase()
    const daySpanish = day.toLowerCase()
    const slotStart = timeSlot.startTime

    // Verificar si hay restricción para este día
    if (restrictions.includes(daySpanish)) {
      // Verificar si hay restricción de hora específica
      const timePattern = /(\d{1,2}):(\d{2})/g
      const matches = [...restrictions.matchAll(timePattern)]

      if (matches.length >= 2) {
        const restrictionStart = matches[0][0]
        const restrictionEnd = matches[1][0]

        // Comparar horas (simplificado)
        if (slotStart >= restrictionStart && slotStart <= restrictionEnd) {
          return false
        }
      }
    }

    return true
  }

  // Función para asignar horas pedagógicas de manera inteligente
  const assignPedagogicalHours = (
    courseSchedule: GeneratedSchedule,
    newTeacherSchedules: TeacherSchedule[],
    course: Course,
  ) => {
    const availableTeachers = teachers.filter((teacher) => {
      // Docentes que enseñan en este curso
      return (
        teacher.subjectsTaught.some((st) => st.courseIds && st.courseIds.includes(course.id)) ||
        teacher.homeroomCourseId === course.id
      )
    })

    if (availableTeachers.length === 0) return

    DAYS.forEach((day) => {
      timeSlots.forEach((slot) => {
        if (courseSchedule.schedule[day][slot.id] === null) {
          // Buscar un docente disponible para hora pedagógica
          const availableTeacher = availableTeachers.find((teacher) => {
            const teacherSchedule = newTeacherSchedules.find((ts) => ts.teacherId === teacher.id)
            return (
              teacherSchedule && !teacherSchedule.schedule[day][slot.id] && checkTeacherRestrictions(teacher, day, slot)
            )
          })

          if (availableTeacher) {
            // Asignar hora pedagógica
            courseSchedule.schedule[day][slot.id] = {
              subjectId: "pedagogical",
              subjectName: "Hora Pedagógica",
              teacherId: availableTeacher.id,
              teacherName: availableTeacher.fullName,
              hours: 1,
            }

            // Actualizar horario del docente
            const teacherSchedule = newTeacherSchedules.find((ts) => ts.teacherId === availableTeacher.id)
            if (teacherSchedule) {
              teacherSchedule.schedule[day][slot.id] = {
                subjectId: "pedagogical",
                subjectName: "Hora Pedagógica",
                courseId: course.id,
                courseName: getCourseName(course.id),
              }
            }
          } else {
            // Si no hay docente disponible, dejar como hora libre
            courseSchedule.schedule[day][slot.id] = {
              subjectId: "free",
              subjectName: "Hora Libre",
              teacherId: "",
              teacherName: "",
              hours: 1,
            }
          }
        }
      })
    })
  }

  // Algoritmo de generación de horarios por curso mejorado
  const generateCourseSchedules = async () => {
    setIsGeneratingCourses(true)
    setGenerationProgress(0)
    setGenerationStatus("Iniciando generación de horarios por curso...")
    setGenerationErrors([])
    setGenerationWarnings([])

    try {
      const newCourseSchedules: GeneratedSchedule[] = []
      const newTeacherSchedules: TeacherSchedule[] = []
      const errors: string[] = []
      const warnings: string[] = []

      // Verificar prerequisitos antes de generar
      if (diagnosticInfo.coursesWithMissingTeachers.length > 0) {
        diagnosticInfo.coursesWithMissingTeachers.forEach((courseInfo) => {
          courseInfo.missingSubjects.forEach((subject) => {
            errors.push(`${courseInfo.courseName}: Falta docente para ${subject.subjectName} (${subject.hours}h)`)
          })
        })
      }

      if (diagnosticInfo.teachersWithoutCourses.length > 0) {
        diagnosticInfo.teachersWithoutCourses.forEach((teacherInfo) => {
          teacherInfo.subjects.forEach((subject) => {
            warnings.push(`${teacherInfo.teacherName}: ${subject.subjectName} (${subject.hours}h) sin cursos asignados`)
          })
        })
      }

      // Si hay errores críticos, no continuar
      if (errors.length > 0) {
        setGenerationErrors(errors)
        setGenerationWarnings(warnings)
        setGenerationStatus("No se puede generar: faltan asignaciones docente-curso")
        setGenerationProgress(100)
        return
      }

      // Inicializar horarios de docentes
      teachers.forEach((teacher) => {
        const schedule: TeacherSchedule["schedule"] = {}
        DAYS.forEach((day) => {
          schedule[day] = {}
          timeSlots.forEach((slot) => {
            schedule[day][slot.id] = null
          })
        })
        newTeacherSchedules.push({
          teacherId: teacher.id,
          teacherName: teacher.fullName,
          schedule,
        })
      })

      // Crear una matriz de disponibilidad global para evitar colisiones
      const globalAvailability: { [day: string]: { [timeSlot: string]: string[] } } = {}
      DAYS.forEach((day) => {
        globalAvailability[day] = {}
        timeSlots.forEach((slot) => {
          globalAvailability[day][slot.id] = []
        })
      })

      // Generar horario para cada curso
      for (let courseIndex = 0; courseIndex < courses.length; courseIndex++) {
        const course = courses[courseIndex]
        setGenerationStatus(`Generando horario para ${getCourseName(course.id)}...`)
        setGenerationProgress((courseIndex / courses.length) * 80)

        const courseSchedule: GeneratedSchedule = {
          courseId: course.id,
          courseName: getCourseName(course.id),
          schedule: {},
        }

        // Inicializar horario del curso
        DAYS.forEach((day) => {
          courseSchedule.schedule[day] = {}
          timeSlots.forEach((slot) => {
            courseSchedule.schedule[day][slot.id] = null
          })
        })

        // Crear un pool de asignaturas con sus horas requeridas
        const subjectPool: Array<{
          subjectId: string
          subjectName: string
          teacherId: string
          teacherName: string
          priority: number
        }> = []

        // Verificar que todas las asignaturas del curso tengan docente asignado
        let courseHasAllTeachers = true
        for (const courseSubject of course.courseSubjects) {
          const subject = subjects.find((s) => s.id === courseSubject.subjectId)
          if (!subject) continue

          const teacher = findTeacherForSubject(courseSubject.subjectId, course.id)
          if (!teacher) {
            errors.push(`${getCourseName(course.id)}: No se encontró docente para ${subject.name}`)
            courseHasAllTeachers = false
            continue
          }

          // Asignar prioridad basada en la configuración de la asignatura
          const priority = subject.priority === "alta" ? 3 : subject.priority === "media" ? 2 : 1

          // Agregar cada hora como una entrada separada para mejor distribución
          for (let i = 0; i < courseSubject.weeklyHours; i++) {
            subjectPool.push({
              subjectId: courseSubject.subjectId,
              subjectName: subject.name,
              teacherId: teacher.id,
              teacherName: teacher.fullName,
              priority,
            })
          }
        }

        if (!courseHasAllTeachers) {
          continue
        }

        // Ordenar por prioridad (alta prioridad primero)
        subjectPool.sort((a, b) => b.priority - a.priority)

        // Distribuir asignaturas con mejor algoritmo
        const subjectTimeTracker: { [subjectId: string]: { [timeSlotId: string]: number } } = {}
        const teacherDailyLoad: { [teacherId: string]: { [day: string]: number } } = {}

        // Inicializar tracker de carga diaria por docente
        teachers.forEach((teacher) => {
          teacherDailyLoad[teacher.id] = {}
          DAYS.forEach((day) => {
            teacherDailyLoad[teacher.id][day] = 0
          })
        })

        let assignedHours = 0
        const maxAttempts = subjectPool.length * 20

        for (let poolIndex = 0; poolIndex < subjectPool.length; poolIndex++) {
          const currentSubject = subjectPool[poolIndex]
          let assigned = false
          let attempts = 0

          while (!assigned && attempts < maxAttempts / subjectPool.length) {
            attempts++

            // Crear arrays aleatorios de días y slots
            const dayIndices = Array.from({ length: DAYS.length }, (_, i) => i)
            const slotIndices = Array.from({ length: timeSlots.length }, (_, i) => i)

            // Barajar para distribución aleatoria
            for (let i = dayIndices.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1))
              ;[dayIndices[i], dayIndices[j]] = [dayIndices[j], dayIndices[i]]
            }

            for (let i = slotIndices.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1))
              ;[slotIndices[i], slotIndices[j]] = [slotIndices[j], slotIndices[i]]
            }

            // Intentar asignar
            for (const dayIndex of dayIndices) {
              if (assigned) break
              for (const slotIndex of slotIndices) {
                if (assigned) break

                const day = DAYS[dayIndex]
                const slot = timeSlots[slotIndex]

                // Verificaciones básicas
                if (courseSchedule.schedule[day][slot.id] !== null) continue
                if (globalAvailability[day][slot.id].includes(currentSubject.teacherId)) continue

                // Verificar restricciones del docente
                const teacher = teachers.find((t) => t.id === currentSubject.teacherId)
                if (teacher && !checkTeacherRestrictions(teacher, day, slot)) continue

                // Verificar distribución de la asignatura
                if (!subjectTimeTracker[currentSubject.subjectId]) {
                  subjectTimeTracker[currentSubject.subjectId] = {}
                }

                const timesAtThisSlot = subjectTimeTracker[currentSubject.subjectId][slot.id] || 0
                if (timesAtThisSlot >= 2) continue

                // Verificar carga diaria del docente (máximo 6 horas por día)
                if (teacherDailyLoad[currentSubject.teacherId][day] >= 6) continue

                // Asignar la clase
                courseSchedule.schedule[day][slot.id] = {
                  subjectId: currentSubject.subjectId,
                  subjectName: currentSubject.subjectName,
                  teacherId: currentSubject.teacherId,
                  teacherName: currentSubject.teacherName,
                  hours: 1,
                }

                // Actualizar trackers
                globalAvailability[day][slot.id].push(currentSubject.teacherId)
                subjectTimeTracker[currentSubject.subjectId][slot.id] = timesAtThisSlot + 1
                teacherDailyLoad[currentSubject.teacherId][day]++

                // Actualizar horario del docente
                const teacherSchedule = newTeacherSchedules.find((ts) => ts.teacherId === currentSubject.teacherId)
                if (teacherSchedule) {
                  teacherSchedule.schedule[day][slot.id] = {
                    subjectId: currentSubject.subjectId,
                    subjectName: currentSubject.subjectName,
                    courseId: course.id,
                    courseName: getCourseName(course.id),
                  }
                }

                assigned = true
                assignedHours++
              }
            }
          }

          if (!assigned) {
            warnings.push(`${getCourseName(course.id)}: No se pudo asignar ${currentSubject.subjectName}`)
          }
        }

        if (assignedHours < subjectPool.length) {
          warnings.push(`${getCourseName(course.id)}: Solo se asignaron ${assignedHours}/${subjectPool.length} horas`)
        }

        newCourseSchedules.push(courseSchedule)
      }

      // Asignar horas pedagógicas de manera inteligente
      setGenerationStatus("Asignando horas pedagógicas...")
      setGenerationProgress(85)

      newCourseSchedules.forEach((courseSchedule) => {
        const course = courses.find((c) => c.id === courseSchedule.courseId)
        if (course) {
          assignPedagogicalHours(courseSchedule, newTeacherSchedules, course)
        }
      })

      setCourseSchedules(newCourseSchedules)
      setTeacherSchedules(newTeacherSchedules)
      setGenerationErrors(errors)
      setGenerationWarnings(warnings)
      setGenerationSuccess(errors.length === 0)
      setGenerationStatus(
        errors.length === 0
          ? warnings.length === 0
            ? "¡Horarios generados exitosamente!"
            : "Generación completada con advertencias menores"
          : "Generación completada con errores",
      )
      setGenerationProgress(100)
    } catch (error) {
      console.error("Error generando horarios:", error)
      setGenerationErrors(["Error interno durante la generación de horarios"])
      setGenerationStatus("Error durante la generación")
    } finally {
      setIsGeneratingCourses(false)
    }
  }

  // Generar solo horarios de docentes (usando los horarios de curso existentes)
  const generateTeacherSchedules = async () => {
    setIsGeneratingTeachers(true)
    setGenerationProgress(0)
    setGenerationStatus("Generando horarios individuales de docentes...")

    try {
      if (courseSchedules.length === 0) {
        setGenerationErrors(["Primero debes generar los horarios por curso"])
        setGenerationStatus("Error: No hay horarios de curso generados")
        return
      }

      setGenerationStatus("¡Horarios de docentes actualizados!")
      setGenerationProgress(100)
      setGenerationSuccess(true)
    } catch (error) {
      console.error("Error generando horarios de docentes:", error)
      setGenerationErrors(["Error interno durante la generación de horarios de docentes"])
      setGenerationStatus("Error durante la generación")
    } finally {
      setIsGeneratingTeachers(false)
    }
  }

  const resetGeneration = () => {
    setCourseSchedules([])
    setTeacherSchedules([])
    setGenerationErrors([])
    setGenerationWarnings([])
    setGenerationSuccess(false)
    setGenerationProgress(0)
    setGenerationStatus("")
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-gray-600 text-lg">Cargando datos para generación...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 pl-4 pr-6 bg-white rounded-lg shadow-sm">
        <SidebarTrigger className="mr-2" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex flex-col flex-grow">
          <h1 className="text-2xl font-bold text-gray-800 text-left">Generación Inteligente de Horarios</h1>
          <p className="text-sm text-gray-600 text-left">
            Sistema avanzado de generación automática de horarios sin colisiones
          </p>
        </div>
      </header>

      {/* Diagnóstico del sistema */}
      {(diagnosticInfo.coursesWithMissingTeachers.length > 0 || diagnosticInfo.teachersWithoutCourses.length > 0) && (
        <Card className="shadow-lg border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Problemas Detectados en la Configuración
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {diagnosticInfo.coursesWithMissingTeachers.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-700 mb-2">Cursos sin docentes asignados:</h4>
                <div className="space-y-2">
                  {diagnosticInfo.coursesWithMissingTeachers.map((courseInfo, index) => (
                    <div key={index} className="bg-white p-3 rounded border border-red-200">
                      <div className="font-medium text-red-800">{courseInfo.courseName}</div>
                      <div className="text-sm text-red-600 mt-1">
                        Faltan docentes para:{" "}
                        {courseInfo.missingSubjects.map((s) => `${s.subjectName} (${s.hours}h)`).join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {diagnosticInfo.teachersWithoutCourses.length > 0 && (
              <div>
                <h4 className="font-semibold text-orange-700 mb-2">Docentes con asignaturas sin cursos específicos:</h4>
                <div className="space-y-2">
                  {diagnosticInfo.teachersWithoutCourses.map((teacherInfo, index) => (
                    <div key={index} className="bg-white p-3 rounded border border-orange-200">
                      <div className="font-medium text-orange-800">{teacherInfo.teacherName}</div>
                      <div className="text-sm text-orange-600 mt-1">
                        Asignaturas sin cursos:{" "}
                        {teacherInfo.subjects.map((s) => `${s.subjectName} (${s.hours}h)`).join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Solución:</strong> Ve a la sección "Docentes" y asegúrate de que cada docente tenga asignados
                los cursos específicos donde impartirá sus asignaturas. Las asignaturas se agregarán automáticamente a
                los cursos.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Estadísticas del sistema */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white rounded-xl shadow-lg border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Cursos</CardTitle>
            <Calendar className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{courses.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-lg border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Docentes</CardTitle>
            <Users className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700">{teachers.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-lg border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Asignaturas</CardTitle>
            <BookOpen className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700">{subjects.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-lg border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Bloques Horarios</CardTitle>
            <Clock className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700">{timeSlots.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Panel de control de generación */}
      <Card className="shadow-lg border-gray-100">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-800">Panel de Control de Generación</CardTitle>
          <p className="text-sm text-muted-foreground">
            Genera horarios inteligentes evitando colisiones, respetando restricciones y distribuyendo equilibradamente
            las asignaturas
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Botones principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={generateCourseSchedules}
              disabled={isGeneratingCourses || isGeneratingTeachers}
              className="h-20 bg-blue-600 hover:bg-blue-700 text-white shadow-md flex flex-col items-center justify-center gap-2"
            >
              <Calendar className="h-6 w-6" />
              <span className="font-semibold">Generar Horarios por Curso</span>
              <span className="text-xs opacity-90">Crea horarios para cada grupo</span>
            </Button>

            <Button
              onClick={generateTeacherSchedules}
              disabled={isGeneratingTeachers || isGeneratingCourses || courseSchedules.length === 0}
              className="h-20 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex flex-col items-center justify-center gap-2"
            >
              <Users className="h-6 w-6" />
              <span className="font-semibold">Actualizar Horarios de Docentes</span>
              <span className="text-xs opacity-90">Sincroniza horarios individuales</span>
            </Button>

            <Button
              onClick={resetGeneration}
              disabled={isGeneratingCourses || isGeneratingTeachers}
              variant="outline"
              className="h-20 border-gray-300 text-gray-700 hover:bg-gray-100 shadow-sm flex flex-col items-center justify-center gap-2 bg-transparent"
            >
              <RotateCcw className="h-6 w-6" />
              <span className="font-semibold">Reiniciar Generación</span>
              <span className="text-xs opacity-90">Limpia resultados actuales</span>
            </Button>
          </div>

          {/* Progreso de generación */}
          {(isGeneratingCourses || isGeneratingTeachers) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{generationStatus}</span>
                <span className="text-sm text-gray-500">{generationProgress.toFixed(0)}%</span>
              </div>
              <Progress value={generationProgress} className="h-3" />
            </div>
          )}

          {/* Resultados */}
          {generationStatus && !isGeneratingCourses && !isGeneratingTeachers && (
            <Alert
              className={generationSuccess ? "border-emerald-200 bg-emerald-50" : "border-orange-200 bg-orange-50"}
            >
              <div className="flex items-center gap-2">
                {generationSuccess ? (
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                )}
                <AlertDescription className={generationSuccess ? "text-emerald-800" : "text-orange-800"}>
                  {generationStatus}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Errores */}
          {generationErrors.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <AlertDescription className="text-red-800">
                <div className="font-semibold mb-2">Errores encontrados:</div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {generationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Advertencias */}
          {generationWarnings.length > 0 && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <div className="font-semibold mb-2">Advertencias:</div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {generationWarnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Resumen de resultados */}
      {(courseSchedules.length > 0 || teacherSchedules.length > 0) && (
        <Card className="shadow-lg border-gray-100">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800">Resumen de Horarios Generados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Horarios por curso */}
              {courseSchedules.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Horarios por Curso ({courseSchedules.length})
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {courseSchedules.map((schedule) => (
                      <div
                        key={schedule.courseId}
                        className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        <span className="font-medium text-blue-800">{schedule.courseName}</span>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          Generado
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Horarios por docente */}
              {teacherSchedules.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Users className="h-5 w-5 text-emerald-600" />
                    Horarios por Docente ({teacherSchedules.length})
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {teacherSchedules.map((schedule) => (
                      <div
                        key={schedule.teacherId}
                        className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200"
                      >
                        <span className="font-medium text-emerald-800">{schedule.teacherName}</span>
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                          Sincronizado
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}