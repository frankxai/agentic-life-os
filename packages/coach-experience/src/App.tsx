import { useEffect, useMemo, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { simulateCoachReview } from '@frankx-ai/agentic-coaching-os';
import {
  coachCapabilities,
  knowledgeGraph,
  lensPresentations,
  memberCapabilities,
  reviewRequest,
  type LensPresentation,
} from './demo-data';

gsap.registerPlugin(ScrollTrigger, useGSAP);

type WorkspaceView = 'member' | 'coach';

const bandLabels = {
  steady: 'Steady',
  rising: 'Rising',
  dipping: 'Dipping',
  watch: 'Watch',
} as const;

function Mark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

function Arrow({ direction = 'right' }: { direction?: 'right' | 'down' }) {
  return <span className={`arrow arrow-${direction}`} aria-hidden="true">↗</span>;
}

function Lens({ lens, selected, onSelect }: {
  lens: LensPresentation;
  selected: boolean;
  onSelect: (lens: LensPresentation) => void;
}) {
  return (
    <button
      className={`lens lens-${lens.domain}`}
      data-band={lens.band}
      aria-pressed={selected}
      onClick={() => onSelect(lens)}
    >
      <span className="lens-label">{lens.label}</span>
      <strong>{lens.signal}</strong>
      <span className="lens-band">{bandLabels[lens.band]}</span>
    </button>
  );
}

function ReviewInstrument() {
  const [selected, setSelected] = useState<LensPresentation>(lensPresentations[3]!);
  const reviewResult = useMemo(() => simulateCoachReview(reviewRequest), []);

  return (
    <div className="review-instrument hero-instrument" aria-label="Synthetic five-lens review instrument">
      <div className="instrument-bar">
        <span className="live-dot" />
        <span>Synthetic check-in</span>
        <span className="instrument-time">08:00 · Assigned</span>
      </div>
      <div className="lens-field">
        <div className="lens-aura" aria-hidden="true" />
        {lensPresentations.map((lens) => (
          <Lens key={lens.domain} lens={lens} selected={selected.domain === lens.domain} onSelect={setSelected} />
        ))}
        <div className="lens-center" aria-live="polite">
          <span>{selected.label} lens</span>
          <strong>{selected.detail}</strong>
          <small>Coach interpretation required</small>
        </div>
      </div>
      <div className="instrument-receipt">
        <div>
          <span className="receipt-label">Prepared next action</span>
          <strong>{reviewResult.conforms ? 'Protect recovery. Keep one focused practice.' : 'Review stopped.'}</strong>
        </div>
        <span className="receipt-state">Awaiting agreement</span>
      </div>
    </div>
  );
}

function ViewSwitch({ activeView, onChange }: { activeView: WorkspaceView; onChange: (view: WorkspaceView) => void }) {
  const changeWithFocus = (view: WorkspaceView) => {
    onChange(view);
    requestAnimationFrame(() => document.getElementById(`${view}-tab`)?.focus());
  };

  return (
    <div
      className="view-switch"
      role="tablist"
      aria-label="Experience view"
      onKeyDown={(event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        changeWithFocus(activeView === 'member' ? 'coach' : 'member');
      }}
    >
      <button
        id="member-tab"
        role="tab"
        type="button"
        aria-selected={activeView === 'member'}
        aria-controls="member-panel"
        tabIndex={activeView === 'member' ? 0 : -1}
        onClick={() => onChange('member')}
      >
        Member view
      </button>
      <button
        id="coach-tab"
        role="tab"
        type="button"
        aria-selected={activeView === 'coach'}
        aria-controls="coach-panel"
        tabIndex={activeView === 'coach' ? 0 : -1}
        onClick={() => onChange('coach')}
      >
        Coach studio
      </button>
    </div>
  );
}

function LensList({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'lens-list compact' : 'lens-list'}>
      {lensPresentations.map((lens) => (
        <div className="lens-row" key={lens.domain}>
          <span className={`signal signal-${lens.band}`} aria-hidden="true" />
          <span>{lens.label}</span>
          <strong>{lens.signal}</strong>
          {!compact && <small>{lens.detail}</small>}
        </div>
      ))}
    </div>
  );
}

