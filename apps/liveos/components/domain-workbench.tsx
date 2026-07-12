'use client';

import { useState, type ChangeEvent } from 'react';
import type {
  CheckIn,
  EvidenceRef,
  FitnessSession,
  LearningSession,
  MemoryAnchor,
} from '@frankx-ai/alos-core';
import { routeHealthPreparation, type LiveOSCommandId } from '@frankx-ai/agentic-life-os-practice';

export type LiveOSArea = 'today' | 'practice' | 'body' | 'fitness' | 'health' | 'intellectual' | 'palace' | 'review';

export const LIVEOS_AREAS: Array<{ id: LiveOSArea; label: string; detail: string }> = [
  { id: 'today', label: 'Today', detail: 'One focused practice and a visible next action.' },
  { id: 'practice', label: 'Practice', detail: 'Private packs and your own rule of life.' },
  { id: 'body', label: 'Body', detail: 'Self-reported observations and local file references.' },
  { id: 'fitness', label: 'Fitness', detail: 'Training sessions and recovery notes.' },
  { id: 'health', label: 'Health', detail: 'Preparation and clinician questions only.' },
  { id: 'intellectual', label: 'Intellectual', detail: 'Learning sessions and source-aware inquiry.' },
  { id: 'palace', label: 'Palace', detail: 'Evidence-linked memory anchors.' },
  { id: 'review', label: 'Review', detail: 'Proposed commitments awaiting your decision.' },
];

interface DomainWorkbenchProps {
  activeArea: LiveOSArea;
  anchors: MemoryAnchor[];
  onAction: (command: LiveOSCommandId, outcome: string, sourceRefs?: EvidenceRef[]) => void;
  onCreateAnchor: (anchor: MemoryAnchor) => void;
  onNotice: (message: string) => void;
}

