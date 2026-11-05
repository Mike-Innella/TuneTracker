# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Music creatives — producers, DJs, vocalists, songwriters, instrumentalists, recording artists, audio
engineers — managing their own songs and releases, often alone, sometimes with a small group of
collaborators. They open TuneTracker between sessions (on a laptop beside the DAW, or on a phone) to see
what is next on a track, move work forward, and share progress with other artists for feedback.

## Product Purpose

A central workspace where music projects move from idea to release. Success: an artist can see every
project's state at a glance, keep each song's tasks moving on a board shaped like their own workflow,
bring collaborators in with the right permissions, and publish a demo or finished track to get feedback.

## Positioning

A production workflow board built specifically for music projects (templates for songwriting,
recording, production, mixing, mastering, release), with collaboration and a lightweight creative
community attached. Projects and tasks are private by default; only what the artist explicitly
publishes becomes public. Not a streaming service, not a generic task manager, not a general social
network.

## Operating Context

- Kanban board per project: custom columns, ordered tasks, priorities, labels, due dates, checklists,
  comments, attachments (stems, references, demos), assignees, BPM and key on tasks.
- Roles: owner, editor, viewer.
- Community feed: progress updates, samples, demos, finished tracks with embedded audio; comments,
  reactions, feedback requests.
- Artist profiles with specialties and links (SoundCloud, Bandcamp, YouTube, website).

## Capabilities and Constraints

- Next.js on Vercel, Supabase Auth/Storage/Postgres, Prisma. Audio uploads go browser → storage directly
  (50 MB per audio file, 1 GB per user).
- Free to use. No pricing tiers exist.

## Brand Commitments

- Name: TuneTracker (version 2.0). Tagline: "Create. Collaborate. Share."
- Approved logo: neon stylised "T" in a circular arc with audio waveform bars, cyan → blue → violet
  gradient (`../Neon T Audio Waveform Logo.png`).
- Approved concept: `../TuneTracker 2.0 Blueprint Poster.png` — cinematic dark UI, deep navy, electric
  blue, indigo and violet light. Binding: dark default plus a fully designed light theme.

## Evidence on Hand

No users, testimonials, customer logos, usage statistics or press exist. Marketing must not invent any.
Product screenshots must be of the real product.

## Product Principles

1. The board is the centrepiece; everything else supports moving a track forward.
2. Private by default; publishing is always an explicit act.
3. Built for musicians' vocabulary (tracks, stems, mixes, BPM, key), not generic PM jargon.
4. Fast to scan between studio sessions, on desktop and on a phone.

## Accessibility & Inclusion

WCAG 2.2 AA. Keyboard alternative for every drag interaction. Respect reduced motion.
