import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const MSG = {
  en: {
    name: "Please enter your name.",
    email: "Please enter a valid email address.",
    consent: "Please tick the box so we can email you.",
    generic: "Something went wrong. Please try again.",
    sending: "Joining…",
    submit: "Join the waitlist"
  },
  ml: {
    name: "ദയവായി നിങ്ങളുടെ പേര് നൽകുക.",
    email: "ദയവായി ശരിയായ ഇമെയിൽ വിലാസം നൽകുക.",
    consent: "ഞങ്ങൾക്ക് ഇമെയിൽ അയയ്ക്കാൻ ബോക്സ് ടിക്ക് ചെയ്യുക.",
    generic: "എന്തോ പിശക് സംഭവിച്ചു. വീണ്ടും ശ്രമിക്കുക.",
    sending: "ചേർക്കുന്നു…",
    submit: "വെയിറ്റ്‌ലിസ്റ്റിൽ ചേരുക"
  }
};

export default function Waitlist() {
  const [lang, setLang] = useState('en');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [doneEmail, setDoneEmail] = useState('');
  const [waitlistCount, setWaitlistCount] = useState(0);

  function t(key) { return MSG[lang][key]; }

  // Fetch waitlist count
  useEffect(() => {
    async function fetchCount() {
      try {
        const { count, error } = await supabase
          .from('waitlist')
          .select('*', { count: 'exact', head: true });
        if (!error && count !== null) setWaitlistCount(count);
      } catch (e) {
        console.error('Failed to fetch waitlist count:', e);
      }
    }
    fetchCount();
  }, []);

  function validate() {
    const errs = {};
    if (!name.trim() || name.trim().length > 80) errs.name = 'name';
    if (!EMAIL_RE.test(email.trim()) || email.trim().length > 254) errs.email = 'email';
    if (!consent) errs.consent = 'consent';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (sending) return;
    if (!validate()) return;

    setSending(true);
    setErrors({});

    try {
      const { error } = await supabase
        .from('waitlist')
        .insert({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          lang,
          consent_text: lang === 'en'
            ? 'Email me when Krewgrid launches in Kochi. I can unsubscribe anytime.'
            : 'കൊച്ചിയിൽ Krewgrid ആരംഭിക്കുമ്പോൾ എനിക്ക് ഇമെയിൽ അയയ്ക്കുക. എപ്പോൾ വേണമെങ്കിലും അൺസബ്സ്ക്രൈബ് ചെയ്യാം.'
        });

      if (error) {
        console.error("Waitlist submission error:", error);
        if (error.code === '23505') {
          // Duplicate email — still show success
          setDoneEmail(email.trim().toLowerCase());
          setDone(true);
        } else {
          setErrors({ form: 'generic' });
        }
      } else {
        setDoneEmail(email.trim().toLowerCase());
        setDone(true);
        setWaitlistCount(prev => prev + 1);
      }
    } catch (err) {
      console.error("Waitlist exception:", err);
      setErrors({ form: 'generic' });
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Noto+Sans+Malayalam:wght@400;600;700&display=swap" rel="stylesheet" />

      <div style={{
        minHeight: '100vh',
        background: '#f2f3f7',
        fontFamily: lang === 'ml' ? '"Noto Sans Malayalam", "Geist", system-ui, sans-serif' : '"Geist", system-ui, -apple-system, "Segoe UI", sans-serif',
        color: '#14151f',
        fontSize: 16,
        lineHeight: lang === 'ml' ? 1.7 : 1.55,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <header style={{
          width: '100%',
          maxWidth: 1080,
          margin: '0 auto',
          padding: '20px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <a href="./" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
            <picture>
              <source srcSet="/krewgrid-logo-white.png" media="(prefers-color-scheme: dark)" />
              <img
                src="/krewgrid-logo.png"
                alt="Krewgrid"
                className="krewgrid-nav-logo"
                style={{ height: 44, width: 'auto', display: 'block', objectFit: 'contain' }}
              />
            </picture>
          </a>
          <div style={{
            display: 'inline-flex',
            background: '#ffffff',
            border: '1px solid #e3e5ee',
            borderRadius: 999,
            padding: 3,
          }}>
            <button onClick={() => setLang('en')} style={{
              border: 0,
              background: lang === 'en' ? '#3b3fd8' : 'transparent',
              color: lang === 'en' ? '#fff' : '#5d6175',
              fontFamily: '"Geist", system-ui, sans-serif',
              fontSize: 14,
              fontWeight: 600,
              padding: '6px 14px',
              borderRadius: 999,
              cursor: 'pointer',
              minHeight: 36,
            }}>EN</button>
            <button onClick={() => setLang('ml')} style={{
              border: 0,
              background: lang === 'ml' ? '#3b3fd8' : 'transparent',
              color: lang === 'ml' ? '#fff' : '#5d6175',
              fontFamily: '"Noto Sans Malayalam", "Geist", system-ui, sans-serif',
              fontSize: 14,
              fontWeight: 600,
              padding: '6px 14px',
              borderRadius: 999,
              cursor: 'pointer',
              minHeight: 36,
            }}>മലയാളം</button>
          </div>
        </header>

        {/* Main */}
        <main className="waitlist-main">
          {/* Hero */}
          <section>
            <p style={{
              display: 'inline-block',
              margin: '0 0 14px',
              padding: '6px 12px',
              borderRadius: 999,
              background: '#fff4de',
              color: '#8a5a00',
              fontSize: 14,
              fontWeight: 600,
            }}>
              {lang === 'en' ? 'For catering workers in Kochi' : 'കൊച്ചിയിലെ കാറ്ററിംഗ് തൊഴിലാളികൾക്ക്'}
            </p>

            <h1 style={{
              margin: '0 0 14px',
              fontSize: 'clamp(32px, 7vw, 52px)',
              lineHeight: lang === 'ml' ? 1.3 : 1.08,
              letterSpacing: lang === 'ml' ? 0 : '-0.03em',
              fontWeight: 700,
            }}>
              {lang === 'en' ? (
                <>Catering shifts in Kochi. <span style={{ color: '#3b3fd8' }}>Zero commission.</span></>
              ) : (
                <>കൊച്ചിയിലെ കാറ്ററിംഗ് ജോലികൾ. <span style={{ color: '#3b3fd8' }}>കമ്മീഷൻ ഇല്ല.</span></>
              )}
            </h1>

            <p style={{ margin: '0 0 24px', color: '#5d6175', fontSize: 18, maxWidth: '34em' }}>
              {lang === 'en'
                ? "Find work with verified caterers, check in from your phone, and keep every rupee you earn. Join the waitlist and we'll email you the day we launch."
                : 'പരിശോധിച്ച കാറ്ററിംഗ് ബിസിനസുകളിൽ ജോലി കണ്ടെത്തൂ, ഫോണിൽ നിന്ന് ചെക്ക്-ഇൻ ചെയ്യൂ, നിങ്ങൾ സമ്പാദിക്കുന്ന മുഴുവൻ തുകയും നിങ്ങൾക്ക്. വെയിറ്റ്‌ലിസ്റ്റിൽ ചേരൂ, ലോഞ്ച് ദിവസം ഞങ്ങൾ ഇമെയിൽ അയയ്ക്കാം.'}
            </p>

            {/* Perks */}
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
              {[
                {
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12M6 8h12M14 21 6 13h3a5 5 0 0 0 0-10"/></svg>
                  ),
                  titleEn: 'Zero commission', titleMl: 'കമ്മീഷൻ ഇല്ല',
                  descEn: 'Your full pay goes to you.', descMl: 'നിങ്ങളുടെ കൂലി മുഴുവൻ നിങ്ങൾക്ക്.',
                  iconBg: '#ececfd', iconColor: '#3b3fd8',
                },
                {
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                  ),
                  titleEn: 'Verified clients', titleMl: 'പരിശോധിച്ച ക്ലയന്റുകൾ',
                  descEn: 'Our team checks every business before it can post a job.', descMl: 'ജോലി പോസ്റ്റ് ചെയ്യുന്നതിന് മുമ്പ് ഓരോ ബിസിനസും ഞങ്ങളുടെ ടീം പരിശോധിക്കുന്നു.',
                  iconBg: '#ececfd', iconColor: '#3b3fd8',
                },
                {
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18M12 8S10.5 3 7.5 3a2.5 2.5 0 0 0 0 5M12 8s1.5-5 4.5-5a2.5 2.5 0 0 1 0 5"/></svg>
                  ),
                  titleEn: '5 free job slots', titleMl: '5 സൗജന്യ ജോലി സ്ലോട്ടുകൾ',
                  descEn: 'Every new worker starts with 5 free slots to apply for jobs.', descMl: 'ഓരോ പുതിയ തൊഴിലാളിക്കും ജോലിക്ക് അപേക്ഷിക്കാൻ 5 സൗജന്യ സ്ലോട്ടുകൾ.',
                  iconBg: '#fff4de', iconColor: '#b06f00',
                },
              ].map((perk, i) => (
                <li key={i} style={{
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                  background: '#ffffff',
                  border: '1px solid #e3e5ee',
                  borderRadius: 16,
                  padding: '14px 16px',
                }}>
                  <span style={{
                    flex: 'none',
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    display: 'grid',
                    placeItems: 'center',
                    background: perk.iconBg,
                    color: perk.iconColor,
                  }}>{perk.icon}</span>
                  <div>
                    <strong style={{ display: 'block', fontSize: 16 }}>{lang === 'en' ? perk.titleEn : perk.titleMl}</strong>
                    <span style={{ color: '#5d6175', fontSize: 15 }}>{lang === 'en' ? perk.descEn : perk.descMl}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Card + Form */}
          <section className="waitlist-card">
            {!done ? (
              <form onSubmit={handleSubmit} noValidate>
                <h2 style={{ margin: '0 0 4px', fontSize: 22, letterSpacing: '-0.01em' }}>
                  {lang === 'en' ? 'Join the waitlist' : 'വെയിറ്റ്‌ലിസ്റ്റിൽ ചേരൂ'}
                </h2>
                <p style={{ margin: '0 0 6px', color: '#5d6175', fontSize: 15 }}>
                  {lang === 'en' ? 'Free. Takes 20 seconds.' : 'സൗജന്യം. 20 സെക്കൻഡ് മാത്രം.'}
                </p>

                {/* Waitlist count badge */}
                {waitlistCount > 0 && (
                  <p style={{
                    margin: '0 0 16px',
                    padding: '6px 12px',
                    borderRadius: 999,
                    background: '#e6f5ec',
                    color: '#1f8a4c',
                    fontSize: 14,
                    fontWeight: 600,
                    display: 'inline-block',
                  }}>
                    🎉 {waitlistCount} {lang === 'en' ? 'workers waitlisted' : 'തൊഴിലാളികൾ വെയിറ്റ്‌ലിസ്റ്റ് ചെയ്തു'}
                  </p>
                )}

                {/* Name field */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 15, marginBottom: 6 }}>
                    {lang === 'en' ? 'Your name' : 'നിങ്ങളുടെ പേര്'}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setErrors(prev => ({ ...prev, name: undefined })); }}
                    placeholder={lang === 'en' ? 'e.g. Arjun Menon' : 'ഉദാ. അർജുൻ മേനോൻ'}
                    maxLength={80}
                    required
                    aria-invalid={!!errors.name}
                    style={{
                      width: '100%',
                      fontFamily: 'inherit',
                      fontSize: 17,
                      padding: '13px 14px',
                      border: `1.5px solid ${errors.name ? '#c9372c' : '#e3e5ee'}`,
                      borderRadius: 12,
                      background: '#fbfbfd',
                      color: '#14151f',
                      minHeight: 50,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {errors.name && <div style={{ color: '#c9372c', fontSize: 14, marginTop: 6 }}>{t('name')}</div>}
                </div>

                {/* Email field */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 15, marginBottom: 6 }}>
                    {lang === 'en' ? 'Email' : 'ഇമെയിൽ'}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })); }}
                    placeholder="you@example.com"
                    maxLength={254}
                    required
                    aria-invalid={!!errors.email}
                    style={{
                      width: '100%',
                      fontFamily: 'inherit',
                      fontSize: 17,
                      padding: '13px 14px',
                      border: `1.5px solid ${errors.email ? '#c9372c' : '#e3e5ee'}`,
                      borderRadius: 12,
                      background: '#fbfbfd',
                      color: '#14151f',
                      minHeight: 50,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {errors.email && <div style={{ color: '#c9372c', fontSize: 14, marginTop: 6 }}>{t('email')}</div>}
                </div>

                {/* Consent */}
                <label style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                  padding: 14,
                  borderRadius: 12,
                  background: '#f2f3f7',
                  cursor: 'pointer',
                  fontSize: 15,
                }}>
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => { setConsent(e.target.checked); setErrors(prev => ({ ...prev, consent: undefined })); }}
                    style={{ flex: 'none', width: 22, height: 22, marginTop: 1, accentColor: '#3b3fd8', cursor: 'pointer' }}
                  />
                  <span>
                    {lang === 'en'
                      ? 'Email me when Krewgrid launches in Kochi. I can unsubscribe anytime.'
                      : 'കൊച്ചിയിൽ Krewgrid ആരംഭിക്കുമ്പോൾ എനിക്ക് ഇമെയിൽ അയയ്ക്കുക. എപ്പോൾ വേണമെങ്കിലും അൺസബ്സ്ക്രൈബ് ചെയ്യാം.'}
                  </span>
                </label>
                {errors.consent && <div style={{ color: '#c9372c', fontSize: 14, marginTop: 6 }}>{t('consent')}</div>}

                <p style={{ color: '#5d6175', fontSize: 13.5, margin: '10px 2px 18px' }}>
                  {lang === 'en'
                    ? "We only use your name and email to tell you about Krewgrid's launch. We never sell them."
                    : "Krewgrid-ന്റെ ലോഞ്ചിനെക്കുറിച്ച് അറിയിക്കാൻ മാത്രമാണ് നിങ്ങളുടെ പേരും ഇമെയിലും ഞങ്ങൾ ഉപയോഗിക്കുന്നത്. ഞങ്ങൾ അവ ഒരിക്കലും വിൽക്കില്ല."}
                </p>

                <button
                  type="submit"
                  disabled={sending}
                  style={{
                    width: '100%',
                    border: 0,
                    borderRadius: 14,
                    background: '#3b3fd8',
                    color: '#fff',
                    fontFamily: 'inherit',
                    fontSize: 17,
                    fontWeight: 650,
                    padding: '15px 18px',
                    minHeight: 54,
                    cursor: sending ? 'progress' : 'pointer',
                    opacity: sending ? 0.7 : 1,
                  }}
                >
                  {sending ? t('sending') : t('submit')}
                </button>

                {errors.form && (
                  <p style={{
                    margin: '12px 0 0',
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: '#fdecea',
                    color: '#c9372c',
                    fontSize: 14,
                  }}>{t('generic')}</p>
                )}
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '8px 4px' }}>
                <div style={{
                  width: 64,
                  height: 64,
                  margin: '4px auto 16px',
                  borderRadius: '50%',
                  background: '#e6f5ec',
                  color: '#1f8a4c',
                  display: 'grid',
                  placeItems: 'center',
                }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                </div>
                <h2 style={{ marginBottom: 8 }}>
                  {lang === 'en' ? "You're on the list!" : 'നിങ്ങൾ ലിസ്റ്റിലുണ്ട്!'}
                </h2>
                <p style={{ color: '#5d6175', margin: '0 0 8px' }}>
                  {lang === 'en' ? "We'll email you at" : 'ഞങ്ങൾ ഇമെയിൽ അയയ്ക്കും:'}{' '}
                  <span style={{ color: '#14151f', fontWeight: 600, wordBreak: 'break-all' }}>{doneEmail}</span>
                </p>
                <p style={{ color: '#5d6175', margin: 0 }}>
                  {lang === 'en' ? "when Krewgrid launches." : 'Krewgrid ലോഞ്ച് ചെയ്യുമ്പോൾ.'}
                </p>
              </div>
            )}
          </section>
        </main>

        {/* Footer */}
        <footer style={{
          width: '100%',
          maxWidth: 1080,
          margin: '0 auto',
          padding: '20px 16px 32px',
          color: '#5d6175',
          fontSize: 14,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px 18px',
          borderTop: '1px solid #e3e5ee',
        }}>
          <span>© 2026 Krewgrid</span>
        </footer>
      </div>

      <style>{`
        .waitlist-main {
          width: 100%;
          max-width: 1080px;
          margin: 0 auto;
          padding: 8px 16px 48px;
          display: grid;
          gap: 28px;
          flex: 1;
        }
        @media (min-width: 900px) {
          .waitlist-main {
            grid-template-columns: 1.1fr 0.9fr;
            align-items: start;
            gap: 56px;
            padding-top: 40px;
          }
        }
        .waitlist-card {
          background: #ffffff;
          border: 1px solid #e3e5ee;
          border-radius: 20px;
          padding: 24px 20px;
          box-shadow: 0 1px 2px rgba(20,21,31,0.04), 0 12px 32px rgba(59,63,216,0.08);
        }
        @media (min-width: 900px) {
          .waitlist-card {
            padding: 32px 28px;
            position: sticky;
            top: 24px;
          }
        }
        .waitlist-card input[type="text"]:focus,
        .waitlist-card input[type="email"]:focus {
          border-color: #3b3fd8 !important;
          background: #fff !important;
          box-shadow: 0 0 0 4px #ececfd !important;
        }
        .waitlist-card button[type="submit"]:hover {
          background: #2e31b0 !important;
        }
        @media (prefers-color-scheme: dark) {
          .krewgrid-nav-logo {
            filter: brightness(0) invert(1);
          }
        }
      `}</style>
    </>
  );
}
