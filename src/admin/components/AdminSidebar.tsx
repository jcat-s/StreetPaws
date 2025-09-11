import { Link, useLocation } from 'react-router-dom'
import { LayoutGrid, Users, Heart, FileText, LogOut, Settings, Search, CheckCircle, Flame, FolderCog, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useAdminAuth } from '../hooks/useAdminAuth'

const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
  const location = useLocation()
  const active = location.pathname === to
  return (
    <Link
      to={to}
      className={`w-full flex items-center h-11 rounded-md transition-colors ${
        active ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-300' : 'text-gray-800 hover:bg-gray-100'
      }`}
    >
      <div className={`h-full w-11 flex items-center justify-center ${active ? 'text-orange-700' : 'text-gray-600'}`}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="px-3 text-sm font-semibold tracking-wide">{label}</span>
    </Link>
  )
}

const AdminSidebar = () => {
  const { logout } = useAdminAuth()
  const location = useLocation()
  const reportsInitiallyOpen = location.pathname.includes('/lost') || location.pathname.includes('/found') || location.pathname.includes('/abuse')
  const formsInitiallyOpen = location.pathname.includes('/adoptions') || location.pathname.includes('/volunteers') || location.pathname.includes('/donors')
  const [reportsOpen, setReportsOpen] = useState<boolean>(reportsInitiallyOpen)
  const [formsOpen, setFormsOpen] = useState<boolean>(formsInitiallyOpen)

  return (
    <aside className="flex flex-col w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-100 p-4 space-y-2 sticky md:static top-16 z-10">
      <div className="text-xs uppercase text-gray-600 px-2">Menu</div>
      <NavItem to="/admin" icon={LayoutGrid} label="Dashboard" />
      {/* Report folder */}
      <button
        onClick={() => setReportsOpen(!reportsOpen)}
        className={`w-full flex items-center h-11 rounded-md transition-colors ${reportsOpen ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-300' : 'text-gray-800 hover:bg-gray-100'}`}
      >
        <div className={`h-full w-11 flex items-center justify-center ${reportsOpen ? 'text-orange-700' : 'text-gray-600'}`}>
          <FileText className="h-5 w-5" />
        </div>
        <span className="px-3 text-sm font-semibold tracking-wide flex-1 text-left">Report</span>
        {reportsOpen ? <ChevronDown className="h-4 w-4 mr-3" /> : <ChevronRight className="h-4 w-4 mr-3" />}
      </button>
      {reportsOpen && (
        <div className="ml-4 space-y-2">
          <NavItem to="/admin/lost" icon={Search} label="Lost" />
          <NavItem to="/admin/found" icon={CheckCircle} label="Found" />
          <NavItem to="/admin/abuse" icon={Flame} label="Abuse" />
        </div>
      )}
      {/* Forms folder */}
      <button
        onClick={() => setFormsOpen(!formsOpen)}
        className={`w-full flex items-center h-11 rounded-md transition-colors ${formsOpen ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-300' : 'text-gray-800 hover:bg-gray-100'}`}
      >
        <div className={`h-full w-11 flex items-center justify-center ${formsOpen ? 'text-orange-700' : 'text-gray-600'}`}>
          <FolderCog className="h-5 w-5" />
        </div>
        <span className="px-3 text-sm font-semibold tracking-wide flex-1 text-left">Forms</span>
        {formsOpen ? <ChevronDown className="h-4 w-4 mr-3" /> : <ChevronRight className="h-4 w-4 mr-3" />}
      </button>
      {formsOpen && (
        <div className="ml-4 space-y-2">
          <NavItem to="/admin/adoptions" icon={Heart} label="Adopt" />
          <NavItem to="/admin/volunteers" icon={Users} label="Volunteers" />
          <NavItem to="/admin/donors" icon={Heart} label="Donors" />
        </div>
      )}
      <NavItem to="/admin/heatmap" icon={Flame} label="Heatmap" />
      {/* Content Management */}
      <button
        onClick={() => {/* non-collapsible header for clarity */}}
        className={`w-full flex items-center h-11 rounded-md transition-colors text-gray-800`}
      >
        <div className={`h-full w-11 flex items-center justify-center text-gray-600`}>
          <FolderCog className="h-5 w-5" />
        </div>
        <span className="px-3 text-sm font-semibold tracking-wide flex-1 text-left">Content…</span>
      </button>
      <div className="ml-4 space-y-2">
        <NavItem to="/admin/content/animals" icon={Users} label="Our Animals" />
        <NavItem to="/admin/content/lost" icon={Search} label="Lost" />
        <NavItem to="/admin/content/found" icon={CheckCircle} label="Found" />
      </div>
      <div className="mt-auto pt-2 space-y-2">
        <NavItem to="/admin/settings" icon={Settings} label="Admin" />
        <button onClick={logout} className="w-full flex items-center h-11 rounded-md bg-white/70 text-red-600 hover:bg-red-50">
          <div className="h-full w-11 flex items-center justify-center text-gray-600">
            <LogOut className="h-5 w-5" />
          </div>
          <span className="px-3 text-sm font-semibold tracking-wide">LogOut</span>
        </button>
        
      </div>
    </aside>
  )
}

export default AdminSidebar


