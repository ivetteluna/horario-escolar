"use client"

import { useState, useEffect } from "react"
import { SchoolSettingsForm } from "@/components/school-settings-form"
import { DailyScheduleForm } from "@/components/daily-schedule-form"
import { SubjectTimeSlotsForm } from "@/components/subject-time-slots-form"
import { SubjectWeeklyHoursConfigList } from "@/components/subject-weekly-hours-config-list"
import { PredefinedTeacherNamesForm } from "@/components/predefined-teacher-names-form" // NEW import
import {
  saveSchoolSettings,
  getSchoolSettings,
  saveDailySchedule,
  getDailySchedule,
  addSubjectTimeSlot,
  getSubjectTimeSlots,
  deleteSubjectTimeSlot,
  addPredefinedTeacherName, // NEW import
  getPredefinedTeacherNames, // NEW import
  deletePredefinedTeacherName, // NEW import
  initDB,
} from "@/lib/db"
import type { SchoolSettings, DailySchedule, SubjectTimeSlot, PredefinedTeacherName } from "@/types" // NEW type import
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | undefined>(undefined)
  const [dailySchedule, setDailySchedule] = useState<DailySchedule | undefined>(undefined)
  const [subjectTimeSlots, setSubjectTimeSlots] = useState<SubjectTimeSlot[]>([])
  const [predefinedTeacherNames, setPredefinedTeacherNames] = useState<PredefinedTeacherName[]>([]) // NEW state
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSettings = async () => {
      await initDB()
      const storedSettings = await getSchoolSettings()
      const storedSchedule = await getDailySchedule()
      const storedSubjectTimeSlots = await getSubjectTimeSlots()
      const storedPredefinedTeacherNames = await getPredefinedTeacherNames() // NEW fetch
      setSchoolSettings(storedSettings)
      setDailySchedule(storedSchedule)
      setSubjectTimeSlots(storedSubjectTimeSlots)
      setPredefinedTeacherNames(storedPredefinedTeacherNames) // NEW set state
      setLoading(false)
    }
    loadSettings()
  }, [])

  const handleSaveSchoolSettings = async (settings: SchoolSettings) => {
    await saveSchoolSettings(settings)
    setSchoolSettings(settings)
    alert("Configuración del centro guardada.")
  }

  const handleSaveDailySchedule = async (schedule: DailySchedule) => {
    await saveDailySchedule(schedule)
    setDailySchedule(schedule)
    alert("Horario de jornada guardado.")
  }

  const handleSaveSubjectTimeSlots = async (slots: SubjectTimeSlot[]) => {
    await Promise.all(subjectTimeSlots.map((slot) => deleteSubjectTimeSlot(slot.id)))
    for (const slot of slots) {
      await addSubjectTimeSlot(slot)
    }
    setSubjectTimeSlots(slots)
    alert("Bloques horarios de asignaturas guardados.")
  }

  // NEW: Handler for saving predefined teacher names
  const handleSavePredefinedTeacherNames = async (names: PredefinedTeacherName[]) => {
    // Clear existing and add new ones for simplicity
    const existingNames = await getPredefinedTeacherNames()
    await Promise.all(existingNames.map((name) => deletePredefinedTeacherName(name.id)))
    for (const name of names) {
      await addPredefinedTeacherName(name)
    }
    setPredefinedTeacherNames(names)
    alert("Nombres de docentes predefinidos guardados.")
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-gray-600 text-lg">Cargando configuración...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 pl-4 pr-6 bg-white rounded-lg shadow-sm">
        <SidebarTrigger className="mr-2" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex flex-col flex-grow">
          <h1 className="text-2xl font-bold text-gray-800 text-left">Configuración de la Aplicación</h1>
          <p className="text-sm text-gray-600 text-left">Ajusta los parámetros generales de tu institución.</p>
        </div>
      </header>
      <SchoolSettingsForm initialData={schoolSettings} onSave={handleSaveSchoolSettings} />
      <DailyScheduleForm initialData={dailySchedule} onSave={handleSaveDailySchedule} />
      <SubjectTimeSlotsForm initialData={subjectTimeSlots} onSave={handleSaveSubjectTimeSlots} />
      <PredefinedTeacherNamesForm initialData={predefinedTeacherNames} onSave={handleSavePredefinedTeacherNames} />{" "}
      {/* NEW component */}
      <SubjectWeeklyHoursConfigList /> {/* Aquí está el componente */}
      <Card className="shadow-lg border-gray-100">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-800">Otras Configuraciones</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Aquí se añadirán opciones de personalización visual y filtros avanzados en futuras iteraciones.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
