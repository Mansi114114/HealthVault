import React, { useState } from 'react';
import { CalendarDays, ChevronDown, FileText, LayoutDashboard, LogOut, Menu, RotateCcw, Share2, ShieldCheck, Stethoscope, UserRound, X } from 'lucide-react';
import { Logo } from './UI';
import { useApp } from '../context/AppContext';

const navItems = [
  { path: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/app/documents', label: 'Documents', icon: FileText },
  { path: '/app/prescriptions', label: 'Prescriptions', icon: Stethoscope },
  { path: '/app/appointments', label: 'Appointments', icon: CalendarDays },
  { path: '/app/sharing', label: 'Sharing', icon: Share2 },
];
export default function AppShell({ path, navigate, children }) {
  const { user, demoMode, actions } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenu, setProfileMenu] = useState(false);
  const change = (page) => { navigate(page); setMobileOpen(false); setProfileMenu(false); };
  return <div className="app-shell">
    <button className="mobile-menu-button icon-btn" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu/></button>
    {mobileOpen && <div className="mobile-shade" onClick={() => setMobileOpen(false)}/>}
    <aside className={`app-sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-top"><button className="sidebar-brand" onClick={() => change('/app/dashboard')}><Logo/></button><button className="mobile-close icon-btn" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X size={20}/></button></div>
      <nav className="sidebar-nav" aria-label="Dashboard navigation">{navItems.map(({path:itemPath,label,icon:Icon}) =>
        <button key={itemPath} onClick={() => change(itemPath)} className={`sidebar-nav-item ${path === itemPath ? 'active' : ''}`}><Icon size={19}/><span>{label}</span></button>
      )}</nav>
      <div className="sidebar-bottom"><div className="sidebar-private"><ShieldCheck size={20}/><strong>Protected & private</strong><p>Only you decide who can access your records.</p></div>
        <button className="sidebar-logout" onClick={async () => { await actions.signOut(); change('/'); }}><LogOut size={18}/> Log out</button>
      </div>
    </aside>
    <div className="app-page"><header className="app-header"><div className="header-breadcrumb">My health workspace <span> / </span><strong>{navItems.find((item)=>item.path===path)?.label || 'Dashboard'}</strong></div>
      <div className="header-user-wrap"><button className="header-user" onClick={() => setProfileMenu((v)=>!v)}><span className="user-avatar"><UserRound size={17}/></span><span className="user-name">{user?.displayName || user?.email?.split('@')[0] || 'Account'}</span><ChevronDown size={15}/></button>
        {profileMenu && <div className="profile-menu"><strong>{user?.displayName || 'HealthVault user'}</strong><small>{user?.email}</small>
          {demoMode && <><div className="profile-menu-divider"/><button onClick={() => { actions.switchDemoRole(user?.role === 'doctor' ? 'patient' : 'doctor'); setProfileMenu(false); change('/app/sharing'); }}>Switch to {user?.role === 'doctor' ? 'patient' : 'doctor'} demo</button><button onClick={() => { actions.resetDemo(); setProfileMenu(false); }}><RotateCcw size={15}/> Reset sample data</button></>}
          <button onClick={async () => { await actions.signOut(); change('/'); }}><LogOut size={15}/> Log out</button>
        </div>}
      </div></header>
      <main className="page-content">{children}</main>
      <footer className="app-footer"> HealthVault · Your health, organized and in your control.<span>For education and demonstration only</span></footer>
    </div>
  </div>;
}