function MemberView() {
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);

  return (
    <div id="member-panel" role="tabpanel" aria-labelledby="member-tab" className="workspace-panel member-panel">
      <div className="workspace-rail">
        <div>
          <span className="meta-label">Member today</span>
          <h3>Foundation · phase 02</h3>
        </div>
        <nav aria-label="Member workspace">
          <a href="#member-today" aria-current="page">Today</a>
          <a href="#member-program">Program</a>
          <a href="#member-knowledge">Knowledge</a>
          <a href="#member-consent">Consent</a>
        </nav>
        <div className="rail-note">
          <span>Assigned coach</span>
          <strong>Coach 001 · Synthetic</strong>
        </div>
      </div>
      <div className="workspace-main" id="member-today">
        <div className="workspace-head">
          <div>
            <span className="meta-label">Saturday · week 03</span>
            <h3>Your next useful move is clear.</h3>
          </div>
          <span className="safe-chip">Wellness structured</span>
        </div>
        <div className="member-grid">
          <article className="phase-card" id="member-program">
            <span className="meta-label">Current phase</span>
            <h4>Build capacity without losing signal.</h4>
            <div
              className="progress-track"
              role="progressbar"
              aria-label="Foundation phase progress"
              aria-valuemin={0}
              aria-valuemax={6}
              aria-valuenow={3}
              aria-valuetext="Week 3 of 6"
            >
              <span />
            </div>
            <div className="progress-copy"><span>Week 3 of 6</span><span>50%</span></div>
          </article>
          <article className="action-card">
            <span className="meta-label">Agreed next action</span>
            <h4>Protect a 20-minute recovery window, then complete one focused repetition.</h4>
            <p>Prepared from the assigned program graph. No diagnosis, treatment, or automated execution.</p>
            <button type="button" aria-expanded={receiptOpen} aria-controls="member-action-receipt" onClick={() => setReceiptOpen((open) => !open)}>
              {receiptOpen ? 'Close action receipt' : 'Open action receipt'} <Arrow />
            </button>
            {receiptOpen && (
              <dl className="inline-receipt" id="member-action-receipt">
                <div><dt>Prepared by</dt><dd>Assigned coach</dd></div>
                <div><dt>Evidence</dt><dd>2 graph nodes</dd></div>
                <div><dt>Agreement</dt><dd>Coach + member</dd></div>
              </dl>
            )}
          </article>
          <article className="signals-card">
            <div className="card-heading">
              <div><span className="meta-label">Five lenses</span><h4>Today’s check-in</h4></div>
              <span className="reviewed-state">Coach reviewed</span>
            </div>
            <LensList />
          </article>
          <article className="knowledge-card" id="member-knowledge">
            <span className="meta-label">Program knowledge</span>
            <h4>Why this action fits the phase.</h4>
            {knowledgeGraph.nodes.slice(0, 2).map((node) => (
              <div className="knowledge-item" key={node.nodeId}>
                <span>{node.domain}</span>
                <div><strong>{node.title}</strong><p>{node.summary}</p></div>
              </div>
            ))}
          </article>
          <article className="consent-card" id="member-consent">
            <span className="meta-label">Consent boundary</span>
            <h4>You control the coaching relationship.</h4>
            <p>Three scoped capabilities are active for this assignment. Raw health records and clinical data are outside this public experience.</p>
            <button type="button" aria-expanded={consentOpen} aria-controls="member-consent-scope" onClick={() => setConsentOpen((open) => !open)}>
              {consentOpen ? 'Hide consent scope' : 'Review consent scope'}
            </button>
            {consentOpen && (
              <ul className="consent-scope" id="member-consent-scope">
                <li>Submit a structured check-in</li>
                <li>Assigned coach reviews that check-in</li>
                <li>View the agreed next action</li>
              </ul>
            )}
          </article>
        </div>
      </div>
    </div>
  );
}

