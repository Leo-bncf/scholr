import React, { useState } from 'react';
import PublicNavbar from '@/components/public/PublicNavbar';
import PublicFooter from '@/components/public/PublicFooter';
import * as demoRequests from '@/data/demoRequests';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CheckCircle, Calendar, Loader2 } from 'lucide-react';

export default function Demo() {
  const [form, setForm] = useState({
    school_name: '', contact_name: '', email: '', phone: '', country: '', school_size: '', message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await demoRequests.create(form);
      setSubmitted(true);
    } catch (err) {
      // The old code awaited the create with no catch, so a failed submission
      // silently showed the success screen and the lead was lost.
      console.error('Demo request failed', err);
      setError("We couldn't send your request. Please try again, or email us directly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      
      <section className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div className="pt-4">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                See Scholr in action
              </h1>
              <p className="mt-4 text-lg text-slate-500 leading-relaxed">
                Schedule a 30-minute personalized demo. We'll walk you through how Scholr can transform your IB school's workflows.
              </p>
              
              <div className="mt-10 space-y-6">
                {[
                  { icon: '🎯', title: 'Tailored to your school', desc: 'We customize the demo based on your school size, programme, and challenges.' },
                  { icon: '⏱️', title: '30 minutes, no commitment', desc: 'A focused walkthrough of the features most relevant to you.' },
                  { icon: '💬', title: 'Q&A with our team', desc: 'Ask anything about pricing, implementation, migration, or security.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <h3 className="font-semibold text-slate-900">{item.title}</h3>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-8">
              {submitted ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Thank you!</h2>
                  <p className="text-slate-500">We'll be in touch within 24 hours to schedule your demo.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-lg font-bold text-slate-900">Book Your Demo</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-700 text-sm">School Name *</Label>
                      <Input required value={form.school_name} onChange={e => setForm({...form, school_name: e.target.value})} className="mt-1.5" />
                    </div>
                    <div>
                      <Label className="text-slate-700 text-sm">Your Name *</Label>
                      <Input required value={form.contact_name} onChange={e => setForm({...form, contact_name: e.target.value})} className="mt-1.5" />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-slate-700 text-sm">Email *</Label>
                    <Input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="mt-1.5" />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-700 text-sm">Phone</Label>
                      <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="mt-1.5" />
                    </div>
                    <div>
                      <Label className="text-slate-700 text-sm">Country</Label>
                      <Input value={form.country} onChange={e => setForm({...form, country: e.target.value})} className="mt-1.5" />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-slate-700 text-sm">School Size</Label>
                    <Select value={form.school_size} onValueChange={v => setForm({...form, school_size: v})}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small_under_200">Under 200 students</SelectItem>
                        <SelectItem value="medium_200_500">200-500 students</SelectItem>
                        <SelectItem value="large_500_1000">500-1,000 students</SelectItem>
                        <SelectItem value="xlarge_over_1000">Over 1,000 students</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-slate-700 text-sm">Message</Label>
                    <Textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="Tell us about your school and what you're looking for..." className="mt-1.5" rows={3} />
                  </div>
                  
                  {error && (
                    <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {error}
                    </p>
                  )}

                  <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-xl h-11">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Request Demo
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}