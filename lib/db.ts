// NUEVO HORARIO/lib/db.ts

"use client"

import { openDB, type IDBPDatabase } from "idb"
import type {
  Teacher,
  SchoolSettings,
  DailySchedule,
  Subject,
  Course,
  SubjectTimeSlot,
  PredefinedTeacherName,
} from "@/types"
import { v4 as uuidv4 } from "uuid"

const DB_NAME = "school_scheduler_db"
const TEACHERS_STORE_NAME = "teachers"
const SETTINGS_STORE_NAME = "school_settings"
const SCHEDULE_STORE_NAME = "daily_schedule"
const SUBJECTS_STORE_NAME = "subjects"
const COURSES_STORE_NAME = "courses"
const SUBJECT_TIME_SLOTS_STORE_NAME = "subject_time_slots"
const PREDEFINED_TEACHER_NAMES_STORE_NAME = "predefined_teacher_names"
// NUEVAS TABLAS PARA HORARIOS
const GENERATED_COURSE_SCHEDULES_STORE_NAME = "generated_course_schedules"
const GENERATED_TEACHER_SCHEDULES_STORE_NAME = "generated_teacher_schedules"


let db: IDBPDatabase

export async function initDB() {
  if (!db) {
    db = await openDB(DB_NAME, 9, { // Incrementamos la versión a 9
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains(TEACHERS_STORE_NAME)) {
          db.createObjectStore(TEACHERS_STORE_NAME, { keyPath: "id" })
        }
        if (!db.objectStoreNames.contains(SETTINGS_STORE_NAME)) {
          db.createObjectStore(SETTINGS_STORE_NAME, { keyPath: "id" })
        }
        if (!db.objectStoreNames.contains(SCHEDULE_STORE_NAME)) {
          db.createObjectStore(SCHEDULE_STORE_NAME, { keyPath: "id" })
        }
        if (!db.objectStoreNames.contains(SUBJECTS_STORE_NAME)) {
          db.createObjectStore(SUBJECTS_STORE_NAME, { keyPath: "id" })
        }
        if (!db.objectStoreNames.contains(COURSES_STORE_NAME)) {
          db.createObjectStore(COURSES_STORE_NAME, { keyPath: "id" })
        }
        if (!db.objectStoreNames.contains(SUBJECT_TIME_SLOTS_STORE_NAME)) {
          db.createObjectStore(SUBJECT_TIME_SLOTS_STORE_NAME, { keyPath: "id" })
        }
        if (!db.objectStoreNames.contains(PREDEFINED_TEACHER_NAMES_STORE_NAME)) {
          db.createObjectStore(PREDEFINED_TEACHER_NAMES_STORE_NAME, { keyPath: "id" })
        }
        // CREAMOS LAS NUEVAS TABLAS SI NO EXISTEN
        if (oldVersion < 9) {
            if (!db.objectStoreNames.contains(GENERATED_COURSE_SCHEDULES_STORE_NAME)) {
                db.createObjectStore(GENERATED_COURSE_SCHEDULES_STORE_NAME, { keyPath: "courseId" });
            }
            if (!db.objectStoreNames.contains(GENERATED_TEACHER_SCHEDULES_STORE_NAME)) {
                db.createObjectStore(GENERATED_TEACHER_SCHEDULES_STORE_NAME, { keyPath: "teacherId" });
            }
        }
      },
    })
  }
  return db
}

// --- Operaciones de Horarios Generados ---

export async function saveGeneratedSchedules(courseSchedules: any[], teacherSchedules: any[]) {
    const db = await initDB();
    const tx = db.transaction([GENERATED_COURSE_SCHEDULES_STORE_NAME, GENERATED_TEACHER_SCHEDULES_STORE_NAME], 'readwrite');
    const courseStore = tx.objectStore(GENERATED_COURSE_SCHEDULES_STORE_NAME);
    const teacherStore = tx.objectStore(GENERATED_TEACHER_SCHEDULES_STORE_NAME);
    
    await courseStore.clear();
    await teacherStore.clear();

    await Promise.all([
        ...courseSchedules.map(schedule => courseStore.put(schedule)),
        ...teacherSchedules.map(schedule => teacherStore.put(schedule))
    ]);

    return tx.done;
}

export async function getGeneratedCourseSchedules(): Promise<any[]> {
    const db = await initDB();
    return db.getAll(GENERATED_COURSE_SCHEDULES_STORE_NAME);
}

export async function getGeneratedTeacherSchedules(): Promise<any[]> {
    const db = await initDB();
    return db.getAll(GENERATED_TEACHER_SCHEDULES_STORE_NAME);
}


// --- Operaciones de Docentes (sin cambios) ---
export async function addTeacher(teacher: Teacher) {
  const db = await initDB()
  return db.put(TEACHERS_STORE_NAME, teacher)
}
export async function getTeachers(): Promise<Teacher[]> {
  const db = await initDB()
  return db.getAll(TEACHERS_STORE_NAME)
}
export async function updateTeacher(teacher: Teacher) {
  const db = await initDB()
  return db.put(TEACHERS_STORE_NAME, teacher)
}
export async function deleteTeacher(id: string) {
  const db = await initDB()
  return db.delete(TEACHERS_STORE_NAME, id)
}

