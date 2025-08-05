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

const getGradeOrder = (grade: SchoolGrade): number => ({ Primero: 1, Segundo: 2, Tercero: 3, Cuarto: 4, Quinto: 5, Sexto: 6 }[grade] || 0)
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
  
  const calculateHoursForCourses = (subjectId: string, courseIds: string[]): number => {
    const subject = availableSubjects.find((s) => s.id === subjectId)
    if (!subject || !subject.weeklyHoursByLevelAndGrade) return 0
    return courseIds.reduce((totalHours, courseId) => {
      const course = availableCourses.find((c) => c.id === courseId)
      return totalHours + (course ? subject.weeklyHoursByLevelAndGrade?.[course.level]?.[course.grade] || 0 : 0)
    }, 0)
  }

  // INTELIGENCIA PARA DOCENTE FIJO
  useEffect(() => {
    if (teacherType === "fijo" && homeroomCourseId) {
      setAssignedSubjects(prevSubjects =>
        prevSubjects.map(subject => ({
          ...subject,
          courseIds: [homeroomCourseId],
          weeklyHoursAssigned: calculateHoursForCourses(subject.subjectId, [homeroomCourseId])
        }))
      );
    }
  }, [teacherType, homeroomCourseId]);


  const weeklyLoad = useMemo(() => assignedSubjects.reduce((sum, as) => sum + as.weeklyHoursAssigned, 0), [assignedSubjects]);

  const handleSelectedSubjectsChange = (selectedSubjectIds: string[]) => {
    const newAssignedSubjects = selectedSubjectIds.map(id => {
      const existing = assignedSubjects.find(s => s.subjectId === id);
      const courseIds = (teacherType === 'fijo' && homeroomCourseId) ? [homeroomCourseId] : (existing?.courseIds || []);
      const weeklyHoursAssigned = calculateHoursForCourses(id, courseIds);
      return { subjectId: id, courseIds, weeklyHoursAssigned };
    });
    setAssignedSubjects(newAssignedSubjects);
  };

  const handleCourseSelectionForSubject = (subjectId: string, courseIds: string[]) => {
    setAssignedSubjects(prev => prev.map(subject => 
        subject.subjectId === subjectId 
        ? { ...subject, courseIds, weeklyHoursAssigned: calculateHoursForCourses(subjectId, courseIds) } 
        : subject
    ));
  };
  
  const getAvailableCoursesForTeacher = useMemo(() => {
    if (teacherType === "fijo") return availableCourses.filter(c => c.id === homeroomCourseId);
    return sortedCourses.filter(c => 
      (qualifiedLevels.length === 0 || qualifiedLevels.includes(c.level)) &&
      (qualifiedGrades.length === 0 || qualifiedGrades.includes(c.grade)) &&
      (qualifiedSections.length === 0 || qualifiedSections.includes(c.section))
    );
  }, [teacherType, homeroomCourseId, sortedCourses, qualifiedLevels, qualifiedGrades, qualifiedSections]);
  
  // ... (resto del componente sin cambios hasta el return)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errors: string[] = []
    if (!fullName.trim()) errors.push("El nombre completo del docente es obligatorio.")
    if ((teacherType === "fijo" || teacherType === "mixto") && !homeroomCourseId) errors.push("Por favor, selecciona el curso del cual este docente es titular.")
    
    assignedSubjects.forEach((as) => {
      if (as.courseIds.length === 0) {
        const subjectName = availableSubjects.find(s => s.id === as.subjectId)?.name || "una asignatura";
        errors.push(`Por favor, selecciona al menos un curso para ${subjectName}.`)
      }
    })

    setFormErrors(errors)
    if (errors.length > 0) return

    const newTeacher: Teacher = {
      id: initialData?.id || uuidv4(),
      fullName, email, phone, specialty, restrictions, teacherType, homeroomCourseId,
      subjectsTaught: assignedSubjects, weeklyLoad, qualifiedLevels, qualifiedGrades, qualifiedSections,
    }
    onSave(newTeacher)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 p-6 bg-white rounded-lg shadow-sm">
        {/* ... (código de los campos de información personal y tipo de docente sin cambios) ... */}
        <h2 className="text-2xl font-semibold text-gray-800">{initialData ? "Editar Docente" : "Añadir Nuevo Docente"}</h2>
        {/* Personal Info */}
      <div className="grid gap-2">
        <Label htmlFor="fullName">Nombre Completo</Label>
        <Select value={fullName} onValueChange={setFullName}>
          <SelectTrigger id="fullName"><SelectValue placeholder="Seleccionar o añadir nombre" /></SelectTrigger>
          <SelectContent>
            {predefinedNames.sort((a, b) => a.name.localeCompare(b.name)).map((nameItem) => (<SelectItem key={nameItem.id} value={nameItem.name}>{nameItem.name}</SelectItem>))}
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
          <SelectTrigger id="teacherType"><SelectValue/></SelectTrigger>
          <SelectContent>
            <SelectItem value="fijo">Docente Fijo (Aula Fija)</SelectItem>
            <SelectItem value="rotacion">Docente de Rotación</SelectItem>
            <SelectItem value="dos_niveles">Docente de Dos Niveles</SelectItem>
            <SelectItem value="mixto">Docente Mixto (Titular y Rotación)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {(teacherType === "fijo" || teacherType === "mixto") && (
        <div className="grid gap-2">
          <Label htmlFor="homeroomCourse">Curso Titular</Label>
          <Select value={homeroomCourseId} onValueChange={setHomeroomCourseId}>
            <SelectTrigger id="homeroomCourse"><SelectValue placeholder="Seleccionar curso" /></SelectTrigger>
            <SelectContent>
              {sortedCourses.map((course) => (<SelectItem key={course.id} value={course.id}>{course.level} {course.grade}º {course.section}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      )}
       {(teacherType === "rotacion" || teacherType === "dos_niveles" || teacherType === "mixto") && (
        <Card className="w-full shadow-sm"><CardContent className="p-4">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Calificaciones del Docente de Rotación</h3>
          <div className="grid gap-4">
            <div className="grid gap-2"><Label>Niveles</Label><MultiSelect options={levels.map(l => ({label: l, value: l}))} selected={qualifiedLevels} onSelectedChange={v => setQualifiedLevels(v as SchoolLevel[])} /></div>
            <div className="grid gap-2"><Label>Grados</Label><MultiSelect options={grades.map(g => ({label: g, value: g}))} selected={qualifiedGrades} onSelectedChange={v => setQualifiedGrades(v as SchoolGrade[])} /></div>
            <div className="grid gap-2"><Label>Secciones</Label><MultiSelect options={sections.map(s => ({label: s, value: s}))} selected={qualifiedSections} onSelectedChange={v => setQualifiedSections(v as SchoolSection[])} /></div>
          </div>
        </CardContent></Card>
      )}

      <Card className="w-full shadow-sm">
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

          {assignedSubjects.length > 0 && teacherType !== 'fijo' && (
            <div className="grid gap-4 mt-4 border-t pt-4">
                <p className="text-sm text-muted-foreground">Ahora, especifica en qué cursos se impartirá cada asignatura.</p>
              {assignedSubjects.map((assignment) => (
                <div key={assignment.subjectId} className="grid gap-2">
                  <Label className="font-semibold">{availableSubjects.find(s => s.id === assignment.subjectId)?.name}</Label>
                  <MultiSelect
                    options={getAvailableCoursesForTeacher.map(c => ({ label: `${c.level} ${c.grade}º ${c.section}`, value: c.id }))}
                    selected={assignment.courseIds}
                    onSelectedChange={(values) => handleCourseSelectionForSubject(assignment.subjectId, values)}
                    placeholder="Seleccionar cursos para esta asignatura"
                  />
                </div>
              ))}
            </div>
          )}

           {assignedSubjects.length > 0 && teacherType === 'fijo' && (
             <div className="text-sm p-3 bg-emerald-50 text-emerald-800 rounded-md">
                Las asignaturas se asignarán automáticamente al curso titular: {courses.find(c => c.id === homeroomCourseId)?.grade || ''}º {courses.find(c => c.id === homeroomCourseId)?.section || ''}
            </div>
           )}
        </CardContent>
      </Card>
      
      {/* Carga Horaria y Restricciones */}
      <div className="grid gap-2"><Label>Carga Horaria Semanal Total (Calculada)</Label><Input value={weeklyLoad} readOnly /></div>
      <div className="grid gap-2"><Label>Restricciones Personales</Label><Textarea value={restrictions} onChange={(e) => setRestrictions(e.target.value)} placeholder="Ej. Lunes 8-10 AM no disponible" /></div>

       {/* Errors and Actions */}
      {formErrors.length > 0 && (<div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md"><ul className="list-disc list-inside">{formErrors.map((error, index) => (<li key={index}>{error}</li>))}</ul></div>)}
      <div className="flex justify-end gap-3 mt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">{initialData ? "Guardar Cambios" : "Añadir Docente"}</Button>
      </div>
    </form>
  )
}