---
name: git-publish
description: Use when the user asks to publish, commit, push, or send the current changes to git. This skill stages the requested changes, creates a short commit message in english using lowercase only and no technical detail, then pushes the current branch.
---

# Git Publish

Use this skill only when the user explicitly wants the current changes published to the remote git repository.

## Workflow

1. Inspect the worktree with `git status --short` and `git diff --stat`.
2. Decide which changes belong in this publish operation. Default to the full requested change set. Do not include obvious local-only artifacts such as `.codex/` unless the user explicitly asks for them.
3. Stage the intended changes with `git add`.
4. Write a commit message that follows all of these rules:
   - english only
   - lowercase only
   - short and direct
   - describe the outcome in a few words
   - avoid technical details, file names, line numbers, implementation notes, prefixes, or long explanations
5. Commit with `git commit -m "<message>"`.
6. Push the current branch. If upstream is already configured, use `git push`. If upstream is missing, use `git push -u origin $(git branch --show-current)`.

## Commit Message Rules

- Good examples:
  - `fix menu highlighting`
  - `update login flow`
  - `add logs page`
- Bad examples:
  - `Fix: corrige problema do menu lateral na rota /logs`
  - `update sidebarnav.tsx and layout.tsx to fix active state`
  - `fix issue with route validation by replacing middleware logic`

## Validation

- Confirm there is something staged before committing.
- Confirm the final commit message is entirely lowercase.
- After pushing, report the branch name and commit SHA.
