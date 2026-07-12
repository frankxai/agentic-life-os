'use client';

import { useMemo, useState } from 'react';
import type {
  ActionReceipt,
  ActionRequest,
  EvidenceRef,
  LiveOSDomain,
  MemoryAnchor,
} from '@frankx-ai/alos-core';
import {
  LIVEOS_COMMANDS,
  SPIRITUAL_PRACTICE_PACKS,
  createDefaultLifeOverview,
  createLiveOSReceipt,
  getLiveOSCommand,
  type LiveOSCommandId,
} from '@frankx-ai/agentic-life-os-practice';
import { LOCAL_ONLY_SYNC_GATE } from '@frankx-ai/agentic-life-os-sync';
import {
  DomainWorkbench,
  LIVEOS_AREAS,
  type LiveOSArea,
} from './domain-workbench';

type PracticeStage = 'intention' | 'practice' | 'observation' | 'reflection' | 'palace' | 'review';

const stages: Array<{ id: PracticeStage; label: string; description: string }> = [
  { id: 'intention', label: 'Intention', description: 'Name what matters before activity fills the day.' },
  { id: 'practice', label: 'Practice', description: 'Give one chosen practice a bounded, undistracted window.' },
  { id: 'observation', label: 'Observation', description: 'Notice what happened without turning it into a verdict.' },
  { id: 'reflection', label: 'Reflection', description: 'Write one honest trace in your own language.' },
  { id: 'palace', label: 'Palace', description: 'Link the trace to a source, person, project, or prior insight.' },
  { id: 'review', label: 'Review', description: 'Choose a small next commitment; keep it reversible.' },
];

const availablePractices = SPIRITUAL_PRACTICE_PACKS.flatMap((pack) => pack.practices);

function createRequest(
  command: LiveOSCommandId,
  scope: LiveOSDomain[],
  requestedOutcome: string,
  sourceRefs: EvidenceRef[] = [],
): ActionRequest {
  return {
    id: `local-${Date.now()}`,
    command,
    mode: 'plan',
    scope,
    requestedOutcome,
    inputs: {},
    sourceRefs,
    requestedAt: new Date().toISOString(),
  };
}

