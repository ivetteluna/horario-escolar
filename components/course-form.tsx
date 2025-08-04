"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import type { Course, SchoolLevel, SchoolGrade, SchoolSection, Teacher, Subject } from "@/types"
import { v4 as uuidv4 } from "uuid"
import { getSubjects } from "@/lib/db"
import { PlusCircle, XCircle } from "lucide-react"

interface CourseFormProps {
  initialData?: Course
  onSave: (course: Course) => void
  onCancel: () => void
  teachers: Teacher[]
}

const levels: SchoolLevel[] = ["Primario", "Secundario"]
const grades: SchoolGrade[] = ["Primero", "Segundo", "Tercero", "Cuarto", "Quinto", "Sexto"]
const sections: SchoolSection[] = ["A", "B", "C", "D", "E"]
const MAX_WEEKLY_HOURS_PER_COURSE = 40 // Updated to 40 hours

export function CourseForm({ initialData, onSave, onCancel, teachers }: CourseFormProps) {
  const [level, setLevel] = useState<SchoolLevel>(initialData?.level || "Primario")
  const [grade, setGrade] = useState<SchoolGrade>(initialData?.grade || "Primero")
  const [section, setSection] = useState<SchoolSection>(initialData?.section || "A")
  const [studentList, setStudentList] = useState(initialData?.studentList || "")
  const [homeroomTeacherId, setHomeroomTeacherId] = useState<string | undefined>(
    initialData?.homeroomTeacherId || undefined,
  )
  const [courseSubjects, setCourseSubjects] = useState<{ subjectId: string; weeklyHours: number }[]>(
    initialData?.courseSubjects || [],
  )
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([])
  const [formErrors, setFormErrors] = useState<string[]>([]) // State for form-level errors

  useEffect(() => {
    const loadSubjects = async () => {
      const subjects = await getSubjects()
      setAvailableSubjects(subjects)
    }
    loadSubjects()

    if (initialData) {
      setLevel(initialData.level)
      setGrade(initialData.grade)
      setSection(initialData.section)
      setStudentList(initialData.studentList)
      setHomeroomTeacherId(initialData.homeroomTeacherId)
      setCourseSubjects(initialData.courseSubjects || [])
    }
  }, [initialData])

  useEffect(() => {
    // Auto-populate subjects only if it's a new course and level/grade are selected
    // And only if courseSubjects is empty or explicitly requested to reset
    if (!initialData && level && grade && availableSubjects.length > 0 && courseSubjects.length === 0) {
      const subjectsForLevelAndGrade = availableSubjects
        .filter((subject) => subject.weeklyHoursByLevelAndGrade?.[level]?.[grade] !== undefined)
        .map((subject) => ({
          subjectId: subject.id,
          weeklyHours: subject.weeklyHoursByLevelAndGrade![level]![grade] || 0,
        }))
      setCourseSubjects(subjectsForLevelAndGrade)
    }
  }, [level, grade, availableSubjects, initialData, courseSubjects.length])

  const handleAddCourseSubject = () => {
    setCourseSubjects([...courseSubjects, { subjectId: "", weeklyHours: 0 }])
  }

  const handleRemoveCourseSubject = (index: number) => {
    setCourseSubjects(courseSubjects.filter((_, i) => i !== index))
  }

  const handleCourseSubjectChange = useCallback(
    (index: number, field: "subjectId" | "weeklyHours", value: string | number) => {
      const newCourseSubjects = [...courseSubjects]
      newCourseSubjects[index] = { ...newCourseSubjects[index], [field]: value }

      // If the subjectId is changed, automatically calculate weeklyHoursAssigned
      if (field === "subjectId" && typeof value === "string" && value) {
        const selectedSubject = availableSubjects.find((sub) => sub.id === value)
        if (selectedSubject && selectedSubject.weeklyHoursByLevelAndGrade) {
          const hoursForLevelAndGrade = selectedSubject.weeklyHoursByLevelAndGrade[level]?.[grade] || 0
          newCourseSubjects[index].weeklyHours = hoursForLevelAndGrade
        } else {
          newCourseSubjects[index].weeklyHours = 0 // Reset if subject not found or no hours configured
        }
      }

      setCourseSubjects(newCourseSubjects)
    },
    [courseSubjects, availableSubjects, level, grade],
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errors: string[] = []

    // Validate total weekly hours for the course
    const totalWeeklyHours = courseSubjects.reduce((sum, cs) => sum + Number(cs.weeklyHours), 0)
    if (totalWeeklyHours > MAX_WEEKLY_HOURS_PER_COURSE) {
      errors.push(
        `La carga horaria total del curso (${totalWeeklyHours}h) excede el máximo permitido de ${MAX_WEEKLY_HOURS_PER_COURSE} horas.`,
      )
    }
    if (totalWeeklyHours < 0) {
      errors.push("La carga horaria total no puede ser negativa.")
    }

    // Validate individual subject weekly hours
    courseSubjects.forEach((cs, index) => {
      if (Number(cs.weeklyHours) < 0) {
        errors.push(`Las horas semanales para la asignatura en la fila ${index + 1} no pueden ser negativas.`)
      }
      if (!cs.subjectId) {
        errors.push(`Por favor, selecciona una asignatura para la fila ${index + 1}.`)
      }
    })

    if (!homeroomTeacherId) {
      errors.push("Por favor, selecciona un docente titular de aula.")
    }

    setFormErrors(errors)

    if (errors.length > 0) {
      return // Prevent form submission if there are errors
    }

    const newCourse: Course = {
      id: initialData?.id || uuidv4(),
      level,
      grade,
      section,
      studentList,
      homeroomTeacherId: homeroomTeacherId || "",
      courseSubjects: courseSubjects.map((cs) => ({
        ...cs,
        weeklyHours: Number(cs.weeklyHours),
      })),
    }
    onSave(newCourse)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-2xl font-semibold text-gray-800">
        {initialData ? "Editar Curso/Grupo" : "Añadir Nuevo Curso/Grupo"}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="level" className="text-gray-700">
            Nivel
          </Label>
          <Select value={level} onValueChange={(value: SchoolLevel) => setLevel(value)}>
            <SelectTrigger id="level" className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
              <SelectValue placeholder="Seleccionar nivel" />
            </SelectTrigger>
            <SelectContent>
              {levels.map((lvl) => (
                <SelectItem key={lvl} value={lvl}>
                  {lvl}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="grade" className="text-gray-700">
            Grado
          </Label>
          <Select value={grade} onValueChange={(value: SchoolGrade) => setGrade(value)}>
            <SelectTrigger id="grade" className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
              <SelectValue placeholder="Seleccionar grado" />
            </SelectTrigger>
            <SelectContent>
              {grades.map((grd) => (
                <SelectItem key={grd} value={grd}>
                  {grd}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="section" className="text-gray-700">
            Sección
          </Label>
          <Select value={section} onValueChange={(value: SchoolSection) => setSection(value)}>
            <SelectTrigger id="section" className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
              <SelectValue placeholder="Seleccionar sección" />
            </SelectTrigger>
            <SelectContent>
              {sections.map((sec) => (
                <SelectItem key={sec} value={sec}>
                  {sec}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="studentList" className="text-gray-700">
          Lista de Estudiantes (separados por línea)
        </Label>
        <Textarea
          id="studentList"
          value={studentList}
          onChange={(e) => setStudentList(e.target.value)}
          placeholder="Ej. Juan Pérez&#10;María García"
          className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 min-h-[100px]"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="homeroomTeacher" className="text-gray-700">
          Docente Titular de Aula
        </Label>
        <Select value={homeroomTeacherId} onValueChange={setHomeroomTeacherId}>
          <SelectTrigger
            id="homeroomTeacher"
            className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
          >
            <SelectValue placeholder="Seleccionar docente" />
          </SelectTrigger>
          <SelectContent>
            {/* Removed SelectItem with empty value */}
            {teachers.length === 0 ? (
              <SelectItem value="no-teachers" disabled>
                No hay docentes registrados
              </SelectItem>
            ) : (
              teachers.map((teacher) => (
                <SelectItem key={teacher.id} value={teacher.id}>
                  {teacher.fullName}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <Card className="w-full shadow-sm border-gray-100">
        <CardContent className="p-4">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Asignaturas del Curso</h3>
          {courseSubjects.length === 0 && (
            <p className="text-muted-foreground mb-4">Añade asignaturas para este curso.</p>
          )}
          <div className="grid gap-4">
            {courseSubjects.map((cs, index) => (
              <div
                key={index}
                className="flex flex-col md:flex-row items-end gap-3 border border-gray-200 p-4 rounded-md bg-gray-50"
              >
                <div className="grid gap-2 flex-1 w-full">
                  <Label htmlFor={`subject-${index}`} className="text-gray-700">
                    Asignatura
                  </Label>
                  <Select
                    value={cs.subjectId || undefined}
                    onValueChange={(value) => handleCourseSubjectChange(index, "subjectId", value)}
                  >
                    <SelectTrigger
                      id={`subject-${index}`}
                      className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    >
                      <SelectValue placeholder="Seleccionar asignatura" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Removed SelectItem with empty value */}
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
                <div className="grid gap-2 w-full md:w-auto">
                  <Label htmlFor={`weeklyHours-${index}`} className="text-gray-700">
                    Horas Semanales (Bloques de 45min)
                  </Label>
                  <Input
                    id={`weeklyHours-${index}`}
                    type="number"
                    value={cs.weeklyHours}
                    onChange={(e) => handleCourseSubjectChange(index, "weeklyHours", Number(e.target.value))}
                    required
                    min="0"
                    step="0.5"
                    className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveCourseSubject(index)}
                  aria-label="Eliminar asignatura del curso"
                  className="text-red-500 hover:text-red-700 self-center md:self-end"
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={handleAddCourseSubject}
              className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300 shadow-sm"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Asignatura al Curso
            </Button>
          </div>
        </CardContent>
      </Card>

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
          {initialData ? "Guardar Cambios" : "Añadir Curso/Grupo"}
        </Button>
      </div>
    </form>
  )
}
