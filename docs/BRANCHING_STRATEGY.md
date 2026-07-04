# Branching Strategy

```
main
 └── develop
      ├── feature/authentication
      ├── feature/ticket-engine
      ├── feature/chatbot
      ├── feature/ai
      ├── feature/knowledge-base
      ├── feature/notifications
      ├── feature/dashboard
      ├── feature/admin
      ├── feature/analytics
      ├── feature/database
      └── feature/frontend-<module>
 └── hotfix/*  (branched from main, merged back into main and develop)
```

## Rules

1. `main` is always deployable and protected. No direct commits.
2. `develop` is the integration branch. All feature branches target `develop`.
3. One feature branch per module/task: `feature/<module>-<short-description>`.
4. `hotfix/*` branches from `main` for urgent production fixes, merged into both `main` and `develop`.
5. Releases: `develop` → PR → `main`, tagged `vX.Y.Z`.

## Workflow

```
main
 ↓
develop
 ↓
feature branch
 ↓
Pull Request
 ↓
Code Review (≥1 approval, CI green)
 ↓
Merge into develop
 ↓
Release PR into main
```

## Suggested board columns

`Backlog → Sprint Ready → In Progress → Review → Testing → Done`

Each GitHub Issue = one feature or module task, labeled by module (`authentication`, `tickets`, `chatbot`,
`ai`, `knowledge-base`, `notifications`, `dashboard`, `admin`, `analytics`, `frontend`, `database`, `infra`).