export function LiveOSWorkspace() {
  const overview = useMemo(() => createDefaultLifeOverview(), []);
  const [stage, setStage] = useState<PracticeStage>('intention');
  const [reflection, setReflection] = useState('');
  const [receipt, setReceipt] = useState<ActionReceipt | undefined>(overview.latestReceipt);
  const [notice, setNotice] = useState('Choose one intentional practice. Nothing leaves this browser prototype.');
  const [selectedCommand, setSelectedCommand] = useState<LiveOSCommandId>('/liveos today');
  const [activeArea, setActiveArea] = useState<LiveOSArea>('today');
  const [selectedPracticeId, setSelectedPracticeId] = useState(overview.activePractice?.id ?? '');
  const [anchors, setAnchors] = useState<MemoryAnchor[]>(overview.anchors);
  const [savedReflection, setSavedReflection] = useState<string | undefined>();

  const activePractice = availablePractices.find((practice) => practice.id === selectedPracticeId) ?? overview.activePractice;
  const activeStageIndex = stages.findIndex((item) => item.id === stage);

  const runCommand = (commandId: LiveOSCommandId, outcome: string, sourceRefs: EvidenceRef[] = []) => {
    const command = getLiveOSCommand(commandId);
    if (!command) {
      setNotice('That command is not registered yet.');
      return;
    }

    const nextReceipt = createLiveOSReceipt(createRequest(command.id, command.scope, outcome, sourceRefs));
    setReceipt(nextReceipt);
    setNotice(nextReceipt.summary);
  };

  const beginPractice = () => {
    setStage('practice');
    runCommand('/liveos practice', `Begin ${activePractice?.title ?? 'the selected practice'}.`);
  };

  const selectPractice = (practiceId: string) => {
    const nextPractice = availablePractices.find((practice) => practice.id === practiceId);
    setSelectedPracticeId(practiceId);
    setStage('intention');
    setNotice(
      nextPractice
        ? `Selected ${nextPractice.title}. Add your own source context before treating it as a sourced practice.`
        : 'Choose a practice from the available packs.',
    );
  };

  const recordReflection = () => {
    if (!reflection.trim()) {
      setNotice('Write a short reflection before saving this step.');
      return;
    }

    setSavedReflection(reflection.trim());
    setStage('reflection');
    runCommand('/liveos practice', 'Capture a private reflection from the completed practice.');
  };

  const linkToPalace = () => {
    if (!savedReflection) {
      setNotice('Save a reflection before creating a Palace anchor.');
      return;
    }

    const now = new Date().toISOString();
    const reflectionId = `reflection-${Date.now()}`;
    const evidenceRef: EvidenceRef = {
      id: reflectionId,
      label: savedReflection.slice(0, 80),
      kind: 'reflection',
      uri: `local://reflections/${reflectionId}`,
      privacyClass: 'sensitive',
      recordedAt: now,
    };
    const anchor: MemoryAnchor = {
      id: `anchor-${reflectionId}`,
      label: 'Today\'s reflection',
      kind: 'reflection',
      sourceRefs: [evidenceRef],
      privacyClass: 'sensitive',
      createdAt: now,
    };

    setStage('palace');
    setAnchors((current) => [...current, anchor]);
    runCommand('/liveos palace', 'Create an evidence-linked memory anchor from the reflection.', [evidenceRef]);
  };

  const reviewNextStep = () => {
    setStage('review');
    runCommand('/liveos weekly', 'Propose one reversible next commitment from today\'s trace.');
  };

  return (
    <main className="liveos-shell">
      <header className="topbar">
        <a className="wordmark" href="#today" aria-label="Agentic Life OS home">
          <span className="wordmark-signal" aria-hidden="true" />
          <span>Agentic Life OS</span>
        </a>
        <div className="topbar-status" aria-label="Privacy status">
          <span className="status-dot" aria-hidden="true" />
          <span>Local practice workspace</span>
        </div>
      </header>

      <section className="intro" id="today" aria-labelledby="today-title">
        <div className="intro-copy">
          <p className="eyebrow">Today</p>
          <h1 id="today-title">One deliberate practice. One durable trace.</h1>
          <p className="intro-lede">
            Begin with the quality of attention you want to bring, then leave behind a reflection that can become a useful memory anchor.
          </p>
          <div className="intro-actions">
            <button className="primary-action" type="button" onClick={beginPractice}>
              Begin today&apos;s practice
            </button>
            <button className="secondary-action" type="button" onClick={() => setStage('intention')}>
              Revisit intention
            </button>
          </div>
        </div>
        <aside className="intention-card" aria-label="Today&apos;s intention">
          <p className="eyebrow">Your intention</p>
          <p>{overview.intention}</p>
          <span>{overview.date}</span>
        </aside>
      </section>

      <section className="workspace-grid" aria-label="Practice workspace">
        <aside className="rail" aria-label="Agentic Life OS areas">
          {LIVEOS_AREAS.map((area) => (
            <button
              className={`rail-item ${area.id === activeArea ? 'is-active' : ''}`}
              key={area.id}
              type="button"
              onClick={() => {
                setActiveArea(area.id);
                setNotice(area.detail);
              }}
            >
              <span>{area.label}</span>
              <span aria-hidden="true">→</span>
            </button>
          ))}
        </aside>

        <div className="main-column">
          {activeArea === 'today' || activeArea === 'practice' ? (
            <>
          <section className="practice-map" aria-labelledby="practice-map-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Practice map</p>
                <h2 id="practice-map-title">From intention to a memory you can return to</h2>
              </div>
              <span className="map-state">{stage}</span>
            </div>

            <ol className="stage-list">
              {stages.map((item, index) => {
                const isCurrent = item.id === stage;
                const isComplete = index < activeStageIndex;
                return (
                  <li className={isCurrent ? 'is-current' : isComplete ? 'is-complete' : ''} key={item.id}>
                    <button type="button" onClick={() => setStage(item.id)}>
                      <span className="stage-index">{String(index + 1).padStart(2, '0')}</span>
                      <span className="stage-label">{item.label}</span>
                      <span className="stage-detail">{item.description}</span>
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="map-caption">
              <span className="caption-line" aria-hidden="true" />
              <p>The map is a live product state, not decoration: each step returns a receipt and a route for the next one.</p>
            </div>
          </section>

          <section className="session-panel" aria-labelledby="session-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Current practice</p>
                <h2 id="session-title">{activePractice?.title}</h2>
              </div>
              <span className="duration">{activePractice?.durationMinutes} minutes</span>
            </div>
            <label className="practice-picker" htmlFor="practice-choice">
              <span>Choose a private practice</span>
              <select
                id="practice-choice"
                value={selectedPracticeId}
                onChange={(event) => selectPractice(event.target.value)}
              >
                {availablePractices.map((practice) => (
                  <option key={practice.id} value={practice.id}>
                    {practice.title} · {practice.tradition}
                  </option>
                ))}
              </select>
            </label>
            <p className="session-intention">{activePractice?.intention}</p>
            <ol className="practice-steps">
              {activePractice?.steps.map((item, index) => (
                <li key={item}>
                  <span>{index + 1}</span>
                  <p>{item}</p>
                </li>
              ))}
            </ol>
            <p className="source-note">
              Source context:{' '}
              {activePractice?.sourceRefs[0]?.citation
                ?? 'Add your source, teacher, tradition, or personal context before treating this practice as sourced.'}
            </p>
            <p className="boundary-note">{activePractice?.safetyBoundary}</p>
          </section>

          <section className="reflection-panel" aria-labelledby="reflection-title">
            <div>
              <p className="eyebrow">Capture</p>
              <h2 id="reflection-title">What changed in your attention?</h2>
            </div>
            <textarea
              aria-label="Private reflection"
              value={reflection}
              onChange={(event) => setReflection(event.target.value)}
              placeholder="Write a short trace in your own language. This prototype does not send it anywhere."
              rows={4}
            />
            <div className="reflection-actions">
              <button className="primary-action" type="button" onClick={recordReflection}>
                Save reflection
              </button>
              <button className="secondary-action" type="button" onClick={linkToPalace}>
                Link to Palace
              </button>
              <button className="quiet-action" type="button" onClick={reviewNextStep}>
                Review next step
              </button>
            </div>
          </section>
            </>
          ) : null}
          <DomainWorkbench
            activeArea={activeArea}
            anchors={anchors}
            onAction={runCommand}
            onCreateAnchor={(anchor) => setAnchors((current) => [...current, anchor])}
            onNotice={setNotice}
          />
        </div>

        <aside className="inspector" aria-label="Action receipt and safety inspector">
          <section>
            <p className="eyebrow">Action receipt</p>
            <h2>{receipt ? receipt.status.replace('-', ' ') : 'Waiting for a practice'}</h2>
            <p aria-live="polite">{notice}</p>
            {receipt ? (
              <dl>
                <div>
                  <dt>Command</dt>
                  <dd>{receipt.command}</dd>
                </div>
                <div>
                  <dt>Route</dt>
                  <dd>{receipt.dashboardRoute}</dd>
                </div>
                <div>
                  <dt>Approval</dt>
                  <dd>{receipt.approvalRequired ? 'User review required' : 'Not required for this plan action'}</dd>
                </div>
                {receipt.evidenceRefs.length > 0 ? (
                  <div>
                    <dt>Evidence</dt>
                    <dd>{receipt.evidenceRefs.length} local reference attached</dd>
                  </div>
                ) : null}
              </dl>
            ) : null}
          </section>

          <section className="command-deck">
            <label htmlFor="liveos-command">Try a command</label>
            <select
              id="liveos-command"
              value={selectedCommand}
              onChange={(event) => setSelectedCommand(event.target.value as LiveOSCommandId)}
            >
              {LIVEOS_COMMANDS.map((command) => (
                <option key={command.id} value={command.id}>
                  {command.id}
                </option>
              ))}
            </select>
            <button
              className="secondary-action"
              type="button"
              onClick={() => runCommand(selectedCommand, 'Create a local plan from the command palette.')}
            >
              Prepare response
            </button>
          </section>

          <section>
            <p className="eyebrow">Memory Palace</p>
            <h2>{anchors.length} local anchors</h2>
            <p>Each anchor should resolve to a source or a user-authored reflection before it is shown as knowledge.</p>
          </section>

          <section className="boundary-panel">
            <p className="eyebrow">Health and sync boundary</p>
            <p>Health preparation remains non-diagnostic. Sync is currently {LOCAL_ONLY_SYNC_GATE.status}; no raw private record is sent remotely.</p>
          </section>
        </aside>
      </section>

      <section className="packs-section" aria-labelledby="packs-title">
        <div>
          <p className="eyebrow">Optional practice packs</p>
          <h2 id="packs-title">Respect tradition, keep your own context visible</h2>
        </div>
        <div className="packs-grid">
          {SPIRITUAL_PRACTICE_PACKS.map((pack) => (
            <article key={pack.id}>
              <h3>{pack.label}</h3>
              <p>{pack.posture}</p>
              <small>{pack.sourceRequirement}</small>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
