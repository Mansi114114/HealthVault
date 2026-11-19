import React, { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useApp } from './context/AppContext';
import { Toast } from './components/UI';
import AppShell from './components/AppShell';
import Landing from './pages/Landing';
import AuthPage from './pages/Auth';
import Dashboard from './pages/Dashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import Documents, { UploadModal } from './pages/Documents';
import Prescriptions from './pages/Prescriptions';
import Appointments from './pages/Appointments';
import Sharing from './pages/Sharing';

const getPath = () => (window.location.hash || '#/').slice(1).split('?')[0];
function App() {
  const { user, loading, demoMode, actions } = useApp();
  const [path, setPath] = useState(getPath);
  const [uploadOpen, setUploadOpen] = useState(false);
  useEffect(() => {
    const changed = () => setPath(getPath());
    window.addEventListener('hashchange', changed);
    return () => window.removeEventListener('hashchange', changed);
  }, []);
  useEffect(() => {
    if (!user && path.startsWith('/app/')) sessionStorage.setItem('healthvault_post_auth_path', window.location.hash.slice(1));
  }, [path, user]);
  const navigate = (destination) => {
    window.location.hash = `#${destination}`;
    setPath(destination);
    window.scrollTo({ top:0, behavior:'instant' });
  };
  const startUpload = () => setUploadOpen(true);
  if (loading) return <div className="loading-screen"><LoaderCircle size={35} className="spin"/><p>Opening HealthVault…</p></div>;
  let content;
  if (path.startsWith('/auth/') && !user) content = <AuthPage kind={path.endsWith('signup')?'signup':'login'} navigate={navigate}/>;
  else if (path.startsWith('/app') && !user) content = <AuthPage kind="login" navigate={navigate}/>;
  else if (user) {
    const current = path.startsWith('/app/') ? path : '/app/dashboard';
    const pages = {
      '/app/dashboard': user.role === 'doctor' ? <DoctorDashboard navigate={navigate}/> : <Dashboard navigate={navigate} startUpload={startUpload}/> ,
      '/app/doctor/patients': <DoctorDashboard navigate={navigate} view="patients"/> ,
      '/app/doctor/expiring': <DoctorDashboard navigate={navigate} view="expiring"/> ,
      '/app/doctor/activity': <DoctorDashboard navigate={navigate} view="activity"/> ,
      '/app/documents': <Documents startUpload={startUpload}/> ,
      '/app/prescriptions': <Prescriptions/> ,
      '/app/appointments': <Appointments/> ,
      '/app/sharing': <Sharing/> ,
    };
    const doctorAllowed = ['/app/dashboard', '/app/sharing', '/app/doctor/patients', '/app/doctor/expiring', '/app/doctor/activity'];
    const safeCurrent = user.role === 'doctor' && !doctorAllowed.includes(current) ? '/app/dashboard' : current;
    content = <AppShell path={safeCurrent} navigate={navigate}>{pages[safeCurrent] || pages['/app/dashboard']}</AppShell>;
  } else content = <Landing navigate={navigate} onTryDemo={demoMode ? async()=>{await actions.signIn('patient@demo.healthvault','demo');navigate('/app/dashboard');}:null}/>;
  return <><Toast/>{content}{uploadOpen && <UploadModal onClose={()=>setUploadOpen(false)}/>}</>;
}
export default App;