function EvidenceFlow() {
  return (
    <div className="evidence-flow" aria-label="Evidence path from context to proposed action">
      <div className="evidence-node">
        <span>Context</span>
        <strong>Available practice window</strong>
        <small>Approved · Aug 01</small>
      </div>
      <div className="flow-relation"><span>constrains</span></div>
      <div className="evidence-node">
        <span>Recovery</span>
        <strong>Load and recovery balance</strong>
        <small>Approved · Aug 01</small>
      </div>
      <div className="flow-relation"><span>prepares for</span></div>
      <div className="evidence-node action-node">
        <span>Next action</span>
        <strong>Protect recovery, keep one repetition</strong>
        <small>Coach + member agreement</small>
      </div>
    </div>
  );
}

function CoachView() {
  const decisions = {
    adjust: {
      label: 'Prepare adjustment',
      title: 'Protect recovery. Keep one focused practice.',
      proposedAction: reviewRequest.proposedAction,
    },
    continue: {
      label: 'Continue phase',
      title: 'Continue the phase with one deliberate repetition.',
      proposedAction: {
        ...reviewRequest.proposedAction,
        actionId: 'action_continue_phase',
        actionTemplateId: 'template_continue_focused_practice',
        domain: 'performance' as const,
        kind: 'continue-program' as const,
        evidenceNodeIds: ['node_deliberate_repetition'],
      },
    },
    referral: {
      label: 'Request referral',
      title: 'Stop the coaching action and prepare a qualified-care handoff.',
      proposedAction: {
        ...reviewRequest.proposedAction,
        actionId: 'action_referral_handoff',
        actionTemplateId: 'template_qualified_care_handoff',
        domain: 'context' as const,
        kind: 'referral-handoff' as const,
        evidenceNodeIds: ['node_context_window'],
      },
    },
  } as const;
  const [selectedDecision, setSelectedDecision] = useState<keyof typeof decisions>('adjust');
  const activeDecision = decisions[selectedDecision];
  const reviewResult = useMemo(
    () => simulateCoachReview({ ...reviewRequest, proposedAction: activeDecision.proposedAction }),
    [activeDecision],
  );

  return (
    <div id="coach-panel" role="tabpanel" aria-labelledby="coach-tab" className="workspace-panel coach-panel">
      <div className="coach-queue">
        <div className="queue-head"><span className="meta-label">Review inbox</span><strong>3 assigned</strong></div>
        <div className="queue-item active" aria-current="true">
          <span className="queue-avatar">01</span>
          <span><strong>Member 001</strong><small>Foundation · submitted 08:00</small></span>
          <span className="queue-signal">Review</span>
        </div>
        <div className="queue-item">
          <span className="queue-avatar">02</span>
          <span><strong>Member 002</strong><small>Build · agreed yesterday</small></span>
          <span className="queue-signal quiet">Clear</span>
        </div>
        <div className="queue-item">
          <span className="queue-avatar">03</span>
          <span><strong>Member 003</strong><small>Reset · referral boundary</small></span>
          <span className="queue-signal referral">Handoff</span>
        </div>
      </div>
      <div className="coach-review">
        <div className="workspace-head">
          <div><span className="meta-label">Assigned review · synthetic</span><h3>One decision, with its evidence attached.</h3></div>
          <div className="binding-state"><span className="live-dot" /> Assignment and consent current</div>
        </div>
        <div className="coach-grid">
          <article className="coach-signals">
            <span className="meta-label">Submitted context</span>
            <LensList compact />
          </article>
          <article className="coach-decision">
            <span className="meta-label">Proposed action</span>
            <h4>{activeDecision.title}</h4>
            <p>This draft is non-executable and remains incomplete until coach and member agreement.</p>
            <div className="decision-actions" role="group" aria-label="Synthetic decision options">
              {Object.entries(decisions).map(([key, decision]) => (
                <button
                  key={key}
                  type="button"
                  className={selectedDecision === key ? 'selected' : undefined}
                  aria-pressed={selectedDecision === key}
                  onClick={() => setSelectedDecision(key as keyof typeof decisions)}
                >
                  {decision.label}
                </button>
              ))}
            </div>
          </article>
          <article className="coach-evidence">
            <div className="card-heading">
              <div><span className="meta-label">Knowledge graph</span><h4>Evidence path</h4></div>
              <span className="safe-chip">2 sources · reviewed</span>
            </div>
            <EvidenceFlow />
          </article>
          <article className="audit-card">
            <span className="meta-label">Audit receipt preview</span>
            <dl>
              <div><dt>Contract</dt><dd>{reviewResult.code}</dd></div>
              <div><dt>Authority</dt><dd>{reviewResult.authorityStatus}</dd></div>
              <div><dt>Execution</dt><dd>{reviewResult.executionPermitted ? 'Permitted' : 'Not permitted'}</dd></div>
              <div><dt>Agreement</dt><dd>{reviewResult.conforms ? reviewResult.agreementRequired.join(' + ') : 'Not available'}</dd></div>
            </dl>
          </article>
        </div>
      </div>
    </div>
  );
}

