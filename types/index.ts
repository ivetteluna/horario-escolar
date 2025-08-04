// NUEVO HORARIO/types/index.ts

export type TeacherType = "titular" | "rotacion" | "mixto"

export interface Teacher {
  id: string
  fullName: string
  email?: string // NEW: Optional email field
  phone?: string // NEW: Optional phone field
  specialty?: string // NEW: Optional specialty field
  subjectsTaught: { subjectId: string; weeklyHoursAssigned: number; courseIds: string[] }[]
  weeklyLoad: number // This will now be calculated
  restrictions: string // Simplified as a string for now (e.g., "Lunes 8-10 AM no disponible")
  teacherType: TeacherType
  qualifiedLevels: SchoolLevel[] // NEW: Levels the teacher is qualified to teach in
  qualifiedGrades: SchoolGrade[] // NEW: Grades the teacher is qualified to teach in
  qualifiedSections: SchoolSection[] // NEW: Sections the teacher is qualified to teach in
  homeroomCourseId?: string // NEW: Course ID for homeroom teachers
}

export interface SchoolSettings {
  id: string // Will be a fixed ID like 'school_settings'
  schoolName: string
  logoUrl: string // URL to the logo image
}

export interface BreakTime {
  name: string
  startTime: string // e.g., "13:00"
  endTime: string // e.g., "14:00"
}

export interface DailySchedule {
  id: string // Will be a fixed ID like 'daily_schedule'
  schoolStartTime: string // e.g., "08:00"
  schoolEndTime: string // e.g., "17:00"
  breaks: BreakTime[]
}

export type SchoolLevel = "Primario" | "Secundario"
export type SchoolGrade = "Primero" | "Segundo" | "Tercero" | "Cuarto" | "Quinto" | "Sexto"
export type SchoolSection = "A" | "B" | "C" | "D" | "E"

export interface Subject {
  id: string
  name: string
  shortCode?: string // NEW: for "LE", "M", "CN" etc.
  priority: "alta" | "media" | "baja"
  iconColor: string // Hex color for the icon
  iconName: string // e.g., "book", "flask" (from Lucide React)
  weeklyHours?: number // NEW: Default weekly hours for this subject
  weeklyHoursByLevelAndGrade?: {
    [level in SchoolLevel]?: {
      [grade in SchoolGrade]?: number // Hours for this subject at this level and grade
    }
  }
}

export interface SubjectTimeSlot {
  id: string
  name: string // e.g., "Bloque 1", "Primera Hora"
  startTime: string // e.g., "08:00"
  endTime: string // e.g., "08:45"
}

export interface Course {
  id: string
  level: SchoolLevel
  grade: SchoolGrade
  section: SchoolSection
  studentList: string // Carga de listas de estudiantes (simplificado como string por ahora)
  homeroomTeacherId: string // ID del docente titular
  courseSubjects: { subjectId: string; weeklyHours: number }[] // NEW: Subjects and their hours for this specific course
}

// NEW: Predefined teacher names for selection
export interface PredefinedTeacherName {
  id: string
  name: string
}