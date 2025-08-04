// NUEVO HORARIO/components/teacher-form.tsx

"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { MultiSelect } from "@/components/multi-select"
import { PlusCircle, XCircle } from "lucide-react"
import type {
  Teacher,
  TeacherType,
  Subject,
  SchoolLevel,
  SchoolGrade,
  SchoolSection,
  PredefinedTeacherName,
  Course,
} from "@/lib/types"
import { v4 as uuidv4 } from "uuid"
import { getSubjects, getPredefinedTeacherNames, getCourses } from "@/lib/db"

interface TeacherFormProps {
  initialData?: Teacher
  onSave: (teacher: Teacher) => void
  onCancel: () => void
}

interface SubjectAssignment {
  subjectId: string
  weeklyHoursAssigned: number
  courseIds: string[]
}

const levels: SchoolLevel[] = ["Primario", "Secundario"]
const grades: SchoolGrade[] = ["Primero", "Segundo", "Tercero", "Cuarto", "Quinto", "Sexto"]
const sections: SchoolSection[] = ["A", "B", "C", "D", "E"]

const getGradeOrder = (grade: SchoolGrade): number => {
  const gradeOrder = { Primero: 1, Segundo: 2, Tercero: 3, Cuarto: 4, Quinto: 5, Sexto: 6 }
  return gradeOrder[grade] || 0
}

const getLevelOrder = (level: SchoolLevel): number => (level === "Primario" ? 1 : 2)

