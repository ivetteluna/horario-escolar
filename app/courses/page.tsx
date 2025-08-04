"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CourseForm } from "@/components/course-form"
import { CourseList } from "@/components/course-list"
import type { Course, Teacher } from "@/types"
import { initDB, getCourses, getTeachers, updateCourse, addCourse, deleteCourse, generateAllCourses } from "@/lib/db" // Import generateAllCourses
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { PlusCircle } from "lucide-react" // Import PlusCircle icon

const CoursesPage = () => {
  const [courses, setCourses] = useState<Course[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [editingCourse, setEditingCourse] = useState<Course | undefined>(undefined)
  const [showForm, setShowForm] = useState(false) // Controls visibility of the form for manual add/edit
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    await initDB()
    const storedCourses = await getCourses()
    const storedTeachers = await getTeachers()
    setCourses(storedCourses)
    setTeachers(storedTeachers)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleGenerateCourses = async () => {
    setLoading(true)
    await generateAllCourses() // Generate all courses
    await loadData() // Reload data to show newly generated courses
    alert("Cursos generados automáticamente. Puedes editarlos individualmente.")
  }

  const handleSaveCourse = async (course: Course) => {
    if (editingCourse) {
      await updateCourse(course)
    } else {
      await addCourse(course) // This path is now less common, mainly for specific additions
    }
    await loadData() // Reload data
    setEditingCourse(undefined)
    setShowForm(false)
  }

  const handleDeleteCourse = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este curso/grupo?")) {
      await deleteCourse(id)
      await loadData() // Reload data
    }
  }

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course)
    setShowForm(true)
  }

  const handleCancelForm = () => {
    setEditingCourse(undefined)
    setShowForm(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-gray-600 text-lg">Cargando cursos y grupos...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 pl-4 pr-6 bg-white rounded-lg shadow-sm">
        <SidebarTrigger className="mr-2" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex flex-col flex-grow">
          <h1 className="text-2xl font-bold text-gray-800 text-left">Gestión de Cursos y Grupos</h1>
          <p className="text-sm text-gray-600 text-left">Administra los cursos y grupos de tu institución.</p>
        </div>
      </header>

      <Card className="shadow-lg border-gray-100">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-2xl font-bold text-gray-800">Lista de Cursos y Grupos</CardTitle>
          <div className="flex gap-2">
            <Button onClick={handleGenerateCourses} className="bg-purple-600 hover:bg-purple-700 text-white shadow-md">
              <PlusCircle className="mr-2 h-4 w-4" /> Generar Cursos Automáticamente
            </Button>
            {/* Optionally keep a manual add button if needed, or remove it */}
            <Button
              onClick={() => setShowForm(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
            >
              Añadir Curso Manualmente
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showForm || editingCourse ? (
            <CourseForm
              initialData={editingCourse}
              onSave={handleSaveCourse}
              onCancel={handleCancelForm}
              teachers={teachers}
            />
          ) : (
            <CourseList courses={courses} teachers={teachers} onEdit={handleEditCourse} onDelete={handleDeleteCourse} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default CoursesPage
