"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, FileSpreadsheet, Upload, Download } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { exportDataToJson, importDataFromJson } from "@/lib/db" // Import DB functions

export default function ExportPrintPage() {
  const handleExportData = async () => {
    try {
      const jsonData = await exportDataToJson()
      const blob = new Blob([jsonData], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "school_scheduler_data.json"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      alert("Datos exportados correctamente a school_scheduler_data.json")
    } catch (error) {
      console.error("Error exporting data:", error)
      alert("Error al exportar los datos.")
    }
  }

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const jsonData = e.target?.result as string
          await importDataFromJson(jsonData)
          alert("Datos importados correctamente. Recarga la página para ver los cambios.")
          // Optionally, reload the page to reflect changes
          // window.location.reload();
        } catch (error) {
          console.error("Error importing data:", error)
          alert("Error al importar los datos. Asegúrate de que el archivo sea un JSON válido.")
        }
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 pl-4 pr-6 bg-white rounded-lg shadow-sm">
        <SidebarTrigger className="mr-2" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex flex-col flex-grow">
          <h1 className="text-2xl font-bold text-gray-800 text-left">Exportación e Importación de Datos</h1>
          <p className="text-sm text-gray-600 text-left">Gestiona la entrada y salida de datos del sistema.</p>
        </div>
      </header>

      <Card className="shadow-lg border-gray-100">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-2xl font-bold text-gray-800">Opciones de Salida de Horarios</CardTitle>
          <div className="flex gap-2 flex-wrap justify-end">
            {" "}
            {/* Added flex-wrap and justify-end for responsiveness */}
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100 shadow-sm bg-transparent"
              onClick={() => alert("Exportar PDF (funcionalidad en desarrollo)")}
            >
              <FileText className="mr-2 h-4 w-4" /> Exportar PDF
            </Button>
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100 shadow-sm bg-transparent"
              onClick={() => alert("Exportar Excel (funcionalidad en desarrollo)")}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Exportar Excel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md" onClick={handleExportData}>
              <Download className="mr-2 h-4 w-4" /> Exportar Datos (JSON)
            </Button>
            <label
              htmlFor="import-json"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-100 hover:bg-blue-200 text-blue-700 shadow-sm h-10 px-4 py-2 cursor-pointer"
            >
              <Upload className="mr-2 h-4 w-4" /> Importar Datos (JSON)
              <input id="import-json" type="file" accept=".json" className="hidden" onChange={handleImportData} />
            </label>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta sección ofrecerá opciones para imprimir horarios individuales por docente y por curso, imprimir todos
            los horarios juntos, y exportar en formatos PDF y Excel con un diseño limpio y listo para su distribución.
            También se incluye la exportación e importación de datos en formato JSON.
          </p>
          <p className="mt-4 text-muted-foreground">La exportación e importación de datos JSON ya están disponibles.</p>
        </CardContent>
      </Card>
    </div>
  )
}