function ProductWorkspace() {
  const [activeView, setActiveView] = useState<WorkspaceView>('member');
  return (
    <section className="workspace-scene" id="experience" aria-labelledby="experience-title">
      <div className="scene-heading">
        <div>
          <span className="section-index">01 · Product proof</span>
          <h2 id="experience-title">Two people. One shared truth.</h2>
        </div>
        <p>The member understands today. The coach understands why. Neither has to reconstruct the relationship from messages, spreadsheets, and memory.</p>
      </div>
      <ViewSwitch activeView={activeView} onChange={setActiveView} />
      <div className="workspace-shell">
        <div className="workspace-brand"><Mark /><span>Coach Performance OS</span><small>Synthetic product proof</small></div>
        {activeView === 'member' ? <MemberView /> : <CoachView />}
      </div>
    </section>
  );
}

function ReviewStory() {
  return (
    <section className="review-story" id="method" aria-labelledby="review-title">
      <div className="review-copy">
        <span className="section-index">02 · Review method</span>
        <h2 id="review-title">Context becomes a decision. Never a verdict.</h2>
        <p className="review-intro">Five bounded signals enter the review. Curated knowledge explains the relationship. One non-executable action leaves with its receipt.</p>
        <ol className="review-steps">
          <li data-review-step="signals"><span>01</span><div><strong>Read the whole context</strong><p>Body, mind, performance, recovery, and real-life constraints stay distinct.</p></div></li>
          <li data-review-step="evidence"><span>02</span><div><strong>Trace the useful relationship</strong><p>Program knowledge—not private member data—explains why an adjustment fits.</p></div></li>
          <li data-review-step="receipt"><span>03</span><div><strong>Prepare one agreed action</strong><p>The coach proposes. The member agrees. The public runtime executes nothing.</p></div></li>
        </ol>
      </div>
      <div className="review-stage">
        <div className="stage-chrome"><span className="live-dot" /><span>Structured review</span><small>Report only</small></div>
        <div className="review-frames">
          <article className="review-state review-frame-signals" data-review-state="signals">
            <span className="meta-label">Signal frame</span>
            <h3>Five lenses preserve the whole context.</h3>
            <LensList />
          </article>
          <article className="review-state review-frame-evidence" data-review-state="evidence">
            <span className="meta-label">Evidence frame</span>
            <h3>The relevant path stays inspectable.</h3>
            <EvidenceFlow />
          </article>
          <article className="review-state review-frame-receipt" data-review-state="receipt">
            <span className="meta-label">Decision frame</span>
            <div className="receipt-seal"><Mark /></div>
            <h3>Protect recovery. Keep one focused practice.</h3>
            <p>Coach prepared · Member agreement required · Execution not permitted</p>
            <div className="receipt-proof"><span>2 evidence nodes</span><span>Consent current</span><span>Audit draft ready</span></div>
          </article>
        </div>
      </div>
    </section>
  );
}

