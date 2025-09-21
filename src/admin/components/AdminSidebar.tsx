import { Link, useLocation } from 'react-router-dom'
import { LayoutGrid, Users, Heart, FileText, LogOut, Settings, Search, Flame, FolderCog, ChevronDown, ChevronRight } from 'lucide-react'
import { useState, type FC } from 'react'
import { useAdminAuth } from '../hooks/useAdminAuth'

const NavItem = ({ to, icon: Icon, label, onNavigate }: { to: string; icon: any; label: string; onNavigate?: () => void }) => {
  const location = useLocation()
  const active = location.pathname === to
  return (
    <Link
      to={to}
      className={`w-full flex items-center h-14 rounded-xl transition-all duration-200 ${
        active 
          ? 'bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 ring-2 ring-orange-200 shadow-md' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800 hover:shadow-sm'
      }`}
      onClick={onNavigate}
    >
      <div className={`h-full w-14 flex items-center justify-center ${active ? 'text-orange-600' : 'text-gray-400'}`}>
        <Icon className="h-6 w-6" />
      </div>
      <span className="px-4 text-sm font-semibold tracking-wide truncate">{label}</span>
    </Link>
  )
}

type AdminSidebarProps = {
  isOpen?: boolean
  onNavigate?: () => void
}

const AdminSidebar: FC<AdminSidebarProps> = ({ isOpen = false, onNavigate }) => {
  const { logout } = useAdminAuth()
  const location = useLocation()
  const contentInitiallyOpen = location.pathname.includes('/content')
  const [contentOpen, setContentOpen] = useState<boolean>(contentInitiallyOpen)

  return (
    <aside
      className={`flex flex-col bg-white border-gray-200 md:border-r shadow-lg
      fixed top-16 left-0 h-[calc(100vh-4rem)] w-80 z-30
      transform transition-transform duration-200 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
    >
      {/* Scrollable content area */}
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-100">
        </div>
        
        {/* Scrollable menu items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <NavItem to="/admin" icon={LayoutGrid} label="Dashboard" onNavigate={onNavigate} />
          <NavItem to="/admin/reports" icon={FileText} label="Report Management" onNavigate={onNavigate} />
          <NavItem to="/admin/adoptions" icon={Heart} label="Adoption Management" onNavigate={onNavigate} />
          <NavItem to="/admin/volunteers" icon={Users} label="Volunteers Management" onNavigate={onNavigate} />
          <NavItem to="/admin/donors" icon={Heart} label="Donations Management" onNavigate={onNavigate} />
          <NavItem to="/admin/heatmap" icon={Flame} label="Heatmap" onNavigate={onNavigate} />
          
          {/* Content folder */}
          <button
            onClick={() => setContentOpen(!contentOpen)}
            className={`w-full flex items-center h-14 rounded-xl transition-all duration-200 ${contentOpen ? 'bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 ring-2 ring-orange-200 shadow-md' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800 hover:shadow-sm'}`}
          >
            <div className={`h-full w-14 flex items-center justify-center ${contentOpen ? 'text-orange-600' : 'text-gray-400'}`}>
              <FolderCog className="h-6 w-6" />
            </div>
            <span className="px-4 text-sm font-semibold tracking-wide flex-1 text-left">Content</span>
            {contentOpen ? <ChevronDown className="h-5 w-5 mr-4" /> : <ChevronRight className="h-5 w-5 mr-4" />}
          </button>
          {contentOpen && (
            <div className="ml-6 space-y-2 mt-2">
              <NavItem to="/admin/content" icon={Search} label="Lost & Found Management" onNavigate={onNavigate} />
              <NavItem to="/admin/content/animals" icon={Users} label="Our Animals Management" onNavigate={onNavigate} />
            </div>
          )}
        </div>
        
        {/* Fixed footer */}
        <div className="flex-shrink-0 p-6 pt-4 space-y-3 border-t border-gray-100 bg-gray-50/50">
          <NavItem to="/admin/settings" icon={Settings} label="Admin Settings" onNavigate={onNavigate} />
          <button onClick={logout} className="w-full flex items-center h-12 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-200 hover:shadow-sm border border-red-200">
            <div className="h-full w-12 flex items-center justify-center text-red-600">
              <LogOut className="h-5 w-5" />
            </div>
            <span className="px-3 text-sm font-medium tracking-wide">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  )
}

export default AdminSidebar


