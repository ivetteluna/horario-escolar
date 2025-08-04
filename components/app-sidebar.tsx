"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Home, Users, BookOpen, GraduationCap, BarChart, Settings, Database, Zap } from "lucide-react"

// Define navigation items with icons
const navItems = [
  {
    title: "Inicio",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Docentes",
    href: "/",
    icon: Users,
  },
  {
    title: "Asignaturas",
    href: "/subjects",
    icon: BookOpen,
  },
  {
    title: "Cursos",
    href: "/courses",
    icon: GraduationCap,
  },
  {
    title: "Generar Horarios",
    href: "/schedule-generation", // NEW: Updated to point to the new page
    icon: Zap, // NEW: Changed icon to represent intelligent generation
  },
  {
    title: "Reportes",
    href: "/reports",
    icon: BarChart,
  },
  {
    title: "Datos",
    href: "/export-print",
    icon: Database,
  },
  {
    title: "Configuración",
    href: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" side="left" variant="sidebar" className="pt-16">
      <SidebarHeader className="p-4 text-center">
        <h2 className="text-xl font-bold text-purple-700">Horarios Docentes</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      {item.icon && <item.icon className="h-5 w-5" />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 text-center text-sm text-gray-500">Sistema de Gestión v1.0</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