function localId(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

function localSourceReference(id: string, label: string, kind: EvidenceRef['kind']): EvidenceRef {
  return {
    id,
    label,
    kind,
    uri: `local://liveos/${id}`,
    privacyClass: 'sensitive',
    recordedAt: new Date().toISOString(),
  };
}

export function DomainWorkbench({
  activeArea,
  anchors,
  onAction,
  onCreateAnchor,
  onNotice,
}: DomainWorkbenchProps) {
  const [bodyObservation, setBodyObservation] = useState('');
  const [bodyCheckIns, setBodyCheckIns] = useState<CheckIn[]>([]);
  const [importRefs, setImportRefs] = useState<EvidenceRef[]>([]);
  const [fitnessLabel, setFitnessLabel] = useState('');
  const [fitnessSessionType, setFitnessSessionType] = useState<FitnessSession['sessionType']>('strength');
  const [fitnessEffort, setFitnessEffort] = useState('5');
  const [fitnessObservation, setFitnessObservation] = useState('');
  const [fitnessSessions, setFitnessSessions] = useState<FitnessSession[]>([]);
  const [healthPrompt, setHealthPrompt] = useState('');
  const [healthBoundary, setHealthBoundary] = useState<string | undefined>();
  const [learningSource, setLearningSource] = useState('');
  const [learningInsight, setLearningInsight] = useState('');
  const [nextQuestion, setNextQuestion] = useState('');
  const [learningSessions, setLearningSessions] = useState<LearningSession[]>([]);
  const [reviewCommitment, setReviewCommitment] = useState('');
  const [proposedCommitment, setProposedCommitment] = useState<string | undefined>();

  const saveBodyCheckIn = () => {
    const observation = bodyObservation.trim();
    if (!observation) {
      onNotice('Add a self-reported observation before recording a Body check-in.');
      return;
    }

    const checkIn: CheckIn = {
      id: localId('body-check-in'),
      occurredAt: new Date().toISOString(),
      domain: 'body',
      observations: [observation],
      privacyClass: 'sensitive',
    };

    setBodyCheckIns((current) => [...current, checkIn]);
    setBodyObservation('');
    onAction('/liveos body', 'Record a private, self-reported Body observation.');
  };

  const addLocalFileReference = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const id = localId('import');
    const reference: EvidenceRef = {
      id,
      label: `${file.name} · ${file.size.toLocaleString()} bytes`,
      kind: 'import',
      uri: `local://imports/${encodeURIComponent(file.name)}`,
      privacyClass: 'sensitive',
      recordedAt: new Date().toISOString(),
    };

    setImportRefs((current) => [...current, reference]);
    event.target.value = '';
    onAction('/liveos body', `Reference local file metadata for ${file.name}; no file content was read.`, [reference]);
  };

  const saveFitnessSession = () => {
    const label = fitnessLabel.trim();
    if (!label) {
      onNotice('Name the completed session before recording Fitness.');
      return;
    }

    const session: FitnessSession = {
      id: localId('fitness-session'),
      occurredAt: new Date().toISOString(),
      label,
      sessionType: fitnessSessionType,
      selfReportedEffort: Number(fitnessEffort),
      observations: fitnessObservation.trim() ? [fitnessObservation.trim()] : [],
      privacyClass: 'sensitive',
    };

    setFitnessSessions((current) => [...current, session]);
    setFitnessLabel('');
    setFitnessObservation('');
    onAction('/liveos fitness', 'Record a completed Fitness session and self-reported recovery observation.');
  };

  const prepareHealth = () => {
    const input = healthPrompt.trim();
    if (!input) {
      onNotice('Name the records or questions you want to prepare before using Health.');
      return;
    }

    const route = routeHealthPreparation(input);
    setHealthBoundary(route.userFacingBoundary);
    onAction('/liveos health-prep', 'Prepare a private health-preparation boundary and clinician-question route.');
  };

  const saveLearningSession = () => {
    const source = learningSource.trim();
    const insight = learningInsight.trim();
    const question = nextQuestion.trim();
    if (!source || !insight || !question) {
      onNotice('Add a source, one insight, and one next question before recording Intellectual practice.');
      return;
    }

    const sourceRef = localSourceReference(localId('learning-source'), source, 'source');
    const session: LearningSession = {
      id: localId('learning-session'),
      occurredAt: new Date().toISOString(),
      topic: source,
      sourceRefs: [sourceRef],
      insight,
      nextQuestion: question,
      privacyClass: 'private',
    };

    setLearningSessions((current) => [...current, session]);
    setLearningInsight('');
    setNextQuestion('');
    onAction('/liveos learn', 'Capture a sourced Intellectual practice and its next question.', [sourceRef]);
  };

  const linkLatestLearning = () => {
    const session = learningSessions[learningSessions.length - 1];
    const sourceRef = session?.sourceRefs[0];
    if (!session || !sourceRef) {
      onNotice('Capture a sourced learning session before linking it to the Palace.');
      return;
    }

    const anchor: MemoryAnchor = {
      id: localId('learning-anchor'),
      label: session.topic,
      kind: 'learning',
      sourceRefs: [sourceRef],
      privacyClass: 'sensitive',
      createdAt: new Date().toISOString(),
    };

    onCreateAnchor(anchor);
    onAction('/liveos palace', 'Create an evidence-linked Palace anchor from the latest learning session.', [sourceRef]);
  };

  const proposeWeeklyCommitment = () => {
    const commitment = reviewCommitment.trim();
    if (!commitment) {
      onNotice('Write a reversible next commitment before proposing the review.');
      return;
    }

    setProposedCommitment(commitment);
    onAction('/liveos weekly', 'Propose a private next commitment for user confirmation.');
  };

  if (activeArea === 'body') {
    return (
      <section className="domain-workbench" aria-labelledby="body-workbench-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Body</p>
            <h2 id="body-workbench-title">Keep observations self-reported and private</h2>
          </div>
          <span className="duration">{bodyCheckIns.length} check-ins</span>
        </div>
        <label className="domain-field" htmlFor="body-observation">
          <span>Energy, rest, recovery, or nourishment observation</span>
          <textarea
            id="body-observation"
            value={bodyObservation}
            onChange={(event) => setBodyObservation(event.target.value)}
            placeholder="Describe what you noticed without asking for a diagnosis."
            rows={5}
          />
        </label>
        <div className="domain-actions">
          <button className="primary-action" type="button" onClick={saveBodyCheckIn}>
            Record Body check-in
          </button>
          <label className="file-reference" htmlFor="local-file-reference">
            <span>Add a local file reference</span>
            <input id="local-file-reference" type="file" onChange={addLocalFileReference} />
            <small>Only name and size are referenced in this session. File contents are not read or uploaded.</small>
          </label>
        </div>
        {importRefs.length > 0 ? <p className="domain-meta">{importRefs.length} local file reference{importRefs.length === 1 ? '' : 's'} added.</p> : null}
      </section>
    );
  }

  if (activeArea === 'fitness') {
    return (
      <section className="domain-workbench" aria-labelledby="fitness-workbench-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Fitness</p>
            <h2 id="fitness-workbench-title">Log completed training; let recovery stay visible</h2>
          </div>
          <span className="duration">{fitnessSessions.length} sessions</span>
        </div>
        <div className="domain-form-grid">
          <label className="domain-field" htmlFor="fitness-label">
            <span>Completed session</span>
            <input
              id="fitness-label"
              value={fitnessLabel}
              onChange={(event) => setFitnessLabel(event.target.value)}
              placeholder="For example: easy walk, strength A, mobility"
            />
          </label>
          <label className="domain-field" htmlFor="fitness-session-type">
            <span>Session type</span>
            <select
              id="fitness-session-type"
              value={fitnessSessionType}
              onChange={(event) => setFitnessSessionType(event.target.value as FitnessSession['sessionType'])}
            >
              <option value="strength">Strength</option>
              <option value="aerobic">Aerobic</option>
              <option value="mobility">Mobility</option>
              <option value="recovery">Recovery</option>
            </select>
          </label>
          <label className="domain-field" htmlFor="fitness-effort">
            <span>Self-reported effort</span>
            <select id="fitness-effort" value={fitnessEffort} onChange={(event) => setFitnessEffort(event.target.value)}>
              {Array.from({ length: 10 }, (_, index) => index + 1).map((effort) => (
                <option key={effort} value={effort}>
                  {effort} / 10
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="domain-field" htmlFor="fitness-observation">
          <span>Recovery observation (optional)</span>
          <textarea
            id="fitness-observation"
            value={fitnessObservation}
            onChange={(event) => setFitnessObservation(event.target.value)}
            placeholder="Record your own experience; this workspace does not prescribe rehabilitation or treatment."
            rows={4}
          />
        </label>
        <div className="domain-actions">
          <button className="primary-action" type="button" onClick={saveFitnessSession}>
            Record Fitness session
          </button>
          <p className="domain-meta">No injury rehabilitation or medical prescription is generated.</p>
        </div>
      </section>
    );
  }

  if (activeArea === 'health') {
    return (
      <section className="domain-workbench" aria-labelledby="health-workbench-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Health preparation</p>
            <h2 id="health-workbench-title">Organize questions; keep clinical authority with qualified care</h2>
          </div>
          <span className="duration">Approval required</span>
        </div>
        <label className="domain-field" htmlFor="health-prompt">
          <span>What records or questions do you want to prepare?</span>
          <textarea
            id="health-prompt"
            value={healthPrompt}
            onChange={(event) => setHealthPrompt(event.target.value)}
            placeholder="For example: organize the timeline and questions I want to bring to a clinician."
            rows={5}
          />
        </label>
        <div className="domain-actions">
          <button className="primary-action" type="button" onClick={prepareHealth}>
            Prepare boundary
          </button>
          <p className="domain-meta">No diagnosis, medication advice, treatment recommendation, or emergency assessment.</p>
        </div>
        {healthBoundary ? <p className="boundary-copy">{healthBoundary}</p> : null}
      </section>
    );
  }

  if (activeArea === 'intellectual') {
    return (
      <section className="domain-workbench" aria-labelledby="intellectual-workbench-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Intellectual practice</p>
            <h2 id="intellectual-workbench-title">Turn a source into an insight and a question</h2>
          </div>
          <span className="duration">{learningSessions.length} sessions</span>
        </div>
        <label className="domain-field" htmlFor="learning-source">
          <span>Source or context</span>
          <input
            id="learning-source"
            value={learningSource}
            onChange={(event) => setLearningSource(event.target.value)}
            placeholder="Name the source, conversation, course, or experiment."
          />
        </label>
        <label className="domain-field" htmlFor="learning-insight">
          <span>Insight</span>
          <textarea
            id="learning-insight"
            value={learningInsight}
            onChange={(event) => setLearningInsight(event.target.value)}
            placeholder="Separate the source-backed observation from your own interpretation."
            rows={4}
          />
        </label>
        <label className="domain-field" htmlFor="learning-question">
          <span>Next question</span>
          <input
            id="learning-question"
            value={nextQuestion}
            onChange={(event) => setNextQuestion(event.target.value)}
            placeholder="What should you test, read, or ask next?"
          />
        </label>
        <div className="domain-actions">
          <button className="primary-action" type="button" onClick={saveLearningSession}>
            Capture learning session
          </button>
          <button className="secondary-action" type="button" onClick={linkLatestLearning}>
            Link latest learning to Palace
          </button>
        </div>
      </section>
    );
  }

  if (activeArea === 'palace') {
    return (
      <section className="domain-workbench" aria-labelledby="palace-workbench-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Memory Palace</p>
            <h2 id="palace-workbench-title">Keep anchors tied to evidence, not a decorative graph</h2>
          </div>
          <span className="duration">{anchors.length} anchors</span>
        </div>
        {anchors.length > 0 ? (
          <ul className="domain-list">
            {anchors.map((anchor) => (
              <li key={anchor.id}>
                <strong>{anchor.label}</strong>
                <span>{anchor.kind} · {anchor.sourceRefs.length} evidence reference{anchor.sourceRefs.length === 1 ? '' : 's'}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="domain-meta">No anchors yet. Save a reflection or a sourced learning session, then link it here.</p>
        )}
      </section>
    );
  }

  if (activeArea === 'review') {
    return (
      <section className="domain-workbench" aria-labelledby="review-workbench-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Review</p>
            <h2 id="review-workbench-title">Propose a commitment; keep the decision yours</h2>
          </div>
          <span className="duration">User confirmation</span>
        </div>
        <label className="domain-field" htmlFor="review-commitment">
          <span>One reversible next commitment</span>
          <textarea
            id="review-commitment"
            value={reviewCommitment}
            onChange={(event) => setReviewCommitment(event.target.value)}
            placeholder="For example: repeat this practice once before the next weekly review."
            rows={4}
          />
        </label>
        <div className="domain-actions">
          <button className="primary-action" type="button" onClick={proposeWeeklyCommitment}>
            Propose commitment
          </button>
          <p className="domain-meta">The proposal is not applied to a calendar, task list, or external system.</p>
        </div>
        {proposedCommitment ? <p className="boundary-copy">Proposed, awaiting your confirmation: {proposedCommitment}</p> : null}
      </section>
    );
  }

  return null;
}
