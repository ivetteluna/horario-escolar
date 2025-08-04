"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { getCourses, getTeachers, getSubjects, initDB } from "@/lib/db"
import type { Course, Teacher, Subject, SchoolLevel, SchoolGrade, SchoolSection } from "@/types"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

const levels: SchoolLevel[] = ["Primario", "Secundario"]
const grades: SchoolGrade[] = ["Primero", "Segundo", "Tercero", "Cuarto", "Quinto", "Sexto"]
const sections: SchoolSection[] = ["A", "B", "C", "D", "E"]

export default function ReportsPage() {
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([])
  const [allSubjects, setAllSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedLevel, setSelectedLevel] = useState<SchoolLevel | "all">("all")
  const [selectedGrade, setSelectedGrade] = useState<SchoolGrade | "all">("all")
  const [selectedSection, setSelectedSection] = useState<SchoolSection | "all">("all")

  useEffect(() => {
    const loadData = async () => {
      await initDB()
      const courses = await getCourses()
      const teachers = await getTeachers()
      const subjects = await getSubjects()
      setAllCourses(courses)
      setAllTeachers(teachers)
      setAllSubjects(subjects)
      setLoading(false)
    }
    loadData()
  }, [])

  const filteredCourses = useMemo(() => {
    return allCourses.filter((course) => {
      const levelMatch = selectedLevel === "all" || course.level === selectedLevel
      const gradeMatch = selectedGrade === "all" || course.grade === selectedGrade
      const sectionMatch = selectedSection === "all" || course.section === selectedSection
      return levelMatch && gradeMatch && sectionMatch
    })
  }, [allCourses, selectedLevel, selectedGrade, selectedSection])

  const getTeacherName = (teacherId: string) => {
    const teacher = allTeachers.find((t) => t.id === teacherId)
    return teacher ? teacher.fullName : "Desconocido"
  }

  const getSubjectName = (subjectId: string) => {
    const subject = allSubjects.find((s) => s.id === subjectId)
    return subject ? subject.name : "Desconocida"
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-gray-600 text-lg">Cargando informes...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 pl-4 pr-6 bg-white rounded-lg shadow-sm">
        <SidebarTrigger className="mr-2" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex flex-col flex-grow">
          {" "}
          {/* Removed text-center here */}
          <h1 className="text-2xl font-bold text-gray-800 text-left">Informes y Listas</h1> {/* Added text-left */}
          <p className="text-sm text-gray-600 text-left">
            Visualiza y filtra información detallada de cursos y estudiantes.
          </p>
        </div>
      </header>

      <Card className="shadow-lg border-gray-100 bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-800">Filtros de Informe</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="filterLevel" className="text-gray-700">
              Nivel
            </Label>
            <Select value={selectedLevel} onValueChange={(value: SchoolLevel | "all") => setSelectedLevel(value)}>
              <SelectTrigger
                id="filterLevel"
                className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
              >
                <SelectValue placeholder="Todos los niveles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los niveles</SelectItem>
                {levels.map((lvl) => (
                  <SelectItem key={lvl} value={lvl}>
                    {lvl}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="filterGrade" className="text-gray-700">
              Grado
            </Label>
            <Select value={selectedGrade} onValueChange={(value: SchoolGrade | "all") => setSelectedGrade(value)}>
              <SelectTrigger
                id="filterGrade"
                className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
              >
                <SelectValue placeholder="Todos los grados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los grados</SelectItem>
                {grades.map((grd) => (
                  <SelectItem key={grd} value={grd}>
                    {grd}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="filterSection" className="text-gray-700">
              Sección
            </Label>
            <Select value={selectedSection} onValueChange={(value: SchoolSection | "all") => setSelectedSection(value)}>
              <SelectTrigger
                id="filterSection"
                className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
              >
                <SelectValue placeholder="Todas las secciones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las secciones</SelectItem>
                {sections.map((sec) => (
                  <SelectItem key={sec} value={sec}>
                    {sec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {filteredCourses.length === 0 ? (
          <Card className="shadow-lg border-gray-100 bg-white">
            <CardContent className="py-8 text-center text-muted-foreground">
              <div className="text-4xl mb-4">!</div>
              <p>No se encontraron cursos que coincidan con los filtros seleccionados.</p>
            </CardContent>
          </Card>
        ) : (
          filteredCourses.map((course) => (
            <Card key={course.id} className="shadow-lg border-gray-100 bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold text-gray-800">
                  {`Curso: ${course.level} ${course.grade}º ${course.section}`}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                  <div>
                    <span className="font-semibold">Docente Titular:</span> {getTeacherName(course.homeroomTeacherId)}
                  </div>
                  <div>
                    <span className="font-semibold">Asignaturas:</span>{" "}
                    {course.courseSubjects
                      .map((cs) => `${getSubjectName(cs.subjectId)} (${cs.weeklyHours}h)`)
                      .join(", ")}
                  </div>
                </div>
                <Separator />
                <h3 className="text-lg font-semibold text-gray-800">Lista de Estudiantes:</h3>
                {course.studentList ? (
                  <ul className="list-disc list-inside text-gray-600">
                    {course.studentList.split("\n").map((student, index) => (
                      <li key={index}>{student.trim()}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No hay estudiantes registrados para este curso.</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
