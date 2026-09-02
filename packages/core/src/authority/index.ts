export * from './contracts.js';
export { operationDigest, simulateAdmission } from './simulator.js';
export {
  assertCompleteDomainCoverage,
  findLeakedSubstrings,
  projectDecision,
  projectDomain,
  type PublicDecisionProjection,
  type PublicDomainProjection,
} from './projection.js';
export {
  createFixtureStore,
  fixtureEgressRequest,
  fixtureReadRequest,
  FIXTURE_CLOCK,
  FIXTURE_NOW,
  leakBaitFor,
  SYNTHETIC_DOMAIN_FIXTURES,
  type SyntheticDomainFixture,
} from './fixtures.js';
