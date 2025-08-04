"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Subject } from "@/types"
import { Edit, Trash2 } from "lucide-react"
import * as LucideIcons from "lucide-react"

interface SubjectListProps {
  subjects: Subject[]
  onEdit: (subject: Subject) => void
  onDelete: (id: string) => void
}

export function SubjectList({ subjects, onEdit, onDelete }: SubjectListProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="text-gray-700 font-semibold">Icono</TableHead>
            <TableHead className="text-gray-700 font-semibold">Nombre</TableHead>
            <TableHead className="text-gray-700 font-semibold">Abreviatura</TableHead> {/* NEW TableHead */}
            <TableHead className="text-gray-700 font-semibold">Prioridad</TableHead>
            <TableHead className="text-right text-gray-700 font-semibold">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subjects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                No hay asignaturas registradas.
              </TableCell>
            </TableRow>
          ) : (
            subjects.map((subject) => {
              const IconComponent = LucideIcons[subject.iconName as keyof typeof LucideIcons] || LucideIcons.BookOpen
              return (
                <TableRow key={subject.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell>
                    {IconComponent && <IconComponent className="h-7 w-7" style={{ color: subject.iconColor }} />}{" "}
                    {/* Increased icon size */}
                  </TableCell>
                  <TableCell className="font-medium text-gray-800">{subject.name}</TableCell>
                  <TableCell className="text-gray-600">{subject.shortCode || "N/A"}</TableCell> {/* NEW TableCell */}
                  <TableCell className="text-gray-600 capitalize">{subject.priority}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(subject)}
                        aria-label="Editar asignatura"
                        className="text-gray-500 hover:text-emerald-600"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(subject.id)}
                        aria-label="Eliminar asignatura"
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
