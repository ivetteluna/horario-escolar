import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"
import type React from "react"

interface DashboardCardProps {
  title: string
  description: string
  href: string
  icon: React.ElementType
}

export function DashboardCard({ title, description, href, icon: Icon }: DashboardCardProps) {
  return (
    <Link href={href} className="block h-full">
      <Card className="h-full flex flex-col justify-between p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-emerald-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold text-gray-800">{title}</CardTitle>
          <Icon className="h-8 w-8 text-emerald-600" />
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-sm text-gray-600">{description}</p>
        </CardContent>
        <div className="flex items-center text-emerald-600 hover:text-emerald-700 font-medium mt-4">
          Ir a la sección <ArrowRight className="ml-2 h-4 w-4" />
        </div>
      </Card>
    </Link>
  )
}
