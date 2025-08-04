// NUEVO HORARIO/components/teacher-list.tsx

"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { Teacher, Subject, Course } from "@/lib/types"
import { Edit, Trash2, Mail, Phone, ChevronDown } from "lucide-react"
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
  return phone.replace(/\D/g, '') // Elimina todo lo que no sea un número
};

export function TeacherList({ teachers, onEdit, onDelete }: TeacherListProps) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      await initDB()
      const [storedSubjects, storedCourses] = await Promise.all([getSubjects(), getCourses()])
      setSubjects(storedSubjects)
      setCourses(storedCourses)
      setLoading(false)
    }
    loadData()
  }, [])

  const getSubjectName = (subjectId: string) => subjects.find((s) => s.id === subjectId)?.name || "Desconocida";
  const getCourseDisplayName = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId)
    return course ? `${course.level} ${course.grade}º ${course.section}` : "Curso Desc."
  }

  // NUEVA FUNCIÓN para crear el mensaje de WhatsApp
  const createWhatsAppMessage = (teacher: Teacher) => {
    let message = `*Resumen de Carga Horaria para ${teacher.fullName}*\n\n`;
    message += `*Carga Total:* ${teacher.weeklyLoad}h / ${MAX_TEACHER_WEEKLY_HOURS}h\n\n`;

    if (teacher.subjectsTaught.length > 0) {
      teacher.subjectsTaught.forEach(st => {
        message += `*Asignatura: ${getSubjectName(st.subjectId)}* (${st.weeklyHoursAssigned}h)\n`;
        if (st.courseIds && st.courseIds.length > 0) {
          const courseNames = st.courseIds.map(id => getCourseDisplayName(id)).join(', ');
          message += `  - Cursos: ${courseNames}\n`;
        } else {
          message += `  - Cursos: No asignados\n`;
        }
        message += `\n`;
      });
    } else {
      message += "Este docente no tiene asignaturas asignadas actualmente.";
    }

    return encodeURIComponent(message);
  };

  if (loading) return <div className="text-center py-12">Cargando docentes...</div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {teachers.map((teacher) => {
        const whatsappNumber = teacher.phone ? formatPhoneNumberForWhatsApp(teacher.phone) : '';
        const whatsappMessage = createWhatsAppMessage(teacher);

        return (
          <Card key={teacher.id} className="shadow-lg border-gray-200 bg-white flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl font-bold text-gray-800">{teacher.fullName}</CardTitle>
                <div className="flex">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(teacher)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(teacher.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col gap-4">
              <div className="grid gap-2 text-sm text-gray-600">
                {teacher.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4" /><span>{teacher.email}</span></div>}
                {teacher.phone && (
                  <a href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-emerald-600 transition-colors">
                    <Phone className="h-4 w-4" />
                    <span>{teacher.phone}</span>
                  </a>
                )}
              </div>
              <div>
                <div className="flex justify-between items-center text-gray-700 font-medium mb-1">
                  <span>Carga Horaria</span>
                  <span>{teacher.weeklyLoad}/{MAX_TEACHER_WEEKLY_HOURS}h</span>
                </div>
                <Progress value={(teacher.weeklyLoad / MAX_TEACHER_WEEKLY_HOURS) * 100} className="h-2" />
              </div>
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">Asignaturas ({teacher.subjectsTaught.length})<ChevronDown className="h-4 w-4" /></Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  {teacher.subjectsTaught.map((st, i) => (
                    <div key={i} className="text-sm p-2 bg-gray-50 rounded-md mb-1">
                      <p className="font-semibold">{getSubjectName(st.subjectId)} ({st.weeklyHoursAssigned}h)</p>
                      <p className="text-xs text-muted-foreground">{st.courseIds.map(getCourseDisplayName).join(', ')}</p>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}