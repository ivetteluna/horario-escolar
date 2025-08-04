"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { Course, Teacher, Subject, SchoolGrade, SchoolLevel } from "@/types"
import { Edit, Trash2, GraduationCap, CheckCircle, AlertTriangle, BookOpen } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { getSubjects, initDB } from "@/lib/db"

interface CourseListProps {
  courses: Course[]
  teachers: Teacher[]
  onEdit: (course: Course) => void
  onDelete: (id: string) => void
}

const MAX_WEEKLY_HOURS_PER_COURSE = 40 // Updated to 40 hours

export function CourseList({ courses, teachers, onEdit, onDelete }: CourseListProps) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSubjects = async () => {
      await initDB()
      const storedSubjects = await getSubjects()
      setSubjects(storedSubjects)
      setLoading(false)
    }
    loadSubjects()
  }, [])

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId)
    return teacher ? teacher.fullName : "Desconocido"
  }

  const getCourseSubjectsDisplay = (courseSubjects: { subjectId: string; weeklyHours: number }[]) => {
    if (!courseSubjects || courseSubjects.length === 0) {
      return "N/A"
    }
    return courseSubjects
      .map((cs) => {
        const subject = subjects.find((s) => s.id === cs.subjectId)
        return `${subject ? subject.name : "Desconocida"} (${cs.weeklyHours}h)`
      })
      .join(", ")
  }

  const summary = useMemo(() => {
    const totalCourses = courses.length
    const primariaCount = courses.filter((c) => c.level === "Primario").length
    const secundariaCount = courses.filter((c) => c.level === "Secundario").length
    const coursesWithProblems = courses.filter((course) => {
      const totalHours = course.courseSubjects.reduce((sum, cs) => sum + cs.weeklyHours, 0)
      // A course has a problem if its total assigned hours are not 40, or if it has no homeroom teacher
      return totalHours !== MAX_WEEKLY_HOURS_PER_COURSE || !course.homeroomTeacherId
    }).length

    return {
      totalCourses,
      primariaCount,
      secundariaCount,
      coursesWithProblems,
    }
  }, [courses])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-gray-600 text-lg">Cargando cursos y grupos...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white rounded-xl shadow-lg border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Cursos</CardTitle>
            <GraduationCap className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700">{summary.totalCourses}</div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-lg border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Primaria</CardTitle>
            <BookOpen className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700">{summary.primariaCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-lg border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Secundaria</CardTitle>
            <GraduationCap className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700">{summary.secundariaCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-lg border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Con Problemas</CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700">{summary.coursesWithProblems}</div>
          </CardContent>
        </Card>
      </div>

      {/* Automatic Ordering Info (as seen in image) */}
      <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 border border-blue-200 p-3 rounded-lg shadow-sm">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-arrow-down-up text-blue-600"
        >
          <path d="m3 16 4 4 4-4" />
          <path d="M7 20V4" />
          <path d="m21 8-4-4-4 4" />
          <path d="M17 4v16" />
        </svg>
        <span>
          <span className="font-semibold">Ordenamiento Automático Activo:</span> Los cursos se organizan automáticamente
          por nivel (Primario → Secundario), luego por grado (1º → 6º) y finalmente por sección (A → C).
        </span>
        <Badge variant="secondary" className="ml-auto bg-gray-100 text-gray-600">
          {courses.length} cursos ordenados
        </Badge>
      </div>

      {/* Course Cards Grid */}
      {(() => {
        const gradeMap: { [key in SchoolGrade]: number } = {
          Primero: 1,
          Segundo: 2,
          Tercero: 3,
          Cuarto: 4,
          Quinto: 5,
          Sexto: 6,
        }

        const levelOrderMap: { [key in SchoolLevel]: number } = {
          Primario: 1,
          Secundario: 2,
        }

        return courses.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No hay cursos/grupos registrados. Haz clic en "Generar Cursos Automáticamente" para crearlos.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses
              .sort((a, b) => {
                // Sort by level first
                const levelComparison = levelOrderMap[a.level] - levelOrderMap[b.level]
                if (levelComparison !== 0) {
                  return levelComparison
                }

                // Then by grade
                const gradeComparison = gradeMap[a.grade] - gradeMap[b.grade]
                if (gradeComparison !== 0) {
                  return gradeComparison
                }

                // Finally by section
                return a.section.localeCompare(b.section)
              })
              .map((course, index) => {
                const totalHoursAssigned = course.courseSubjects.reduce((sum, cs) => sum + cs.weeklyHours, 0)
                const isComplete = totalHoursAssigned === MAX_WEEKLY_HOURS_PER_COURSE && !!course.homeroomTeacherId
                const hasProblem = totalHoursAssigned !== MAX_WEEKLY_HOURS_PER_COURSE || !course.homeroomTeacherId

                return (
                  <Card key={course.id} className="shadow-lg border-gray-200 bg-white flex flex-col">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                      <CardTitle className="text-xl font-bold text-gray-800">
                        #{index + 1} {course.grade}º {course.section}{" "}
                        {course.level === "Primario" ? "Primario" : "Secundario"}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(course)}
                          aria-label="Editar curso/grupo"
                          className="text-gray-500 hover:text-emerald-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(course.id)}
                          aria-label="Eliminar curso/grupo"
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col gap-4">
                      <div className="text-sm text-gray-600">
                        {course.level} • {course.grade}º • Sección {course.section}
                      </div>
                      <div
                        className={`flex items-center gap-2 font-medium ${
                          course.homeroomTeacherId ? "text-emerald-600" : "text-orange-600"
                        }`}
                      >
                        {course.homeroomTeacherId ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertTriangle className="h-4 w-4" />
                        )}
                        <span>Docente Titular: {getTeacherName(course.homeroomTeacherId) || "No Asignado"}</span>
                      </div>

                      <div className="grid gap-2">
                        <div className="flex justify-between items-center text-gray-700 font-medium">
                          <span>Horas asignadas:</span>
                          <span>
                            {totalHoursAssigned}/{MAX_WEEKLY_HOURS_PER_COURSE}h
                          </span>
                        </div>
                        <Progress
                          value={(totalHoursAssigned / MAX_WEEKLY_HOURS_PER_COURSE) * 100}
                          className="h-2"
                          indicatorClassName={hasProblem ? "bg-red-500" : "bg-emerald-500"}
                        />
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>
                            Asignaturas: {course.courseSubjects.length}/{course.courseSubjects.length}
                          </span>{" "}
                          {/* Assuming all subjects are listed */}
                          <Badge
                            variant="secondary"
                            className={isComplete ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}
                          >
                            {isComplete ? "Completo" : "Incompleto"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        )
      })()}
    </div>
  )
}
