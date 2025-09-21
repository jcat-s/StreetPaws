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
      className={`w-full flex items-center h-11 rounded-md transition-colors ${
        active ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-300' : 'text-gray-800 hover:bg-gray-100'
      }`}
      onClick={onNavigate}
    >
      <div className={`h-full w-11 flex items-center justify-center ${active ? 'text-orange-700' : 'text-gray-600'}`}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="px-3 text-sm font-semibold tracking-wide">{label}</span>
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
  const formsInitiallyOpen = location.pathname.includes('/adoptions') || location.pathname.includes('/volunteers') || location.pathname.includes('/donors')
  const contentInitiallyOpen = location.pathname.includes('/content')
  const [formsOpen, setFormsOpen] = useState<boolean>(formsInitiallyOpen)
  const [contentOpen, setContentOpen] = useState<boolean>(contentInitiallyOpen)

  return (
    <aside
      className={`flex flex-col bg-gray-100 p-4 space-y-2 border-gray-200 md:border-r
      fixed md:static top-16 left-0 h-[calc(100vh-4rem)] md:h-auto w-64 md:w-64 z-30
      overflow-y-auto overscroll-contain pb-4
      transform transition-transform duration-200 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
    >
      <div className="text-xs uppercase text-gray-600 px-2">Menu</div>
      <NavItem to="/admin" icon={LayoutGrid} label="Dashboard" onNavigate={onNavigate} />
      <NavItem to="/admin/reports" icon={FileText} label="Report Management" onNavigate={onNavigate} />
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
          <NavItem to="/admin/adoptions" icon={Heart} label="Adoption Management" onNavigate={onNavigate} />
          <NavItem to="/admin/volunteers" icon={Users} label="Volunteers Management" onNavigate={onNavigate} />
          <NavItem to="/admin/donors" icon={Heart} label="Donations Management" onNavigate={onNavigate} />
        </div>
      )}
      <NavItem to="/admin/heatmap" icon={Flame} label="Heatmap" onNavigate={onNavigate} />
      {/* Content folder */}
      <button
        onClick={() => setContentOpen(!contentOpen)}
        className={`w-full flex items-center h-11 rounded-md transition-colors ${contentOpen ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-300' : 'text-gray-800 hover:bg-gray-100'}`}
      >
        <div className={`h-full w-11 flex items-center justify-center ${contentOpen ? 'text-orange-700' : 'text-gray-600'}`}>
          <FolderCog className="h-5 w-5" />
        </div>
        <span className="px-3 text-sm font-semibold tracking-wide flex-1 text-left">Content</span>
        {contentOpen ? <ChevronDown className="h-4 w-4 mr-3" /> : <ChevronRight className="h-4 w-4 mr-3" />}
      </button>
      {contentOpen && (
        <div className="ml-4 space-y-2">
          <NavItem to="/admin/content" icon={Search} label="Lost & Found Management" onNavigate={onNavigate} />
          <NavItem to="/admin/content/animals" icon={Users} label="Our Animals Management" onNavigate={onNavigate} />
        </div>
      )}
      <div className="mt-auto pt-2 space-y-2">
        <NavItem to="/admin/settings" icon={Settings} label="Admin" onNavigate={onNavigate} />
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


