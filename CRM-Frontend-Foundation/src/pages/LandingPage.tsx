import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  BarChart3,
  Users,
  Zap,
  Globe,
  Shield,
  Bell,
  Menu,
  X,
  Star,
  TrendingUp,
  Target,
  Layers,
  Play,
} from 'lucide-react';
import { BrandLogo } from '@/components/branding/BrandLogo';

const NAV_LINKS = ['Features', 'Pricing', 'Testimonials', 'FAQ'];

const STATS = [
  { value: '500+', label: 'Companies Trust Us' },
  { value: '98%', label: 'Customer Satisfaction' },
  { value: '50M+', label: 'Deals Managed' },
  { value: '24/7', label: 'Customer Support' },
];

const FEATURES = [
  {
    icon: <BarChart3 size={28} className="text-indigo-500" />,
    title: 'Smart Dashboard',
    desc: 'Get a bird\'s-eye view of your pipeline, revenue, and team performance with real-time insights that help you make faster decisions.',
    color: 'bg-indigo-50',
  },
  {
    icon: <Users size={28} className="text-violet-500" />,
    title: 'Team Collaboration',
    desc: 'Assign leads, track updates, and coordinate across Marketing, Sales, and Partner teams — all from one unified workspace.',
    color: 'bg-violet-50',
  },
  {
    icon: <Target size={28} className="text-pink-500" />,
    title: 'Lead Intelligence',
    desc: 'Capture, qualify, and convert leads with smart scoring, automated follow-ups, and a full history of every interaction.',
    color: 'bg-pink-50',
  },
  {
    icon: <TrendingUp size={28} className="text-emerald-500" />,
    title: 'Revenue Analytics',
    desc: 'Track every order, subscription, and product variant. Spot trends and forecast revenue with interactive charts.',
    color: 'bg-emerald-50',
  },
  {
    icon: <Bell size={28} className="text-amber-500" />,
    title: 'Smart Notifications',
    desc: 'Never miss a follow-up. NexCRM delivers intelligent alerts for deal changes, overdue tasks, and team activity.',
    color: 'bg-amber-50',
  },
  {
    icon: <Shield size={28} className="text-blue-500" />,
    title: 'Role-Based Access',
    desc: 'Control what your team sees and does. Granular permissions for Admins, Marketing, and Partners — secure by design.',
    color: 'bg-blue-50',
  },
];

const PRICING = [
  {
    name: 'Starter',
    price: '$29',
    period: '/month',
    description: 'Perfect for small teams just getting started.',
    color: 'border-gray-200',
    btn: 'bg-gray-900 text-white hover:bg-gray-700',
    features: ['Up to 5 users', '500 contacts', 'Basic lead tracking', 'Email support', 'Dashboard analytics'],
    highlight: false,
  },
  {
    name: 'Professional',
    price: '$89',
    period: '/month',
    description: 'For growing teams that need more power.',
    color: 'border-indigo-500 ring-2 ring-indigo-500',
    btn: 'bg-indigo-600 text-white hover:bg-indigo-700',
    features: ['Up to 25 users', '10,000 contacts', 'Advanced analytics', 'Role-based access', 'Priority support', 'Custom pipeline stages'],
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: '$199',
    period: '/month',
    description: 'For large businesses with full control needs.',
    color: 'border-gray-200',
    btn: 'bg-gray-900 text-white hover:bg-gray-700',
    features: ['Unlimited users', 'Unlimited contacts', 'Custom integrations', 'Dedicated manager', 'SLA guarantee', 'On-premise option'],
    highlight: false,
  },
];