function CapabilityColumns() {
  return (
    <section className="capability-scene" id="capabilities" aria-labelledby="capability-title">
      <div className="scene-heading">
        <div><span className="section-index">03 · Capability boundary</span><h2 id="capability-title">Designed around the relationship—not the dashboard.</h2></div>
        <p>Every capability is scoped to a role, an assignment, current consent, and a visible next decision.</p>
      </div>
      <div className="capability-columns">
        <article>
          <header><span>Member</span><strong>Agency without admin work</strong></header>
          <ul>{memberCapabilities.map(([title, text]) => <li key={title}><span>{title}</span><p>{text}</p></li>)}</ul>
        </article>
        <article>
          <header><span>Coach</span><strong>Judgment with provenance</strong></header>
          <ul>{coachCapabilities.map(([title, text]) => <li key={title}><span>{title}</span><p>{text}</p></li>)}</ul>
        </article>
      </div>
      <aside className="boundary-band">
        <span className="boundary-symbol">↳</span>
        <div><strong>When the work becomes clinical, coaching stops.</strong><p>The experience exposes a qualified-care handoff boundary; it does not diagnose, interpret treatment, or manufacture authority.</p></div>
        <span className="safe-chip">Referral route</span>
      </aside>
    </section>
  );
}

function OfferScene() {
  const [notice, setNotice] = useState('');
  return (
    <section className="offer-scene" id="application" aria-labelledby="offer-title">
      <div className="offer-copy">
        <span className="section-index">04 · Private implementation</span>
        <h2 id="offer-title">Your method, made legible between sessions.</h2>
        <p>For premium independent coaches and performance teams ready to turn an expert method into a trusted member experience—without pretending software is the coach.</p>
        <button type="button" onClick={() => setNotice('Synthetic demo only. Connect an approved CRM and private authority store during implementation.')}>Prepare a private pilot <Arrow /></button>
        {notice && <p className="application-notice" role="status">{notice}</p>}
      </div>
      <div className="offer-ledger">
        <div><span>01</span><strong>Method architecture</strong><p>Map phases, practices, evidence, boundaries, and the review cadence.</p></div>
        <div><span>02</span><strong>Member experience</strong><p>Build today, program, knowledge, progress, consent, and agreement surfaces.</p></div>
        <div><span>03</span><strong>Coach studio</strong><p>Build the assigned review queue, provenance path, decisions, and receipts.</p></div>
        <div><span>04</span><strong>Private deployment</strong><p>Connect identity, storage, authority, CRM, analytics, and approved communications.</p></div>
      </div>
    </section>
  );
}

