# ADR-001 — ESLint flat config (eslint.config.mjs) over legacy .eslintrc

**Date:** 2026-06-04  
**Status:** Accepted  
**Deciders:** Founding engineer  

## Context

ESLint has two config formats: legacy (`.eslintrc.js`) and flat config (`eslint.config.mjs`).
The methodology specifies eslint-plugin-boundaries but not the config format.

## Decision

Use **flat config** (`eslint.config.mjs`). Flat config is ESLint's default from v9 onward, is
required by several new plugins, and is explicitly recommended by ESLint for new projects.
The legacy format is deprecated.

## Consequences

- `eslint.config.mjs` in `packages/config/` is the shared config
- All apps/packages extend it
- eslint-plugin-boundaries v4+ supports flat config natively
