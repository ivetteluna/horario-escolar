// NUEVO HORARIO/app/page.tsx

"use client"

import { useState, useEffect } from "react"
import { TeacherForm } from "@/components/teacher-form"
import { TeacherList } from "@/components/teacher-list"
import { addTeacher, getTeachers, updateTeacher, deleteTeacher, initDB } from "@/lib/db"
import type { Teacher } from "@/lib/types" // <-- CAMBIO IMPORTANTE
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

export default function HomePage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [editingTeacher, setEditingTeacher] = useState<Teacher | undefined>(undefined)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTeachers = async () => {
      await initDB()
      const storedTeachers = await getTeachers()
      setTeachers(storedTeachers)
      setLoading(false)
    }
    loadTeachers()
  }, [])

  const handleSaveTeacher = async (teacher: Teacher) => {
    if (editingTeacher) {
      await updateTeacher(teacher)
    } else {
      await addTeacher(teacher)
    }
    const updatedTeachers = await getTeachers()
    setTeachers(updatedTeachers)
    setEditingTeacher(undefined)
    setShowForm(false)
  }

  const handleDeleteTeacher = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este docente?")) {
      await deleteTeacher(id)
      const updatedTeachers = await getTeachers()
      setTeachers(updatedTeachers)
    }
  }

  const handleEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    setShowForm(true)
  }

  const handleCancelForm = () => {
    setEditingTeacher(undefined)
    setShowForm(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-gray-600 text-lg">Cargando docentes...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 pl-4 pr-6 bg-white rounded-lg shadow-sm">
        <SidebarTrigger className="mr-2" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex flex-col flex-grow">
          <h1 className="text-2xl font-bold text-gray-800 text-left">Gestión de Docentes</h1>
          <p className="text-sm text-gray-600 text-left">
            Administra la información de los docentes de tu institución.
          </p>
        </div>
      </header>

      <Card className="shadow-lg border-gray-100">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-2xl font-bold text-gray-800">Lista de Docentes</CardTitle>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
          >
            Añadir Docente
          </Button>
        </CardHeader>
        <CardContent>
          {showForm || editingTeacher ? (
            <TeacherForm initialData={editingTeacher} onSave={handleSaveTeacher} onCancel={handleCancelForm} />
          ) : (
            <TeacherList teachers={teachers} onEdit={handleEditTeacher} onDelete={handleDeleteTeacher} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}