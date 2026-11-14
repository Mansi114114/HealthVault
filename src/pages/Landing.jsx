import React from 'react';
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, Eye, FileText, HeartPulse, LockKeyhole, Search, ShieldCheck, Stethoscope, UploadCloud } from 'lucide-react';
import { Button, Logo } from '../components/UI';

const benefits = [
  { icon: LockKeyhole, heading: 'Protected cloud storage', copy: 'Access protected by Firebase rules.' },
  { icon: ShieldCheck, heading: 'You control access', copy: 'Nothing is shared until you choose.' },
  { icon: Clock3, heading: 'Expiring access', copy: 'Shares end automatically when they expire.' },
  { icon: Eye, heading: 'In-app access log', copy: 'Review document opens inside HealthVault.' }
];
const features = [
  { icon: FileText, heading: 'Medical reports', copy: 'Upload PDFs and scans, then organize by Blood Test, X-Ray, MRI and more.' },
  { icon: Stethoscope, heading: 'Prescriptions', copy: 'Keep medicine, dosage, doctor and date, with a document linked.' },
  { icon: CalendarDays, heading: 'Appointment history', copy: 'Track upcoming visits and notes from previous appointments.' },
  { icon: ShieldCheck, heading: 'Permission-based sharing', copy: 'Share a single document with a verified recipient, not your whole vault.', featured: true },
  { icon: Search, heading: 'Search and filters', copy: 'Find the record you need in seconds by name, category or doctor.' },
  { icon: Eye, heading: 'Access log', copy: 'See document views made through HealthVault by recipients.' }
];
export default function Landing({ navigate, onTryDemo }) {
  return <div className="landing">
    <div className="landing-hero" id="top">
      <header className="landing-header content-container"><Logo inverse/><nav aria-label="Main navigation">
        <a href="#features">Features</a><a href="#how-it-works">How it works</a><a href="#privacy">Privacy</a>
        <Button variant="outline-light" onClick={() => navigate('/auth/login')}>Log in</Button>
      </nav></header>
      <section className="hero-inner content-container">
        <div className="hero-text"><span className="overline overline-dark"><ShieldCheck size={13}/> Private by design</span>
          <h1>Your health records, safe and always with you.</h1>
          <p>Store reports and prescriptions, keep every appointment in one timeline, and share with a doctor only when you choose, and only for as long as you choose.</p>
          <div className="hero-actions"><Button onClick={() => navigate('/auth/signup')}>Create your vault <ArrowRight size={16}/></Button><Button variant="outline-light" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>See how it works</Button></div>
          <span className="micro-line"><LockKeyhole size={14}/> Protected storage · Revoke future access any time</span>
        </div>
        <div className="hero-visual"><div className="floating-label"><Eye size={13}/> Viewed today, 9:12 AM</div>
          <div className="preview-card"><div className="preview-top"><strong>My vault</strong><span className="preview-tag">All records</span></div>
            {[['Blood Test – CBC','Blood Test',FileText],['Chest X-Ray','X-Ray',FileText],['Amlodipine 5 mg','Prescription',Stethoscope],['Cardiology follow-up','18 Nov',CalendarDays]].map(([title,tag,Icon]) =>
              <div className="preview-row" key={title}><span className="preview-icon"><Icon size={16}/></span><span>{title}</span><span className="preview-tag">{tag}</span></div>
            )}
          </div><div className="share-float"><strong>Shared with Dr. A. Sharma</strong><small>Chest X-Ray · expires in 7 days</small><span>Revoke access</span></div>
        </div>
      </section>
    </div>
    <div className="trust-strip" id="privacy"><div className="content-container trust-grid">{benefits.map(({icon:Icon,heading,copy}) =>
      <div className="trust-item" key={heading}><span className="trust-icon"><Icon size={17}/></span><div><strong>{heading}</strong><p>{copy}</p></div></div>
    )}</div></div>
    <section className="feature-section content-container" id="features"><span className="eyebrow">Features</span><h2>Everything your health paperwork needs</h2><p>Built around the things people actually keep track of.</p>
      <div className="feature-grid">{features.map(({icon:Icon,heading,copy,featured}) =>
        <div className={`feature-card ${featured ? 'feature-special' : ''}`} key={heading}><div className="feature-icon"><Icon size={21}/></div><h3>{heading}</h3><p>{copy}</p></div>
      )}</div>
    </section>
    <section className="steps-section" id="how-it-works"><div className="content-container"><span className="eyebrow">How it works</span><h2>Set up in three steps</h2>
      <div className="steps-grid">{[['01','Create your vault','Sign up with secure authentication.'],['02','Add your records','Upload reports and save prescriptions.'],['03','Share on your terms','Pick one document, a recipient and an expiry.']].map(([num,title,copy]) =>
        <div className="step-card" key={num}><span>{num}</span><h3>{title}</h3><p>{copy}</p></div>
      )}</div></div></section>
    <section className="landing-cta"><h2>Start organizing your health records today.</h2><p>Your documents stay private until you decide otherwise.</p>
      <Button onClick={() => navigate('/auth/signup')}>Create your vault <ArrowRight size={16}/></Button>
      {onTryDemo && <button className="text-light-link" onClick={onTryDemo}>Or explore with sample data</button>}
    </section>
    <footer className="landing-footer"><div className="content-container"><Logo inverse/><p>HealthVault organizes your records and does not provide medical advice. In an emergency, contact local emergency services.</p><p>© 2026 HealthVault · Privacy by design</p></div></footer>
  </div>;
}
