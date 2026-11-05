# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [2.0.0] - Unreleased

### Added
- Next.js App Router application on a `frontend/` `backend/` `data/` `packages/shared/` npm-workspaces monorepo.
- Supabase Auth: sign-up with email verification, login, logout, password reset.
- Customisable Kanban boards: columns, ordered tasks, drag-and-drop (pointer, touch, keyboard), labels,
  checklists, comments, attachments with audio playback, assignees, priorities, due dates, BPM/key.
- Projects with music-production templates, artwork, deadlines, status, visibility, archive and delete.
- Collaboration with owner / editor / viewer roles enforced server-side.
- Community feed with audio and image uploads (direct to Supabase Storage), comments, reactions,
  feedback requests, reporting, pagination and project-to-community publishing.
- Artist profiles, public project showcase, settings with persisted theme.
- Liner Notes design system with dark and light themes; new logo and brand assets.
- Docker dev/prod images, GitHub Actions CI, security scanning and release workflow.

### Changed
- Database moved from MySQL to PostgreSQL (Supabase) with Prisma 7.
- Custom JWT auth replaced by Supabase Auth.
- Audio no longer proxied through the API server.

### Removed
- Express API server, Vite SPA, AWS App Runner configuration (preserved at tag `legacy-baseline`).