// --- Otras operaciones (sin cambios) ---
// (Aquí va el resto del código de db.ts: School Settings, Daily Schedule, Subjects, etc. No es necesario que lo copies de nuevo, solo añade lo de arriba)
// School Settings operations
const SCHOOL_SETTINGS_ID = "school_settings"
export async function saveSchoolSettings(settings: SchoolSettings) {
  const db = await initDB()
  return db.put(SETTINGS_STORE_NAME, { ...settings, id: SCHOOL_SETTINGS_ID })
}

export async function getSchoolSettings(): Promise<SchoolSettings | undefined> {
  const db = await initDB()
  return db.get(SETTINGS_STORE_NAME, SCHOOL_SETTINGS_ID)
}

// Daily Schedule operations
const DAILY_SCHEDULE_ID = "daily_schedule"
export async function saveDailySchedule(schedule: DailySchedule) {
  const db = await initDB()
  return db.put(SCHEDULE_STORE_NAME, { ...schedule, id: DAILY_SCHEDULE_ID })
}

export async function getDailySchedule(): Promise<DailySchedule | undefined> {
  const db = await initDB()
  return db.get(SCHEDULE_STORE_NAME, DAILY_SCHEDULE_ID)
}

// Subject operations
export async function addSubject(subject: Subject) {
  const db = await initDB()
  return db.put(SUBJECTS_STORE_NAME, subject)
}

export async function getSubjects(): Promise<Subject[]> {
  const db = await initDB()
  return db.getAll(SUBJECTS_STORE_NAME)
}

export async function updateSubject(subject: Subject) {
  const db = await initDB()
  return db.put(SUBJECTS_STORE_NAME, subject)
}

export async function deleteSubject(id: string) {
  const db = await initDB()
  return db.delete(SUBJECTS_STORE_NAME, id)
}

// Subject Time Slot operations
export async function addSubjectTimeSlot(slot: SubjectTimeSlot) {
  const db = await initDB()
  return db.put(SUBJECT_TIME_SLOTS_STORE_NAME, slot)
}

export async function getSubjectTimeSlots(): Promise<SubjectTimeSlot[]> {
  const db = await initDB()
  return db.getAll(SUBJECT_TIME_SLOTS_STORE_NAME)
}

export async function updateSubjectTimeSlot(slot: SubjectTimeSlot) {
  const db = await initDB()
  return db.put(SUBJECT_TIME_SLOTS_STORE_NAME, slot)
}

export async function deleteSubjectTimeSlot(id: string) {
  const db = await initDB()
  return db.delete(SUBJECT_TIME_SLOTS_STORE_NAME, id)
}

// Predefined Teacher Names operations
export async function addPredefinedTeacherName(name: PredefinedTeacherName) {
  const db = await initDB()
  return db.put(PREDEFINED_TEACHER_NAMES_STORE_NAME, name)
}

export async function getPredefinedTeacherNames(): Promise<PredefinedTeacherName[]> {
  const db = await initDB()
  return db.getAll(PREDEFINED_TEACHER_NAMES_STORE_NAME)
}

export async function updatePredefinedTeacherName(name: PredefinedTeacherName) {
  const db = await initDB()
  return db.put(PREDEFINED_TEACHER_NAMES_STORE_NAME, name)
}

export async function deletePredefinedTeacherName(id: string) {
  const db = await initDB()
  return db.delete(PREDEFINED_TEACHER_NAMES_STORE_NAME, id)
}

// Course operations
export async function addCourse(course: Course) {
  const db = await initDB()
  return db.put(COURSES_STORE_NAME, course)
}

export async function getCourses(): Promise<Course[]> {
  const db = await initDB()
  return db.getAll(COURSES_STORE_NAME)
}

export async function updateCourse(course: Course) {
  const db = await initDB()
  return db.put(COURSES_STORE_NAME, course)
}

export async function deleteCourse(id: string) {
  const db = await initDB()
  return db.delete(COURSES_STORE_NAME, id)
}

// Function to generate all possible courses
export async function generateAllCourses(): Promise<Course[]> {
  const db = await initDB()
  const allSubjects = await getSubjects()
  const allTeachers = await getTeachers()

  const levels: SchoolLevel[] = ["Primario", "Secundario"]
  const grades: SchoolGrade[] = ["Primero", "Segundo", "Tercero", "Cuarto", "Quinto", "Sexto"]
  const sections: SchoolSection[] = ["A", "B", "C", "D", "E"]

  const generatedCourses: Course[] = []

  for (const level of levels) {
    for (const grade of grades) {
      for (const section of sections) {
        const existingCourse = (await db.getAll(COURSES_STORE_NAME)).find(
          (c) => c.level === level && c.grade === grade && c.section === section,
        )

        if (existingCourse) {
          generatedCourses.push(existingCourse)
          continue
        }

        // Auto-populate subjects for this course based on configured weekly hours
        const courseSubjects = allSubjects
          .filter((subject) => subject.weeklyHoursByLevelAndGrade?.[level]?.[grade] !== undefined)
          .map((subject) => ({
            subjectId: subject.id,
            weeklyHours: subject.weeklyHoursByLevelAndGrade![level]![grade] || 0,
          }))

        const defaultHomeroomTeacherId = allTeachers.length > 0 ? allTeachers[0].id : ""

        const newCourse: Course = {
          id: uuidv4(),
          level,
          grade,
          section,
          studentList: "",
          homeroomTeacherId: defaultHomeroomTeacherId,
          courseSubjects,
        }
        await db.put(COURSES_STORE_NAME, newCourse)
        generatedCourses.push(newCourse)
      }
    }
  }
  return generatedCourses
}