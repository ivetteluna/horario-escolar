export type TeacherType = "fijo" | "rotacion" | "dos_niveles" | "mixto"

export interface Teacher {
  id: string
  fullName: string
  email?: string
  phone?: string
  specialty?: string
  subjectsTaught: { subjectId: string; weeklyHoursAssigned: number }[]
  weeklyLoad: number
  restrictions: string
  teacherType: TeacherType
  qualifiedLevels?: SchoolLevel[]
  qualifiedGrades?: SchoolGrade[]
  qualifiedSections?: SchoolSection[]
  homeroomCourseId?: string // NEW: For titular teachers, which course they are homeroom teacher of
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

export interface Subject {
  id: string
  name: string
  shortCode?: string
  priority: "alta" | "media" | "baja"
  iconColor: string // Hex color for the icon
  iconName: string // e.g., "book", "flask" (from Lucide React)
  weeklyHoursByLevelAndGrade?: {
    [level in SchoolLevel]?: {
      [grade in SchoolGrade]?: number
    }
  }
}

export interface SubjectTimeSlot {
  id: string
  name: string // e.g., "Bloque 1", "Primera Hora"
  startTime: string // e.g., "08:00"
  endTime: string // e.g., "08:45"
}

export type SchoolLevel = "Primario" | "Secundario"
export type SchoolGrade = "Primero" | "Segundo" | "Tercero" | "Cuarto" | "Quinto" | "Sexto"
export type SchoolSection = "A" | "B" | "C" | "D" | "E"

export interface Course {
  id: string
  level: SchoolLevel
  grade: SchoolGrade
  section: SchoolSection
  studentList: string // Carga de listas de estudiantes (simplificado como string por ahora)
  homeroomTeacherId: string // ID del docente titular
  courseSubjects: { subjectId: string; weeklyHours: number; teacherId?: string }[] // NEW: Added teacherId for subject assignments
}

export interface PredefinedTeacherName {
  id: string
  name: string
}

export interface SubjectWeeklyHoursConfig {
  id: string
  subjectId: string
  level: SchoolLevel
  grade: SchoolGrade
  weeklyHours: number
}
