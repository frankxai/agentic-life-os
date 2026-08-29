# Dependency and license release policy

The first public projection is application source, not a package-registry
release. Every workspace package remains `private: true` to prevent accidental
publication.

The lockfile is part of the projection digest. CI must install it with scripts
disabled, run the full production/development dependency audit, and pass the
machine-enforced license allowlist. The general reviewed license families are
MIT, Apache-2.0, ISC, BSD-3-Clause, and Python-2.0. Any other license is allowed
only for an exact package and version recorded below. New packages, versions,
or license strings fail closed pending review.

## Exact pre-release exceptions

These exceptions document technical use in the private hardening source. They
do not replace the final human license review required before public visibility,
do not relicense third-party work as MIT, and do not authorize redistribution of
a dependency as a standalone product.

| Package | License | Approved use |
| --- | --- | --- |
| `@fontsource/inter@5.3.0` | OFL-1.1 | Self-hosted Latin webfont files in the synthetic Coach experience |
| `@fontsource/jetbrains-mono@5.3.0` | OFL-1.1 | Self-hosted Latin evidence/readout font files |
| `@fontsource/playfair-display@5.3.0` | OFL-1.1 | Self-hosted Latin editorial font files |
| `@fontsource/poppins@5.3.0` | OFL-1.1 | Self-hosted Latin display font files |
| `caniuse-lite@1.0.30001810` | CC-BY-4.0 | Build-time browser compatibility dataset; preserve package attribution |
| `gsap@3.15.0` | GSAP Standard no-charge license | Application animation runtime; do not resell or expose the library as a standalone product |
| `@gsap/react@2.1.2` | GSAP Standard license | Scoped React lifecycle integration for the application runtime |

Fontsource documents per-package OFL metadata and bundled license files at
<https://fontsource.org/docs/getting-started/migrate-v5>. GSAP documents that
GSAP 3.13+ and its plugins are freely available through the public npm package at
<https://gsap.com/docs/v3/Installation/>. The exact license text distributed in
each installed package remains authoritative.

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