export function TeacherForm({ initialData, onSave, onCancel }: TeacherFormProps) {
  const [fullName, setFullName] = useState(initialData?.fullName || "")
  const [email, setEmail] = useState(initialData?.email || "")
  const [phone, setPhone] = useState(initialData?.phone || "")
  const [specialty, setSpecialty] = useState(initialData?.specialty || "")
  const [assignedSubjects, setAssignedSubjects] = useState<SubjectAssignment[]>(initialData?.subjectsTaught || [])
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([])
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [restrictions, setRestrictions] = useState(initialData?.restrictions || "")
  const [teacherType, setTeacherType] = useState<TeacherType>(initialData?.teacherType || "fijo")
  const [qualifiedLevels, setQualifiedLevels] = useState<SchoolLevel[]>(initialData?.qualifiedLevels || [])
  const [qualifiedGrades, setQualifiedGrades] = useState<SchoolGrade[]>(initialData?.qualifiedGrades || [])
  const [qualifiedSections, setQualifiedSections] = useState<SchoolSection[]>(initialData?.qualifiedSections || [])
  const [homeroomCourseId, setHomeroomCourseId] = useState<string>(initialData?.homeroomCourseId || "")
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [predefinedNames, setPredefinedNames] = useState<PredefinedTeacherName[]>([])

  useEffect(() => {
    const loadData = async () => {
      const [subjects, names, courses] = await Promise.all([getSubjects(), getPredefinedTeacherNames(), getCourses()])
      setAvailableSubjects(subjects)
      setPredefinedNames(names)
      setAvailableCourses(courses)
    }
    loadData()
  }, [])

  const sortedCourses = useMemo(() => {
    return [...availableCourses].sort((a, b) => {
      const levelComparison = getLevelOrder(a.level) - getLevelOrder(b.level)
      if (levelComparison !== 0) return levelComparison
      const gradeComparison = getGradeOrder(a.grade) - getGradeOrder(b.grade)
      if (gradeComparison !== 0) return gradeComparison
      return a.section.localeCompare(b.section)
    })
  }, [availableCourses])

  const getAvailableCoursesForTeacher = useMemo(() => {
    if (teacherType === "fijo") {
      const homeroomCourse = availableCourses.find((c) => c.id === homeroomCourseId)
      return homeroomCourse ? [homeroomCourse] : []
    }
    return sortedCourses.filter((course) => {
      const levelMatch = qualifiedLevels.length === 0 || qualifiedLevels.includes(course.level)
      const gradeMatch = qualifiedGrades.length === 0 || qualifiedGrades.includes(course.grade)
      const sectionMatch = qualifiedSections.length === 0 || qualifiedSections.includes(course.section)
      return levelMatch && gradeMatch && sectionMatch
    })
  }, [teacherType, homeroomCourseId, availableCourses, sortedCourses, qualifiedLevels, qualifiedGrades, qualifiedSections])

  const calculateHoursForCourses = (subjectId: string, courseIds: string[]): number => {
    const subject = availableSubjects.find((s) => s.id === subjectId)
    if (!subject || !subject.weeklyHoursByLevelAndGrade) return 0
    let totalHours = 0
    courseIds.forEach((courseId) => {
      const course = availableCourses.find((c) => c.id === courseId)
      if (course) {
        const hours = subject.weeklyHoursByLevelAndGrade?.[course.level]?.[course.grade] || 0
        totalHours += hours
      }
    })
    return totalHours
  }

  const weeklyLoad = useMemo(() => {
    return assignedSubjects.reduce((sum, as) => sum + Number(as.weeklyHoursAssigned || 0), 0)
  }, [assignedSubjects])

  const handleAssignedSubjectsChange = (subjectId: string, courseIds: string[]) => {
    setAssignedSubjects((prev) => {
      const existingSubject = prev.find((s) => s.subjectId === subjectId)
      if (existingSubject) {
        // Update existing subject's courses
        const updated = prev.map((s) => {
          if (s.subjectId === subjectId) {
            const weeklyHoursAssigned = calculateHoursForCourses(subjectId, courseIds)
            return { ...s, courseIds, weeklyHoursAssigned }
          }
          return s
        })
        // Filter out subjects with no courses
        return updated.filter(s => s.courseIds.length > 0)
      } else {
        // Add new subject
        const weeklyHoursAssigned = calculateHoursForCourses(subjectId, courseIds)
        if (courseIds.length > 0) {
          return [...prev, { subjectId, courseIds, weeklyHoursAssigned }]
        }
        return prev
      }
    })
  }
  
  const handleSelectedSubjectsChange = (selectedSubjectIds: string[]) => {
    const newAssignedSubjects = selectedSubjectIds.map(id => {
        const existing = assignedSubjects.find(s => s.subjectId === id);
        return existing || { subjectId: id, courseIds: [], weeklyHoursAssigned: 0 };
    });
    setAssignedSubjects(newAssignedSubjects);
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errors: string[] = []
    if (!fullName.trim()) errors.push("El nombre completo del docente es obligatorio.")
    if (assignedSubjects.length === 0) errors.push("El docente debe tener al menos una asignatura asignada.")
    assignedSubjects.forEach((as, index) => {
      if (!as.subjectId) errors.push(`Por favor, selecciona una asignatura para la asignación en la fila ${index + 1}.`)
      if (as.courseIds.length === 0) errors.push(`Por favor, selecciona al menos un curso para la asignatura en la fila ${index + 1}.`)
      if (Number(as.weeklyHoursAssigned) <= 0) errors.push(`Las horas semanales asignadas para la asignatura en la fila ${index + 1} deben ser mayores que 0.`)
    })
    if ((teacherType === "rotacion" || teacherType === "dos_niveles" || teacherType === "mixto")) {
      if (qualifiedLevels.length === 0) errors.push("Por favor, selecciona al menos un nivel en el que el docente esté calificado.")
      if (qualifiedGrades.length === 0) errors.push("Por favor, selecciona al menos un grado en el que el docente esté calificado.")
      if (qualifiedSections.length === 0) errors.push("Por favor, selecciona al menos una sección en la que el docente esté calificado.")
    }
    if ((teacherType === "fijo" || teacherType === "mixto") && !homeroomCourseId) errors.push("Por favor, selecciona el curso del cual este docente es titular.")
    setFormErrors(errors)
    if (errors.length > 0) return

    const newTeacher: Teacher = {
      id: initialData?.id || uuidv4(),
      fullName,
      email,
      phone,
      specialty,
      subjectsTaught: assignedSubjects.map((as) => ({
        subjectId: as.subjectId,
        weeklyHoursAssigned: Number(as.weeklyHoursAssigned),
        courseIds: as.courseIds,
      })),
      weeklyLoad,
      restrictions,
      teacherType,
      qualifiedLevels: teacherType === "fijo" ? [] : qualifiedLevels,
      qualifiedGrades: teacherType === "fijo" ? [] : qualifiedGrades,
      qualifiedSections: teacherType === "fijo" ? [] : qualifiedSections,
      homeroomCourseId: teacherType === "fijo" || teacherType === "mixto" ? homeroomCourseId : undefined,
    }
    onSave(newTeacher)
  }

  const allNameOptions = useMemo(() => {
    const options = [...predefinedNames]
    if (fullName && !predefinedNames.some((n) => n.name === fullName)) {
      options.push({ id: "current-temp", name: fullName })
    }
    return options.sort((a, b) => a.name.localeCompare(b.name))
  }, [fullName, predefinedNames])

  const getTeacherTypeLabel = (type: TeacherType) => ({
    fijo: "Docente Fijo (Aula Fija)",
    rotacion: "Docente de Rotación",
    dos_niveles: "Docente de Dos Niveles",
    mixto: "Docente Mixto (Titular y Rotación)",
  }[type] || type)

  const getTeacherTypeDescription = (type: TeacherType) => ({
    fijo: "Docente que permanece en un aula fija y es titular de un curso específico.",
    rotacion: "Docente que rota entre diferentes aulas y cursos para impartir su(s) asignatura(s).",
    dos_niveles: "Docente que imparte clases en dos niveles educativos diferentes.",
    mixto: "Docente que es titular de un curso pero también rota para impartir asignaturas en otros cursos.",
  }[type] || "")

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-2xl font-semibold text-gray-800">{initialData ? "Editar Docente" : "Añadir Nuevo Docente"}</h2>
      
      {/* Personal Info */}
      <div className="grid gap-2">
        <Label htmlFor="fullName">Nombre Completo</Label>
        <Select value={fullName} onValueChange={setFullName}>
          <SelectTrigger id="fullName"><SelectValue placeholder="Seleccionar o añadir nombre" /></SelectTrigger>
          <SelectContent>
            {allNameOptions.map((nameItem) => (<SelectItem key={nameItem.id} value={nameItem.name}>{nameItem.name}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2"><Label htmlFor="email">Correo Electrónico</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ejemplo@dominio.com" /></div>
        <div className="grid gap-2"><Label htmlFor="phone">Número de Teléfono</Label><Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="809-123-4567" /></div>
      </div>
      <div className="grid gap-2"><Label htmlFor="specialty">Especialidad</Label><Input id="specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Ej. Educación Básica, Ciencias" /></div>

      {/* Teacher Type and Qualifications */}
      <div className="grid gap-2">
        <Label htmlFor="teacherType">Tipo de Docente</Label>
        <Select value={teacherType} onValueChange={(value: TeacherType) => setTeacherType(value)}>
          <SelectTrigger id="teacherType"><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="fijo">{getTeacherTypeLabel("fijo")}</SelectItem>
            <SelectItem value="rotacion">{getTeacherTypeLabel("rotacion")}</SelectItem>
            <SelectItem value="dos_niveles">{getTeacherTypeLabel("dos_niveles")}</SelectItem>
            <SelectItem value="mixto">{getTeacherTypeLabel("mixto")}</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">{getTeacherTypeDescription(teacherType)}</p>
      </div>
      {(teacherType === "fijo" || teacherType === "mixto") && (
        <div className="grid gap-2">
          <Label htmlFor="homeroomCourse">Curso Titular</Label>
          <Select value={homeroomCourseId} onValueChange={setHomeroomCourseId}>
            <SelectTrigger id="homeroomCourse"><SelectValue placeholder="Seleccionar curso del cual es titular" /></SelectTrigger>
            <SelectContent>
              {sortedCourses.map((course) => (<SelectItem key={course.id} value={course.id}>{course.level} {course.grade}º {course.section}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      )}
      {(teacherType === "rotacion" || teacherType === "dos_niveles" || teacherType === "mixto") && (
        <Card className="w-full shadow-sm"><CardContent className="p-4">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Calificaciones del Docente</h3>
          <div className="grid gap-4">
            <div className="grid gap-2"><Label htmlFor="qualifiedLevels">Niveles Calificados</Label><MultiSelect options={levels.map(l => ({label: l, value: l}))} selected={qualifiedLevels} onSelectedChange={v => setQualifiedLevels(v as SchoolLevel[])} placeholder="Seleccionar niveles" /></div>
            <div className="grid gap-2"><Label htmlFor="qualifiedGrades">Grados Calificados</Label><MultiSelect options={grades.map(g => ({label: g, value: g}))} selected={qualifiedGrades} onSelectedChange={v => setQualifiedGrades(v as SchoolGrade[])} placeholder="Seleccionar grados" /></div>
            <div className="grid gap-2"><Label htmlFor="qualifiedSections">Secciones Calificadas</Label><MultiSelect options={sections.map(s => ({label: s, value: s}))} selected={qualifiedSections} onSelectedChange={v => setQualifiedSections(v as SchoolSection[])} placeholder="Seleccionar secciones" /></div>
          </div>
        </CardContent></Card>
      )}

      {/* NEW: Improved Subject Assignment */}
      <Card className="w-full shadow-sm border-gray-100">
        <CardContent className="p-4">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Asignación de Asignaturas y Cursos</h3>
          <div className="grid gap-2 mb-4">
            <Label>Asignaturas que imparte</Label>
            <MultiSelect
              options={availableSubjects.map(s => ({ label: s.name, value: s.id }))}
              selected={assignedSubjects.map(as => as.subjectId)}
              onSelectedChange={handleSelectedSubjectsChange}
              placeholder="Seleccionar asignaturas"
            />
          </div>

          {assignedSubjects.length > 0 && (
            <div className="grid gap-4 mt-4 border-t pt-4">
              {assignedSubjects.map((assignment) => (
                <div key={assignment.subjectId} className="grid gap-2">
                  <Label className="font-semibold">{availableSubjects.find(s => s.id === assignment.subjectId)?.name}</Label>
                  <MultiSelect
                    options={getAvailableCoursesForTeacher.map(c => ({ label: `${c.level} ${c.grade}º ${c.section}`, value: c.id }))}
                    selected={assignment.courseIds}
                    onSelectedChange={(values) => handleAssignedSubjectsChange(assignment.subjectId, values)}
                    placeholder="Seleccionar cursos para esta asignatura"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Load and Restrictions */}
      <div className="grid gap-2"><Label htmlFor="weeklyLoad">Carga Horaria Semanal Total (Calculada)</Label><Input id="weeklyLoad" value={weeklyLoad} readOnly /></div>
      <div className="grid gap-2"><Label htmlFor="restrictions">Restricciones Personales</Label><Textarea id="restrictions" value={restrictions} onChange={(e) => setRestrictions(e.target.value)} placeholder="Ej. Lunes 8-10 AM no disponible" /></div>
      
      {/* Errors and Actions */}
      {formErrors.length > 0 && (<div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md"><p className="font-semibold mb-2">Errores:</p><ul className="list-disc list-inside">{formErrors.map((error, index) => (<li key={index}>{error}</li>))}</ul></div>)}
      <div className="flex justify-end gap-3 mt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">{initialData ? "Guardar Cambios" : "Añadir Docente"}</Button>
      </div>
    </form>
  )
}