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
      className={`w-full flex items-center h-12 rounded-lg transition-all duration-200 ${
        active 
          ? 'bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 ring-2 ring-orange-200 shadow-md' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800 hover:shadow-sm'
      }`}
      onClick={onNavigate}
    >
      <div className={`h-full w-12 flex items-center justify-center ${active ? 'text-orange-600' : 'text-gray-400'}`}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="px-3 text-sm font-medium tracking-wide">{label}</span>
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
      fixed top-16 left-0 h-[calc(100vh-4rem)] w-72 z-30
      transform transition-transform duration-200 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
    >
      {/* Scrollable content area */}
      <div className="flex flex-col h-full overflow-hidden">
        {/* Scrollable menu items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          <NavItem to="/" icon={LayoutGrid} label="Dashboard" onNavigate={onNavigate} />
          <NavItem to="/reports" icon={FileText} label="Report Management" onNavigate={onNavigate} />
          <NavItem to="/adoptions" icon={Heart} label="Adoption Management" onNavigate={onNavigate} />
          <NavItem to="/volunteers" icon={Users} label="Volunteers Management" onNavigate={onNavigate} />
          <NavItem to="/donors" icon={Heart} label="Donations Management" onNavigate={onNavigate} />
          <NavItem to="/heatmap" icon={Flame} label="Heatmap" onNavigate={onNavigate} />
          
          {/* Content folder */}
          <button
            onClick={() => setContentOpen(!contentOpen)}
            className={`w-full flex items-center h-12 rounded-lg transition-all duration-200 ${contentOpen ? 'bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 ring-2 ring-orange-200 shadow-md' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800 hover:shadow-sm'}`}
          >
            <div className={`h-full w-12 flex items-center justify-center ${contentOpen ? 'text-orange-600' : 'text-gray-400'}`}>
              <FolderCog className="h-5 w-5" />
            </div>
            <span className="px-3 text-sm font-medium tracking-wide flex-1 text-left">Content</span>
            {contentOpen ? <ChevronDown className="h-4 w-4 mr-3" /> : <ChevronRight className="h-4 w-4 mr-3" />}
          </button>
          {contentOpen && (
            <div className="ml-4 space-y-1 mt-1">
              <NavItem to="/content" icon={Search} label="Lost & Found Management" onNavigate={onNavigate} />
              <NavItem to="/content/animals" icon={Users} label="Our Animals Management" onNavigate={onNavigate} />
            </div>
          )}
        </div>
        
        {/* Fixed footer */}
        <div className="flex-shrink-0 p-4 pt-3 space-y-2 border-t border-gray-100 bg-gray-50/50">
          <NavItem to="/settings" icon={Settings} label="Admin Settings" onNavigate={onNavigate} />
          <button onClick={logout} className="w-full flex items-center h-11 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-200 hover:shadow-sm border border-red-200">
            <div className="h-full w-11 flex items-center justify-center text-red-600">
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


