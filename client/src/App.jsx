import { useCallback, useEffect, useMemo, useState } from 'react'
import api, {
  assessmentApi,
  authApi,
  budgetApi,
  dashboardApi,
  forumApi,
  recommendationApi,
  transactionApi,
} from './lib/api'
import { compactDate, currency } from './lib/format'
import { storysetAssets } from './lib/storyset'

const tabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'profile', label: 'Profil' },
  { id: 'transactions', label: 'Transaksi' },
  { id: 'assessment', label: 'Assessment' },
  { id: 'hustle', label: 'Side Hustle' },
  { id: 'forum', label: 'Forum' },
]

const categoryOptions = [
  'Makanan',
  'Transport',
  'Hiburan',
  'Tagihan',
  'Belanja',
  'Kesehatan',
  'Pendidikan',
  'Gaji',
  'Side Hustle',
  'Investasi',
]

const skillOptions = [
  'design',
  'copywriting',
  'social media',
  'teaching',
  'spreadsheet',
  'seo',
  'writing',
  'communication',
]

const defaultBadgeIcon = 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f3c5.svg'

const maxBadgeLevel = 6

const badgeLevelByKey = {
  first_saver: 6,
  expense_tracker: 2,
  budget_keeper: 3,
  daily_logger: 4,
  side_hustler: 5,
  saving_streak: 6,
  comeback: 6,
}

const today = new Date().toISOString().slice(0, 10)
const currentMonth = new Date().toISOString().slice(0, 7)

const splitCsv = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

const clampBadgeLevel = (value) => {
  const numericLevel = Number(value)
  if (!Number.isFinite(numericLevel)) {
    return 1
  }

  return Math.max(1, Math.min(maxBadgeLevel, Math.trunc(numericLevel)))
}

const getBadgeIcon = (key, level) => `/badges/${key}/level-${clampBadgeLevel(level)}.png`
const getBadgeBaseIcon = (key) => `/badges/${key}.png`
const getBadgeLevel = (key) => badgeLevelByKey[key] || 1

