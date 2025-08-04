import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { MainNav } from "@/components/main-nav"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "School Scheduler",
  description: "Automatic and personalized school timetable generation for teachers.",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <MainNav /> {/* Top navigation bar */}
        <SidebarProvider>
          <AppSidebar /> {/* The actual sidebar component */}
          <SidebarInset className="bg-gradient-to-br from-blue-50 to-purple-50 pt-16">
            {" "}
            {/* Added pt-16 */}
            {/* The main content area with a gradient background */}
            {children}
          </SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  )
}
