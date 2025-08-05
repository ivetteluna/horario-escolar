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
import type { Teacher, TeacherType, Subject, SchoolLevel, SchoolGrade, SchoolSection, PredefinedTeacherName, Course, Restriction, SubjectTimeSlot } from "@/lib/types"
import { v4 as uuidv4 } from "uuid"
import { getSubjects, getPredefinedTeacherNames, getCourses, getSubjectTimeSlots } from "@/lib/db"

interface TeacherFormProps {
  initialData?: Teacher
  onSave: (teacher: Teacher) => void
  onCancel: () => void
}

interface SubjectAssignment {
  subjectId: string;
  weeklyHoursAssigned: number;
  courseIds: string[];
}

const levels: SchoolLevel[] = ["Primario", "Secundario"];
const grades: SchoolGrade[] = ["Primero", "Segundo", "Tercero", "Cuarto", "Quinto", "Sexto"];
const sections: SchoolSection[] = ["A", "B", "C", "D", "E"];
const daysOfWeek: Restriction['day'][] = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];


export function TeacherForm({ initialData, onSave, onCancel }: TeacherFormProps) {
  const [fullName, setFullName] = useState(initialData?.fullName || "");
  const [assignedSubjects, setAssignedSubjects] = useState<SubjectAssignment[]>(initialData?.subjectsTaught || []);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([])
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [teacherType, setTeacherType] = useState<TeacherType>(initialData?.teacherType || "fijo")
  const [homeroomCourseId, setHomeroomCourseId] = useState<string>(initialData?.homeroomCourseId || "")
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [restrictions, setRestrictions] = useState<Restriction[]>(initialData?.restrictions || []);
  const [timeSlots, setTimeSlots] = useState<SubjectTimeSlot[]>([]); // Para el selector de restricciones

  useEffect(() => {
    const loadData = async () => {
      const [subjects, courses, slots] = await Promise.all([getSubjects(), getCourses(), getSubjectTimeSlots()])
      setAvailableSubjects(subjects)
      setAvailableCourses(courses)
      setTimeSlots(slots.sort((a,b) => a.startTime.localeCompare(b.startTime)));
    }
    loadData()
  }, [])
  
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

  // Lógica para filtrar asignaturas con carga horaria > 0
  const relevantSubjects = useMemo(() => {
    // Si no hay cursos seleccionados (ej. docente de rotación sin calificaciones), mostrar todas.
    if (getAvailableCoursesForTeacher.length === 0 && teacherType !== 'fijo') {
        return availableSubjects;
    }

    const relevantCourseIds = getAvailableCoursesForTeacher.map(c => c.id);
    
    return availableSubjects.filter(subject => {
        return relevantCourseIds.some(courseId => {
            const course = availableCourses.find(c => c.id === courseId);
            return course && (subject.weeklyHoursByLevelAndGrade?.[course.level]?.[course.grade] || 0) > 0;
        });
    });
  }, [availableSubjects, availableCourses, teacherType, homeroomCourseId]);
  
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
    if (teacherType === 'fijo') return availableCourses.filter(c => c.id === homeroomCourseId);
    // Para otros tipos, se basará en la lógica del formulario principal (qualifications)
    return availableCourses;
  }, [teacherType, homeroomCourseId, availableCourses]);
  
  const handleAddRestriction = () => setRestrictions([...restrictions, { id: uuidv4(), day: 'Lunes', startTime: timeSlots[0]?.startTime || '08:00', endTime: timeSlots[0]?.endTime || '08:45', reason: '' }]);
  const handleRemoveRestriction = (id: string) => setRestrictions(restrictions.filter(r => r.id !== id));
  const handleRestrictionChange = (id: string, field: keyof Restriction, value: string) => {
      const newRestrictions = restrictions.map(r => {
          if (r.id === id) {
              const updated = { ...r, [field]: value };
              // Sincronizar endTime si se cambia startTime
              if (field === 'startTime') {
                  const selectedSlot = timeSlots.find(slot => slot.startTime === value);
                  if (selectedSlot) updated.endTime = selectedSlot.endTime;
              }
              return updated;
          }
          return r;
      });
      setRestrictions(newRestrictions);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // ... Lógica de validación ...
    const newTeacher: Teacher = {
      id: initialData?.id || uuidv4(),
      fullName, 
      email: initialData?.email || '', 
      phone: initialData?.phone || '', 
      specialty: initialData?.specialty || '',
      subjectsTaught: assignedSubjects, 
      weeklyLoad, 
      restrictions, 
      teacherType, 
      homeroomCourseId: homeroomCourseId || undefined,
      qualifiedLevels: initialData?.qualifiedLevels || [],
      qualifiedGrades: initialData?.qualifiedGrades || [],
      qualifiedSections: initialData?.qualifiedSections || [],
    };
    onSave(newTeacher);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-2xl font-semibold">{initialData ? "Editar" : "Añadir"} Docente</h2>
      
      {/* ... Campos de información personal ... */}
      <div className="grid gap-2"><Label>Nombre Completo</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} required /></div>
      
      <div className="grid gap-2">
        <Label>Tipo de Docente</Label>
        <Select value={teacherType} onValueChange={(v: TeacherType) => setTeacherType(v)}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>
                <SelectItem value="fijo">Docente Fijo (Aula Fija)</SelectItem>
                <SelectItem value="rotacion">Docente de Rotación</SelectItem>
            </SelectContent>
        </Select>
      </div>

      {teacherType === 'fijo' && (
          <div className="grid gap-2">
              <Label>Curso Titular</Label>
              <Select value={homeroomCourseId} onValueChange={setHomeroomCourseId}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar curso..."/></SelectTrigger>
                  <SelectContent>
                      {availableCourses.map(c => <SelectItem key={c.id} value={c.id}>{`${c.level} ${c.grade}º ${c.section}`}</SelectItem>)}
                  </SelectContent>
              </Select>
          </div>
      )}
      
      <Card>
          <CardContent className="p-4">
              <h3 className="text-xl font-semibold mb-4">Asignaturas y Cursos</h3>
              <div className="grid gap-2 mb-4">
                  <Label>Asignaturas que imparte</Label>
                  <MultiSelect 
                    options={relevantSubjects.map(s => ({ label: s.name, value: s.id }))} 
                    selected={assignedSubjects.map(as => as.subjectId)} 
                    onSelectedChange={handleSelectedSubjectsChange}
                    placeholder="Seleccionar asignaturas..."
                  />
              </div>

              {assignedSubjects.length > 0 && teacherType !== 'fijo' && (
                  <div className="grid gap-4 mt-4 border-t pt-4">
                      {assignedSubjects.map(as => (
                          <div key={as.subjectId} className="grid gap-2">
                              <Label className="font-semibold">{availableSubjects.find(s => s.id === as.subjectId)?.name}</Label>
                              <MultiSelect 
                                options={getAvailableCoursesForTeacher.map(c => ({ label: `${c.level} ${c.grade}º ${c.section}`, value: c.id }))} 
                                selected={as.courseIds} 
                                onSelectedChange={(v) => handleCourseSelectionForSubject(as.subjectId, v)}
                                placeholder="Seleccionar cursos..."
                              />
                          </div>
                      ))}
                  </div>
              )}
          </CardContent>
      </Card>
      
      <Card>
          <CardContent className="p-4">
              <h3 className="text-xl font-semibold mb-4">Restricciones Horarias</h3>
              <div className="space-y-3">
                  {restrictions.map(r => (
                      <div key={r.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 border p-3 rounded-md items-end">
                          <div className="grid gap-1"><Label>Día</Label>
                              <Select value={r.day} onValueChange={(v: Restriction['day']) => handleRestrictionChange(r.id, 'day', v)}>
                                  <SelectTrigger><SelectValue/></SelectTrigger>
                                  <SelectContent>{daysOfWeek.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                              </Select>
                          </div>
                          <div className="grid gap-1"><Label>Bloque Horario</Label>
                             <Select value={r.startTime} onValueChange={v => handleRestrictionChange(r.id, 'startTime', v)}>
                                 <SelectTrigger><SelectValue placeholder="Seleccionar bloque..."/></SelectTrigger>
                                 <SelectContent>
                                     {timeSlots.map(slot => <SelectItem key={slot.id} value={slot.startTime}>{`${slot.name} (${slot.startTime}-${slot.endTime})`}</SelectItem>)}
                                 </SelectContent>
                             </Select>
                          </div>
                          <div className="flex items-center gap-2">
                              <Input value={r.reason} onChange={e => handleRestrictionChange(r.id, 'reason', e.target.value)} placeholder="Motivo (opcional)"/>
                              <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveRestriction(r.id)}><XCircle className="h-5 w-5 text-red-500"/></Button>
                          </div>
                      </div>
                  ))}
              </div>
              <Button type="button" variant="outline" onClick={handleAddRestriction} className="mt-4"><PlusCircle className="mr-2 h-4"/>Añadir Restricción</Button>
          </CardContent>
      </Card>

      <div className="flex justify-end gap-3 mt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">{initialData ? "Guardar Cambios" : "Añadir Docente"}</Button>
      </div>
    </form>
  )
}