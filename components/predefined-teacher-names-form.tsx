"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { XCircle, PlusCircle, Edit, Save } from "lucide-react"
import type { PredefinedTeacherName } from "@/types"

interface PredefinedTeacherNamesFormProps {
  initialData?: PredefinedTeacherName[]
  onSave: (names: PredefinedTeacherName[]) => void
}

export const PredefinedTeacherNamesForm: React.FC<PredefinedTeacherNamesFormProps> = ({ initialData, onSave }) => {
  const [names, setNames] = useState<PredefinedTeacherName[]>(initialData || [])
  const [newName, setNewName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingNameValue, setEditingNameValue] = useState("")
  const [formErrors, setFormErrors] = useState<string[]>([])

  useEffect(() => {
    if (initialData) {
      setNames(initialData)
    }
  }, [initialData])

  const handleAddName = () => {
    setFormErrors([])
    if (!newName.trim()) {
      setFormErrors(["El nombre del docente no puede estar vacío."])
      return
    }
    if (names.some((n) => n.name.toLowerCase() === newName.trim().toLowerCase())) {
      setFormErrors(["Este nombre de docente ya existe."])
      return
    }
    setNames([...names, { id: uuidv4(), name: newName.trim() }])
    setNewName("")
  }

  const handleRemoveName = (id: string) => {
    setNames(names.filter((name) => name.id !== id))
  }

  const handleEditClick = (name: PredefinedTeacherName) => {
    setEditingId(name.id)
    setEditingNameValue(name.name)
  }

  const handleSaveEdit = (id: string) => {
    setFormErrors([])
    if (!editingNameValue.trim()) {
      setFormErrors(["El nombre del docente no puede estar vacío."])
      return
    }
    if (names.some((n) => n.id !== id && n.name.toLowerCase() === editingNameValue.trim().toLowerCase())) {
      setFormErrors(["Este nombre de docente ya existe."])
      return
    }

    setNames(names.map((n) => (n.id === id ? { ...n, name: editingNameValue.trim() } : n)))
    setEditingId(null)
    setEditingNameValue("")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors([]) // Clear errors on final submit
    // Basic validation before saving the whole list
    if (names.length === 0) {
      setFormErrors(["Por favor, añade al menos un nombre de docente predefinido."])
      return
    }
    const uniqueNames = new Set(names.map((n) => n.name.toLowerCase()))
    if (uniqueNames.size !== names.length) {
      setFormErrors(["Hay nombres de docentes duplicados en la lista."])
      return
    }

    onSave(names)
  }

  return (
    <Card className="w-full shadow-lg border-gray-100">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-800">Gestión de Nombres de Docentes Predefinidos</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid gap-4">
            <h3 className="text-xl font-semibold text-gray-800">Añadir Nuevo Nombre</h3>
            <div className="flex flex-col md:flex-row items-end gap-3">
              <div className="grid gap-2 flex-1 w-full">
                <Label htmlFor="newName" className="text-gray-700">
                  Nombre Completo del Docente
                </Label>
                <Input
                  id="newName"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddName}
                className="w-full md:w-auto bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300 shadow-sm"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Nombre
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            <h3 className="text-xl font-semibold text-gray-800">Lista de Nombres Predefinidos</h3>
            {names.length === 0 && (
              <p className="text-muted-foreground mb-4">
                No hay nombres de docentes predefinidos. Añade algunos arriba.
              </p>
            )}
            <ul className="grid gap-3">
              {names.map((nameItem) => (
                <li
                  key={nameItem.id}
                  className="flex flex-col md:flex-row items-center gap-3 border border-gray-200 p-3 rounded-md bg-gray-50"
                >
                  {editingId === nameItem.id ? (
                    <div className="flex-1 w-full grid gap-2">
                      <Label htmlFor={`editName-${nameItem.id}`} className="sr-only">
                        Editar nombre
                      </Label>
                      <Input
                        id={`editName-${nameItem.id}`}
                        value={editingNameValue}
                        onChange={(e) => setEditingNameValue(e.target.value)}
                        className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>
                  ) : (
                    <span className="flex-1 text-gray-800 font-medium w-full">{nameItem.name}</span>
                  )}
                  <div className="flex gap-2">
                    {editingId === nameItem.id ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSaveEdit(nameItem.id)}
                        aria-label="Guardar nombre"
                        className="text-emerald-600 hover:text-emerald-700"
                      >
                        <Save className="h-5 w-5" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(nameItem)}
                        aria-label="Editar nombre"
                        className="text-gray-500 hover:text-emerald-600"
                      >
                        <Edit className="h-5 w-5" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveName(nameItem.id)}
                      aria-label="Eliminar nombre"
                      className="text-red-500 hover:text-red-700"
                    >
                      <XCircle className="h-5 w-5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {formErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
              <p className="font-semibold mb-2">Errores:</p>
              <ul className="list-disc list-inside">
                {formErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md mt-4">
            Guardar Nombres Predefinidos
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
