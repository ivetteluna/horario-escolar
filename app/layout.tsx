// NUEVO HORARIO/app/layout.tsx

import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import "./print.css"
import { MainNav } from "@/components/main-nav"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "School Scheduler",
  description: "Automatic and personalized school timetable generation for teachers.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {/* Añadimos la clase no-print a los elementos que no queremos imprimir */}
        <div className="no-print">
          <MainNav />
        </div>
        <SidebarProvider>
          <div className="no-print">
            <AppSidebar />
          </div>
          <SidebarInset className="bg-gradient-to-br from-blue-50 to-purple-50 pt-16">
            {children}
          </SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  )
}