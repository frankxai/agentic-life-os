# Dependency and license release policy

The first public projection is application source, not a package-registry
release. Every workspace package remains `private: true` to prevent accidental
publication.

The lockfile is part of the projection digest. CI must install it with scripts
disabled, run the full production/development dependency audit, and pass the
machine-enforced license allowlist. The current reviewed license families are
MIT, Apache-2.0, ISC, BSD-3-Clause, and Python-2.0. Any new or compound license
fails pending human legal/license review.

For a release candidate, retain the following outside the public repository in
the private release evidence store, keyed by public root commit and projection
digest:

- `pnpm audit --json` output;
- `pnpm licenses list --json` output;
- the public projection receipt;
- the exact Node, pnpm, and Git versions;
- secret-scan, test, typecheck, generated-asset, accessibility, and privacy-review results.

An npm or other registry release is a separate future lane. Before enabling it,
add package-specific license/repository/files/exports/publish configuration,
provenance signing, registry permissions, and an independent package-content
inspection gate.
