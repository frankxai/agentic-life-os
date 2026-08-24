# Public clean-history projection

The current `agentic-life-os` repository is a private hardening source. Its
reachable history contains workstation-era material and is not approved for
public visibility. A squash merge does not remove that history from existing
refs, tags, or branches.

The intended public Agentic Life OS must be created as a new, clean-history
projection from one reviewed source commit. Do not copy a working directory or
reuse the private repository's Git database.

## Initial publication gate

1. Freeze one reviewed private source commit.
2. Verify `release/public-projection.paths` exactly matches the candidate files.
3. Export only those files as bytes from the reviewed Git commit.
4. Initialize a new temporary Git repository with one root commit.
5. From the trusted private source checkout, run its verifier against the new
   repository: `node <trusted-source>/scripts/verify-public-projection.mjs --root=<new-public-repo-path> --commit=HEAD --require-single-commit`.
6. Run dependency audit, tests, type checks, generated-asset verification,
   public-safety scanning, secret scanning, license review, and accessibility review.
7. Obtain explicit approval for the target GitHub repository, visibility,
   branch rules, Actions, and first push.

The exporter requires a full reviewed source commit, a new destination path,
and a new receipt path outside both repositories:

```text
pnpm release:export-public -- --source-commit=<40-hex-source-commit> --destination=<new-empty-public-repo-path> --receipt=<new-private-receipt-path>
```

It reads Git blobs rather than copying the mutable worktree, preserves and binds
regular-file modes, forces SHA-1 plus UTF-8 commit metadata under a sanitized Git
environment, creates a single deterministic root commit, invokes the trusted source
verifier against the destination without executing projected code, and writes a
private source-blob-to-public-blob receipt. It canonicalizes
existing path ancestors, rejects symlink/junction escapes, rechecks paths after
creation, refuses existing destinations, and never rewrites or removes the private
source.

After the approved first push, verify the remote branch against the receipt:

```text
pnpm release:verify-remote -- --repository=<owner/repo> --branch=main --expected-commit=<public-root-commit> --expected-tree=<public-root-tree> --expected-digest=<projection-sha256>
```

The post-push verifier first audits the complete ref advertisement and requires
exactly symbolic `HEAD`, object `HEAD`, and the approved branch, all bound to the
approved root commit. It rejects every extra branch, tag, ref, or commit before
cloning the named branch into a bounded temporary directory and using the trusted
local verifier to recompute the committed-tree projection digest. Candidate scripts
are treated only as bytes and are never executed. The expected commit, tree, and
digest arguments must come from the independently protected private receipt; caller
input is not review evidence. Keep the receipt in the private release evidence
store, never in the public repository.

The projection manifest is a path admission list, not a privacy guarantee. The
verifier additionally binds regular-file modes and bytes; rejects symlinks,
submodules, binary files, Git LFS pointers, archives, private-data roots,
genomic/family interchange formats, non-canonical UTF-8, Git control-directory
aliases, unsafe cross-platform paths, local
workstation paths, and common secret patterns; and checks the initial repository
for one reachable root commit, one branch ref, no shared/alternate object store,
and no unreachable objects. Root `.gitattributes` fixes text checkout to LF so
worktree and committed bytes remain comparable across platforms. CI must run both
worktree and committed-tree modes.
Independent history, security, privacy, medical, license, and release review
remain mandatory.
