# Version ownership and compatibility

Agentic Life OS has several independent contract axes. They are not aliases and
must not be advanced together without need.

| Axis | Current | Owner | Breaking-change trigger |
| --- | --- | --- | --- |
| Runtime package | `0.3.0` | root `package.json` | exported runtime behavior or package surface |
| Profile contract | `1.4.0` | `LifeOSProfileSchema` | profile fields, enums, authority or safety contract |
| SIP compatibility | `1.1.1` | Memory/SIP private-adapter contract | memory descriptor or adapter protocol |
| Discovery asset schema | `1.3.0` | generated discovery assets | machine-readable discovery shape |
| Private overlay schema | `1.0.0` | overlay template | private-instance configuration shape |
| HIS artifact pin | `1.0.0` | health integrity contract | immutable artifact binding fields |

The only supported first-public-release combination is runtime `0.3.0`, profile
`1.4.0`, SIP `1.1.1`, discovery `1.3.0`, overlay `1.0.0`, and HIS pin `1.0.0`.
Unknown combinations fail closed; there is no implicit backwards-compatibility
claim before the first stable release.

For every bump:

1. identify the owning schema and whether the change is breaking;
2. add an old-to-new migration fixture or explicitly document that migration is
   unsupported and requires a fresh private overlay;
3. update the compatibility row and exact schema literal;
4. regenerate discovery assets;
5. pass profile, generated-asset, dashboard-drift, projection, and private-overlay
   integration tests;
6. bind the approved runtime version to the clean public commit, tree, and
   projection digest in the private overlay receipt.

The dashboard footer is a checked contract surface. The generator fails if its
runtime, profile, or discovery versions drift from the canonical package/profile.
