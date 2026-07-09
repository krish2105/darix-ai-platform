'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SectionTitle } from './SectionTitle';
import { Button } from './Button';
import { Send, CheckCircle2 } from 'lucide-react';
import { fadeIn } from '@/utils/animations';

export const ContactSection = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    setTimeout(() => setIsSubmitted(true), 1000);
  };

  return (
    <section className="py-24 bg-background relative overflow-hidden" id="contact">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-electric-blue/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-ai-violet/10 rounded-full blur-[100px]"></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-6xl mx-auto glass-card p-8 md:p-16 border-t-4 border-t-electric-blue">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left side: Text */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6">
                Start Your AI <br />
                <span className="text-gradient">Readiness Journey</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Get a structured view of your AI readiness, business opportunities, and transformation priorities. Request a personalized review with our team.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-glass-panel border border-card-border flex items-center justify-center flex-shrink-0">
                    <span className="text-cyber-cyan font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="text-foreground font-semibold mb-1">Complete the Form</h4>
                    <p className="text-sm text-muted-foreground">Tell us about your organization and current stage.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-glass-panel border border-card-border flex items-center justify-center flex-shrink-0">
                    <span className="text-cyber-cyan font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="text-foreground font-semibold mb-1">Schedule a Call</h4>
                    <p className="text-sm text-muted-foreground">We'll arrange a 30-minute discovery session.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-glass-panel border border-card-border flex items-center justify-center flex-shrink-0">
                    <span className="text-cyber-cyan font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="text-foreground font-semibold mb-1">Receive Your Roadmap</h4>
                    <p className="text-sm text-muted-foreground">Get actionable recommendations to start your AI transformation.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right side: Form */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground/80">Full Name</label>
                      <input required type="text" className="w-full bg-glass-panel border border-card-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-colors" placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground/80">Work Email</label>
                      <input required type="email" className="w-full bg-glass-panel border border-card-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-colors" placeholder="john@company.com" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground/80">Company Name</label>
                      <input required type="text" className="w-full bg-glass-panel border border-card-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-colors" placeholder="Acme Corp" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground/80">Company Size</label>
                      <select required className="w-full bg-glass-panel border border-card-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-colors appearance-none">
                        <option value="" disabled selected>Select size</option>
                        <option value="1-50">1-50 employees</option>
                        <option value="51-200">51-200 employees</option>
                        <option value="201-500">201-500 employees</option>
                        <option value="500+">500+ employees</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Main AI Challenge</label>
                    <textarea required rows={4} className="w-full bg-glass-panel border border-card-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-colors resize-none" placeholder="What is the biggest barrier to AI adoption in your organization?"></textarea>
                  </div>

                  <Button type="submit" className="w-full" size="lg" icon={<Send className="w-4 h-4" />}>
                    Request AI Readiness Review
                  </Button>
                </form>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-glass-panel border border-card-border rounded-xl">
                  <div className="w-16 h-16 bg-emerald-success/20 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-8 h-8 text-emerald-success" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">Request Submitted</h3>
                  <p className="text-muted-foreground mb-8">
                    Thank you. A member of our team will review your request and contact you shortly to schedule your consultation.
                  </p>
                  <Button variant="outline" onClick={() => setIsSubmitted(false)}>
                    Submit Another Request
                  </Button>
                </div>
              )}
            </motion.div>
            
          </div>
        </div>
      </div>
    </section>
  );
};
