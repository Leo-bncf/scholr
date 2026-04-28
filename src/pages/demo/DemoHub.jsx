import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import DemoRoleSwitcher from '@/components/demo-sandbox/DemoRoleSwitcher';
import { SCHOOL } from '@/components/demo-sandbox/mockSchoolData';
import { DEMO_ROLES, DEMO_ROLE_ORDER } from '@/components/demo-sandbox/demoRolesConfig';

export default function DemoHub() {
  const navigate = useNavigate();
  const [selectedKey, setSelectedKey] = useState(null);

  const handleSelect = (key) => {
    if (selectedKey) return;
    setSelectedKey(key);
    // Keep this short so the demo feels immediate
    setTimeout(() => navigate(DEMO_ROLES[key].path), 220);
  };

  const selected = selectedKey ? DEMO_ROLES[selectedKey] : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Live sandbox · No sign-up required
          </div>
          <h1 className="mt-6 text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
            Choose your role
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Explore <span className="font-semibold text-slate-800">{SCHOOL.name}</span> from the perspective of every user type. Nothing you do is saved.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
          {DEMO_ROLE_ORDER.map((key) => {
            const role = DEMO_ROLES[key];
            const Icon = role.icon;
            const isSelected = selectedKey === key;
            const isOther = selectedKey && selectedKey !== key;

            return (
              <motion.button
                key={key}
                onClick={() => handleSelect(key)}
                disabled={!!selectedKey}
                animate={{
                  opacity: isOther ? 0.25 : 1,
                  scale: isSelected ? 1.03 : 1,
                  y: isSelected ? -4 : 0,
                }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                whileHover={!selectedKey ? { y: -2, transition: { duration: 0.12 } } : {}}
                className={`group relative text-left rounded-2xl bg-white border p-7 shadow-sm overflow-hidden transition-shadow disabled:cursor-default ${
                  isSelected ? 'border-slate-900 shadow-2xl' : 'border-slate-200 hover:shadow-xl'
                }`}
              >
                <div className={`absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${role.gradient} opacity-10 transition-opacity ${isSelected ? 'opacity-30' : 'group-hover:opacity-20'}`} />
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${role.gradient} text-white shadow-lg`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="mt-5 flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900">{role.name}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{role.tagline}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{role.desc}</p>

                <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                  {isSelected ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
Opening demo…
                    </>
                  ) : (
                    <>
                      Enter demo
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-900 underline underline-offset-4">
            ← Back to marketing site
          </Link>
        </div>
      </div>

      {/* Full-screen transition flourish when a role is selected */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
            className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.2, opacity: 0.22 }}
              animate={{ scale: 8, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`h-24 w-24 rounded-full bg-gradient-to-br ${selected.gradient}`}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <DemoRoleSwitcher />
    </div>
  );
}