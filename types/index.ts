// NUEVO HORARIO/types/index.ts

// NUEVA INTERFAZ PARA RESTRICCIONES
export interface Restriction {
  id: string;
  day: "Lunes" | "Martes" | "Miércoles" | "Jueves" | "Viernes";
  startTime: string;
  endTime: string;
  reason: string;
}

export type TeacherType = "titular" | "rotacion" | "mixto"

export interface Teacher {
  id: string
  fullName: string
  email?: string
  phone?: string
  specialty?: string
  subjectsTaught: { subjectId: string; weeklyHoursAssigned: number; courseIds: string[] }[]
  weeklyLoad: number
  restrictions: Restriction[] // CAMBIADO de string a Restriction[]
  teacherType: TeacherType
  qualifiedLevels: SchoolLevel[]
  qualifiedGrades: SchoolGrade[]
  qualifiedSections: SchoolSection[]
  homeroomCourseId?: string
}

// ... (El resto del archivo sigue igual, no necesitas cambiar nada más aquí)
export interface SchoolSettings {
  id: string
  schoolName: string
  logoUrl: string
}
export interface BreakTime {
  name: string
  startTime: string
  endTime: string
}
export interface DailySchedule {
  id: string
  schoolStartTime: string
  schoolEndTime: string
  breaks: BreakTime[]
}
export type SchoolLevel = "Primario" | "Secundario"
export type SchoolGrade = "Primero" | "Segundo" | "Tercero" | "Cuarto" | "Quinto" | "Sexto"
export type SchoolSection = "A" | "B" | "C" | "D" | "E"
export interface Subject {
  id: string
  name: string
  shortCode?: string
  priority: "alta" | "media" | "baja"
  iconColor: string
  iconName: string
  weeklyHours?: number
  weeklyHoursByLevelAndGrade?: {
    [level in SchoolLevel]?: {
      [grade in SchoolGrade]?: number
    }
  }
}
export interface SubjectTimeSlot {
  id: string
  name: string
  startTime: string
  endTime: string
}
export interface Course {
  id: string
  level: SchoolLevel
  grade: SchoolGrade
  section: SchoolSection
  studentList: string
  homeroomTeacherId: string
  courseSubjects: { subjectId: string; weeklyHours: number }[]
}
export interface PredefinedTeacherName {
  id: string
  name: string
}