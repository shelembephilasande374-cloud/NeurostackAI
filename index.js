import { useState } from 'react';
import Head from 'next/head';
import { UserButton, SignInButton, useUser } from '@clerk/nextjs';

export default function Home() {
  const { isSignedIn } = useUser();
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState('summary');
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mastered, setMastered] = useState([]);
  const [usage, setUsage] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const FREE_LIMIT = 3;
  const wordCount = notes.trim() ? notes.trim().split(/\s+/).length : 0;
  const remaining = Math.max(0, FREE_LIMIT - usage);

  async function generate() {
    setError('');
    setResult(null);
    setLoading(true);
    setCardIndex(0);
    setFlipped(false);
    setMastered([]);
    setShowUpgrade(false);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      const data = await res.json();

      if (res.status === 403 && data.error === 'free_limit_reached') {
        setShowUpgrade(true);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        setLoading(false);
        return;
      }

      setResult(data);
      setUsage(data.usage || 0);
      setTab('summary');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function nextCard() {
    setFlipped(false);
    setTimeout(() => setCardIndex(i => Math.min(i + 1, result.flashcards.length - 1)), 150);
  }
  function prevCard() {
    setFlipped(false);
    setTimeout(() => setCardIndex(i => Math.max(i - 1, 0)), 150);
  }
  function markMastered() {
    setMastered(m => [...new Set([...m, cardIndex])]);
    if (cardIndex < result.flashcards.length - 1) nextCard();
  }

  const card = result?.flashcards[cardIndex];

  return (
    <>
      <Head>
        <title>NeuroStack — Turn notes into flashcards</title>
        <meta name="description" content="Paste your notes. Get flashcards and a summary instantly." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={st.page}>
        {/* Header */}
        <header style={st.header}>
          <div style={st.logo}>Neuro<span style={st.logoAccent}>Stack</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isSignedIn && usage > 0 && (
              <span style={remaining === 0 ? st.usagePillRed : st.usagePill}>
                {remaining === 0 ? 'No generations left' : `${remaining} free left`}
              </span>
            )}
            {isSignedIn ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <SignInButton mode="modal">
                <button style={st.signInBtn}>Sign in</button>
              </SignInButton>
            )}
          </div>
        </header>

        <main style={st.main}>

          {/* Hero — only on empty state */}
          {!result && !showUpgrade && (
            <div style={st.hero}>
              <h1 style={st.heroTitle}>
                Turn your notes into<br />
                <span style={st.heroAccent}>flashcards & summaries</span>
              </h1>
              <p style={st.heroSub}>
                Paste any notes — lectures, textbooks, study guides. AI generates smart flashcards and a clean summary in seconds.
              </p>
              {!isSignedIn && (
                <div style={st.freeBanner}>✦ 3 free generations · No credit card needed</div>
              )}
            </div>
          )}

          {/* Upgrade wall */}
          {showUpgrade && (
            <div style={st.upgradeCard} className="fade-up">
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎓</div>
              <h2 style={st.upgradeTitle}>You've used all 3 free generations</h2>
              <p style={st.upgradeSub}>
                Upgrade to keep generating flashcards — less than a coffee.
              </p>
              <div style={st.pricingRow}>
                <div style={st.pricingCard}>
                  <div style={st.pricingLabel}>Student</div>
                  <div style={st.pricingPrice}>$4.99 <span style={st.pricingPer}>/month</span></div>
                  <ul style={st.pricingFeatures}>
                    <li>✓ Unlimited generations</li>
                    <li>✓ All subjects</li>
                    <li>✓ Cancel anytime</li>
                  </ul>
                  <button style={st.upgradeBtn} onClick={() => alert('Stripe payments coming soon!')}>
                    Upgrade for $4.99/mo →
                  </button>
                </div>

                <div style={{ ...st.pricingCard, borderColor: 'rgba(170,255,69,0.3)' }}>
                  <div style={st.popularBadge}>Most popular</div>
                  <div style={st.pricingLabel}>Exam Bundle</div>
                  <div style={st.pricingPrice}>$7.99 <span style={st.pricingPer}>one-time</span></div>
                  <ul style={st.pricingFeatures}>
                    <li>✓ 30 days unlimited</li>
                    <li>✓ No subscription</li>
                    <li>✓ Perfect for exam season</li>
                  </ul>
                  <button style={st.upgradeBtn} onClick={() => alert('Stripe payments coming soon!')}>
                    Get 30 days →
                  </button>
                </div>
              </div>
              <button style={st.backBtn} onClick={() => setShowUpgrade(false)}>← Go back</button>
            </div>
          )}

          {/* Input box */}
          {!showUpgrade && (
            <div style={st.inputCard}>
              <label style={st.label}>Your notes</label>
              <textarea
                style={st.textarea}
                placeholder="Paste your notes here... lecture notes, textbook chapters, study material. The more detail, the better the flashcards."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={8}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <span style={st.wordCount}>{wordCount} words</span>
                {result && (
                  <button onClick={() => { setResult(null); setNotes(''); }} style={st.clearBtn}>
                    ← Start over
                  </button>
                )}
              </div>
              <button
                onClick={generate}
                disabled={loading || wordCount < 10}
                style={loading || wordCount < 10 ? st.generateBtnOff : st.generateBtn}
              >
                {loading ? <><span className="spinner" />Generating...</> : '✦ Generate flashcards & summary'}
              </button>
            </div>
          )}

          {/* Error */}
          {error && <div style={st.errorBox}>⚠ {error}</div>}

          {/* Results */}
          {result && (
            <div className="fade-up">
              <div style={st.tabRow}>
                <button style={tab === 'summary' ? st.tabActive : st.tab} onClick={() => setTab('summary')}>
                  📋 Summary notes
                </button>
                <button style={tab === 'cards' ? st.tabActive : st.tab} onClick={() => { setTab('cards'); setFlipped(false); }}>
                  🃏 Flashcards ({result.flashcards.length})
                </button>
              </div>

              {tab === 'summary' && (
                <div style={st.resultCard} className="fade-up">
                  <div style={st.resultTitle}>📋 Key concepts summary</div>
                  <div style={{ marginBottom: '24px' }}>
                    {result.summary.map((pt, i) => (
                      <div key={i} style={st.bulletItem}>
                        <div style={st.dot} />
                        <span style={st.bulletText}>{pt}</span>
                      </div>
                    ))}
                  </div>
                  <button style={st.switchBtn} onClick={() => { setTab('cards'); setCardIndex(0); setFlipped(false); }}>
                    Study flashcards →
                  </button>
                </div>
              )}

              {tab === 'cards' && card && (
                <div className="fade-up">
                  <div style={st.progressRow}>
                    <span style={st.progressLabel}>
                      Card {cardIndex + 1} of {result.flashcards.length}
                      {mastered.includes(cardIndex) && <span style={st.masteredBadge}>✓ Mastered</span>}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--lime)', fontWeight: '700' }}>
                      {mastered.length}/{result.flashcards.length} mastered
                    </span>
                  </div>
                  <div style={st.pbWrap}>
                    <div style={{ ...st.pbFill, width: `${(mastered.length / result.flashcards.length) * 100}%` }} />
                  </div>

                  <div style={st.cardWrap} onClick={() => setFlipped(f => !f)}>
                    <div style={flipped ? st.cardInnerFlipped : st.cardInner}>
                      <div style={st.cardFront}>
                        <span style={st.cardLabel}>Question</span>
                        <p style={st.cardQ}>{card.question}</p>
                        <span style={{ fontSize: '12px', color: 'var(--t3)', marginTop: '8px' }}>Tap to reveal answer</span>
                      </div>
                      <div style={st.cardBack}>
                        <span style={st.cardLabelGreen}>Answer</span>
                        <p style={st.cardA}>{card.answer}</p>
                        {card.hint && <p style={st.cardHint}>💡 {card.hint}</p>}
                      </div>
                    </div>
                  </div>

                  <div style={st.navRow}>
                    <button style={cardIndex === 0 ? st.navBtnOff : st.navBtn} onClick={prevCard} disabled={cardIndex === 0}>← Prev</button>
                    <button style={st.masterBtn} onClick={markMastered}>✓ Got it</button>
                    <button style={cardIndex === result.flashcards.length - 1 ? st.navBtnOff : st.navBtn} onClick={nextCard} disabled={cardIndex === result.flashcards.length - 1}>Next →</button>
                  </div>

                  {mastered.length === result.flashcards.length && (
                    <div style={st.doneBox} className="fade-up">
                      🎉 You mastered all {result.flashcards.length} cards!
                      <button style={st.retryBtn} onClick={() => { setMastered([]); setCardIndex(0); setFlipped(false); }}>Study again</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
        <footer style={st.footer}>Built with Next.js + Gemini AI · 3 free generations per account</footer>
      </div>
    </>
  );
}

const st = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' },
  header: { padding: '16px 28px', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg2)', position: 'sticky', top: 0, zIndex: 10 },
  logo: { fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', color: 'var(--t1)' },
  logoAccent: { color: 'var(--lime)' },
  usagePill: { fontSize: '12px', fontWeight: '600', background: 'rgba(255,180,60,0.1)', border: '1px solid rgba(255,180,60,0.3)', color: '#FFB347', padding: '4px 12px', borderRadius: '20px' },
  usagePillRed: { fontSize: '12px', fontWeight: '600', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', color: '#FF6B6B', padding: '4px 12px', borderRadius: '20px' },
  signInBtn: { fontSize: '13px', fontWeight: '600', background: 'var(--lime-dim)', border: '1px solid var(--lime-border)', color: 'var(--lime)', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer' },
  main: { flex: 1, maxWidth: '780px', width: '100%', margin: '0 auto', padding: '40px 24px' },
  hero: { textAlign: 'center', marginBottom: '40px' },
  heroTitle: { fontSize: 'clamp(26px, 5vw, 42px)', fontWeight: '800', letterSpacing: '-1px', lineHeight: 1.2, marginBottom: '16px', color: 'var(--t1)' },
  heroAccent: { color: 'var(--lime)' },
  heroSub: { fontSize: '16px', color: 'var(--t2)', maxWidth: '520px', margin: '0 auto 20px', lineHeight: 1.7 },
  freeBanner: { display: 'inline-block', fontSize: '13px', fontWeight: '600', background: 'var(--lime-dim)', border: '1px solid var(--lime-border)', color: 'var(--lime)', padding: '8px 20px', borderRadius: '20px' },
  inputCard: { background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: '20px', padding: '28px', marginBottom: '24px' },
  label: { fontSize: '11px', fontWeight: '700', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px', display: 'block' },
  textarea: { width: '100%', minHeight: '200px', background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: '12px', padding: '16px', fontSize: '14px', color: 'var(--t1)', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.7' },
  wordCount: { fontSize: '12px', color: 'var(--t3)' },
  clearBtn: { fontSize: '13px', color: 'var(--t2)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' },
  generateBtn: { width: '100%', padding: '16px', background: 'var(--lime)', color: '#0B0B14', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '16px' },
  generateBtnOff: { width: '100%', padding: '16px', background: 'var(--bg3)', color: 'var(--t3)', border: '1px solid var(--bd)', borderRadius: '14px', fontSize: '15px', fontWeight: '700', cursor: 'not-allowed', marginTop: '16px' },
  errorBox: { background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: '12px', padding: '14px 18px', fontSize: '14px', color: '#FF6B6B', marginBottom: '20px' },
  tabRow: { display: 'flex', gap: '10px', marginBottom: '24px' },
  tab: { flex: 1, padding: '13px', background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: '12px', fontSize: '14px', fontWeight: '600', color: 'var(--t2)', cursor: 'pointer', textAlign: 'center' },
  tabActive: { flex: 1, padding: '13px', background: 'var(--lime-dim)', border: '1px solid var(--lime-border)', borderRadius: '12px', fontSize: '14px', fontWeight: '700', color: 'var(--lime)', cursor: 'pointer', textAlign: 'center' },
  resultCard: { background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: '20px', padding: '28px' },
  resultTitle: { fontSize: '18px', fontWeight: '700', marginBottom: '22px', color: 'var(--t1)' },
  bulletItem: { display: 'flex', gap: '14px', marginBottom: '14px', alignItems: 'flex-start' },
  dot: { width: '7px', height: '7px', borderRadius: '50%', background: 'var(--lime)', marginTop: '9px', flexShrink: 0 },
  bulletText: { fontSize: '15px', color: 'var(--t1)', lineHeight: '1.65' },
  switchBtn: { width: '100%', padding: '14px', background: 'var(--lime)', color: '#0B0B14', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  progressRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  progressLabel: { fontSize: '13px', color: 'var(--t2)', fontWeight: '600' },
  masteredBadge: { marginLeft: '8px', fontSize: '11px', background: 'var(--lime-dim)', color: 'var(--lime)', border: '1px solid var(--lime-border)', padding: '2px 8px', borderRadius: '8px' },
  pbWrap: { background: 'var(--bg3)', borderRadius: '4px', height: '5px', overflow: 'hidden', marginBottom: '24px' },
  pbFill: { height: '100%', background: 'var(--lime)', borderRadius: '4px', transition: 'width 0.5s' },
  cardWrap: { perspective: '1200px', height: '240px', cursor: 'pointer', marginBottom: '20px' },
  cardInner: { position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d', transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)' },
  cardInnerFlipped: { position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d', transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)', transform: 'rotateY(180deg)' },
  cardFront: { position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center' },
  cardBack: { position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', background: '#13132A', border: '1px solid rgba(170,255,69,0.2)', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center', transform: 'rotateY(180deg)' },
  cardLabel: { fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--t3)', marginBottom: '16px' },
  cardLabelGreen: { fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--lime)', marginBottom: '16px', opacity: 0.8 },
  cardQ: { fontSize: '19px', fontWeight: '700', color: 'var(--t1)', lineHeight: '1.4', marginBottom: '10px' },
  cardA: { fontSize: '15px', color: 'var(--t1)', lineHeight: '1.6', marginBottom: '12px' },
  cardHint: { fontSize: '13px', color: 'var(--t2)', fontStyle: 'italic' },
  navRow: { display: 'flex', gap: '10px', marginBottom: '16px' },
  navBtn: { flex: 1, padding: '13px', background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: '12px', fontSize: '14px', fontWeight: '600', color: 'var(--t1)', cursor: 'pointer' },
  navBtnOff: { flex: 1, padding: '13px', background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: '12px', fontSize: '14px', fontWeight: '600', color: 'var(--t3)', cursor: 'not-allowed' },
  masterBtn: { flex: 2, padding: '13px', background: 'var(--lime)', color: '#0B0B14', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  doneBox: { background: 'var(--lime-dim)', border: '1px solid var(--lime-border)', borderRadius: '16px', padding: '20px 24px', textAlign: 'center', fontSize: '16px', fontWeight: '600', color: 'var(--lime)', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' },
  retryBtn: { padding: '10px 24px', background: 'var(--lime)', color: '#0B0B14', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  upgradeCard: { background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: '24px', padding: '40px 32px', textAlign: 'center', marginBottom: '24px' },
  upgradeTitle: { fontSize: '24px', fontWeight: '800', color: 'var(--t1)', marginBottom: '12px', letterSpacing: '-0.5px' },
  upgradeSub: { fontSize: '15px', color: 'var(--t2)', marginBottom: '32px', maxWidth: '420px', margin: '0 auto 32px' },
  pricingRow: { display: 'flex', gap: '16px', marginBottom: '28px', justifyContent: 'center', flexWrap: 'wrap' },
  pricingCard: { background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: '16px', padding: '24px', flex: 1, minWidth: '200px', maxWidth: '240px', textAlign: 'left', position: 'relative' },
  pricingLabel: { fontSize: '12px', fontWeight: '700', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' },
  pricingPrice: { fontSize: '30px', fontWeight: '800', color: 'var(--t1)', marginBottom: '16px', letterSpacing: '-1px' },
  pricingPer: { fontSize: '13px', fontWeight: '500', color: 'var(--t2)' },
  pricingFeatures: { listStyle: 'none', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--t2)' },
  upgradeBtn: { width: '100%', padding: '13px', background: 'var(--lime)', color: '#0B0B14', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  popularBadge: { position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--lime)', color: '#0B0B14', fontSize: '11px', fontWeight: '700', padding: '4px 14px', borderRadius: '20px', whiteSpace: 'nowrap' },
  backBtn: { background: 'none', border: 'none', color: 'var(--t2)', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  footer: { textAlign: 'center', padding: '24px', fontSize: '12px', color: 'var(--t3)', borderTop: '1px solid var(--bd)' },
};
