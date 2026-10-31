import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, User, Wrench, Building2, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import ThemeToggle from '../../components/layout/ThemeToggle';
import LanguageSelector from '../../components/layout/LanguageSelector';

export const PortalSelection = () => {
  const navigate = useNavigate();

  const portals = [
    {
      id: 'citizen',
      title: 'Citizen Portal',
      subtitle: 'Public Grievance Redressal',
      description: 'Report civic issues, track real-time resolution progress, endorse neighborhood complaints, and verify work completion.',
      icon: User,
      color: 'blue',
      badge: 'Public & Open Access',
      actionUrl: '/login?portal=citizen',
      allowRegister: true
    },
    {
      id: 'worker',
      title: 'Field Worker Operations',
      subtitle: 'Municipal Crew & Contractors',
      description: 'View assigned maintenance work orders, perform on-site photo inspections, log progress, and upload completion proofs.',
      icon: Wrench,
      color: 'amber',
      badge: 'Field Staff',
      actionUrl: '/login?portal=worker',
      allowRegister: true
    },
    {
      id: 'officer',
      title: 'Department Officer Desk',
      subtitle: 'Municipal Wings & Engineers',
      description: 'Review incoming grievances, assign specialist contractors, request inter-department transfers, and audit resolutions.',
      icon: Building2,
      color: 'purple',
      badge: 'Authorized Personnel Only',
      actionUrl: '/login?portal=officer',
      allowRegister: false
    },
    {
      id: 'admin',
      title: 'Supervisor Administration',
      subtitle: 'Central Civic Governance',
      description: 'Manage inter-department transfer requests, oversee ward escalations, monitor SLA compliance, and configure department officers.',
      icon: Shield,
      color: 'rose',
      badge: 'Executive Oversight',
      actionUrl: '/login?portal=admin',
      allowRegister: false
    }
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Header */}
      <header className="border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-slate-100">
                  NagrikSeva
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  Gov-Tech Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Digital Citizen Grievance & Municipal Resolution Platform
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <LanguageSelector />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-12 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mb-3">
            Select Your Municipal Service Gate
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            NagrikSeva operates dedicated gateways tailored for citizens, on-ground field specialists, department officers, and executive supervisors.
          </p>
        </div>

        {/* Portals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <div
                key={portal.id}
                onClick={() => navigate(portal.actionUrl)}
                className="gov-card p-6 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer border border-slate-200 dark:border-slate-800 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-600 group-hover:text-white transition-colors text-slate-700 dark:text-slate-300 shadow-sm">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {portal.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {portal.title}
                  </h3>
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">
                    {portal.subtitle}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {portal.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center gap-1 transition-colors">
                    Enter Portal <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  {portal.allowRegister && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Self-Sign Up
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Security & Access Notice */}
        <div className="mt-12 p-4 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 max-w-3xl mx-auto flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p>
            <strong>Role Boundary Policy:</strong> Department Officers and Administrative Supervisors must use credentials authorized by the Central Administration. Citizens and Field Crew can self-register their accounts directly from the respective portal gate.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800">
        Digital Citizen Services &mdash; Ministry of Municipal Administration &bull; Enterprise Architecture
      </footer>
    </div>
  );
};

export default PortalSelection;