function App() {
  const savedToken = localStorage.getItem('finary_token')

  const [token, setToken] = useState(savedToken || '')
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(savedToken))
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [dashboard, setDashboard] = useState(null)
  const [profile, setProfile] = useState(null)
  const [badges, setBadges] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [transactions, setTransactions] = useState([])
  const [budgets, setBudgets] = useState([])
  const [assessment, setAssessment] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [recommendationSource, setRecommendationSource] = useState('-')
  const [forumPosts, setForumPosts] = useState([])

  const [authForm, setAuthForm] = useState({
    name: '',
    email: 'demo@finary.app',
    password: 'password123',
    password_confirmation: 'password123',
  })

  const [transactionForm, setTransactionForm] = useState({
    type: 'expense',
    category: '',
    amount: '',
    transaction_date: today,
    note: '',
  })

  const [budgetForm, setBudgetForm] = useState({
    category: 'Makanan',
    period: currentMonth,
    monthly_limit: '',
  })

  const [assessmentForm, setAssessmentForm] = useState({
    financial_status: 'seimbang',
    economic_condition: 'kos',
    monthly_income: '6000000',
    monthly_expense: '4200000',
    income_sources: 'Gaji',
    financial_goal: 'Dana darurat 6 bulan',
    available_hours_per_week: '10',
    skills: 'design,copywriting,social media',
  })

  const [recommendForm, setRecommendForm] = useState({
    skills: 'design,copywriting,social media',
    available_hours_per_week: '10',
    classification: 'Normal',
  })

  const [forumForm, setForumForm] = useState({
    title: '',
    body: '',
    tags: 'budget,saving',
  })
  const [forumReplyForms, setForumReplyForms] = useState({})

  const chartMax = useMemo(() => {
    const points = dashboard?.monthly_chart || []
    const max = points.reduce((acc, item) => {
      return Math.max(acc, item.income || 0, item.expense || 0)
    }, 1)

    return max <= 0 ? 1 : max
  }, [dashboard])

  const achievementLevel = useMemo(() => {
    const unlocked = badges?.summary?.unlocked_count || 0
    const total = badges?.summary?.total_badges || 0

    if (total <= 0) {
      return 1
    }

    const scaled = Math.ceil((unlocked / total) * maxBadgeLevel)
    return Math.max(1, Math.min(maxBadgeLevel, scaled))
  }, [badges])

  const unlockedBadges = useMemo(
    () => (badges?.badges || []).filter((badge) => badge.unlocked),
    [badges],
  )

  const latestUnlockedBadges = useMemo(
    () => unlockedBadges.slice(-3).reverse(),
    [unlockedBadges],
  )

  const userLeaderboardRow = useMemo(
    () => leaderboard.find((item) => item.name === user?.name),
    [leaderboard, user],
  )

  const pocketOptions = useMemo(() => {
    const categories = budgets
      .map((item) => item.category?.trim())
      .filter(Boolean)

    return Array.from(new Set(categories)).sort((a, b) => a.localeCompare(b, 'id'))
  }, [budgets])

  const refreshAll = useCallback(async () => {
    const [
      meRes,
      dashboardRes,
      profileRes,
      badgesRes,
      leaderboardRes,
      transactionRes,
      budgetRes,
      assessmentRes,
      recommendationRes,
      forumRes,
    ] = await Promise.all([
      authApi.me(),
      dashboardApi.getDashboard(),
      dashboardApi.getProfile(),
      dashboardApi.getBadges(),
      dashboardApi.getLeaderboard(),
      transactionApi.list(),
      budgetApi.list(),
      assessmentApi.getLatest(),
      recommendationApi.sideHustles(),
      forumApi.list(),
    ])
    const latestAssessment = assessmentRes.data.data

    setUser(meRes.data.user)
    setDashboard(dashboardRes.data.data)
    setProfile(profileRes.data.data)
    setBadges(badgesRes.data.data)
    setLeaderboard(leaderboardRes.data.data || [])
    setTransactions(transactionRes.data.data || [])
    setBudgets(budgetRes.data.data || [])
    setAssessment(latestAssessment)
    setRecommendations(recommendationRes.data.data?.recommendations || [])
    setRecommendationSource(recommendationRes.data.data?.source || '-')
    setForumPosts(forumRes.data.data || [])

    return { latestAssessment }
  }, [])

  const storeToken = (nextToken) => {
    localStorage.setItem('finary_token', nextToken)
    setToken(nextToken)
  }

  const clearSession = () => {
    localStorage.removeItem('finary_token')
    setToken('')
    setUser(null)
    setActiveTab('dashboard')
    setIsNavOpen(false)
    setDashboard(null)
    setProfile(null)
    setBadges(null)
    setLeaderboard([])
    setTransactions([])
    setBudgets([])
    setAssessment(null)
    setRecommendations([])
    setForumPosts([])
    setIsBootstrapping(false)
  }

  useEffect(() => {
    if (pocketOptions.length === 0) {
      setTransactionForm((prev) => (prev.category ? { ...prev, category: '' } : prev))
      return
    }

    setTransactionForm((prev) => {
      if (pocketOptions.includes(prev.category)) {
        return prev
      }

      return {
        ...prev,
        category: pocketOptions[0],
      }
    })
  }, [pocketOptions])

  useEffect(() => {
    if (!token) {
      return
    }

    let isMounted = true

    const bootstrapSession = async () => {
      setLoading(true)
      setError('')

      try {
        const { latestAssessment } = await refreshAll()

        if (!isMounted) {
          return
        }

        if (!latestAssessment) {
          setActiveTab('assessment')
          setMessage('Lengkapi assessment awal agar insight dan rekomendasi jadi personal.')
        }
      } catch {
        if (!isMounted) {
          return
        }

        clearSession()
        setError('Sesi sudah berakhir. Silakan login kembali.')
      } finally {
        if (isMounted) {
          setLoading(false)
          setIsBootstrapping(false)
        }
      }
    }

    bootstrapSession()

    return () => {
      isMounted = false
    }
  }, [token, refreshAll])

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const isRegister = authMode === 'register'

      const response = authMode === 'login'
        ? await authApi.login({ email: authForm.email, password: authForm.password })
        : await authApi.register(authForm)

      storeToken(response.data.token)
      setUser(response.data.user)
      const { latestAssessment } = await refreshAll()

      if (isRegister || !latestAssessment) {
        setActiveTab('assessment')
        setMessage('Akun berhasil dibuat. Lengkapi assessment awal untuk personalisasi dashboard.')
      } else {
        setMessage('Session aktif. Selamat datang di Finary.')
      }
    } catch (err) {
      if (!err?.response) {
        setError('Tidak bisa terhubung ke API. Jalankan Laravel di http://127.0.0.1:8000.')
      } else {
        setError(err?.response?.data?.message || 'Autentikasi gagal. Coba ulangi.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await authApi.login({
        email: 'demo@finary.app',
        password: 'password123',
      })

      storeToken(response.data.token)
      setUser(response.data.user)
      const { latestAssessment } = await refreshAll()

      if (!latestAssessment) {
        setActiveTab('assessment')
        setMessage('Akun demo berhasil login. Lengkapi assessment awal terlebih dulu.')
      } else {
        setMessage('Masuk dengan akun demo berhasil.')
      }
    } catch (err) {
      if (!err?.response) {
        setError('Tidak bisa terhubung ke API. Jalankan Laravel di http://127.0.0.1:8000.')
      } else {
        setError(err?.response?.data?.message || 'Akun demo belum siap. Jalankan seed database dahulu.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setLoading(true)

    try {
      if (token) {
        await authApi.logout()
      }
    } catch {
      // Ignore logout API failures and still clear local session.
    } finally {
      clearSession()
      setLoading(false)
      setMessage('Anda sudah logout.')
    }
  }

  const guardedAction = async (fn, successMessage) => {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      await fn()
      await refreshAll()
      if (successMessage) {
        setMessage(successMessage)
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Proses gagal, coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleTransactionSubmit = async (event) => {
    event.preventDefault()

    if (pocketOptions.length === 0) {
      setError('Buat kantong budget dulu sebelum menambah transaksi.')
      setMessage('')
      return
    }

    await guardedAction(async () => {
      await transactionApi.create({
        ...transactionForm,
        amount: Number(transactionForm.amount),
      })

      setTransactionForm((prev) => ({
        ...prev,
        amount: '',
        note: '',
      }))
    }, 'Transaksi baru sudah ditambahkan.')
  }

  const handleDeleteTransaction = async (id) => {
    await guardedAction(() => transactionApi.remove(id), 'Transaksi berhasil dihapus.')
  }

  const handleBudgetSubmit = async (event) => {
    event.preventDefault()

    await guardedAction(async () => {
      await budgetApi.create({
        ...budgetForm,
        monthly_limit: Number(budgetForm.monthly_limit),
      })

      setBudgetForm((prev) => ({
        ...prev,
        monthly_limit: '',
      }))
    }, 'Budget tersimpan.')
  }

  const handleAssessmentSubmit = async (event) => {
    event.preventDefault()

    await guardedAction(async () => {
      await assessmentApi.create({
        ...assessmentForm,
        monthly_income: Number(assessmentForm.monthly_income),
        monthly_expense: Number(assessmentForm.monthly_expense),
        available_hours_per_week: Number(assessmentForm.available_hours_per_week),
        income_sources: splitCsv(assessmentForm.income_sources),
        skills: splitCsv(assessmentForm.skills),
      })
    }, 'Assessment tersimpan dan profil finansial diperbarui.')
  }

  const handleRecommendationSubmit = async (event) => {
    event.preventDefault()

    await guardedAction(async () => {
      const response = await recommendationApi.sideHustles({
        skills: splitCsv(recommendForm.skills),
        available_hours_per_week: Number(recommendForm.available_hours_per_week),
        classification: recommendForm.classification,
      })

      setRecommendations(response.data.data?.recommendations || [])
      setRecommendationSource(response.data.data?.source || '-')
    }, 'Rekomendasi side hustle diperbarui.')
  }

  const handleForumSubmit = async (event) => {
    event.preventDefault()

    await guardedAction(async () => {
      await forumApi.create({
        ...forumForm,
        tags: splitCsv(forumForm.tags),
      })

      setForumForm({
        title: '',
        body: '',
        tags: 'budget,saving',
      })
    }, 'Postingan forum berhasil dipublikasikan.')
  }

  const handleForumReplySubmit = async (event, postId) => {
    event.preventDefault()

    const body = (forumReplyForms[postId] || '').trim()

    if (!body) {
      setError('Balasan tidak boleh kosong.')
      setMessage('')
      return
    }

    await guardedAction(async () => {
      await forumApi.reply(postId, { body })

      setForumReplyForms((prev) => ({
        ...prev,
        [postId]: '',
      }))
    }, 'Balasan forum berhasil dikirim.')
  }

  const handleExportCsv = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('/reports/transactions/export', {
        params: { month: currentMonth },
        responseType: 'blob',
      })

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `finary-transactions-${currentMonth}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      setMessage('Laporan CSV berhasil diunduh.')
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal export report.')
    } finally {
      setLoading(false)
    }
  }

  if (token && isBootstrapping) {
    return (
      <div className="page">
        <section className="panel loading-panel">
          <p className="kicker">Menyiapkan akun</p>
          <h2>Sedang menyiapkan data akunmu.</h2>
          <div className="loading-track">
            <span className="loading-bar" />
          </div>
        </section>
      </div>
    )
  }

  if (!token || !user) {
    return (
      <div className="page">
        <header className="site-header auth-header">
          <div className="brand">Finary</div>
          <button className="button ghost" onClick={handleDemoLogin} disabled={loading}>
            Masuk Demo
          </button>
        </header>

        <main className="hero-layout auth-layout">
          <section className="hero-visual panel auth-visual">
            <div className="hero-visual-frame">
              <img src={storysetAssets.hero} alt="Finance illustration from Storyset" />
            </div>
            <ul className="feature-checklist auth-support-list">
              <li>Ringkasan cashflow harian.</li>
              <li>Assessment awal otomatis.</li>
              <li>Rekomendasi side hustle relevan.</li>
            </ul>
          </section>

          <section className="panel panel-pop auth-form-panel">
            <form className="auth-grid" onSubmit={handleAuthSubmit}>
              <div className="auth-card-head">
                <h2>{authMode === 'login' ? 'Masuk ke Finary' : 'Buat akun baru'}</h2>
                <p>
                  {authMode === 'login'
                    ? 'Masukkan email dan password untuk lanjut.'
                    : 'Isi data akun untuk mulai daftar.'}
                </p>
              </div>

              {authMode === 'register' && (
                <label>
                  Nama
                  <input
                    value={authForm.name}
                    onChange={(e) => setAuthForm((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </label>
              )}

              <label>
                Email
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm((prev) => ({ ...prev, password: e.target.value }))}
                  required
                />
              </label>

              {authMode === 'register' && (
                <label>
                  Konfirmasi Password
                  <input
                    type="password"
                    value={authForm.password_confirmation}
                    onChange={(e) =>
                      setAuthForm((prev) => ({ ...prev, password_confirmation: e.target.value }))
                    }
                    required
                  />
                </label>
              )}

              <div className="auth-actions">
                <button className="button" disabled={loading}>
                  {loading ? 'Loading...' : authMode === 'login' ? 'Login' : 'Register'}
                </button>
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => setAuthMode((prev) => (prev === 'login' ? 'register' : 'login'))}
                >
                  {authMode === 'login' ? 'Buat akun baru' : 'Punya akun? Login'}
                </button>
              </div>
            </form>

            {error && (
              <div className="alert error">
                <span>{error}</span>
                <button
                  type="button"
                  className="alert-close"
                  onClick={() => setError('')}
                  aria-label="Tutup notifikasi"
                >
                  x
                </button>
              </div>
            )}
            {message && (
              <div className="alert success">
                <span>{message}</span>
                <button
                  type="button"
                  className="alert-close"
                  onClick={() => setMessage('')}
                  aria-label="Tutup notifikasi"
                >
                  x
                </button>
              </div>
            )}
          </section>
        </main>

        <footer className="credits">
          by Tim Capstone CC26-PSU008
        </footer>
      </div>
    )
  }

  return (
    <div className="page">
      <datalist id="category-list">
        {categoryOptions.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>

      <datalist id="skill-list">
        {skillOptions.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>

      <header className="site-header sticky app-header">
        <div className="brand">Finary</div>
        <button
          type="button"
          className={`menu-toggle ${isNavOpen ? 'open' : ''}`}
          aria-expanded={isNavOpen}
          aria-label="Buka menu navigasi"
          onClick={() => setIsNavOpen((prev) => !prev)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav className={`tab-row ${isNavOpen ? 'open' : ''}`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab.id)
                setIsNavOpen(false)
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="head-actions">
          <span>Hi, {user.name}</span>
          <button className="button ghost" onClick={handleLogout} disabled={loading}>
            Logout
          </button>
        </div>
      </header>

      {(error || message || !assessment) && (
        <div className="notice-wrap">
          {!assessment && (
            <p className="alert onboarding">
              Mulai dari tab Assessment agar insight lebih personal.
            </p>
          )}
          {error && (
            <div className="alert error">
              <span>{error}</span>
              <button
                type="button"
                className="alert-close"
                onClick={() => setError('')}
                aria-label="Tutup notifikasi"
              >
                x
              </button>
            </div>
          )}
          {message && (
            <div className="alert success">
              <span>{message}</span>
              <button
                type="button"
                className="alert-close"
                onClick={() => setMessage('')}
                aria-label="Tutup notifikasi"
              >
                x
              </button>
            </div>
          )}
        </div>
      )}

      <main className="app-grid">
        {activeTab === 'dashboard' && (
          <>
            <section className="panel balance-hero">
              <div className="balance-copy">
                <p className="kicker">Saldo Utama</p>
                <h2>Posisi keuanganmu bulan ini</h2>
                <p className="balance-amount">{currency(dashboard?.summary?.balance)}</p>
                <p className="balance-caption">
                  Ini saldo utama yang jadi acuan sebelum kamu tambah pengeluaran berikutnya.
                </p>
                <div className="quick-metrics">
                  <span>{transactions.length} transaksi</span>
                  <span>{budgets.length} kantong aktif</span>
                  <span>{recommendations.length} ide side hustle</span>
                </div>
              </div>
              <div className="balance-art">
                <img src={storysetAssets.dashboard} alt="Revenue illustration from Storyset" />
              </div>
            </section>

            <section className="split-grid duo cashflow-grid">
              <article className="inset cashflow-card income-card">
                <p className="cashflow-label">Pemasukan</p>
                <strong>{currency(dashboard?.summary?.income)}</strong>
                <small>Uang masuk selama periode berjalan.</small>
              </article>
              <article className="inset cashflow-card expense-card">
                <p className="cashflow-label">Pengeluaran</p>
                <strong>{currency(dashboard?.summary?.expense)}</strong>
                <small>
                  Saving rate sekarang <strong>{dashboard?.summary?.saving_rate || 0}%</strong>.
                </small>
              </article>
            </section>

            <section className="panel stack">
              <div className="section-head">
                <h3>Kantong Aktif</h3>
                <p className="helper">{budgets.length} kantong terdaftar</p>
              </div>

              <div className="pocket-grid">
                {budgets.length === 0 && (
                  <article className="pocket-card empty">
                    <strong>Belum ada kantong.</strong>
                    <p>Buka tab Transaksi, lalu tambah kantong budget dulu.</p>
                  </article>
                )}

                {budgets.map((item) => (
                  <article
                    key={item.id}
                    className={`pocket-card ${item.is_overbudget ? 'is-over' : ''}`}
                  >
                    <div className="pocket-head">
                      <strong>{item.category}</strong>
                      <span>{item.period || currentMonth}</span>
                    </div>
                    <p>{currency(item.spent)} / {currency(item.monthly_limit)}</p>
                    <div className="progress-wrap">
                      <div
                        className={`progress ${item.is_overbudget ? 'danger' : ''}`}
                        style={{ width: `${Math.min(item.progress_percent || 0, 100)}%` }}
                      />
                    </div>
                    <small>{Math.round(item.progress_percent || 0)}% terpakai</small>
                  </article>
                ))}
              </div>
            </section>

            <section className="panel stack">
              <div className="section-head">
                <h3>Tren Cashflow Bulanan</h3>
                <p className="helper">Perbandingan pemasukan vs pengeluaran per bulan</p>
              </div>

              <div className="chart-board">
                {(dashboard?.monthly_chart || []).map((point) => (
                  <div className="chart-col" key={point.month}>
                    <div className="bars">
                      <div className="bar income" style={{ height: `${(point.income / chartMax) * 100}%` }} />
                      <div className="bar expense" style={{ height: `${(point.expense / chartMax) * 100}%` }} />
                    </div>
                    <small>{point.month}</small>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel stack">
              <div className="split-grid duo dashboard-bottom">
                <article className="inset">
                  <h3>Badge Progress</h3>
                  <p>
                    {badges?.summary?.unlocked_count || 0} / {badges?.summary?.total_badges || 0} badges unlocked
                  </p>
                  <p className="achievement-level">
                    Achievement Level: <strong>Lv {achievementLevel}</strong>
                  </p>
                  <div className="badge-grid">
                    {(badges?.badges || []).map((badge) => {
                      const level = getBadgeLevel(badge.key)

                      return (
                        <div
                          key={badge.key}
                          className={`badge-chip level-${level} ${badge.unlocked ? 'on' : 'locked'}`}
                        >
                          <div className="badge-head">
                            <div className="badge-photo-wrap" aria-hidden="true">
                              <img
                                className="badge-photo"
                                src={getBadgeIcon(badge.key, level)}
                                data-base-src={getBadgeBaseIcon(badge.key)}
                                data-fallback-stage="level"
                                alt={`${badge.name} level ${level}`}
                                loading="lazy"
                                onError={(event) => {
                                  const stage = event.currentTarget.dataset.fallbackStage || 'level'
                                  if (stage === 'level') {
                                    event.currentTarget.dataset.fallbackStage = 'base'
                                    event.currentTarget.src = event.currentTarget.dataset.baseSrc || defaultBadgeIcon
                                    return
                                  }

                                  event.currentTarget.onerror = null
                                  event.currentTarget.src = defaultBadgeIcon
                                }}
                              />
                            </div>
                            <div className="badge-copy">
                              <strong>{badge.name}</strong>
                              <small>{badge.description}</small>
                            </div>
                          </div>

                          <div className="badge-level-row" aria-label={`Level ${level} dari ${maxBadgeLevel}`}>
                            <span className="badge-level-label">Lv {level}</span>
                            <div className="badge-level-track">
                              {Array.from({ length: maxBadgeLevel }, (_, index) => (
                                <span
                                  key={`${badge.key}-level-${index + 1}`}
                                  className={`badge-level-dot ${index + 1 <= level ? 'on' : 'off'}`}
                                />
                              ))}
                            </div>
                          </div>

                          <span className={`badge-state ${badge.unlocked ? 'on' : 'off'}`}>
                            {badge.unlocked ? 'Unlocked' : 'Locked'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </article>

                <article className="inset leaderboard-panel">
                  <h3>Leaderboard</h3>
                  <ol className="leaderboard">
                    {leaderboard.map((item) => (
                      <li key={`${item.name}-${item.rank}`}>
                        <span>#{item.rank} {item.name}</span>
                        <strong>{item.discipline_score}</strong>
                      </li>
                    ))}
                  </ol>
                </article>
              </div>
            </section>
          </>
        )}

        {activeTab === 'profile' && (
          <section className="panel stack">
            <div className="split-grid duo profile-grid">
              <article className="inset profile-card">
                <h3>Data Diri</h3>
                <div className="profile-meta">
                  <p>Nama: <strong>{user.name || '-'}</strong></p>
                  <p>Email: <strong>{user.email || '-'}</strong></p>
                  <p>Status akun: <strong>{assessment ? 'Aktif' : 'Belum assessment'}</strong></p>
                  <p>Bergabung: <strong>{user.created_at ? compactDate(user.created_at) : '-'}</strong></p>
                </div>
              </article>

              <article className="inset profile-card">
                <h3>Status Finansial</h3>
                <div className="profile-mode-row">
                  <span className={`status-pill ${assessment ? 'ready' : 'pending'}`}>
                    {assessment ? `Mode: ${assessment.classification}` : 'Assessment awal dibutuhkan'}
                  </span>
                </div>
                <div className="profile-meta">
                  <p>Spending habit: <strong>{profile?.spending_habit || '-'}</strong></p>
                  <p>Income pattern: <strong>{profile?.income_pattern || '-'}</strong></p>
                  <p>Saving behavior: <strong>{profile?.saving_behavior || '-'}</strong></p>
                  <p>Posisi leaderboard: <strong>{userLeaderboardRow ? `#${userLeaderboardRow.rank}` : '-'}</strong></p>
                </div>
              </article>
            </div>

            <div className="split-grid duo profile-grid">
              <article className="inset dynamic-profile-card">
                <h3>Insight Profil</h3>
                <p>
                  Prediksi saldo bulan depan: <strong>{currency(profile?.prediction?.next_month_balance)}</strong>
                </p>
                <ul className="dynamic-profile-warnings">
                  {(profile?.warnings || []).length === 0 && (
                    <li>Tidak ada warning. Pertahankan ritme keuanganmu.</li>
                  )}
                  {(profile?.warnings || []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <div className="profile-recommendations">
                  <h4>Rekomendasi</h4>
                  <ul className="dynamic-profile-warnings">
                    {(profile?.recommendations || []).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </article>

              <article className="inset profile-achievement-card">
                <h3>Achievement Terbaru</h3>
                <p>
                  {badges?.summary?.unlocked_count || 0} / {badges?.summary?.total_badges || 0} badges unlocked
                </p>

                <div className="profile-achievement-list">
                  {latestUnlockedBadges.length === 0 && (
                    <p className="helper">Belum ada badge yang terbuka.</p>
                  )}

                  {latestUnlockedBadges.map((badge) => {
                    const level = getBadgeLevel(badge.key)

                    return (
                      <article className="profile-achievement-item" key={`latest-${badge.key}`}>
                        <div className="badge-photo-wrap" aria-hidden="true">
                          <img
                            className="badge-photo"
                            src={getBadgeIcon(badge.key, level)}
                            data-base-src={getBadgeBaseIcon(badge.key)}
                            data-fallback-stage="level"
                            alt={`${badge.name} level ${level}`}
                            loading="lazy"
                            onError={(event) => {
                              const stage = event.currentTarget.dataset.fallbackStage || 'level'
                              if (stage === 'level') {
                                event.currentTarget.dataset.fallbackStage = 'base'
                                event.currentTarget.src = event.currentTarget.dataset.baseSrc || defaultBadgeIcon
                                return
                              }

                              event.currentTarget.onerror = null
                              event.currentTarget.src = defaultBadgeIcon
                            }}
                          />
                        </div>
                        <div className="profile-achievement-copy">
                          <strong>{badge.name}</strong>
                          <small>{badge.description}</small>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </article>
            </div>
          </section>
        )}

        {activeTab === 'transactions' && (
          <section className="panel stack">
            <div className="split-grid transactions-grid">
              <form className="inset form-grid" onSubmit={handleTransactionSubmit}>
                <h3>Input Transaksi</h3>
                <label>
                  Tipe
                  <select
                    value={transactionForm.type}
                    onChange={(e) => setTransactionForm((prev) => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </label>
                <label>
                  Kantong
                  <select
                    value={transactionForm.category}
                    onChange={(e) => setTransactionForm((prev) => ({ ...prev, category: e.target.value }))}
                    disabled={pocketOptions.length === 0}
                    required
                  >
                    {pocketOptions.length === 0 && (
                      <option value="">Belum ada kantong</option>
                    )}
                    {pocketOptions.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>
                {pocketOptions.length === 0 && (
                  <p className="helper">Tambah kantong budget dulu agar transaksi bisa dipilih dari dropdown.</p>
                )}
                <label>
                  Nominal
                  <input
                    type="number"
                    min="1"
                    value={transactionForm.amount}
                    onChange={(e) => setTransactionForm((prev) => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </label>
                <label>
                  Tanggal
                  <input
                    type="date"
                    value={transactionForm.transaction_date}
                    onChange={(e) =>
                      setTransactionForm((prev) => ({ ...prev, transaction_date: e.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Catatan
                  <textarea
                    value={transactionForm.note}
                    onChange={(e) => setTransactionForm((prev) => ({ ...prev, note: e.target.value }))}
                  />
                </label>
                <button className="button" disabled={loading || pocketOptions.length === 0}>Simpan Transaksi</button>
              </form>

              <div className="inset">
                <h3>Kantong Budget</h3>
                <form className="form-grid compact" onSubmit={handleBudgetSubmit}>
                  <label>
                    Kategori
                    <input
                      list="category-list"
                      value={budgetForm.category}
                      onChange={(e) => setBudgetForm((prev) => ({ ...prev, category: e.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    Periode (YYYY-MM)
                    <input
                      type="month"
                      value={budgetForm.period}
                      onChange={(e) => setBudgetForm((prev) => ({ ...prev, period: e.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    Limit Bulanan
                    <input
                      type="number"
                      min="1"
                      value={budgetForm.monthly_limit}
                      onChange={(e) =>
                        setBudgetForm((prev) => ({ ...prev, monthly_limit: e.target.value }))
                      }
                      required
                    />
                  </label>
                  <button className="button" disabled={loading}>Simpan Budget</button>
                </form>

                <div className="budget-list">
                  {budgets.map((item) => (
                    <article key={item.id} className="budget-item">
                      <div>
                        <strong>{item.category}</strong>
                        <p>{currency(item.spent)} / {currency(item.monthly_limit)}</p>
                      </div>
                      <div className="progress-wrap">
                        <div
                          className={`progress ${item.is_overbudget ? 'danger' : ''}`}
                          style={{ width: `${Math.min(item.progress_percent, 100)}%` }}
                        />
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            <div className="inset">
              <div className="table-head">
                <h3>Riwayat Transaksi</h3>
                <button className="button ghost" onClick={handleExportCsv} disabled={loading}>
                  Export CSV
                </button>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Tipe</th>
                      <th>Kategori</th>
                      <th>Nominal</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((item) => (
                      <tr key={item.id}>
                        <td>{compactDate(item.transaction_date)}</td>
                        <td>{item.type}</td>
                        <td>{item.category}</td>
                        <td>{currency(item.amount)}</td>
                        <td>
                          <button
                            className="button tiny"
                            onClick={() => handleDeleteTransaction(item.id)}
                            disabled={loading}
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'assessment' && (
          <section className="panel stack">
            <div className="split-grid duo">
              <form className="inset form-grid" onSubmit={handleAssessmentSubmit}>
                <h3>Financial Assessment</h3>
                <label>
                  Status Finansial
                  <select
                    value={assessmentForm.financial_status}
                    onChange={(e) =>
                      setAssessmentForm((prev) => ({ ...prev, financial_status: e.target.value }))
                    }
                  >
                    <option value="defisit">Defisit</option>
                    <option value="seimbang">Seimbang</option>
                    <option value="surplus">Surplus</option>
                  </select>
                </label>
                <label>
                  Kondisi Ekonomi & Tempat Tinggal
                  <input
                    value={assessmentForm.economic_condition}
                    onChange={(e) =>
                      setAssessmentForm((prev) => ({ ...prev, economic_condition: e.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Income / bulan
                  <input
                    type="number"
                    min="0"
                    value={assessmentForm.monthly_income}
                    onChange={(e) =>
                      setAssessmentForm((prev) => ({ ...prev, monthly_income: e.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Expense / bulan
                  <input
                    type="number"
                    min="0"
                    value={assessmentForm.monthly_expense}
                    onChange={(e) =>
                      setAssessmentForm((prev) => ({ ...prev, monthly_expense: e.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Sumber Pemasukan (pisah koma)
                  <input
                    value={assessmentForm.income_sources}
                    onChange={(e) =>
                      setAssessmentForm((prev) => ({ ...prev, income_sources: e.target.value }))
                    }
                  />
                </label>
                <label>
                  Target Finansial
                  <input
                    value={assessmentForm.financial_goal}
                    onChange={(e) =>
                      setAssessmentForm((prev) => ({ ...prev, financial_goal: e.target.value }))
                    }
                  />
                </label>
                <label>
                  Waktu Luang / minggu
                  <input
                    type="number"
                    min="0"
                    max="168"
                    value={assessmentForm.available_hours_per_week}
                    onChange={(e) =>
                      setAssessmentForm((prev) => ({ ...prev, available_hours_per_week: e.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Skills (pisah koma)
                  <input
                    list="skill-list"
                    value={assessmentForm.skills}
                    onChange={(e) => setAssessmentForm((prev) => ({ ...prev, skills: e.target.value }))}
                  />
                </label>
                <button className="button" disabled={loading}>Generate Profil</button>
              </form>

              <article className="inset assessment-preview">
                <h3>Profil Terbaru</h3>
                <p>Klasifikasi: <strong>{assessment?.classification || '-'}</strong></p>
                <p>Goal: {assessment?.financial_goal || '-'}</p>
                <p>
                  Source inference: <strong>{assessment?.metadata?.source || 'rule-based'}</strong>
                </p>
                <img
                  className="assessment-illustration"
                  src={storysetAssets.insight}
                  alt="Investment insight illustration from Storyset"
                />
              </article>
            </div>
          </section>
        )}

        {activeTab === 'hustle' && (
          <section className="panel stack">
            <article className="inset hustle-hero">
              <form className="form-grid form-tight" onSubmit={handleRecommendationSubmit}>
                <h3>Mesin Rekomendasi Side Hustle</h3>
                <label>
                  Skills (pisah koma)
                  <input
                    list="skill-list"
                    value={recommendForm.skills}
                    onChange={(e) => setRecommendForm((prev) => ({ ...prev, skills: e.target.value }))}
                  />
                </label>
                <label>
                  Waktu Luang / minggu
                  <input
                    type="number"
                    min="0"
                    max="168"
                    value={recommendForm.available_hours_per_week}
                    onChange={(e) =>
                      setRecommendForm((prev) => ({ ...prev, available_hours_per_week: e.target.value }))
                    }
                  />
                </label>
                <label>
                  Kondisi Finansial
                  <select
                    value={recommendForm.classification}
                    onChange={(e) =>
                      setRecommendForm((prev) => ({ ...prev, classification: e.target.value }))
                    }
                  >
                    <option value="Inflasi">Inflasi</option>
                    <option value="Normal">Normal</option>
                    <option value="Resesi">Resesi</option>
                  </select>
                </label>
                <button className="button" disabled={loading}>Cari Rekomendasi</button>
                <p className="helper">Mode inference saat ini: {recommendationSource}</p>
              </form>

              <div className="hustle-hero-media">
                <img src={storysetAssets.budget} alt="Coins illustration from Storyset" />
              </div>
            </article>

            <div className="recommend-grid">
              {recommendations.map((item) => (
                <article className="recommend-card" key={item.title}>
                  <h4>{item.title}</h4>
                  <p>{item.reason}</p>
                  <p>Income potential: <strong>{currency(item.estimated_income.low)} - {currency(item.estimated_income.high)}</strong></p>
                  <p>Channel: {item.channel}</p>
                  <p>Skill match: {(item.matched_skills || []).join(', ') || '-'}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'forum' && (
          <section className="panel stack">
            <div className="split-grid duo">
              <form className="inset form-grid form-tight" onSubmit={handleForumSubmit}>
                <h3>Post Baru</h3>
                <label>
                  Judul
                  <input
                    value={forumForm.title}
                    onChange={(e) => setForumForm((prev) => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </label>
                <label>
                  Isi
                  <textarea
                    value={forumForm.body}
                    onChange={(e) => setForumForm((prev) => ({ ...prev, body: e.target.value }))}
                    required
                  />
                </label>
                <label>
                  Tags (pisah koma)
                  <input
                    value={forumForm.tags}
                    onChange={(e) => setForumForm((prev) => ({ ...prev, tags: e.target.value }))}
                  />
                </label>
                <button className="button" disabled={loading}>Publikasikan</button>
              </form>

              <article className="inset forum-preview">
                <h3>Komunitas</h3>
                <img
                  className="forum-illustration"
                  src={storysetAssets.forum}
                  alt="Community illustration from Storyset"
                />
              </article>
            </div>

            <div className="forum-list">
              {forumPosts.map((post) => (
                <article key={post.id} className="forum-item">
                  <h4>{post.title}</h4>
                  <p>{post.body}</p>
                  {!!(post.tags || []).length && (
                    <div className="forum-tags">
                      {(post.tags || []).map((tag) => (
                        <span className="forum-tag" key={`${post.id}-${tag}`}>#{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="forum-replies">
                    {(post.replies || []).length === 0 && (
                      <p className="helper">Belum ada balasan.</p>
                    )}

                    {(post.replies || []).map((reply) => (
                      <div className="forum-reply" key={reply.id}>
                        <div className="meta">
                          <span>{reply.user?.name || '-'}</span>
                          <span>{compactDate(reply.created_at)}</span>
                        </div>
                        <p>{reply.body}</p>
                      </div>
                    ))}
                  </div>

                  <form
                    className="forum-reply-form"
                    onSubmit={(event) => handleForumReplySubmit(event, post.id)}
                  >
                    <input
                      value={forumReplyForms[post.id] || ''}
                      onChange={(event) =>
                        setForumReplyForms((prev) => ({
                          ...prev,
                          [post.id]: event.target.value,
                        }))
                      }
                      placeholder="Tulis balasan..."
                      maxLength={1000}
                    />
                    <button className="button tiny" disabled={loading}>Reply</button>
                  </form>

                  <div className="meta">
                    <span>by {post.user?.name || '-'}</span>
                    <span>{compactDate(post.created_at)}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="credits">
        by Tim Capstone CC26-PSU008
      </footer>
    </div>
  )
}

export default App
