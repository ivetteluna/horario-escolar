// NUEVO HORARIO/components/teacher-list.tsx

"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { Teacher, Subject, Course } from "@/lib/types"
import { Edit, Trash2, Mail, Phone, ChevronDown, GraduationCap, BookOpen, Clock } from "lucide-react"
import { useState, useEffect } from "react"
import { getSubjects, initDB, getCourses } from "@/lib/db"

interface TeacherListProps {
  teachers: Teacher[]
  onEdit: (teacher: Teacher) => void
  onDelete: (id: string) => void
}

const MAX_TEACHER_WEEKLY_HOURS = 40

// Función para formatear el número para WhatsApp
const formatPhoneNumberForWhatsApp = (phone: string) => {
  // Elimina todo lo que no sea un número
  let cleaned = phone.replace(/\D/g, '');
  // Asume código de país +1 (República Dominicana) si no está presente
  if (cleaned.length === 10) {
    cleaned = '1' + cleaned;
  }
  return cleaned;
};

export function TeacherList({ teachers, onEdit, onDelete }: TeacherListProps) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      await initDB()
      const storedSubjects = await getSubjects()
      const storedCourses = await getCourses()
      setSubjects(storedSubjects)
      setCourses(storedCourses)
      setLoading(false)
    }
    loadData()
  }, [])

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find((s) => s.id === subjectId)
    return subject ? subject.name : "Desconocida"
  }

  const getSubjectShortCode = (subjectId: string) => {
    const subject = subjects.find((s) => s.id === subjectId)
    return subject?.shortCode || subject?.name.substring(0, 2).toUpperCase() || "??"
  }

  const getSubjectIconColor = (subjectId: string) => {
    const subject = subjects.find((s) => s.id === subjectId)
    return subject?.iconColor || "#6B7280"
  }

  const getTeacherTypeLabel = (type: string) => {
    switch (type) {
      case "fijo": return "fijo";
      case "rotacion": return "rotación";
      case "dos_niveles": return "dos niveles";
      case "mixto": return "mixto";
      default: return type;
    }
  }

  const getTeacherTypeColor = (type: string) => {
    switch (type) {
      case "fijo": return "bg-blue-100 text-blue-700";
      case "rotacion": return "bg-green-100 text-green-700";
      case "dos_niveles": return "bg-orange-100 text-orange-700";
      case "mixto": return "bg-purple-100 text-purple-700";
      default: return "bg-gray-100 text-gray-700";
    }
  }

  const getHomeroomCourse = (teacher: Teacher) => {
    if (!teacher.homeroomCourseId) return null
    return courses.find((course) => course.id === teacher.homeroomCourseId)
  }

  const getCourseDisplayName = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId)
    return course ? `${course.level} ${course.grade}º ${course.section}` : "Curso Desconocido"
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-gray-600 text-lg">Cargando docentes...</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.length === 0 ? (
          <div className="col-span-full text-center py-6 text-muted-foreground">No hay docentes registrados.</div>
        ) : (
          teachers.map((teacher) => {
            const homeroomCourse = getHomeroomCourse(teacher)
            const whatsappNumber = teacher.phone ? formatPhoneNumberForWhatsApp(teacher.phone) : '';

            return (
              <Card key={teacher.id} className="shadow-lg border-gray-200 bg-white flex flex-col">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex flex-col gap-1">
                    <CardTitle className="text-xl font-bold text-gray-800">{teacher.fullName}</CardTitle>
                    <div className="flex flex-wrap gap-1">
                      <Badge className={getTeacherTypeColor(teacher.teacherType)}>
                        {getTeacherTypeLabel(teacher.teacherType)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(teacher)} aria-label="Editar docente" className="text-gray-500 hover:text-emerald-600"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(teacher.id)} aria-label="Eliminar docente" className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col gap-4">
                  <div className="grid gap-2 text-sm text-gray-600">
                    {teacher.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>{teacher.email}</span>
                      </div>
                    )}
                    {teacher.phone && (
                      <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-emerald-600 transition-colors">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{teacher.phone}</span>
                      </a>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <div className="flex justify-between items-center text-gray-700 font-medium">
                      <span>Carga Horaria</span>
                      <span>{teacher.weeklyLoad}/{MAX_TEACHER_WEEKLY_HOURS}h</span>
                    </div>
                    <Progress value={(teacher.weeklyLoad / MAX_TEACHER_WEEKLY_HOURS) * 100} className="h-2" />
                  </div>

                  {(teacher.teacherType === "fijo" || teacher.teacherType === "mixto") && homeroomCourse && (
                    <div className="grid gap-1">
                      <span className="text-sm font-semibold text-gray-700">Curso Titular:</span>
                      <Badge variant="outline" className="w-fit bg-blue-50 text-blue-700 border-blue-200">{homeroomCourse.level} {homeroomCourse.grade}º {homeroomCourse.section}</Badge>
                    </div>
                  )}

                  <Collapsible className="grid gap-2">
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full justify-between text-gray-700 hover:bg-gray-100 bg-transparent">Asignaturas ({teacher.subjectsTaught.length})<ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" /></Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="grid gap-3 pt-2">
                      {teacher.subjectsTaught.length > 0 ? (
                        teacher.subjectsTaught.map((subjectTaught, index) => (
                          <div key={`${subjectTaught.subjectId}-${index}`} className="border border-gray-200 p-3 rounded-md bg-gray-50">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: getSubjectIconColor(subjectTaught.subjectId) }} />
                              <span className="font-semibold text-gray-800">{getSubjectName(subjectTaught.subjectId)}</span>
                              <span className="ml-auto text-sm text-gray-600 font-medium">{subjectTaught.weeklyHoursAssigned}h</span>
                            </div>
                            {subjectTaught.courseIds && subjectTaught.courseIds.length > 0 && (
                              <div className="text-xs text-gray-600 mt-2">
                                <span className="font-medium text-blue-600">Imparte en:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {subjectTaught.courseIds.map((courseId) => (
                                    <Badge key={courseId} variant="secondary" className="bg-blue-100 text-blue-700 text-xs">{getCourseDisplayName(courseId)}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm text-center py-2">No tiene asignaturas asignadas.</p>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </>
  )
}