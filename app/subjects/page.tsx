"use client"

import { useState, useEffect } from "react"
import { SubjectForm } from "@/components/subject-form"
import { SubjectList } from "@/components/subject-list"
import { addSubject, getSubjects, updateSubject, deleteSubject, initDB } from "@/lib/db"
import type { Subject } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [editingSubject, setEditingSubject] = useState<Subject | undefined>(undefined)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSubjects = async () => {
      await initDB()
      const storedSubjects = await getSubjects()
      setSubjects(storedSubjects)
      setLoading(false)
    }
    loadSubjects()
  }, [])

  const handleSaveSubject = async (subject: Subject) => {
    if (editingSubject) {
      await updateSubject(subject)
    } else {
      await addSubject(subject)
    }
    const updatedSubjects = await getSubjects()
    setSubjects(updatedSubjects)
    setEditingSubject(undefined)
    setShowForm(false)
  }

  const handleDeleteSubject = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta asignatura?")) {
      await deleteSubject(id)
      const updatedSubjects = await getSubjects()
      setSubjects(updatedSubjects)
    }
  }

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject)
    setShowForm(true)
  }

  const handleCancelForm = () => {
    setEditingSubject(undefined)
    setShowForm(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-gray-600 text-lg">Cargando asignaturas...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 pl-4 pr-6 bg-white rounded-lg shadow-sm">
        <SidebarTrigger className="mr-2" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex flex-col flex-grow">
          <h1 className="text-2xl font-bold text-gray-800 text-left">Gestión de Asignaturas</h1>
          <p className="text-sm text-gray-600 text-left">Administra las asignaturas impartidas en tu institución.</p>
        </div>
      </header>

      <Card className="shadow-lg border-gray-100">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-2xl font-bold text-gray-800">Lista de Asignaturas</CardTitle>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
          >
            Añadir Asignatura
          </Button>
        </CardHeader>
        <CardContent>
          {showForm || editingSubject ? (
            <SubjectForm initialData={editingSubject} onSave={handleSaveSubject} onCancel={handleCancelForm} />
          ) : (
            <SubjectList subjects={subjects} onEdit={handleEditSubject} onDelete={handleDeleteSubject} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
