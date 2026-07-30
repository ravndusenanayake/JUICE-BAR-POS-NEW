"use client"

import { Users } from "lucide-react"

export default function StaffPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Users className="text-orange-500 w-8 h-8" /> Staff Management
          </h2>
          <p className="text-gray-500 font-medium mt-1">Manage staff attendance and non-login employees.</p>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-700">Coming Soon</h3>
        <p className="text-gray-500 mt-2">The dedicated Staff Management module is currently under development.</p>
        <p className="text-sm text-gray-400 mt-1">For now, use the Users module to manage staff accounts.</p>
      </div>
    </div>
  )
}
