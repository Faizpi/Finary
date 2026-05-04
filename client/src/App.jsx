import { useCallback, useEffect, useMemo, useState } from 'react'
import finaryImg from './assets/finary.png'
import api, {
  assessmentApi,
  authApi,
  budgetApi,
  dashboardApi,
  forumApi,
  mlApiClient,
  recommendationApi,
  transactionApi,
} from './lib/api'
import { compactDate, currency } from './lib/format'

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

const experienceLevelOptions = ['Beginner', 'Intermediate', 'Expert']

const interestCategoryOptions = [
  'App Development',
  'Web Development',
  'Graphic Design',
  'UI/UX Design',
  'SEO',
  'Copywriting',
  'Social Media Management',
  'Video Editing',
  'Content Writing',
  'Data Entry',
  'Virtual Assistant',
  'Translation',
  'Teaching / Tutoring',
  'Digital Marketing',
  'Photography',
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

  // Onboarding: show assessment modal right after register
  const [showOnboarding, setShowOnboarding] = useState(false)

  // ML state
  const [mlClassifyResult, setMlClassifyResult] = useState(null)
  const [mlPredictResult, setMlPredictResult] = useState(null)
  const [mlSideHustleResult, setMlSideHustleResult] = useState(null)
  const [mlLoading, setMlLoading] = useState(false)
  const [predictLoading, setPredictLoading] = useState(false)

  const [predictForm, setPredictForm] = useState({
    income: '',
    expense: '',
    savings: '',
    target_tabungan: '',
    loan_payment: '0',
    emergency_fund: '',
  })

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

  // Saldo hutang dan dana darurat (from assessment)
  const [hutangBalance, setHutangBalance] = useState(0)
  const [emergencyBalance, setEmergencyBalance] = useState(0)

  const [budgetForm, setBudgetForm] = useState({
    category: 'Makanan',
    period: currentMonth,
    monthly_limit: '',
  })

  const [assessmentForm, setAssessmentForm] = useState({
    monthly_income: '6000000',
    monthly_expense: '4200000',
    actual_savings: '1800000',
    budget_goal: '1200000',
    emergency_fund: '5000000',
    loan_payment: '0',
  })

  const [recommendForm, setRecommendForm] = useState({
    experience_level: 'Beginner',
    available_hours_per_week: '10',
    interest_category: 'App Development',
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
    setMlPredictResult(null)
    setHutangBalance(0)
    setEmergencyBalance(0)
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

  // Auto-populate predictForm & auto-run /predict from dashboard + assessment
  useEffect(() => {
    if (!dashboard && !assessment) return

    const income         = dashboard?.summary?.income     || assessment?.monthly_income  || 0
    const expense        = dashboard?.summary?.expense    || assessment?.monthly_expense || 0
    const savings        = assessment?.actual_savings     || 0
    const target         = assessment?.budget_goal        || 0
    const loan           = assessment?.loan_payment       || 0
    const emergency      = assessment?.emergency_fund     || 0

    // Sync balance cards
    setHutangBalance(loan)
    setEmergencyBalance(emergency)

    const next = {
      income:          String(income),
      expense:         String(expense),
      savings:         String(savings),
      target_tabungan: String(target),
      loan_payment:    String(loan),
      emergency_fund:  String(emergency),
    }
    setPredictForm(next)

    // Auto-call /predict
    if (income > 0) {
      setPredictLoading(true)
      mlApiClient
        .predict({
          income:          Number(income),
          expense:         Number(expense),
          savings:         Number(savings),
          target_tabungan: Number(target),
          loan_payment:    Number(loan),
          emergency_fund:  Number(emergency),
        })
        .then((res) => setMlPredictResult(res.data))
        .catch(() => {})
        .finally(() => setPredictLoading(false))
    }
  }, [dashboard, assessment])

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

      if (isRegister) {
        // New flow: show onboarding assessment right away
        setShowOnboarding(true)
        setMessage('Akun berhasil dibuat! Lengkapi asesmen finansial kamu dulu.')
      } else {
        const { latestAssessment } = await refreshAll()
        if (!latestAssessment) {
          setActiveTab('assessment')
          setMessage('Selamat datang! Lengkapi assessment awal untuk personalisasi dashboard.')
        } else {
          setMessage('Session aktif. Selamat datang di Finary.')
        }
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
    setLoading(true)
    setError('')
    setMessage('')

    try {
      // 1. Call ML /classify first
      const mlPayload = {
        monthly_income: Number(assessmentForm.monthly_income),
        monthly_expense_total: Number(assessmentForm.monthly_expense),
        actual_savings: Number(assessmentForm.actual_savings),
        budget_goal: Number(assessmentForm.budget_goal),
        emergency_fund: Number(assessmentForm.emergency_fund),
      }

      const mlRes = await mlApiClient.classify(mlPayload)
      const classifyData = mlRes.data
      setMlClassifyResult(classifyData)

      await assessmentApi.create({
        monthly_income: Number(assessmentForm.monthly_income),
        monthly_expense: Number(assessmentForm.monthly_expense),
        actual_savings: Number(assessmentForm.actual_savings),
        budget_goal: Number(assessmentForm.budget_goal),
        emergency_fund: Number(assessmentForm.emergency_fund),
        loan_payment: Number(assessmentForm.loan_payment || 0),
        classification: classifyData.classification,
        ml_score: classifyData.score,
        ml_explanation: classifyData.explanation,
      })

      await refreshAll()
      setMessage(`Assessment tersimpan. Klasifikasi AI: ${classifyData.classification} (score: ${(classifyData.score * 100).toFixed(0)}%)`)

      // If onboarding, close modal and go to dashboard
      if (showOnboarding) {
        setShowOnboarding(false)
        setActiveTab('dashboard')
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Assessment gagal, coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handlePredictSubmit = async (event) => {
    event.preventDefault()
    setPredictLoading(true)
    setError('')
    setMessage('')
    try {
      const payload = {
        income:          Number(predictForm.income),
        expense:         Number(predictForm.expense),
        savings:         Number(predictForm.savings),
        target_tabungan: Number(predictForm.target_tabungan),
        loan_payment:    Number(predictForm.loan_payment),
        emergency_fund:  Number(predictForm.emergency_fund),
      }
      const res = await mlApiClient.predict(payload)
      setMlPredictResult(res.data)
      setMessage('Prediksi saldo bulan depan berhasil dimuat dari AI.')
    } catch (err) {
      setError(err?.message || 'Gagal menjalankan prediksi AI.')
    } finally {
      setPredictLoading(false)
    }
  }

  const handleRecommendationSubmit = async (event) => {
    event.preventDefault()
    setMlLoading(true)
    setError('')
    setMessage('')

    try {
      const res = await mlApiClient.sideHustle({
        experience_level: recommendForm.experience_level,
        available_hours_per_week: Number(recommendForm.available_hours_per_week),
        interest_category: recommendForm.interest_category,
      })
      setMlSideHustleResult(res.data.recommendations || [])
      setMessage('Rekomendasi side hustle dari AI berhasil dimuat.')
    } catch (err) {
      setError(err?.message || 'Gagal memuat rekomendasi AI.')
    } finally {
      setMlLoading(false)
    }
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
      <div className="page auth-page">
        <header className="site-header auth-header">
          <div className="brand">Finary</div>
          <button className="button ghost" onClick={handleDemoLogin} disabled={loading}>
            {loading ? 'Memuat...' : 'Masuk Demo'}
          </button>
        </header>

        <main className="auth-center">
          <div className="auth-box">
            <div className="auth-brand-block auth-brand-image">
              <img src={finaryImg} alt="Finary" className="auth-finary-img" />
              <h1>Finary</h1>
              <p>Kelola keuanganmu dengan cerdas — didukung AI.</p>
            </div>

            <div className="panel auth-form-panel">
              <form className="auth-grid" onSubmit={handleAuthSubmit}>
                <div className="auth-card-head">
                  <h2>{authMode === 'login' ? 'Masuk ke Finary' : 'Buat akun baru'}</h2>
                  <p>{authMode === 'login' ? 'Masukkan email dan password.' : 'Isi data untuk mulai daftar.'}</p>
                </div>

                {authMode === 'register' && (
                  <label>Nama
                    <input value={authForm.name} onChange={(e) => setAuthForm((p) => ({ ...p, name: e.target.value }))} required />
                  </label>
                )}
                <label>Email
                  <input type="email" value={authForm.email} onChange={(e) => setAuthForm((p) => ({ ...p, email: e.target.value }))} required />
                </label>
                <label>Password
                  <input type="password" value={authForm.password} onChange={(e) => setAuthForm((p) => ({ ...p, password: e.target.value }))} required />
                </label>
                {authMode === 'register' && (
                  <label>Konfirmasi Password
                    <input type="password" value={authForm.password_confirmation} onChange={(e) => setAuthForm((p) => ({ ...p, password_confirmation: e.target.value }))} required />
                  </label>
                )}

                {error && <div className="alert error"><span>{error}</span><button type="button" className="alert-close" onClick={() => setError('')}>x</button></div>}
                {message && <div className="alert success"><span>{message}</span><button type="button" className="alert-close" onClick={() => setMessage('')}>x</button></div>}

                <div className="auth-actions">
                  <button className="button" disabled={loading}>
                    {loading ? 'Memuat...' : authMode === 'login' ? 'Login' : 'Register'}
                  </button>
                  <button type="button" className="button ghost" onClick={() => setAuthMode((p) => (p === 'login' ? 'register' : 'login'))}>
                    {authMode === 'login' ? 'Buat akun baru' : 'Sudah punya akun? Login'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>

        <footer className="credits">by Tim Capstone CC26-PSU008</footer>
      </div>
    )
  }

  // ── Onboarding Modal (shown right after register) ──────────────────────────
  if (showOnboarding) {
    return (
      <div className="page auth-page">
        <header className="site-header auth-header">
          <div className="brand">Finary</div>
          <span className="onboarding-step">Langkah 1 dari 1 — Asesmen Awal</span>
        </header>
        <main className="auth-center">
          <div className="auth-box onboarding-box">
            <div className="auth-brand-block auth-brand-image">
              <img src={finaryImg} alt="Finary" className="auth-finary-img" />
              <h1>Asesmen Finansial</h1>
              <p>Isi data keuanganmu agar AI bisa mengklasifikasikan kondisi finansialmu secara akurat.</p>
            </div>
            <div className="panel auth-form-panel">
              <form className="auth-grid" onSubmit={handleAssessmentSubmit}>
                <div className="auth-card-head">
                  <h2>Data Keuangan Kamu</h2>
                  <p>6 field — sesuai dengan input model AI /classify &amp; /predict.</p>
                </div>
                <label>Pendapatan Bulanan (IDR)
                  <input type="number" min="1" value={assessmentForm.monthly_income}
                    onChange={(e) => setAssessmentForm((p) => ({ ...p, monthly_income: e.target.value }))} required />
                </label>
                <label>Total Pengeluaran Bulanan (IDR)
                  <input type="number" min="0" value={assessmentForm.monthly_expense}
                    onChange={(e) => setAssessmentForm((p) => ({ ...p, monthly_expense: e.target.value }))} required />
                </label>
                <label>Tabungan Aktual Bulan Ini (IDR)
                  <input type="number" min="0" value={assessmentForm.actual_savings}
                    onChange={(e) => setAssessmentForm((p) => ({ ...p, actual_savings: e.target.value }))} required />
                </label>
                <label>Target Tabungan / Budget Goal (IDR)
                  <input type="number" min="0" value={assessmentForm.budget_goal}
                    onChange={(e) => setAssessmentForm((p) => ({ ...p, budget_goal: e.target.value }))} required />
                </label>
                <label>Cicilan Hutang / Bulan (IDR)
                  <input type="number" min="0" value={assessmentForm.loan_payment}
                    onChange={(e) => setAssessmentForm((p) => ({ ...p, loan_payment: e.target.value }))} required />
                </label>
                <label>Dana Darurat saat ini (IDR)
                  <input type="number" min="0" value={assessmentForm.emergency_fund}
                    onChange={(e) => setAssessmentForm((p) => ({ ...p, emergency_fund: e.target.value }))} required />
                </label>
                {error && <div className="alert error"><span>{error}</span><button type="button" className="alert-close" onClick={() => setError('')}>x</button></div>}
                <div className="auth-actions">
                  <button className="button" disabled={loading}>
                    {loading ? '🤖 Menganalisis AI...' : '🤖 Analisis & Mulai'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
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
                <p className="balance-caption">Saldo acuan sebelum pengeluaran berikutnya.</p>
                {assessment && (
                  <div className={`ml-classify-badge ml-${assessment.classification}`} style={{marginTop: '12px'}}>
                    {(assessment.classification || 'N/A').toUpperCase()}
                  </div>
                )}
                <div className="quick-metrics">
                  <span>{transactions.length} transaksi</span>
                  <span>{budgets.length} kantong aktif</span>
                </div>
              </div>
            </section>

            <section className="split-grid cashflow-grid-5">
              <article className="inset cashflow-card income-card">
                <p className="cashflow-label">Pemasukan</p>
                <strong>{currency(dashboard?.summary?.income)}</strong>
                <small>Uang masuk selama periode berjalan.</small>
              </article>
              <article className="inset cashflow-card expense-card">
                <p className="cashflow-label">Pengeluaran</p>
                <strong>{currency(dashboard?.summary?.expense)}</strong>
                <small>Uang keluar selama periode berjalan.</small>
              </article>
              <article className="inset cashflow-card saving-card">
                <p className="cashflow-label">Saving Rate</p>
                <strong>{dashboard?.summary?.saving_rate || 0}%</strong>
                <small>Persentase pendapatan yang masih tersimpan.</small>
              </article>
              <article className="inset cashflow-card hutang-card">
                <p className="cashflow-label">Cicilan Hutang</p>
                <strong>{currency(hutangBalance)}</strong>
                <small>Total cicilan hutang / bulan dari asesmen.</small>
              </article>
              <article className="inset cashflow-card emergency-card">
                <p className="cashflow-label">Dana Darurat</p>
                <strong>{currency(emergencyBalance)}</strong>
                <small>Total dana darurat yang tersedia saat ini.</small>
              </article>
            </section>

            {/* ── AI Predict Panel (Auto) ───────────────────────────────── */}
            <section className="panel stack">
              <div className="section-head">
                <h3>🔮 Prediksi Saldo Bulan Depan</h3>
                <p className="helper">
                  {predictLoading
                    ? 'Menjalankan prediksi otomatis...'
                    : 'Otomatis dari saldo & asesmen kamu — Powered by Finary AI'}
                </p>
              </div>
              {predictLoading ? (
                <div className="inset" style={{textAlign:'center',padding:'32px'}}>
                  <p className="helper">🔮 Sedang memprediksi saldo bulan depan...</p>
                </div>
              ) : mlPredictResult ? (
                <div className="split-grid predict-auto-grid">
                  <article className="inset predict-result predict-auto-main">
                    <p className="kicker">Prediksi Saldo Bulan Depan</p>
                    <p className="balance-amount predict-balance">
                      {currency(mlPredictResult.predicted_next_month_balance)}
                    </p>
                    <div className={`predict-warning-badge ${mlPredictResult.warning_flag ? 'flag-on' : 'flag-off'}`} style={{marginTop:'12px'}}>
                      {mlPredictResult.warning_flag ? '⚠️ Ada Risiko Keuangan' : '✅ Kondisi Aman'}
                    </div>
                    <div className="prob-row" style={{marginTop:'14px'}}>
                      <div className="prob-item">
                        <span>Probabilitas Risiko</span>
                        <div className="progress-wrap">
                          <div className={`progress ${mlPredictResult.warning_probability > 0.5 ? 'danger' : ''}`}
                            style={{ width: `${(mlPredictResult.warning_probability * 100).toFixed(0)}%` }} />
                        </div>
                        <small>{(mlPredictResult.warning_probability * 100).toFixed(0)}%</small>
                      </div>
                    </div>
                  </article>
                  <article className="inset predict-result">
                    <h3>💡 Rekomendasi AI</h3>
                    <ul className="dynamic-profile-warnings">
                      {(mlPredictResult.recommendations || []).map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                    <div className="predict-data-summary">
                      <small>📊 Berdasarkan: Pemasukan {currency(Number(predictForm.income))} · Pengeluaran {currency(Number(predictForm.expense))} · Tabungan {currency(Number(predictForm.savings))}</small>
                    </div>
                  </article>
                </div>
              ) : (
                <div className="inset">
                  <p className="helper">Lengkapi asesmen terlebih dahulu agar prediksi bisa berjalan otomatis.</p>
                </div>
              )}
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
                <h3>Status Finansial AI</h3>
                <div className="profile-mode-row">
                  <span className={`ml-classify-badge ml-${assessment?.classification || 'unknown'}`}>
                    {assessment ? (assessment.classification || '-').toUpperCase() : 'BELUM ASSESSMENT'}
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
                <h3>Insight Prediksi AI</h3>
                {mlPredictResult ? (
                  <>
                    <p className="kicker">Prediksi saldo bulan depan</p>
                    <p className="balance-amount predict-balance">
                      {currency(mlPredictResult.predicted_next_month_balance)}
                    </p>
                    <div className={`predict-warning-badge ${mlPredictResult.warning_flag ? 'flag-on' : 'flag-off'}`}
                      style={{marginTop: '8px'}}>
                      {mlPredictResult.warning_flag ? '⚠️ Ada Risiko Keuangan' : '✅ Kondisi Aman'}
                    </div>
                    <div className="prob-row" style={{marginTop: '10px'}}>
                      <div className="prob-item">
                        <span>Risk prob.</span>
                        <div className="progress-wrap">
                          <div className={`progress ${mlPredictResult.warning_probability > 0.5 ? 'danger' : ''}`}
                            style={{ width: `${(mlPredictResult.warning_probability * 100).toFixed(0)}%` }} />
                        </div>
                        <small>{(mlPredictResult.warning_probability * 100).toFixed(0)}%</small>
                      </div>
                    </div>
                    <h4 style={{marginTop:'10px'}}>Rekomendasi AI</h4>
                    <ul className="dynamic-profile-warnings">
                      {(mlPredictResult.recommendations || []).map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <>
                    <p className="helper">Jalankan prediksi dari tab <strong>Dashboard</strong> agar hasil muncul di sini.</p>
                    {profile?.prediction?.next_month_balance != null && (
                      <p>Prediksi Laravel: <strong>{currency(profile.prediction.next_month_balance)}</strong></p>
                    )}
                    <ul className="dynamic-profile-warnings">
                      {(profile?.warnings || []).length === 0 && (
                        <li>Tidak ada warning. Pertahankan ritme keuanganmu.</li>
                      )}
                      {(profile?.warnings || []).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </>
                )}
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
                    <option value="income">💰 Income (Pemasukan)</option>
                    <option value="expense">💸 Expense (Pengeluaran)</option>
                    <option value="hutang">🏦 Hutang (Cicilan/Pembayaran)</option>
                    <option value="dana_darurat">🛡️ Dana Darurat (Tabungan Darurat)</option>
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
                <p className="helper">6 field input — dikirim ke model AI (<strong>/classify</strong> &amp; <strong>/predict</strong>) untuk klasifikasi &amp; prediksi otomatis.</p>

                <label>Pendapatan Bulanan (IDR)
                  <input type="number" min="1" value={assessmentForm.monthly_income}
                    onChange={(e) => setAssessmentForm((p) => ({ ...p, monthly_income: e.target.value }))} required />
                </label>
                <label>Total Pengeluaran Bulanan (IDR)
                  <input type="number" min="0" value={assessmentForm.monthly_expense}
                    onChange={(e) => setAssessmentForm((p) => ({ ...p, monthly_expense: e.target.value }))} required />
                </label>
                <label>Tabungan Aktual Bulan Ini (IDR)
                  <input type="number" min="0" value={assessmentForm.actual_savings}
                    onChange={(e) => setAssessmentForm((p) => ({ ...p, actual_savings: e.target.value }))} required />
                </label>
                <label>Target Tabungan / Budget Goal (IDR)
                  <input type="number" min="0" value={assessmentForm.budget_goal}
                    onChange={(e) => setAssessmentForm((p) => ({ ...p, budget_goal: e.target.value }))} required />
                </label>
                <label>Cicilan Hutang / Bulan (IDR)
                  <input type="number" min="0" value={assessmentForm.loan_payment}
                    onChange={(e) => setAssessmentForm((p) => ({ ...p, loan_payment: e.target.value }))} required />
                </label>
                <label>Dana Darurat saat ini (IDR)
                  <input type="number" min="0" value={assessmentForm.emergency_fund}
                    onChange={(e) => setAssessmentForm((p) => ({ ...p, emergency_fund: e.target.value }))} required />
                </label>

                <button className="button" disabled={loading}>
                  {loading ? '🤖 Menganalisis...' : '🤖 Simpan & Analisis AI'}
                </button>
              </form>

              <article className="inset assessment-preview">
                <h3>Hasil Klasifikasi AI</h3>
                {mlClassifyResult ? (
                  <>
                    <div className={`ml-classify-badge ml-${mlClassifyResult.classification}`}>
                      {mlClassifyResult.classification?.toUpperCase()}
                    </div>
                    <p>Confidence: <strong>{(mlClassifyResult.score * 100).toFixed(1)}%</strong></p>
                    <p className="helper">{mlClassifyResult.explanation}</p>
                    <div className="prob-row">
                      {Object.entries(mlClassifyResult.probabilities || {}).map(([k, v]) => (
                        <div key={k} className="prob-item">
                          <span>{k}</span>
                          <div className="progress-wrap">
                            <div className="progress" style={{ width: `${(v * 100).toFixed(0)}%` }} />
                          </div>
                          <small>{(v * 100).toFixed(0)}%</small>
                        </div>
                      ))}
                    </div>
                    <div className="risk-flags">
                      <h4>Risk Flags</h4>
                      {Object.entries(mlClassifyResult.risk_flags || {}).map(([k, v]) => (
                        <span key={k} className={`risk-flag ${v ? 'flag-on' : 'flag-off'}`}>
                          {v ? '⚠️' : '✅'} {k.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="helper">Kirim form untuk analisis AI real-time.</p>
                    {assessment && (
                      <>
                        <p>Klasifikasi tersimpan:</p>
                        <div className={`ml-classify-badge ml-${assessment.classification}`}>
                          {(assessment.classification || '-').toUpperCase()}
                        </div>
                      </>
                    )}
                  </>
                )}
              </article>
            </div>
          </section>
        )}

        {activeTab === 'hustle' && (
          <section className="panel stack">
            <article className="inset hustle-hero">
              <form className="form-grid form-tight" onSubmit={handleRecommendationSubmit}>
                <h3>Rekomendasi Side Hustle — AI</h3>
                <p className="helper">Powered by <strong>/recommend-side-hustle</strong> AI model.</p>
                <label>Level Pengalaman
                  <select value={recommendForm.experience_level}
                    onChange={(e) => setRecommendForm((p) => ({ ...p, experience_level: e.target.value }))}>
                    {experienceLevelOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </label>
                <label>Kategori Minat
                  <select value={recommendForm.interest_category}
                    onChange={(e) => setRecommendForm((p) => ({ ...p, interest_category: e.target.value }))}>
                    {interestCategoryOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </label>
                <label>Waktu Luang / minggu (jam)
                  <input type="number" min="1" max="168" value={recommendForm.available_hours_per_week}
                    onChange={(e) => setRecommendForm((p) => ({ ...p, available_hours_per_week: e.target.value }))} />
                </label>
                <button className="button" disabled={mlLoading}>
                  {mlLoading ? '🤖 Mencari...' : '🤖 Cari Rekomendasi AI'}
                </button>
              </form>
            </article>

            <div className="recommend-grid">
              {(mlSideHustleResult || []).map((item, idx) => (
                <article className="recommend-card" key={`${item.job_category}-${idx}`}>
                  <h4>{item.job_category}</h4>
                  <p className="hustle-platform">📍 {item.platform}</p>
                  <p className="hustle-project">{item.project_type}</p>
                  <p className="hustle-income">Estimasi: <strong>{currency(item.predicted_monthly_earnings_idr)}</strong> / bulan</p>
                </article>
              ))}
              {mlSideHustleResult !== null && mlSideHustleResult.length === 0 && (
                <p className="helper">Tidak ada rekomendasi. Coba ubah parameter.</p>
              )}
              {mlSideHustleResult === null && (
                <p className="helper">Pilih parameter dan klik &quot;Cari Rekomendasi AI&quot;.</p>
              )}
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

              <article className="inset forum-info">
                <h3>Komunitas Finary</h3>
                <p className="helper">Diskusi, tanya, dan berbagi tips keuangan bersama pengguna lain.</p>
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
