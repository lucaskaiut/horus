---
name: git-publish
description: Use when the user asks to publish, commit, push, or send the current changes to git. Inspects changes, bumps semver independently in api/composer.json and web/package.json when those trees change, then stages, commits (short english lowercase message), and pushes.
---

# Git Publish

Use this skill only when the user explicitly wants the current changes published to the remote git repository.

## Semantic versioning (SemVer 2.0.0)

Follow [Semantic Versioning 2.0.0](https://semver.org/): **`MAJOR.MINOR.PATCH`** (e.g. `1.4.2`).

Given version **MAJOR.MINOR.PATCH**:

| Bump | When |
|------|------|
| **MAJOR** | Incompatible changes: consumers **must** change to stay compatible. |
| **MINOR** | New backward-compatible behavior; existing clients keep working without changes. |
| **PATCH** | Backward-compatible fixes (bugs, security fixes) without new contract surface. |

**API (`api/`, version in `api/composer.json` field `version`)**

- **MAJOR**: Breaking public HTTP API for clients — e.g. removed or renamed routes/methods, required fields added with no default, response shape changed incompatibly, status codes or error envelope changed in a breaking way, authentication contract changed, OpenAPI contract removed or altered in a way that breaks existing clients, default pagination/filters changed with different semantics for the same request.
- **MINOR**: New endpoints, new optional request/response fields, additive enums, backward-compatible new query parameters, deprecations announced but old behavior still works.
- **PATCH**: Internal refactors, bug fixes preserving contract, tests-only, config/docs that do not change runtime contract, non-breaking dependency updates, logging/observability without API surface change.

**Web (`web/`, version in `web/package.json` field `version`)**

- **MAJOR**: Breaking deploy or consumer contract — e.g. removed env vars required at build/runtime, incompatible change to BFF routes under `web/app/api/` that other systems call, intentional removal of user-facing flows other teams rely on.
- **MINOR**: New pages/features, new optional UI capabilities, backward-compatible API route additions for the Next app.
- **PATCH**: Bugfixes, styling, a11y, tests, internal refactors, dependency patches that do not change public behavior.

When unsure between MINOR and PATCH, prefer **PATCH** for small/safe changes; prefer **MINOR** when user-visible capability is clearly added. Reserve **MAJOR** for real breakage.

## Independent versioning

- **API** and **Web** each have their own version string. They **must not** be forced to the same number.
- Bump **`api/composer.json`** only if at least one path to be committed is under **`api/`** (see exclusions below) and the change is not “noise only” (e.g. do not bump for an accidental edit reverted before commit — use judgment).
- Bump **`web/package.json`** only if at least one path to be committed is under **`web/`**.
- If the change set touches **only** `web/`, **do not** change `api/composer.json`. If **only** `api/`, **do not** change `web/package.json`.
- Changes **outside** both trees (e.g. repo root `README.md`, `docker-compose.yml`, `.agents/` at repo root) **do not** by themselves trigger a semver bump in either file unless those edits also include files under `api/` or `web/` respectively.

**Path exclusions (do not treat as a reason to bump by themselves)**

- `api/vendor/`, `web/node_modules/`
- Generated or local-only: `api/storage/logs/*`, scratch files, secrets (`.env` should not be committed)
- If the **only** committed paths under `api/` or `web/` are excluded artifacts, **skip** the version bump for that package.

**Bump procedure**

1. Read current `version` from `api/composer.json` and `web/package.json` (must match `X.Y.Z` with non-negative integers).
2. For each product (`api` / `web`) that qualifies for a bump, choose **one** of: MAJOR, MINOR, or PATCH based on the diff and the rules above.
3. Apply the bump:
   - **MAJOR**: `(X+1).0.0`
   - **MINOR**: `X.(Y+1).0`
   - **PATCH**: `X.Y.(Z+1)`
4. Write the updated `version` back to the correct file only.

## Workflow

1. **Inspect** the worktree: `git status --short`, `git diff --stat`, and for content review `git diff` (and `git diff --cached` if partial staging exists).
2. **Decide** which changes belong in this publish operation. Default to the full requested change set. Do not include obvious local-only artifacts such as `.codex/` unless the user explicitly asks for them.
3. **Classify paths** that will be committed (unstaged and/or staged, per user intent). Determine whether `api/` and/or `web/` require a semver bump and at which level, using the SemVer rules above.
4. **Bump versions** in `api/composer.json` and/or `web/package.json` as needed. Skip bumping entirely for a product if no meaningful committed paths touch that tree.
5. **Stage** all intended changes **including** any version file updates: `git add …`.
6. **Write a commit message** that follows all of these rules:
   - english only
   - lowercase only
   - short and direct
   - describe the outcome in a few words
   - avoid technical details, file names, line numbers, implementation notes, prefixes, or long explanations
7. **Commit** with `git commit -m "<message>"`.
8. **Push** the current branch. If upstream is already configured, use `git push`. If upstream is missing, use `git push -u origin $(git branch --show-current)`.

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
- After pushing, report the **branch name**, **commit SHA**, and the **new version(s)** for `api` and/or `web` if they were bumped (or state that neither was bumped).

## Reporting

After a successful publish, briefly state:

- Branch and commit SHA.
- Whether `api` version, `web` version, both, or neither were bumped, with old → new when bumped.
