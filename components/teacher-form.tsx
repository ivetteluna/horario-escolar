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
  courseIds: string[] // NEW: Specific courses where this subject will be taught
}

const levels: SchoolLevel[] = ["Primario", "Secundario"]
const grades: SchoolGrade[] = ["Primero", "Segundo", "Tercero", "Cuarto", "Quinto", "Sexto"]
const sections: SchoolSection[] = ["A", "B", "C", "D", "E"]

// Helper function to get grade order for sorting
const getGradeOrder = (grade: SchoolGrade): number => {
  const gradeOrder = {
    Primero: 1,
    Segundo: 2,
    Tercero: 3,
    Cuarto: 4,
    Quinto: 5,
    Sexto: 6,
  }
  return gradeOrder[grade] || 0
}

// Helper function to get level order for sorting
const getLevelOrder = (level: SchoolLevel): number => {
  return level === "Primario" ? 1 : 2
}

export function TeacherForm({ initialData, onSave, onCancel }: TeacherFormProps) {
  const [fullName, setFullName] = useState(initialData?.fullName || "")
  const [email, setEmail] = useState(initialData?.email || "")
  const [phone, setPhone] = useState(initialData?.phone || "")
  const [specialty, setSpecialty] = useState(initialData?.specialty || "")
  const [assignedSubjects, setAssignedSubjects] = useState<SubjectAssignment[]>(
    initialData?.subjectsTaught?.map((st) => ({
      subjectId: st.subjectId,
      weeklyHoursAssigned: st.weeklyHoursAssigned,
      courseIds: st.courseIds || [],
    })) || [],
  )
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

      if (initialData) {
        setFullName(initialData.fullName)
        setEmail(initialData.email || "")
        setPhone(initialData.phone || "")
        setSpecialty(initialData.specialty || "")
        setAssignedSubjects(
          initialData.subjectsTaught?.map((st) => ({
            subjectId: st.subjectId,
            weeklyHoursAssigned: st.weeklyHoursAssigned,
            courseIds: st.courseIds || [],
          })) || [],
        )
        setRestrictions(initialData.restrictions)
        setTeacherType(initialData.teacherType)
        setQualifiedLevels(initialData.qualifiedLevels || [])
        setQualifiedGrades(initialData.qualifiedGrades || [])
        setQualifiedSections(initialData.qualifiedSections || [])
        setHomeroomCourseId(initialData.homeroomCourseId || "")
      }
    }
    loadData()
  }, [initialData])

  // Sort courses properly: Primary first (1st to 6th), then Secondary (1st to 6th)
  const sortedCourses = useMemo(() => {
    return [...availableCourses].sort((a, b) => {
      // First sort by level (Primary first, then Secondary)
      const levelComparison = getLevelOrder(a.level) - getLevelOrder(b.level)
      if (levelComparison !== 0) return levelComparison

      // Then sort by grade (1st to 6th)
      const gradeComparison = getGradeOrder(a.grade) - getGradeOrder(b.grade)
      if (gradeComparison !== 0) return gradeComparison

      // Finally sort by section (A, B, C, etc.)
      return a.section.localeCompare(b.section)
    })
  }, [availableCourses])

  // Get available courses for a teacher based on their qualifications
  const getAvailableCoursesForTeacher = (): Course[] => {
    if (teacherType === "fijo") {
      // Fixed teachers can only teach in their homeroom course
      const homeroomCourse = availableCourses.find((c) => c.id === homeroomCourseId)
      return homeroomCourse ? [homeroomCourse] : []
    }

    // For rotating teachers, filter by qualifications
    return sortedCourses.filter((course) => {
      const levelMatch = qualifiedLevels.length === 0 || qualifiedLevels.includes(course.level)
      const gradeMatch = qualifiedGrades.length === 0 || qualifiedGrades.includes(course.grade)
      const sectionMatch = qualifiedSections.length === 0 || qualifiedSections.includes(course.section)
      return levelMatch && gradeMatch && sectionMatch
    })
  }

  // Calculate suggested hours based on selected courses and subject configuration
  const calculateHoursForCourses = (subjectId: string, courseIds: string[]): number => {
    const subject = availableSubjects.find((s) => s.id === subjectId)
    if (!subject || !subject.weeklyHoursByLevelAndGrade) return 0

    let totalHours = 0
    courseIds.forEach((courseId) => {
      const course = availableCourses.find((c) => c.id === courseId)
      if (course) {
        const hours = subject.weeklyHoursByLevelAndGrade[course.level]?.[course.grade] || 0
        totalHours += hours
      }
    })

    return totalHours
  }

  // Calculate weeklyLoad based on assignedSubjects
  const weeklyLoad = useMemo(() => {
    return assignedSubjects.reduce((sum, as) => sum + Number(as.weeklyHoursAssigned || 0), 0)
  }, [assignedSubjects])

  const handleAddAssignedSubject = () => {
    setAssignedSubjects([...assignedSubjects, { subjectId: "", weeklyHoursAssigned: 0, courseIds: [] }])
  }

  const handleRemoveAssignedSubject = (index: number) => {
    setAssignedSubjects(assignedSubjects.filter((_, i) => i !== index))
  }

  const handleAssignedSubjectChange = (
    index: number,
    field: "subjectId" | "weeklyHoursAssigned" | "courseIds",
    value: string | number | string[],
  ) => {
    const newAssignedSubjects = [...assignedSubjects]

    if (field === "weeklyHoursAssigned") {
      const numValue = value === "" ? 0 : Number(value)
      newAssignedSubjects[index] = { ...newAssignedSubjects[index], [field]: numValue }
    } else if (field === "courseIds") {
      const courseIds = value as string[]
      const suggestedHours = calculateHoursForCourses(newAssignedSubjects[index].subjectId, courseIds)
      newAssignedSubjects[index] = {
        ...newAssignedSubjects[index],
        courseIds,
        weeklyHoursAssigned: suggestedHours,
      }
    } else {
      // When subject changes, reset courses and hours
      newAssignedSubjects[index] = {
        ...newAssignedSubjects[index],
        [field]: value,
        courseIds: [],
        weeklyHoursAssigned: 0,
      }
    }
    setAssignedSubjects(newAssignedSubjects)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errors: string[] = []

    if (!fullName.trim()) {
      errors.push("El nombre completo del docente es obligatorio.")
    }
    if (assignedSubjects.length === 0) {
      errors.push("El docente debe tener al menos una asignatura asignada.")
    }

    assignedSubjects.forEach((as, index) => {
      if (!as.subjectId) {
        errors.push(`Por favor, selecciona una asignatura para la asignación en la fila ${index + 1}.`)
      }
      if (as.courseIds.length === 0) {
        errors.push(`Por favor, selecciona al menos un curso para la asignatura en la fila ${index + 1}.`)
      }
      if (Number(as.weeklyHoursAssigned) <= 0) {
        errors.push(`Las horas semanales asignadas para la asignatura en la fila ${index + 1} deben ser mayores que 0.`)
      }
    })

    // Validation for rotating teachers
    if (teacherType === "rotacion" || teacherType === "dos_niveles" || teacherType === "mixto") {
      if (qualifiedLevels.length === 0) {
        errors.push("Por favor, selecciona al menos un nivel en el que el docente esté calificado.")
      }
      if (qualifiedGrades.length === 0) {
        errors.push("Por favor, selecciona al menos un grado en el que el docente esté calificado.")
      }
      if (qualifiedSections.length === 0) {
        errors.push("Por favor, selecciona al menos una sección en la que el docente esté calificado.")
      }
    }

    // Validation for homeroom teachers
    if ((teacherType === "fijo" || teacherType === "mixto") && !homeroomCourseId) {
      errors.push("Por favor, selecciona el curso del cual este docente es titular.")
    }

    setFormErrors(errors)

    if (errors.length > 0) {
      return
    }

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
      weeklyLoad: weeklyLoad,
      restrictions,
      teacherType,
      qualifiedLevels: teacherType === "fijo" ? [] : qualifiedLevels,
      qualifiedGrades: teacherType === "fijo" ? [] : qualifiedGrades,
      qualifiedSections: teacherType === "fijo" ? [] : qualifiedSections,
      homeroomCourseId: teacherType === "fijo" || teacherType === "mixto" ? homeroomCourseId : undefined,
    }
    onSave(newTeacher)
  }

  const levelOptions = levels.map((lvl) => ({ label: lvl, value: lvl }))
  const gradeOptions = grades.map((grd) => ({ label: grd, value: grd }))
  const sectionOptions = sections.map((sec) => ({ label: sec, value: sec }))

  const currentFullNameOption = useMemo(() => {
    if (fullName && !predefinedNames.some((n) => n.name === fullName)) {
      return { id: "current-temp", name: fullName }
    }
    return null
  }, [fullName, predefinedNames])

  const allNameOptions = useMemo(() => {
    const options = [...predefinedNames]
    if (currentFullNameOption) {
      options.push(currentFullNameOption)
    }
    return options.sort((a, b) => a.name.localeCompare(b.name))
  }, [predefinedNames, currentFullNameOption])

  const getTeacherTypeLabel = (type: TeacherType) => {
    switch (type) {
      case "fijo":
        return "Docente Fijo (Aula Fija)"
      case "rotacion":
        return "Docente de Rotación"
      case "dos_niveles":
        return "Docente de Dos Niveles"
      case "mixto":
        return "Docente Mixto (Titular y Rotación)"
      default:
        return type
    }
  }

  const getTeacherTypeDescription = (type: TeacherType) => {
    switch (type) {
      case "fijo":
        return "Docente que permanece en un aula fija y es titular de un curso específico."
      case "rotacion":
        return "Docente que rota entre diferentes aulas y cursos para impartir su(s) asignatura(s)."
      case "dos_niveles":
        return "Docente que imparte clases en dos niveles educativos diferentes."
      case "mixto":
        return "Docente que es titular de un curso pero también rota para impartir asignaturas en otros cursos."
      default:
        return ""
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-2xl font-semibold text-gray-800">
        {initialData ? "Editar Docente" : "Añadir Nuevo Docente"}
      </h2>

      <div className="grid gap-2">
        <Label htmlFor="fullName" className="text-gray-700">
          Nombre Completo
        </Label>
        <Select value={fullName} onValueChange={setFullName}>
          <SelectTrigger id="fullName" className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
            <SelectValue placeholder="Seleccionar o añadir nombre" />
          </SelectTrigger>
          <SelectContent>
            {allNameOptions.length === 0 ? (
              <SelectItem value="no-names" disabled>
                No hay nombres predefinidos. Añade en Configuración.
              </SelectItem>
            ) : (
              allNameOptions.map((nameItem) => (
                <SelectItem key={nameItem.id} value={nameItem.name}>
                  {nameItem.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email" className="text-gray-700">
            Correo Electrónico
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ejemplo@dominio.com"
            className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone" className="text-gray-700">
            Número de Teléfono
          </Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="809-123-4567"
            className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="specialty" className="text-gray-700">
          Especialidad
        </Label>
        <Input
          id="specialty"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          placeholder="Ej. Educación Básica, Ciencias"
          className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="teacherType" className="text-gray-700">
          Tipo de Docente
        </Label>
        <Select value={teacherType} onValueChange={(value: TeacherType) => setTeacherType(value)}>
          <SelectTrigger id="teacherType" className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
            <SelectValue placeholder="Seleccionar tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fijo">{getTeacherTypeLabel("fijo")}</SelectItem>
            <SelectItem value="rotacion">{getTeacherTypeLabel("rotacion")}</SelectItem>
            <SelectItem value="dos_niveles">{getTeacherTypeLabel("dos_niveles")}</SelectItem>
            <SelectItem value="mixto">{getTeacherTypeLabel("mixto")}</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">{getTeacherTypeDescription(teacherType)}</p>
      </div>

      {/* Homeroom Course Selection for Fixed and Mixed Teachers */}
      {(teacherType === "fijo" || teacherType === "mixto") && (
        <div className="grid gap-2">
          <Label htmlFor="homeroomCourse" className="text-gray-700">
            Curso Titular
          </Label>
          <Select value={homeroomCourseId} onValueChange={setHomeroomCourseId}>
            <SelectTrigger
              id="homeroomCourse"
              className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
            >
              <SelectValue placeholder="Seleccionar curso del cual es titular" />
            </SelectTrigger>
            <SelectContent>
              {sortedCourses.length === 0 ? (
                <SelectItem value="no-courses" disabled>
                  No hay cursos registrados
                </SelectItem>
              ) : (
                sortedCourses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.level} {course.grade}º {course.section}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Qualifications for Rotating Teachers */}
      {(teacherType === "rotacion" || teacherType === "dos_niveles" || teacherType === "mixto") && (
        <Card className="w-full shadow-sm border-gray-100">
          <CardContent className="p-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Calificaciones del Docente</h3>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="qualifiedLevels" className="text-gray-700">
                  Niveles Calificados
                </Label>
                <MultiSelect
                  options={levelOptions}
                  selected={qualifiedLevels}
                  onSelectedChange={(values) => setQualifiedLevels(values as SchoolLevel[])}
                  placeholder="Seleccionar niveles"
                  className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="qualifiedGrades" className="text-gray-700">
                  Grados Calificados
                </Label>
                <MultiSelect
                  options={gradeOptions}
                  selected={qualifiedGrades}
                  onSelectedChange={(values) => setQualifiedGrades(values as SchoolGrade[])}
                  placeholder="Seleccionar grados"
                  className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="qualifiedSections" className="text-gray-700">
                  Secciones Calificadas
                </Label>
                <MultiSelect
                  options={sectionOptions}
                  selected={qualifiedSections}
                  onSelectedChange={(values) => setQualifiedSections(values as SchoolSection[])}
                  placeholder="Seleccionar secciones"
                  className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="w-full shadow-sm border-gray-100">
        <CardContent className="p-4">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Asignaturas Asignadas</h3>
          {assignedSubjects.length === 0 && (
            <p className="text-muted-foreground mb-4">Añade asignaturas que este docente impartirá.</p>
          )}
          <div className="grid gap-4">
            {assignedSubjects.map((as, index) => (
              <div key={index} className="border border-gray-200 p-4 rounded-md bg-gray-50 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor={`assignedSubject-${index}`} className="text-gray-700">
                      Asignatura
                    </Label>
                    <Select
                      value={as.subjectId || undefined}
                      onValueChange={(value) => handleAssignedSubjectChange(index, "subjectId", value)}
                    >
                      <SelectTrigger
                        id={`assignedSubject-${index}`}
                        className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                      >
                        <SelectValue placeholder="Seleccionar asignatura" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSubjects.length === 0 ? (
                          <SelectItem value="no-subjects" disabled>
                            No hay asignaturas registradas
                          </SelectItem>
                        ) : (
                          availableSubjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`weeklyHoursAssigned-${index}`} className="text-gray-700">
                      Horas Semanales Asignadas
                    </Label>
                    <Input
                      id={`weeklyHoursAssigned-${index}`}
                      type="number"
                      value={as.weeklyHoursAssigned}
                      onChange={(e) => handleAssignedSubjectChange(index, "weeklyHoursAssigned", e.target.value)}
                      required
                      min="0"
                      step="0.5"
                      className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {as.subjectId && (
                  <div className="grid gap-2">
                    <Label htmlFor={`courses-${index}`} className="text-gray-700">
                      Cursos donde se impartirá esta asignatura
                    </Label>
                    <MultiSelect
                      options={getAvailableCoursesForTeacher().map((course) => ({
                        label: `${course.level} ${course.grade}º ${course.section}`,
                        value: course.id,
                      }))}
                      selected={as.courseIds}
                      onSelectedChange={(values) => handleAssignedSubjectChange(index, "courseIds", values)}
                      placeholder="Seleccionar cursos específicos"
                      className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveAssignedSubject(index)}
                    aria-label="Eliminar asignatura asignada"
                    className="text-red-500 hover:text-red-700"
                  >
                    <XCircle className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={handleAddAssignedSubject}
              className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300 shadow-sm"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Asignatura Asignada
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-2">
        <Label htmlFor="weeklyLoad" className="text-gray-700">
          Carga Horaria Semanal Total (Calculada)
        </Label>
        <Input
          id="weeklyLoad"
          value={weeklyLoad}
          readOnly
          className="border-gray-300 bg-gray-100 focus:border-emerald-500 focus:ring-emerald-500"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="restrictions" className="text-gray-700">
          Restricciones Personales
        </Label>
        <Textarea
          id="restrictions"
          value={restrictions}
          onChange={(e) => setRestrictions(e.target.value)}
          placeholder="Ej. Lunes 8-10 AM no disponible"
          className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
        />
      </div>

      {formErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <p className="font-semibold mb-2">Errores en el formulario:</p>
          <ul className="list-disc list-inside">
            {formErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end gap-3 mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-gray-300 text-gray-700 hover:bg-gray-100 bg-transparent shadow-sm"
        >
          Cancelar
        </Button>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
          {initialData ? "Guardar Cambios" : "Añadir Docente"}
        </Button>
      </div>
    </form>
  )
}