const TESTIMONIALS = [
  {
    quote: 'NexCRM transformed how our team handles leads. We closed 40% more deals in the first quarter after switching.',
    name: 'Sarah Chen',
    role: 'VP of Sales, TechNova',
    avatar: 'SC',
    color: 'bg-indigo-500',
  },
  {
    quote: 'The role-based access was a game changer. Our Marketing and Partner teams now work in perfect sync without stepping on each other.',
    name: 'Marcus Williams',
    role: 'COO, GrowthLabs',
    avatar: 'MW',
    color: 'bg-violet-500',
  },
  {
    quote: 'Setup took less than a day. The dashboard is clean, fast, and shows exactly what our leadership team needs to see.',
    name: 'Priya Kapoor',
    role: 'Director of Operations, ScaleUp',
    avatar: 'PK',
    color: 'bg-pink-500',
  },
];

const FAQS = [
  {
    q: 'How quickly can I get started with NexCRM?',
    a: 'Most teams are fully onboarded within a day. Our guided setup and dedicated support team ensures a smooth transition from any existing tool.',
  },
  {
    q: 'Can I control what each team member can see?',
    a: 'Yes. NexCRM has granular role-based access control. You can set distinct permissions for ManagementAdmin, Marketing, and Partner roles.',
  },
  {
    q: 'Is my data secure?',
    a: 'Absolutely. All data is encrypted in transit and at rest. We follow industry-standard security practices including JWT authentication and audit logging.',
  },
  {
    q: 'Can I migrate data from my current CRM?',
    a: 'Yes, we provide data import tools and migration support for all major CRM platforms including Salesforce, HubSpot, and Zoho.',
  },
  {
    q: 'What happens if I need to upgrade or downgrade my plan?',
    a: 'You can change your plan at any time. Upgrades take effect immediately and downgrades apply at the next billing cycle.',
  },
];

