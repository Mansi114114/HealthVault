import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Button, FormField, FormMessage, Logo, useSubmit } from '../components/UI';
import { useApp } from '../context/AppContext';

export default function AuthPage({ kind, navigate }) {
  const { actions, demoMode } = useApp();
  const isSignup = kind === 'signup';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const submit = useSubmit();
  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await submit.run(() => isSignup ? actions.signUp(name,email,password) : actions.signIn(email,password));
    if (ok) navigate('/app/dashboard');
  };
  const forgotPassword = () => submit.run(async () => { if (!email) throw new Error('Enter your email address first.'); await actions.resetPassword(email); });
  return <div className="auth-layout">
    <div className="auth-left"><button className="auth-back" onClick={() => navigate('/')}><ArrowLeft size={17}/> Back to home</button><Logo/>
      <div className="auth-content"><h1>{isSignup ? 'Create your vault' : 'Welcome back'}</h1><p>{isSignup ? 'Make your health records easier to organize.' : 'Log in to your private health vault.'}</p>
        <form onSubmit={handleSubmit}>
          {isSignup && <FormField label="Full name"><input required type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Morgan" maxLength={80}/></FormField>}
          <FormField label="Email"><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"/></FormField>
          <FormField label="Password"><div className="password-wrap"><input required type={showPassword ? 'text' : 'password'} value={password} minLength={demoMode ? 1 : 6} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete={isSignup ? 'new-password' : 'current-password'}/><button type="button" aria-label={showPassword ? 'Hide password':'Show password'} onClick={() => setShowPassword((v)=>!v)}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></FormField>
          {!isSignup && <button className="forgot-link" type="button" onClick={forgotPassword}>Forgot password?</button>}
          <FormMessage message={submit.message}/><Button loading={submit.busy} className="auth-submit" type="submit">{isSignup ? 'Create account' : 'Log in'}</Button>
        </form>
        <p className="auth-switch">{isSignup ? 'Already have an account?' : 'New here?'} <button onClick={() => navigate(isSignup ? '/auth/login' : '/auth/signup')}>{isSignup ? 'Log in' : 'Create your vault'}</button></p>
        {demoMode && <div className="auth-demo"><p>Try the project without Firebase:</p><button onClick={() => { actions.signIn('patient@demo.healthvault', 'demo'); navigate('/app/dashboard'); }}>Open patient demo</button><button onClick={() => { actions.signIn('doctor@clinic.example', 'demo'); navigate('/app/sharing'); }}>Open doctor demo</button></div>}
      </div>
    </div>
    <div className="auth-right"><div className="auth-right-content"><span className="auth-shield"><LockKeyhole size={24}/></span><h2>Your records stay yours.</h2>
      <div className="auth-guarantees"><p><ShieldCheck size={19}/> Account passwords are handled by Firebase Authentication.</p><p><ShieldCheck size={19}/> Cloud files are protected with Firestore security rules.</p><p><ShieldCheck size={19}/> Sharing is time-limited and can be revoked.</p><p><ShieldCheck size={19}/> In-app views of shared documents are logged.</p></div>
    </div></div>
  </div>;
}
