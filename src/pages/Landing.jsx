import React, { useState, useEffect } from 'react';
import DetachedNavbar from '@/components/public/DetachedNavbar';
import { ExpandableCard } from '@/components/ui/expandable-card';
import PublicFooter from '@/components/public/PublicFooter';
import AnimatedBackground from '@/components/public/AnimatedBackground';
import ConsentModal from '@/components/public/ConsentModal';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, BookOpen, Users, BarChart3, Shield, 
  MessageSquare, Calendar, ClipboardCheck, Star,
  ChevronRight, Sparkles, GraduationCap, UserCheck,
  UserCircle, Compass, Settings2, CheckCircle2,
  LayoutDashboard, LibraryBig, FilePenLine, UsersRound, 
  CalendarClock, MessageCircleMore, ShieldCheck, Trophy,
  PieChart, ListChecks, Award, HeartHandshake, CalendarDays,
  MessageSquareShare, Globe2
} from 'lucide-react';

export default function Landing() {
  return <div>Landing Page Import Test</div>;
}