const INTEGRATIONS = ['Slack', 'Dropbox', 'Zoom', 'Stripe', 'Mailchimp', 'Google'];

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <BrandLogo />

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase()}`}
                className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition"
              >
                {link}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition px-4 py-2"
            >
              Log In
            </button>
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-semibold bg-indigo-600 text-white px-5 py-2 rounded-full hover:bg-indigo-700 transition shadow-sm"
            >
              Start for Free
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase()}`}
                className="block text-sm font-medium text-gray-600 hover:text-indigo-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link}
              </a>
            ))}
            <button
              onClick={() => navigate('/login')}
              className="w-full mt-2 text-sm font-semibold bg-indigo-600 text-white px-5 py-2.5 rounded-full hover:bg-indigo-700 transition"
            >
              Log In
            </button>
          </div>
        )}
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        {/* Background gradient blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-indigo-100 via-violet-50 to-pink-50 opacity-60 blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-0 w-72 h-72 rounded-full bg-indigo-200 opacity-20 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 border border-indigo-100">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            Trusted by 500+ fast-growing businesses
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight max-w-4xl mx-auto">
            A CRM that helps your team{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
              stay in flow
            </span>
          </h1>

          <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Simple, intuitive, and built for teams that want clarity — not clutter. Manage customers, track deals, and move faster without the manual friction.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 bg-indigo-600 text-white font-semibold px-7 py-3.5 rounded-full hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
            >
              Start for Free
              <ArrowRight size={18} />
            </button>
            <button className="flex items-center gap-2 text-gray-700 font-medium px-6 py-3.5 rounded-full border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition">
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center">
                <Play size={12} className="text-white ml-0.5" />
              </div>
              Watch Demo
            </button>
          </div>

          <p className="mt-4 text-xs text-gray-400">No credit card required · Setup in minutes</p>
        </div>

        {/* ─── DASHBOARD MOCKUP ─── */}
        <div className="relative max-w-5xl mx-auto mt-14 px-4 sm:px-6 lg:px-0">
          <div className="relative rounded-2xl shadow-2xl shadow-indigo-100 border border-gray-200 overflow-hidden bg-white">
            {/* Mockup header bar */}
            <div className="bg-gray-900 px-4 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="ml-4 flex-1 bg-gray-700 rounded-md h-5 max-w-xs" />
            </div>

            {/* Mockup App UI */}
            <div className="flex bg-gray-50" style={{ height: '400px' }}>
              {/* Sidebar */}
              <div className="w-52 bg-white border-r border-gray-100 p-4 hidden sm:block">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                    <Zap size={14} className="text-white" />
                  </div>
                  <span className="text-sm font-bold text-gray-800">Nex<span className="text-indigo-600">CRM</span></span>
                </div>
                {['Dashboard', 'Leads', 'Customers', 'Orders', 'Users'].map((item, i) => (
                  <div
                    key={item}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-1 text-xs font-medium ${i === 0 ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500'}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-indigo-500' : 'bg-gray-300'}`} />
                    {item}
                  </div>
                ))}
              </div>

              {/* Main Content */}
              <div className="flex-1 p-5 overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-xs text-gray-400">Good morning 👋</p>
                    <h3 className="text-sm font-bold text-gray-800">Hello, Esther Howard</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-6 bg-indigo-100 rounded-full" />
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500" />
                  </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Revenue', value: '$600K', color: 'bg-indigo-50 border-indigo-100', trend: '+12%' },
                    { label: 'New Leads', value: '248', color: 'bg-violet-50 border-violet-100', trend: '+8%' },
                    { label: 'Orders', value: '$250K', color: 'bg-pink-50 border-pink-100', trend: '+23%' },
                    { label: 'Customers', value: '2,580', color: 'bg-emerald-50 border-emerald-100', trend: '+5%' },
                  ].map((card) => (
                    <div key={card.label} className={`${card.color} border rounded-xl p-3`}>
                      <p className="text-xs text-gray-400">{card.label}</p>
                      <p className="text-sm font-bold text-gray-800 mt-0.5">{card.value}</p>
                      <span className="text-xs text-emerald-500 font-semibold">{card.trend}</span>
                    </div>
                  ))}
                </div>

                {/* Chart placeholder */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 bg-white border border-gray-100 rounded-xl p-3">
                    <p className="text-xs font-semibold text-gray-600 mb-3">Leads Overview</p>
                    <div className="flex items-end gap-1 h-20">
                      {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-sm"
                          style={{
                            height: `${h}%`,
                            background: i === 10
                              ? 'linear-gradient(to top, #6366f1, #a78bfa)'
                              : i % 2 === 0 ? '#e0e7ff' : '#ede9fe',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-xl p-3">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Deal Stage</p>
                    <div className="space-y-2">
                      {[{ label: 'New', w: '70%', c: 'bg-indigo-500' }, { label: 'Demo', w: '50%', c: 'bg-violet-400' }, { label: 'Converted', w: '35%', c: 'bg-pink-400' }].map((s) => (
                        <div key={s.label}>
                          <div className="flex justify-between text-xs text-gray-400 mb-0.5">
                            <span>{s.label}</span>
                            <span>{s.w}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full">
                            <div className={`h-1.5 rounded-full ${s.c}`} style={{ width: s.w }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating cards */}
          <div className="hidden md:block absolute -left-6 top-1/3 bg-white rounded-xl shadow-lg border border-gray-100 p-3 w-36">
            <p className="text-xs text-gray-400 mb-1">This Month</p>
            <p className="text-base font-bold text-gray-800">$180,000</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp size={12} className="text-emerald-500" />
              <span className="text-xs text-emerald-500 font-semibold">+18.2%</span>
            </div>
          </div>
          <div className="hidden md:block absolute -right-4 top-1/4 bg-white rounded-xl shadow-lg border border-gray-100 p-3 w-36">
            <p className="text-xs text-gray-400 mb-1">New Deal</p>
            <p className="text-base font-bold text-gray-800">$2,500</p>
            <p className="text-xs text-violet-500 font-medium mt-1">Partner closed</p>
          </div>
        </div>
      </section>

      {/* ─── TRUST LOGOS ─── */}
      <section className="py-12 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-6">
            Trusted by fast-growing teams worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {INTEGRATIONS.map((name) => (
              <span key={name} className="text-lg font-bold text-gray-300 hover:text-gray-400 transition cursor-default">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <p className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-3">
              Features
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              Everything you need to{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
                stay organized
              </span>
            </h2>
            <p className="mt-4 text-gray-500 max-w-xl mx-auto">
              Naturally feels obvious, simple, and crafted to help your team ship forward.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat) => (
              <div
                key={feat.title}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 transition group"
              >
                <div className={`w-12 h-12 ${feat.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition`}>
                  {feat.icon}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{feat.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-3">
              How It Works
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Up and running in 3 steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create your workspace', desc: 'Sign up, invite your team, and configure roles for Admin, Marketing, and Partner users in minutes.' },
              { step: '02', title: 'Import your data', desc: 'Bring in your existing leads, customers, and orders — or start fresh with NexCRM\'s guided onboarding flow.' },
              { step: '03', title: 'Start closing deals', desc: 'Use the intelligent dashboard, automated notifications, and analytics to accelerate your pipeline.' },
            ].map((s, i) => (
              <div key={s.step} className="relative flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-extrabold text-lg flex items-center justify-center shadow-lg shadow-indigo-200 mb-4">
                  {s.step}
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-7 left-3/4 w-1/2 h-px border-t-2 border-dashed border-indigo-200" />
                )}
                <h3 className="text-base font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-3">
              Pricing
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Simple, transparent pricing</h2>
            <p className="mt-4 text-gray-500 max-w-md mx-auto">
              No surprises. Choose a plan that scales with your business.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-2xl p-8 border transition hover:shadow-xl ${plan.color}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-400 mt-1 mb-5">{plan.description}</p>
                <div className="flex items-end gap-1 mb-6">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-sm text-gray-400 mb-1">USD{plan.period}</span>
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition mb-6 ${plan.btn}`}
                >
                  Get Started
                </button>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 size={15} className="text-indigo-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-3">
              Testimonials
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">What our customers say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-indigo-200 hover:shadow-lg transition">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-5">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full ${t.color} text-white text-xs font-bold flex items-center justify-center`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-3">
              FAQ
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Got questions? We've got answers.</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className={`bg-white rounded-xl border transition cursor-pointer ${openFaq === i ? 'border-indigo-300 shadow-sm' : 'border-gray-100 hover:border-indigo-200'}`}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div className="flex items-center justify-between px-5 py-4 gap-4">
                  <p className="text-sm font-semibold text-gray-900">{faq.q}</p>
                  <ChevronDown
                    size={18}
                    className={`text-gray-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180 text-indigo-500' : ''}`}
                  />
                </div>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BOTTOM CTA BANNER ─── */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 border border-white/20">
            <Layers size={12} />
            Start your free trial today
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-4">
            Ready to grow smarter,<br />not harder?
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
            Join 500+ businesses that use NexCRM to manage leads, close deals, and scale their teams with confidence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 bg-white text-indigo-700 font-bold px-8 py-4 rounded-full hover:bg-gray-50 transition shadow-xl"
            >
              Get Started Free
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="text-white/80 font-medium px-6 py-4 rounded-full border border-white/30 hover:border-white/60 hover:bg-white/10 transition"
            >
              Log In
            </button>
          </div>
          <p className="mt-5 text-white/50 text-xs">No credit card needed · Cancel anytime</p>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <Zap size={16} className="text-white" />
                </div>
                <span className="text-lg font-bold text-white">
                  Nex<span className="text-indigo-400">CRM</span>
                </span>
              </div>
              <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                Simple, intuitive CRM for teams that want clarity — not clutter.
              </p>
              <div className="flex gap-2 mt-4">
                <Globe size={16} className="text-gray-600" />
              </div>
            </div>
            {[
              { heading: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Roadmap'] },
              { heading: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
              { heading: 'Support', links: ['Help Center', 'Contact', 'Status', 'Privacy'] },
            ].map((col) => (
              <div key={col.heading}>
                <h4 className="text-sm font-semibold text-white mb-3">{col.heading}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm hover:text-indigo-400 transition">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-600">© 2026 NexCRM. All rights reserved.</p>
            <p className="text-xs text-gray-600">Made with ❤️ for teams that move fast</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