export function App() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const media = gsap.matchMedia();

    media.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set('[data-hero-reveal], .review-state, [data-review-step]', { clearProps: 'all' });
    });

    media.add('(prefers-reduced-motion: no-preference)', () => {
      const hero = gsap.timeline({ defaults: { ease: 'power3.out' } });
      hero
        .from('[data-hero-reveal="label"]', { autoAlpha: 0, y: 18, duration: 0.55 })
        .from('[data-hero-reveal="title"]', { autoAlpha: 0, y: 38, duration: 0.9 }, '-=0.25')
        .from('[data-hero-reveal="copy"]', { autoAlpha: 0, y: 22, duration: 0.7 }, '-=0.5')
        .from('[data-hero-reveal="actions"]', { autoAlpha: 0, y: 16, duration: 0.55 }, '-=0.38')
        .from('.hero-instrument', { autoAlpha: 0, x: 36, scale: 0.975, duration: 1 }, '-=0.82')
        .from('.lens', { autoAlpha: 0, scale: 0.72, duration: 0.62, stagger: 0.055 }, '-=0.56');
    });

    media.add('(min-width: 960px) and (prefers-reduced-motion: no-preference)', () => {
      const states = gsap.utils.toArray<HTMLElement>('.review-state');
      const steps = gsap.utils.toArray<HTMLElement>('[data-review-step]');
      const [signalState, evidenceState, receiptState] = states;
      const [signalStep, evidenceStep, receiptStep] = steps;
      if (!signalState || !evidenceState || !receiptState || !signalStep || !evidenceStep || !receiptStep) return;

      gsap.set(states, { autoAlpha: 0, y: 28 });
      gsap.set(signalState, { autoAlpha: 1, y: 0 });
      gsap.set(steps, { opacity: 0.34 });
      gsap.set(signalStep, { opacity: 1 });

      const story = gsap.timeline({
        scrollTrigger: {
          trigger: '.review-story',
          start: 'top top+=72',
          end: '+=170%',
          scrub: 0.65,
          pin: '.review-stage',
          anticipatePin: 1,
        },
      });

      story
        .to(signalState, { autoAlpha: 0, y: -20, duration: 0.35 })
        .to(signalStep, { opacity: 0.34, duration: 0.2 }, '<')
        .to(evidenceState, { autoAlpha: 1, y: 0, duration: 0.55 })
        .to(evidenceStep, { opacity: 1, duration: 0.25 }, '<')
        .to({}, { duration: 0.35 })
        .to(evidenceState, { autoAlpha: 0, y: -20, duration: 0.35 })
        .to(evidenceStep, { opacity: 0.34, duration: 0.2 }, '<')
        .to(receiptState, { autoAlpha: 1, y: 0, duration: 0.55 })
        .to(receiptStep, { opacity: 1, duration: 0.25 }, '<');
    });

    media.add('(pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      const instrument = root.current?.querySelector<HTMLElement>('.hero-instrument');
      if (!instrument) return;
      const moveX = gsap.quickTo(instrument, 'x', { duration: 0.5, ease: 'power3.out' });
      const moveY = gsap.quickTo(instrument, 'y', { duration: 0.5, ease: 'power3.out' });
      const onPointerMove = (event: PointerEvent) => {
        const rect = instrument.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        instrument.style.setProperty('--pointer-x', `${(x + 0.5) * 100}%`);
        instrument.style.setProperty('--pointer-y', `${(y + 0.5) * 100}%`);
        moveX(x * 8);
        moveY(y * 8);
      };
      const onPointerLeave = () => { moveX(0); moveY(0); };
      instrument.addEventListener('pointermove', onPointerMove);
      instrument.addEventListener('pointerleave', onPointerLeave);
      return () => {
        instrument.removeEventListener('pointermove', onPointerMove);
        instrument.removeEventListener('pointerleave', onPointerLeave);
      };
    });

    return () => media.revert();
  }, { scope: root });

  useEffect(() => {
    const onHashChange = () => document.documentElement.classList.remove('nav-open');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return (
    <div ref={root} className="site-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <a href="#top" className="wordmark" aria-label="Coach Performance OS home"><Mark /><span>Coach Performance OS</span></a>
        <nav aria-label="Primary navigation"><a href="#experience">Experience</a><a href="#method">Method</a><a href="#capabilities">Capabilities</a></nav>
        <a className="header-action" href="#application">Private pilot <Arrow /></a>
      </header>

      <main id="main">
        <section className="hero" id="top" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="hero-label" data-hero-reveal="label"><span className="live-dot" /> Synthetic product experience · No member data</span>
            <h1 id="hero-title" data-hero-reveal="title">Coaching, with every decision in view.</h1>
            <p data-hero-reveal="copy">One calm place to understand the person, guide the program, and prove what happens next—across body, mind, performance, recovery, and real life.</p>
            <div className="hero-actions" data-hero-reveal="actions">
              <a className="primary-action" href="#experience">Enter the member day <Arrow /></a>
              <a className="text-action" href="#method">See the review method <Arrow direction="down" /></a>
            </div>
            <div className="hero-proof" data-hero-reveal="actions">
              <span><strong>5</strong> bounded lenses</span>
              <span><strong>2</strong> required agreements</span>
              <span><strong>0</strong> automated decisions</span>
            </div>
          </div>
          <ReviewInstrument />
        </section>

        <ProductWorkspace />
        <ReviewStory />
        <CapabilityColumns />
        <OfferScene />
      </main>

      <footer className="site-footer">
        <div><Mark /><strong>Coach Performance OS</strong></div>
        <p>A synthetic, report-only experience built on Agentic Life OS contracts. Not medical advice, diagnosis, treatment, or a production authority system.</p>
        <a href="#top">Return to top ↑</a>
      </footer>
    </div>
  );
}
