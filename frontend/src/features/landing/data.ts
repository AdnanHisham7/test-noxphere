// src/features/landing/data.ts

export const PROBLEMS = [
  {
    title: "Spread across five apps",
    body: "Attendance on paper, fees in a spreadsheet, updates on WhatsApp. Nothing talks to anything else.",
  },
  {
    title: "No single source of truth",
    body: "Coaches, admins and parents all work off different information — and it's rarely the same version.",
  },
  {
    title: "Manual work eats your week",
    body: "Chasing overdue fees, re-typing attendance registers, building reports by hand before every meeting.",
  },
];

export const FEATURES = [
  {
    title: "Students",
    body: "One record per student — batch, guardian, documents, medical notes and history in one place.",
  },
  {
    title: "Batches & teams",
    body: "Group by age, skill level or centre. Move students between batches without losing their history.",
  },
  {
    title: "Attendance",
    body: "Mark session attendance in seconds, from any device. Trends surface automatically.",
  },
  {
    title: "Fees & payments",
    body: "Track collection by student, batch or centre, with reminders for what's overdue.",
  },
  {
    title: "Coaches & sessions",
    body: "Assign coaches to batches and sessions, and keep session plans and notes with the team.",
  },
  {
    title: "Performance tracking",
    body: "Log assessments and progress per player so development isn't just a coach's memory.",
  },
  {
    title: "Communication",
    body: "Send updates and reminders to guardians and coaches without leaving the platform.",
  },
  {
    title: "Reports & analytics",
    body: "A 360° view of attendance, fee collection and performance — by batch, coach or centre.",
  },
];

export const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Set up your academy",
    body: "Add centres, batches, coaches and students. Import existing records or start fresh.",
  },
  {
    step: "02",
    title: "Run daily operations",
    body: "Mark attendance, log sessions, collect fees — all from the same system, every day.",
  },
  {
    step: "03",
    title: "Everyone stays connected",
    body: "Coaches update from the field, guardians see it in real time, admins track it centrally.",
  },
  {
    step: "04",
    title: "See it in reports",
    body: "Attendance, collection and performance roll up into one view, ready before every review.",
  },
];

export const ROLES = [
  {
    audience: "Academy owners",
    headline: "Run your academy with less manual work and more control.",
  },
  {
    audience: "Associations",
    headline: "Manage multiple academies from one central system.",
  },
  {
    audience: "Admins",
    headline: "Track students, fees, batches, attendance and communication in one place.",
  },
  {
    audience: "Coaches",
    headline: "Mark attendance, update assessments and manage sessions easily.",
  },
  {
    audience: "Guardians",
    headline: "Receive updates, reminders and clear communication.",
  },
];

type Support = boolean | "partial";

export const WHY_ROWS: { label: string; generic: Support; sports: Support; noxphere: Support }[] = [
  {
    label: "Built for football workflows",
    generic: false,
    sports: "partial",
    noxphere: true,
  },
  {
    label: "Batches by age group & season",
    generic: false,
    sports: false,
    noxphere: true,
  },
  {
    label: "Multi-academy / association view",
    generic: "partial",
    sports: false,
    noxphere: true,
  },
  {
    label: "Fee tracking built for recurring academy fees",
    generic: true,
    sports: "partial",
    noxphere: true,
  },
  {
    label: "Coach, guardian & student portals",
    generic: false,
    sports: "partial",
    noxphere: true,
  },
];

export const FAQS = [
  {
    q: "Can I manage more than one academy or centre from one account?",
    a: "Yes. Associations and multi-centre academies can manage every location from a single, central view while keeping each centre's data separate.",
  },
  {
    q: "Do coaches and guardians get their own access?",
    a: "Yes. Coaches get a portal for attendance and assessments, and guardians get a portal for updates, fees and communication — no shared logins.",
  },
  {
    q: "Is Noxphere built specifically for football, or general sports?",
    a: "Specifically football. Batches, sessions, assessments and reporting are all modelled around how football academies actually run, not a generic sports template.",
  },
  {
    q: "How does fee tracking work?",
    a: "Fees are tracked per student and batch, with a clear view of what's collected, pending and overdue, plus reminders so you're not chasing payments manually.",
  },
  {
    q: "Can I bring in my existing student and fee records?",
    a: "Yes, existing records can be imported during setup so you're not starting from zero.",
  },
  {
    q: "Is there a mobile app?",
    a: "A mobile app for coaches and guardians is on the roadmap after launch. The web platform works on mobile browsers today.",
  },
];
