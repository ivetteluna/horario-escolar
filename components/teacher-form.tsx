// NUEVO HORARIO/components/teacher-form.tsx

"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { MultiSelect } from "@/components/multi-select"
import { PlusCircle, XCircle } from "lucide-react"
import type { Teacher, TeacherType, Subject, SchoolLevel, SchoolGrade, SchoolSection, PredefinedTeacherName, Course, Restriction } from "@/lib/types"
import { v4 as uuidv4 } from "uuid"
import { getSubjects, getPredefinedTeacherNames, getCourses } from "@/lib/db"

// ... (interfaz SubjectAssignment y constantes sin cambios)
interface SubjectAssignment {
  subjectId: string;
  weeklyHoursAssigned: number;
  courseIds: string[];
}
const levels: SchoolLevel[] = ["Primario", "Secundario"];
const grades: SchoolGrade[] = ["Primero", "Segundo", "Tercero", "Cuarto", "Quinto", "Sexto"];
const sections: SchoolSection[] = ["A", "B", "C", "D", "E"];
const daysOfWeek: Restriction['day'][] = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];


export function TeacherForm({ initialData, onSave, onCancel }: { initialData?: Teacher, onSave: (t: Teacher) => void, onCancel: () => void }) {
  // ... (estados existentes)
  const [fullName, setFullName] = useState(initialData?.fullName || "")
  const [email, setEmail] = useState(initialData?.email || "")
  const [phone, setPhone] = useState(initialData?.phone || "")
  const [specialty, setSpecialty] = useState(initialData?.specialty || "")
  const [assignedSubjects, setAssignedSubjects] = useState<SubjectAssignment[]>(initialData?.subjectsTaught || [])
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([])
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [teacherType, setTeacherType] = useState<TeacherType>(initialData?.teacherType || "fijo")
  const [qualifiedLevels, setQualifiedLevels] = useState<SchoolLevel[]>(initialData?.qualifiedLevels || [])
  const [qualifiedGrades, setQualifiedGrades] = useState<SchoolGrade[]>(initialData?.qualifiedGrades || [])
  const [qualifiedSections, setQualifiedSections] = useState<SchoolSection[]>(initialData?.qualifiedSections || [])
  const [homeroomCourseId, setHomeroomCourseId] = useState<string>(initialData?.homeroomCourseId || "")
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [predefinedNames, setPredefinedNames] = useState<PredefinedTeacherName[]>([])
  
  // NUEVO ESTADO PARA RESTRICCIONES
  const [restrictions, setRestrictions] = useState<Restriction[]>(initialData?.restrictions || []);

  useEffect(() => {
    // ... (lógica de carga de datos sin cambios)
    const loadData = async () => {
      const [subjects, names, courses] = await Promise.all([getSubjects(), getPredefinedTeacherNames(), getCourses()])
      setAvailableSubjects(subjects)
      setPredefinedNames(names)
      setAvailableCourses(courses)
    }
    loadData()
  }, []);

  // ... (toda la lógica de cálculo y manejo de asignaturas sin cambios)
  const sortedCourses = useMemo(() => availableCourses.sort((a, b) => (a.level + a.grade + a.section).localeCompare(b.level + b.grade + b.section)), [availableCourses]);
  const calculateHoursForCourses = (subjectId: string, courseIds: string[]): number => {
    const subject = availableSubjects.find(s => s.id === subjectId);
    if (!subject) return 0;
    return courseIds.reduce((sum, cId) => {
      const course = availableCourses.find(c => c.id === cId);
      return sum + (course ? subject.weeklyHoursByLevelAndGrade?.[course.level]?.[course.grade] || 0 : 0);
    }, 0);
  };
  useEffect(() => {
    if (teacherType === 'fijo' && homeroomCourseId) {
      setAssignedSubjects(prev => prev.map(s => ({ ...s, courseIds: [homeroomCourseId], weeklyHoursAssigned: calculateHoursForCourses(s.subjectId, [homeroomCourseId]) })));
    }
  }, [teacherType, homeroomCourseId]);
  const weeklyLoad = useMemo(() => assignedSubjects.reduce((sum, as) => sum + as.weeklyHoursAssigned, 0), [assignedSubjects]);
  const handleSelectedSubjectsChange = (selectedIds: string[]) => {
    const newSubjects = selectedIds.map(id => {
      const existing = assignedSubjects.find(s => s.subjectId === id);
      const courseIds = (teacherType === 'fijo' && homeroomCourseId) ? [homeroomCourseId] : (existing?.courseIds || []);
      return { subjectId: id, courseIds, weeklyHoursAssigned: calculateHoursForCourses(id, courseIds) };
    });
    setAssignedSubjects(newSubjects);
  };
  const handleCourseSelectionForSubject = (subjectId: string, courseIds: string[]) => {
    setAssignedSubjects(prev => prev.map(s => s.subjectId === subjectId ? { ...s, courseIds, weeklyHoursAssigned: calculateHoursForCourses(s.subjectId, courseIds) } : s));
  };
  const getAvailableCoursesForTeacher = useMemo(() => {
    if (teacherType === 'fijo') return sortedCourses.filter(c => c.id === homeroomCourseId);
    return sortedCourses.filter(c => 
      (qualifiedLevels.length === 0 || qualifiedLevels.includes(c.level)) &&
      (qualifiedGrades.length === 0 || qualifiedGrades.includes(c.grade)) &&
      (qualifiedSections.length === 0 || qualifiedSections.includes(c.section))
    );
  }, [teacherType, homeroomCourseId, sortedCourses, qualifiedLevels, qualifiedGrades, qualifiedSections]);
  
  // NUEVAS FUNCIONES PARA MANEJAR RESTRICCIONES
  const handleAddRestriction = () => {
    setRestrictions([...restrictions, { id: uuidv4(), day: 'Lunes', startTime: '08:00', endTime: '09:00', reason: '' }]);
  };
  const handleRemoveRestriction = (id: string) => {
    setRestrictions(restrictions.filter(r => r.id !== id));
  };
  const handleRestrictionChange = (id: string, field: keyof Restriction, value: string) => {
    setRestrictions(restrictions.map(r => r.id === id ? { ...r, [field]: value } : r));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    // ... (lógica de validación sin cambios)
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
      subjectsTaught: assignedSubjects, weeklyLoad,
      qualifiedLevels: teacherType === 'fijo' ? [] : qualifiedLevels,
      qualifiedGrades: teacherType === 'fijo' ? [] : qualifiedGrades,
      qualifiedSections: teacherType === 'fijo' ? [] : qualifiedSections,
    }
    onSave(newTeacher)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 p-6 bg-white rounded-lg shadow-sm">
      {/* ... (renderizado de campos de información personal y tipo de docente sin cambios) ... */}
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

      {/* Asignaturas */}
      <Card className="w-full shadow-sm">
        <CardContent className="p-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Asignación de Asignaturas</h3>
            <div className="grid gap-2">
                <Label>Asignaturas que imparte</Label>
                <MultiSelect options={availableSubjects.map(s => ({ label: s.name, value: s.id }))} selected={assignedSubjects.map(as => as.subjectId)} onSelectedChange={handleSelectedSubjectsChange} />
            </div>
            {assignedSubjects.length > 0 && teacherType !== 'fijo' && (
                <div className="grid gap-4 mt-4 border-t pt-4">
                    {assignedSubjects.map(as => (
                        <div key={as.subjectId} className="grid gap-2">
                            <Label className="font-semibold">{availableSubjects.find(s => s.id === as.subjectId)?.name}</Label>
                            <MultiSelect options={getAvailableCoursesForTeacher.map(c => ({ label: `${c.level} ${c.grade}º ${c.section}`, value: c.id }))} selected={as.courseIds} onSelectedChange={(v) => handleCourseSelectionForSubject(as.subjectId, v)} />
                        </div>
                    ))}
                </div>
            )}
             {/* CORRECCIÓN DEL ERROR: Usar 'availableCourses' en lugar de 'courses' */}
             {assignedSubjects.length > 0 && teacherType === 'fijo' && homeroomCourseId && (
             <div className="text-sm mt-4 p-3 bg-emerald-50 text-emerald-800 rounded-md">
                Asignaturas asignadas automáticamente al curso titular: {availableCourses.find(c => c.id === homeroomCourseId)?.grade || ''}º {availableCourses.find(c => c.id === homeroomCourseId)?.section || ''}
            </div>
           )}
        </CardContent>
      </Card>
      
      {/* NUEVA SECCIÓN DE RESTRICCIONES AVANZADAS */}
      <Card>
        <CardContent className="p-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Restricciones Horarias</h3>
            <div className="space-y-3">
                {restrictions.map((r, index) => (
                    <div key={r.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 border p-3 rounded-md">
                        <div className="grid gap-1">
                            <Label>Día</Label>
                            <Select value={r.day} onValueChange={(v: Restriction['day']) => handleRestrictionChange(r.id, 'day', v)}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>{daysOfWeek.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1">
                           <Label>Desde</Label>
                           <Input type="time" value={r.startTime} onChange={e => handleRestrictionChange(r.id, 'startTime', e.target.value)} />
                        </div>
                        <div className="grid gap-1">
                            <Label>Hasta</Label>
                            <Input type="time" value={r.endTime} onChange={e => handleRestrictionChange(r.id, 'endTime', e.target.value)} />
                        </div>
                        <div className="grid gap-1">
                            <Label>Motivo (Opcional)</Label>
                            <div className="flex items-center gap-2">
                                <Input value={r.reason} onChange={e => handleRestrictionChange(r.id, 'reason', e.target.value)} />
                                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveRestriction(r.id)}><XCircle className="h-5 w-5 text-red-500"/></Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <Button type="button" variant="outline" onClick={handleAddRestriction} className="mt-4"><PlusCircle className="mr-2 h-4 w-4"/> Añadir Restricción</Button>
        </CardContent>
      </Card>
      
      <div className="grid gap-2"><Label>Carga Horaria Semanal Total (Calculada)</Label><Input value={weeklyLoad} readOnly /></div>
      {formErrors.length > 0 && (<div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md"><ul className="list-disc list-inside">{formErrors.map((error, index) => (<li key={index}>{error}</li>))}</ul></div>)}
      <div className="flex justify-end gap-3 mt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">{initialData ? "Guardar Cambios" : "Añadir Docente"}</Button>
      </div>
    </form>
  )
}