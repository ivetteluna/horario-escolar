"use client"
import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Edit, Save } from "lucide-react"
import { getSubjects, updateSubject, initDB } from "@/lib/db"
import type { Subject, SchoolLevel, SchoolGrade } from "@/types"
import { Badge } from "@/components/ui/badge"
import * as LucideIcons from "lucide-react"

const levels: SchoolLevel[] = ["Primario", "Secundario"]
const grades: SchoolGrade[] = ["Primero", "Segundo", "Tercero", "Cuarto", "Quinto", "Sexto"]

type SubjectWeeklyHoursConfigListProps = {}

export function SubjectWeeklyHoursConfigList({}: SubjectWeeklyHoursConfigListProps) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null)

  useEffect(() => {
    const loadSubjects = async () => {
      await initDB()
      const storedSubjects = await getSubjects()
      setSubjects(storedSubjects)
      setLoading(false)
    }
    loadSubjects()
  }, [])

  const handleHoursChange = (subjectId: string, level: SchoolLevel, grade: SchoolGrade, value: string) => {
    setSubjects((prevSubjects) =>
      prevSubjects.map((sub) => {
        if (sub.id === subjectId) {
          const newWeeklyHours = { ...sub.weeklyHoursByLevelAndGrade }
          if (!newWeeklyHours[level]) {
            newWeeklyHours[level] = {} as { [grade in SchoolGrade]?: number }
          }
          newWeeklyHours[level]![grade] = Number(value)
          return { ...sub, weeklyHoursByLevelAndGrade: newWeeklyHours }
        }
        return sub
      }),
    )
  }

  const handleSaveSubjectHours = async (subjectToSave: Subject) => {
    await updateSubject(subjectToSave)
    setEditingSubjectId(null) // Exit editing mode
    alert(`Horas de ${subjectToSave.name} guardadas.`)
  }

  const calculateTotalHours = (subject: Subject) => {
    let total = 0
    if (subject.weeklyHoursByLevelAndGrade) {
      levels.forEach((level) => {
        if (subject.weeklyHoursByLevelAndGrade?.[level]) {
          grades.forEach((grade) => {
            total += subject.weeklyHoursByLevelAndGrade![level]![grade] || 0
          })
        }
      })
    }
    return total
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-gray-600 text-lg">Cargando configuración de horas por asignatura...</p>
      </div>
    )
  }

  return (
    <Card className="w-full shadow-lg border-gray-100">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-800">Carga Horaria por Asignatura, Nivel y Grado</CardTitle>
      </CardHeader>
      <CardContent>
        {subjects.length === 0 ? (
          <p className="text-muted-foreground">
            No hay asignaturas registradas. Por favor, añade asignaturas en la sección "Gestión de Asignaturas" para
            configurar sus horas.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => {
              const IconComponent = LucideIcons[subject.iconName as keyof typeof LucideIcons] || LucideIcons.BookOpen
              const isEditing = editingSubjectId === subject.id

              return (
                <Card key={subject.id} className="shadow-sm border-gray-200 bg-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-2">
                      {IconComponent && <IconComponent className="h-5 w-5" style={{ color: subject.iconColor }} />}
                      <CardTitle className="text-lg font-semibold text-gray-800">{subject.name}</CardTitle>
                      {subject.shortCode && (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                          {subject.shortCode}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        Básica
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      {isEditing ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSaveSubjectHours(subject)}
                          aria-label="Guardar cambios"
                          className="text-emerald-600 hover:text-emerald-700"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingSubjectId(subject.id)}
                          aria-label="Editar horas de asignatura"
                          className="text-gray-500 hover:text-emerald-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {/* Delete button is typically handled on the main subject management page */}
                      {/* <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => console.log("Delete subject config")}
                        aria-label="Eliminar configuración de asignatura"
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button> */}
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    {levels.map((level) => (
                      <div key={level} className="grid gap-2">
                        <h4 className="text-md font-semibold text-gray-700">{`Nivel ${level}:`}</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {grades.map((grade) => (
                            <div key={grade} className="flex flex-col items-center gap-1">
                              <Label htmlFor={`${subject.id}-${level}-${grade}`} className="text-sm text-gray-600">
                                {grade.substring(0, 1).toUpperCase()}º
                              </Label>
                              <Input
                                id={`${subject.id}-${level}-${grade}`}
                                type="number"
                                value={subject.weeklyHoursByLevelAndGrade?.[level]?.[grade] || 0}
                                onChange={(e) => handleHoursChange(subject.id, level, grade, e.target.value)}
                                min="0"
                                step="0.5"
                                className="w-16 text-center border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                                disabled={!isEditing}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-end items-center mt-4">
                      <span className="text-lg font-bold text-gray-800">
                        Total horas: {calculateTotalHours(subject)}h
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
