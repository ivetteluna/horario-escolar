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
  SchoolLevel,
  SchoolGrade,
  SchoolSection,
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

let db: IDBPDatabase

export async function initDB() {
  if (!db) {
    db = await openDB(DB_NAME, 8, {
      upgrade(db, oldVersion, newVersion, transaction) {
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
        if (oldVersion < 2 && !db.objectStoreNames.contains(SUBJECT_TIME_SLOTS_STORE_NAME)) {
          db.createObjectStore(SUBJECT_TIME_SLOTS_STORE_NAME, { keyPath: "id" })
        }
        if (oldVersion < 7 && !db.objectStoreNames.contains(PREDEFINED_TEACHER_NAMES_STORE_NAME)) {
          db.createObjectStore(PREDEFINED_TEACHER_NAMES_STORE_NAME, { keyPath: "id" })
        }
        if (oldVersion < 6) {
          const subjectsStore = transaction.objectStore(SUBJECTS_STORE_NAME)
          subjectsStore.openCursor().onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
            if (cursor) {
              const subject = { ...cursor.value } as Subject
              if (!subject.weeklyHoursByLevelAndGrade) {
                subject.weeklyHoursByLevelAndGrade = {
                  Primario: { Primero: 0, Segundo: 0, Tercero: 0, Cuarto: 0, Quinto: 0, Sexto: 0 },
                  Secundario: { Primero: 0, Segundo: 0, Tercero: 0, Cuarto: 0, Quinto: 0, Sexto: 0 },
                }
              }
              if (!subject.shortCode) {
                subject.shortCode = subject.name.substring(0, 2).toUpperCase()
              }
              cursor.update(subject)
              cursor.continue()
            }
          }
        }
      },
    })
  }
  return db
}

// Teacher operations
export async function addTeacher(teacher: Teacher) {
  const db = await initDB()
  const result = await db.put(TEACHERS_STORE_NAME, teacher)

  // Actualizar automáticamente los cursos cuando se guarda un docente
  await updateCoursesWithTeacherSubjects(teacher)

  return result
}

export async function getTeachers(): Promise<Teacher[]> {
  const db = await initDB()
  return db.getAll(TEACHERS_STORE_NAME)
}

export async function updateTeacher(teacher: Teacher) {
  const db = await initDB()
  const result = await db.put(TEACHERS_STORE_NAME, teacher)

  // Actualizar automáticamente los cursos cuando se actualiza un docente
  await updateCoursesWithTeacherSubjects(teacher)

  return result
}

export async function deleteTeacher(id: string) {
  const db = await initDB()
  return db.delete(TEACHERS_STORE_NAME, id)
}

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

// JSON Export/Import
export async function exportDataToJson(): Promise<string> {
  const teachers = await getTeachers()
  const settings = await getSchoolSettings()
  const schedule = await getDailySchedule()
  const subjects = await getSubjects()
  const courses = await getCourses()
  const subjectTimeSlots = await getSubjectTimeSlots()
  const predefinedTeacherNames = await getPredefinedTeacherNames()

  const data = {
    teachers,
    settings,
    schedule,
    subjects,
    courses,
    subjectTimeSlots,
    predefinedTeacherNames,
  }
  return JSON.stringify(data, null, 2)
}

export async function importDataFromJson(jsonData: string): Promise<void> {
  const data = JSON.parse(jsonData)
  const db = await initDB()
  const tx = db.transaction(
    [
      TEACHERS_STORE_NAME,
      SETTINGS_STORE_NAME,
      SCHEDULE_STORE_NAME,
      SUBJECTS_STORE_NAME,
      COURSES_STORE_NAME,
      SUBJECT_TIME_SLOTS_STORE_NAME,
      PREDEFINED_TEACHER_NAMES_STORE_NAME,
    ],
    "readwrite",
  )

  if (data.teachers) {
    const store = tx.objectStore(TEACHERS_STORE_NAME)
    await store.clear()
    for (const item of data.teachers) {
      await store.put(item)
    }
  }
  if (data.settings) {
    const store = tx.objectStore(SETTINGS_STORE_NAME)
    await store.clear()
    await store.put(data.settings)
  }
  if (data.schedule) {
    const store = tx.objectStore(SCHEDULE_STORE_NAME)
    await store.clear()
    await store.put(data.schedule)
  }
  if (data.subjects) {
    const store = tx.objectStore(SUBJECTS_STORE_NAME)
    await store.clear()
    for (const item of data.subjects) {
      await store.put(item)
    }
  }
  if (data.courses) {
    const store = tx.objectStore(COURSES_STORE_NAME)
    await store.clear()
    for (const item of data.courses) {
      await store.put(item)
    }
  }
  if (data.subjectTimeSlots) {
    const store = tx.objectStore(SUBJECT_TIME_SLOTS_STORE_NAME)
    await store.clear()
    for (const item of data.subjectTimeSlots) {
      await store.put(item)
    }
  }
  if (data.predefinedTeacherNames) {
    const store = tx.objectStore(PREDEFINED_TEACHER_NAMES_STORE_NAME)
    await store.clear()
    for (const item of data.predefinedTeacherNames) {
      await store.put(item)
    }
  }
  await tx.done
}

// Nueva función para actualizar automáticamente los cursos con las asignaturas del docente
async function updateCoursesWithTeacherSubjects(teacher: Teacher) {
  const db = await initDB()
  const allCourses = await db.getAll(COURSES_STORE_NAME)
  const allSubjects = await db.getAll(SUBJECTS_STORE_NAME)

  // Para cada asignatura que enseña el docente
  for (const subjectTaught of teacher.subjectsTaught) {
    if (!subjectTaught.courseIds || subjectTaught.courseIds.length === 0) continue

    const subject = allSubjects.find((s) => s.id === subjectTaught.subjectId)
    if (!subject) continue

    // Para cada curso donde enseña esta asignatura
    for (const courseId of subjectTaught.courseIds) {
      const course = allCourses.find((c) => c.id === courseId)
      if (!course) continue

      // Verificar si la asignatura ya está en el curso
      const existingSubject = course.courseSubjects.find((cs) => cs.subjectId === subjectTaught.subjectId)

      if (!existingSubject) {
        // Obtener las horas configuradas para esta asignatura en este nivel y grado
        const configuredHours = subject.weeklyHoursByLevelAndGrade?.[course.level]?.[course.grade] || 0

        if (configuredHours > 0) {
          // Agregar la asignatura al curso
          course.courseSubjects.push({
            subjectId: subjectTaught.subjectId,
            weeklyHours: configuredHours,
          })

          // Guardar el curso actualizado
          await db.put(COURSES_STORE_NAME, course)
        }
      }
    }
  }
}
