// NUEVO HORARIO/app/dashboard/page.tsx

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Users,
  BookOpen,
  GraduationCap,
  Settings,
  CalendarCheck,
  Activity,
  CheckCircle,
  List,
  Clock,
} from "lucide-react"
import { useState, useEffect } from "react"
import { getTeachers, getSubjects, getCourses, initDB } from "@/lib/db"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import Link from "next/link"

export default function DashboardPage() {
  const [teacherCount, setTeacherCount] = useState(0)
  const [subjectCount, setSubjectCount] = useState(0)
  const [courseCount, setCourseCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCounts = async () => {
      await initDB()
      const teachers = await getTeachers()
      const subjects = await getSubjects()
      const courses = await getCourses()
      setTeacherCount(teachers.length)
      setSubjectCount(subjects.length)
      setCourseCount(courses.length)
      setLoading(false)
    }
    loadCounts()
  }, [])

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header for the main content area, including sidebar trigger */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 pl-4 pr-6 bg-white rounded-lg shadow-sm">
        <SidebarTrigger className="mr-2" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex flex-col flex-grow">
          {" "}
          {/* Removed text-center here */}
          <h1 className="text-2xl font-bold text-gray-800 text-left">Sistema de Gestión de Horarios Docentes</h1>{" "}
          {/* Added text-left */}
          <p className="text-sm text-gray-600 text-left">
            Administra docentes, asignaturas, cursos y genera horarios de manera eficiente
          </p>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <p className="text-gray-600 text-lg">Cargando resumen...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {/* Docentes Card */}
          <Card className="bg-white rounded-xl shadow-lg border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Docentes</CardTitle>
              <Users className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-700">{teacherCount}</div>
            </CardContent>
          </Card>
          {/* Asignaturas Card */}
          <Card className="bg-white rounded-xl shadow-lg border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Asignaturas</CardTitle>
              <BookOpen className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-700">{subjectCount}</div>
            </CardContent>
          </Card>
          {/* Cursos Card */}
          <Card className="bg-white rounded-xl shadow-lg border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Cursos</CardTitle>
              <GraduationCap className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-700">{courseCount}</div>
            </CardContent>
          </Card>
          {/* Estado Card */}
          <Card className="bg-white rounded-xl shadow-lg border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Estado</CardTitle>
              <Activity className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-xl font-bold">Activo</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Acciones Rápidas */}
      <Card className="shadow-lg border-gray-100 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-gray-700" /> Acciones Rápidas
          </CardTitle>
          <p className="text-sm text-muted-foreground">Accede rápidamente a las funciones principales del sistema</p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            variant="outline"
            className="h-auto py-3 px-4 flex flex-col items-center justify-center gap-1 text-gray-700 hover:bg-gray-100 border-gray-300 shadow-sm bg-transparent"
            asChild
          >
            <Link href="/">
              <Users className="h-6 w-6" />
              <span>Gestionar Docentes</span>
            </Link>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-3 px-4 flex flex-col items-center justify-center gap-1 text-gray-700 hover:bg-gray-100 border-gray-300 shadow-sm bg-transparent"
            asChild
          >
            <Link href="/subjects">
              <BookOpen className="h-6 w-6" />
              <span>Gestionar Asignaturas</span>
            </Link>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-3 px-4 flex flex-col items-center justify-center gap-1 text-gray-700 hover:bg-gray-100 border-gray-300 shadow-sm bg-transparent"
            asChild
          >
            <Link href="/courses">
              <GraduationCap className="h-6 w-6" />
              <span>Gestionar Cursos</span>
            </Link>
          </Button>
          <Button
            className="h-auto py-3 px-4 flex flex-col items-center justify-center gap-1 bg-purple-600 hover:bg-purple-700 text-white shadow-md"
            asChild
          >
            <Link href="/schedule-generation">
              <CalendarCheck className="h-6 w-6" />
              <span>Generar Horarios</span>
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Estado del Sistema */}
      <Card className="shadow-lg border-gray-100 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <List className="h-6 w-6 text-gray-700" /> Estado del Sistema
          </CardTitle>
          <p className="text-sm text-muted-foreground">Información general sobre el estado actual del sistema</p>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Base de Datos</span>
            <span className="flex items-center gap-2 text-emerald-600 font-medium">
              <CheckCircle className="h-4 w-4" /> Conectada
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Configuración</span>
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-xs px-2 py-1 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
            >
              <List className="h-3 w-3 mr-1" /> Lista
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Horarios</span>
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-xs px-2 py-1 bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
            >
              <Clock className="h-3 w-3 mr-1" /> Pendiente
            </Button>
          </div>
          <Button className="mt-4 bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-sm" asChild>
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" /> Ir a Configuración
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Actividad Reciente */}
      <Card className="shadow-lg border-gray-100 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Clock className="h-6 w-6 text-gray-700" /> Actividad Reciente
          </CardTitle>
          <p className="text-sm text-muted-foreground">Últimas acciones realizadas en el sistema</p>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle className="h-5 w-5" />
            <span>Sistema inicializado correctamente</span>
          </div>
          <p className="text-muted-foreground text-center py-4">
            <span className="text-4xl block mb-2">!</span>
            No hay actividad reciente
          </p>
        </CardContent>
      </Card>
    </div>
  )
}