# Git Conventions

## Commit Messages

Follow Conventional Commits format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat:` — New feature
- `fix:` — Bug fix
- `chore:` — Maintenance tasks
- `docs:` — Documentation changes
- `style:` — Code style changes (formatting, no logic change)
- `refactor:` — Code refactoring (no feature change)
- `test:` — Adding or updating tests
- `ci:` — CI/CD changes

### Examples

```
feat(leave-requests): add balance display page
fix(auth): handle expired session cookie
chore: update dependencies
```

## Branch Naming

- `feat/<description>` — Feature branches
- `fix/<description>` — Bug fix branches
- `chore/<description>` — Maintenance branches

## Pre-commit Hooks

- husky runs lint-staged on pre-commit
- lint-staged runs ESLint + Prettier on staged `.ts` and `.tsx` files
- All commits must pass lint before committing

## Pull Requests

- Squash merge to main
- PR title must follow Conventional Commits format
- Review required before merge
