import { useCallback, useEffect, useMemo, useState } from 'react'
import finaryImg from './assets/finary.png'
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

const pieColors = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)',
]

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

const platformDomains = [
  ['upwork', 'upwork.com'],
  ['fiverr', 'fiverr.com'],
  ['freelancer', 'freelancer.com'],
  ['instagram', 'instagram.com'],
  ['preply', 'preply.com'],
  ['shopee', 'shopee.co.id'],
  ['tokopedia', 'tokopedia.com'],
  ['linkedin', 'linkedin.com'],
  ['tiktok', 'tiktok.com'],
  ['youtube', 'youtube.com'],
  ['projects.co.id', 'projects.co.id'],
  ['sribulancer', 'sribulancer.com'],
  ['fastwork', 'fastwork.co.id'],
]

const getPlatformDomain = (platform = '') => {
  const normalized = platform.toLowerCase()
  const match = platformDomains.find(([keyword]) => normalized.includes(keyword))

  return match?.[1] || ''
}

const getPlatformLogo = (platform = '') => {
  const domain = getPlatformDomain(platform)

  return domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : ''
}

function App() {
  const savedToken = localStorage.getItem('finary_token')

  const [language, setLanguage] = useState(() => localStorage.getItem('finary_lang') || 'id')
  const [theme, setTheme] = useState(() => localStorage.getItem('finary_theme') || 'light')
  const [token, setToken] = useState(savedToken || '')
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(savedToken))
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isBalanceVisible, setIsBalanceVisible] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState(() => localStorage.getItem('finary_profile_photo') || '')

  // Onboarding: show assessment modal right after register
  const [showOnboarding, setShowOnboarding] = useState(false)

  // ML state
  const [mlClassifyResult, setMlClassifyResult] = useState(null)
  const [mlSideHustleResult, setMlSideHustleResult] = useState(null)
  const [mlLoading, setMlLoading] = useState(false)

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

  const [loanUpdate, setLoanUpdate] = useState(null)
  const [emergencyUpdate, setEmergencyUpdate] = useState(null)

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

  const t = useCallback((idText, enText) => (language === 'en' ? enText : idText), [language])
  const isDarkMode = theme === 'dark'

  const tabs = useMemo(
    () => [
      { id: 'dashboard', label: t('Dashboard', 'Dashboard') },
      { id: 'profile', label: t('Profil', 'Profile') },
      { id: 'transactions', label: t('Transaksi', 'Transactions') },
      { id: 'assessment', label: t('Assessment', 'Assessment') },
      { id: 'hustle', label: t('Side Hustle', 'Side Hustle') },
      { id: 'forum', label: t('Forum', 'Forum') },
    ],
    [t],
  )

  const monthlyIncome = Number(dashboard?.summary?.income || 0)
  const monthlyExpense = Number(dashboard?.summary?.expense || 0)
  const monthlyBalance = Number(dashboard?.summary?.balance || 0)
  const monthlySavings = Number(assessment?.actual_savings || 0)
  const savingsTarget = Number(assessment?.budget_goal || 0)
  const loanPayment = Number(assessment?.loan_payment || 0)
  const emergencyFund = Number(assessment?.emergency_fund || 0)
  const monthMax = Math.max(monthlyIncome, monthlyExpense, 1)

  const buildPieSlices = useCallback((items) => {
    const cleaned = items.filter((item) => item.value > 0)
    const total = cleaned.reduce((sum, item) => sum + item.value, 0)

    const { slices } = cleaned.reduce((acc, item, index) => {
      const percent = total > 0 ? (item.value / total) * 100 : 0
      const start = acc.running
      const end = acc.running + percent

      return {
        running: end,
        slices: [
          ...acc.slices,
          {
            ...item,
            color: pieColors[index % pieColors.length],
            percent,
            start,
            end,
          },
        ],
      }
    }, { running: 0, slices: [] })

    return { slices, total }
  }, [])

  const expenseSlices = useMemo(
    () => buildPieSlices(budgets.map((item) => ({
      label: item.category,
      value: Number(item.spent) || 0,
    }))),
    [budgets, buildPieSlices],
  )

  const incomeSlices = useMemo(() => {
    const incomeMap = new Map()
    transactions
      .filter((item) => item.type === 'income')
      .forEach((item) => {
        const key = item.category || t('Lainnya', 'Other')
        const nextValue = (incomeMap.get(key) || 0) + Number(item.amount || 0)
        incomeMap.set(key, nextValue)
      })

    const items = Array.from(incomeMap.entries()).map(([label, value]) => ({
      label,
      value,
    }))

    return buildPieSlices(items)
  }, [transactions, buildPieSlices, t])

  const getPieBackground = useCallback((slicesData) => {
    if (slicesData.total <= 0) {
      return 'conic-gradient(var(--chart-empty) 0% 100%)'
    }

    const gradient = slicesData.slices
      .map((slice) => `${slice.color} ${slice.start}% ${slice.end}%`)
      .join(', ')

    return `conic-gradient(${gradient})`
  }, [])

  const expensePieBackground = useMemo(() => getPieBackground(expenseSlices), [expenseSlices, getPieBackground])
  const incomePieBackground = useMemo(() => getPieBackground(incomeSlices), [incomeSlices, getPieBackground])

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

  const displayedSideHustles = useMemo(
    () => mlSideHustleResult ?? recommendations,
    [mlSideHustleResult, recommendations],
  )

  const userLeaderboardRow = useMemo(
    () => leaderboard.find((item) => item.name === user?.name),
    [leaderboard, user],
  )

  const userInitials = useMemo(() => {
    const rawName = user?.name || ''
    const parts = rawName.trim().split(' ').filter(Boolean)
    if (parts.length === 0) {
      return '??'
    }

    return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('')
  }, [user])

  const metricSlides = useMemo(
    () => [
      {
        key: 'loan',
        label: t('Cicilan Hutang', 'Loan Installment'),
        value: currency(loanPayment),
        helper: t('Perkiraan cicilan bulanan.', 'Estimated monthly installment.'),
      },
      {
        key: 'emergency',
        label: t('Dana Darurat', 'Emergency Fund'),
        value: currency(emergencyFund),
        helper: t('Dana cadangan yang tersedia.', 'Reserve funds available now.'),
      },
      {
        key: 'savings',
        label: t('Tabungan Bulan Ini', 'Savings This Month'),
        value: currency(monthlySavings),
        helper: t('Mengacu pada asesmen terakhir.', 'Based on your latest assessment.'),
      },
      {
        key: 'target',
        label: t('Target Tabungan', 'Savings Target'),
        value: currency(savingsTarget),
        helper: t('Target tabungan yang ingin dicapai.', 'Savings goal you want to reach.'),
      },
    ],
    [t, loanPayment, emergencyFund, monthlySavings, savingsTarget],
  )

  const pocketOptions = useMemo(() => {
    const categories = budgets
      .map((item) => item.category?.trim())
      .filter(Boolean)

    return Array.from(new Set(categories)).sort((a, b) => a.localeCompare(b, 'id'))
  }, [budgets])
  const selectedPocketCategory = pocketOptions.includes(transactionForm.category)
    ? transactionForm.category
    : (pocketOptions[0] || '')
  const loanUpdateValue = loanUpdate ?? (assessment ? String(assessment.loan_payment ?? '') : '')
  const emergencyUpdateValue = emergencyUpdate ?? (assessment ? String(assessment.emergency_fund ?? '') : '')

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
    setLoanUpdate(null)
    setEmergencyUpdate(null)
    setIsBalanceVisible(false)
    setIsBootstrapping(false)
  }

  useEffect(() => {
    localStorage.setItem('finary_lang', language)
  }, [language])

  useEffect(() => {
    localStorage.setItem('finary_theme', theme)
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    if (profilePhoto) {
      localStorage.setItem('finary_profile_photo', profilePhoto)
      return
    }

    localStorage.removeItem('finary_profile_photo')
  }, [profilePhoto])

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

  const handleProfilePhotoChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      if (result) {
        setProfilePhoto(result)
      }
    }
    reader.readAsDataURL(file)
  }

  const buildAssessmentPayload = (overrides = {}) => {
    if (!assessment) {
      return null
    }

    const loanValue = overrides.loan_payment ?? assessment.loan_payment ?? 0
    const emergencyValue = overrides.emergency_fund ?? assessment.emergency_fund ?? 0

    return {
      monthly_income: Number(assessment.monthly_income || 0),
      monthly_expense: Number(assessment.monthly_expense || 0),
      actual_savings: Number(assessment.actual_savings || 0),
      budget_goal: Number(assessment.budget_goal || 0),
      emergency_fund: Number(emergencyValue || 0),
      loan_payment: Number(loanValue || 0),
      classification: assessment.classification || 'unknown',
    }
  }

  const handleLoanUpdateSubmit = async (event) => {
    event.preventDefault()
    const payload = buildAssessmentPayload({ loan_payment: Number(loanUpdateValue || 0) })

    if (!payload) {
      setError(t('Lengkapi assessment dulu sebelum memperbarui cicilan.', 'Complete the assessment before updating loan installments.'))
      setMessage('')
      return
    }

    await guardedAction(async () => {
      await assessmentApi.create(payload)
      setLoanUpdate(null)
    }, t('Cicilan hutang diperbarui.', 'Loan installment updated.'))
  }

  const handleEmergencyUpdateSubmit = async (event) => {
    event.preventDefault()
    const payload = buildAssessmentPayload({ emergency_fund: Number(emergencyUpdateValue || 0) })

    if (!payload) {
      setError(t('Lengkapi assessment dulu sebelum memperbarui dana darurat.', 'Complete the assessment before updating emergency funds.'))
      setMessage('')
      return
    }

    await guardedAction(async () => {
      await assessmentApi.create(payload)
      setEmergencyUpdate(null)
    }, t('Dana darurat diperbarui.', 'Emergency fund updated.'))
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
        category: selectedPocketCategory,
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
      const response = await assessmentApi.create({
        monthly_income: Number(assessmentForm.monthly_income),
        monthly_expense: Number(assessmentForm.monthly_expense),
        actual_savings: Number(assessmentForm.actual_savings),
        budget_goal: Number(assessmentForm.budget_goal),
        emergency_fund: Number(assessmentForm.emergency_fund),
        loan_payment: Number(assessmentForm.loan_payment || 0),
      })
      const savedAssessment = response.data.data
      const classifyData = savedAssessment?.metadata?.classification_result || {
        classification: savedAssessment?.classification || 'unknown',
        score: savedAssessment?.ml_score || 0,
        explanation: savedAssessment?.ml_explanation || '',
      }

      setMlClassifyResult(classifyData)

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

  const handleRecommendationSubmit = async (event) => {
    event.preventDefault()
    setMlLoading(true)
    setError('')
    setMessage('')

    try {
      const res = await recommendationApi.sideHustles({
        experience_level: recommendForm.experience_level,
        available_hours_per_week: Number(recommendForm.available_hours_per_week),
        interest_category: recommendForm.interest_category,
      })
      setMlSideHustleResult(res.data.data?.recommendations || [])
      setRecommendationSource(res.data.data?.source || '-')
      setMessage('Rekomendasi side hustle berhasil dimuat.')
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Gagal memuat rekomendasi side hustle.')
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

  const formatTransactionType = useCallback((type) => {
    if (type === 'income') {
      return t('Pemasukan', 'Income')
    }
    if (type === 'expense') {
      return t('Pengeluaran', 'Expense')
    }
    return type
  }, [t])

  if (token && isBootstrapping) {
    return (
      <div className="page">
        <section className="panel loading-panel">
          <p className="kicker">{t('Menyiapkan akun', 'Preparing account')}</p>
          <h2>{t('Sedang menyiapkan data akunmu.', 'Setting up your account data.')}</h2>
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
          <div className="head-actions">
            <button
              type="button"
              className="button ghost tiny"
              onClick={() => setLanguage((prev) => (prev === 'id' ? 'en' : 'id'))}
              aria-label={t('Ganti bahasa', 'Switch language')}
            >
              {language === 'id' ? 'EN' : 'ID'}
            </button>
            <button
              type="button"
              className="button ghost tiny"
              onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
              aria-label={isDarkMode ? t('Aktifkan mode terang', 'Enable light mode') : t('Aktifkan mode gelap', 'Enable dark mode')}
            >
              {isDarkMode ? t('Light', 'Light') : t('Dark', 'Dark')}
            </button>
            <button className="button ghost" onClick={handleDemoLogin} disabled={loading}>
              {loading ? t('Memuat...', 'Loading...') : t('Masuk Demo', 'Demo Login')}
            </button>
          </div>
        </header>

        <main className="auth-center">
          <div className="auth-box">
            <div className="auth-brand-block auth-brand-image">
              <img src={finaryImg} alt="Finary" className="auth-finary-img" />
              <h1>Finary</h1>
              <p>{t('Kelola keuanganmu dengan cerdas — didukung AI.', 'Manage your finances smartly — powered by AI.')}</p>
            </div>

            <div className="panel auth-form-panel">
              <form className="auth-grid" onSubmit={handleAuthSubmit}>
                <div className="auth-card-head">
                  <h2>{authMode === 'login' ? t('Masuk ke Finary', 'Sign in to Finary') : t('Buat akun baru', 'Create a new account')}</h2>
                  <p>{authMode === 'login' ? t('Masukkan email dan password.', 'Enter your email and password.') : t('Isi data untuk mulai daftar.', 'Fill in the details to get started.')}</p>
                </div>

                {authMode === 'register' && (
                  <label>{t('Nama', 'Name')}
                    <input value={authForm.name} onChange={(e) => setAuthForm((p) => ({ ...p, name: e.target.value }))} required />
                  </label>
                )}
                <label>{t('Email', 'Email')}
                  <input type="email" value={authForm.email} onChange={(e) => setAuthForm((p) => ({ ...p, email: e.target.value }))} required />
                </label>
                <label>{t('Password', 'Password')}
                  <input type="password" value={authForm.password} onChange={(e) => setAuthForm((p) => ({ ...p, password: e.target.value }))} required />
                </label>
                {authMode === 'register' && (
                  <label>{t('Konfirmasi Password', 'Confirm Password')}
                    <input type="password" value={authForm.password_confirmation} onChange={(e) => setAuthForm((p) => ({ ...p, password_confirmation: e.target.value }))} required />
                  </label>
                )}

                {error && <div className="alert error"><span>{error}</span><button type="button" className="alert-close" onClick={() => setError('')}>x</button></div>}
                {message && <div className="alert success"><span>{message}</span><button type="button" className="alert-close" onClick={() => setMessage('')}>x</button></div>}

                <div className="auth-actions">
                  <button className="button" disabled={loading}>
                    {loading ? t('Memuat...', 'Loading...') : authMode === 'login' ? t('Login', 'Login') : t('Register', 'Register')}
                  </button>
                  <button type="button" className="button ghost" onClick={() => setAuthMode((p) => (p === 'login' ? 'register' : 'login'))}>
                    {authMode === 'login' ? t('Buat akun baru', 'Create a new account') : t('Sudah punya akun? Login', 'Already have an account? Login')}
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
          <span className="onboarding-step">{t('Langkah 1 dari 1 — Asesmen Awal', 'Step 1 of 1 — Initial Assessment')}</span>
        </header>
        <main className="auth-center">
          <div className="auth-box onboarding-box">
            <div className="auth-brand-block auth-brand-image">
              <img src={finaryImg} alt="Finary" className="auth-finary-img" />
              <h1>{t('Asesmen Finansial', 'Financial Assessment')}</h1>
              <p>{t('Isi data keuanganmu agar AI bisa mengklasifikasikan kondisi finansialmu secara akurat.', 'Fill in your financial data so AI can classify your condition accurately.')}</p>
            </div>
            <div className="panel auth-form-panel">
              <form className="auth-grid" onSubmit={handleAssessmentSubmit}>
                <div className="auth-card-head">
                  <h2>{t('Data Keuangan Kamu', 'Your Financial Data')}</h2>
                  <p>{t('6 field — sesuai dengan input model AI /classify.', '6 fields — aligned with the AI model inputs /classify.')}</p>
                </div>
                <label>{t('Pendapatan Bulanan (IDR)', 'Monthly Income (IDR)')}
                  <input type="number" min="1" value={assessmentForm.monthly_income}
                    onChange={(e) => setAssessmentForm((p) => ({ ...p, monthly_income: e.target.value }))} required />
                </label>
                <label>{t('Total Pengeluaran Bulanan (IDR)', 'Total Monthly Expenses (IDR)')}
                  <input type="number" min="0" value={assessmentForm.monthly_expense}
                    onChange={(e) => setAssessmentForm((p) => ({ ...p, monthly_expense: e.target.value }))} required />
                </label>
                <label>{t('Tabungan Aktual Bulan Ini (IDR)', 'Actual Savings This Month (IDR)')}
                  <input type="number" min="0" value={assessmentForm.actual_savings}
                    onChange={(e) => setAssessmentForm((p) => ({ ...p, actual_savings: e.target.value }))} required />
                </label>
                <label>{t('Target Tabungan / Budget Goal (IDR)', 'Savings Target / Budget Goal (IDR)')}
                  <input type="number" min="0" value={assessmentForm.budget_goal}
                    onChange={(e) => setAssessmentForm((p) => ({ ...p, budget_goal: e.target.value }))} required />
                </label>
                <label>{t('Cicilan Hutang / Bulan (IDR)', 'Loan Installment / Month (IDR)')}
                  <input type="number" min="0" value={assessmentForm.loan_payment}
                    onChange={(e) => setAssessmentForm((p) => ({ ...p, loan_payment: e.target.value }))} required />
                </label>
                <label>{t('Dana Darurat saat ini (IDR)', 'Emergency Fund (IDR)')}
                  <input type="number" min="0" value={assessmentForm.emergency_fund}
                    onChange={(e) => setAssessmentForm((p) => ({ ...p, emergency_fund: e.target.value }))} required />
                </label>
                {error && <div className="alert error"><span>{error}</span><button type="button" className="alert-close" onClick={() => setError('')}>x</button></div>}
                <div className="auth-actions">
                  <button className="button" disabled={loading}>
                    {loading ? t('🤖 Menganalisis AI...', '🤖 Analyzing...') : t('🤖 Analisis & Mulai', '🤖 Analyze & Start')}
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
          aria-label={t('Buka menu navigasi', 'Open navigation menu')}
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
                setIsUserMenuOpen(false)
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="head-actions">
          <span className="head-greeting">{t('Halo', 'Hi')}, {user.name}</span>
          <div className="head-dropdown">
            <button
              type="button"
              className={`head-dropdown-toggle ${isUserMenuOpen ? 'open' : ''}`}
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={isUserMenuOpen}
              aria-controls="user-menu-panel"
              aria-label={t('Buka menu pengguna', 'Open user menu')}
            >
              <span />
              <span />
              <span />
            </button>
            <div
              id="user-menu-panel"
              className={`head-dropdown-panel ${isUserMenuOpen ? 'open' : ''}`}
              role="menu"
            >
              <button
                type="button"
                className="button ghost tiny"
                onClick={() => {
                  setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
                  setIsUserMenuOpen(false)
                }}
                aria-label={isDarkMode ? t('Aktifkan mode terang', 'Enable light mode') : t('Aktifkan mode gelap', 'Enable dark mode')}
                role="menuitem"
              >
                {isDarkMode ? t('Light', 'Light') : t('Dark', 'Dark')}
              </button>
              <button
                type="button"
                className="button ghost tiny"
                onClick={() => {
                  setLanguage((prev) => (prev === 'id' ? 'en' : 'id'))
                  setIsUserMenuOpen(false)
                }}
                aria-label={t('Ganti bahasa', 'Switch language')}
                role="menuitem"
              >
                {language === 'id' ? 'EN' : 'ID'}
              </button>
              <button
                className="button ghost"
                onClick={() => {
                  setIsUserMenuOpen(false)
                  handleLogout()
                }}
                disabled={loading}
                role="menuitem"
              >
                {t('Logout', 'Logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {(error || message || !assessment) && (
        <div className="notice-wrap">
          {!assessment && (
            <p className="alert onboarding">
              {t('Mulai dari tab Assessment agar insight lebih personal.', 'Start with the Assessment tab for personalized insights.')}
            </p>
          )}
          {error && (
            <div className="alert error">
              <span>{error}</span>
              <button
                type="button"
                className="alert-close"
                onClick={() => setError('')}
                aria-label={t('Tutup notifikasi', 'Close notification')}
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
                aria-label={t('Tutup notifikasi', 'Close notification')}
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
                <p className="kicker">{t('Saldo Utama', 'Main Balance')}</p>
                <h2>{t('Posisi keuanganmu bulan ini', 'Your financial position this month')}</h2>
                <div className="balance-row">
                  <p className={`balance-amount ${isBalanceVisible ? '' : 'is-hidden'}`}>
                    {isBalanceVisible ? currency(monthlyBalance) : '******'}
                  </p>
                  <button
                    type="button"
                    className="button ghost tiny"
                    onClick={() => setIsBalanceVisible((prev) => !prev)}
                  >
                    {isBalanceVisible ? t('Sembunyikan', 'Hide') : t('Lihat', 'Show')}
                  </button>
                </div>
                <p className="balance-caption">{t('Saldo acuan sebelum pengeluaran berikutnya.', 'Baseline balance before upcoming expenses.')}</p>
                <div className="quick-metrics">
                  <span>{transactions.length} {t('transaksi', 'transactions')}</span>
                  <span>{budgets.length} {t('kantong aktif', 'active pockets')}</span>
                </div>
              </div>
            </section>

            <section className="panel stack">
              <div className="section-head">
                <h3>{t('Ringkasan Cashflow', 'Cashflow Overview')}</h3>
                <p className="helper">
                  {t('Pemasukan dan pengeluaran bulan ini dalam satu tampilan.', 'Income and expense snapshot for this month.')}
                </p>
              </div>
              <div className="split-grid duo dashboard-overview">
                <article className="inset income-pie-card">
                  <div className="pie-wrap">
                    <div className="pie-chart" style={{ background: incomePieBackground }} aria-hidden="true" />
                    <div className="pie-center">
                      <span>{t('Pemasukan', 'Income')}</span>
                      <strong>{currency(incomeSlices.total || monthlyIncome)}</strong>
                    </div>
                  </div>
                  <div className="pie-legend">
                    {incomeSlices.slices.length === 0 ? (
                      <p className="helper">{t('Belum ada pemasukan per kategori bulan ini.', 'No income by category recorded this month.')}</p>
                    ) : (
                      incomeSlices.slices.map((slice) => (
                        <div className="pie-legend-item" key={slice.label}>
                          <span className="pie-dot" style={{ background: slice.color }} />
                          <span>{slice.label}</span>
                          <strong>{currency(slice.value)}</strong>
                        </div>
                      ))
                    )}
                  </div>
                </article>
                <article className="inset expense-pie-card">
                  <div className="pie-wrap">
                    <div className="pie-chart" style={{ background: expensePieBackground }} aria-hidden="true" />
                    <div className="pie-center">
                      <span>{t('Pengeluaran', 'Expense')}</span>
                      <strong>{currency(expenseSlices.total || monthlyExpense)}</strong>
                    </div>
                  </div>
                  <div className="pie-legend">
                    {expenseSlices.slices.length === 0 ? (
                      <p className="helper">{t('Belum ada pengeluaran per kantong bulan ini.', 'No pocket expenses recorded this month.')}</p>
                    ) : (
                      expenseSlices.slices.map((slice) => (
                        <div className="pie-legend-item" key={slice.label}>
                          <span className="pie-dot" style={{ background: slice.color }} />
                          <span>{slice.label}</span>
                          <strong>{currency(slice.value)}</strong>
                        </div>
                      ))
                    )}
                  </div>
                </article>
              </div>
              <div className="metric-carousel" role="list">
                {metricSlides.map((item) => (
                  <article className="metric-slide" key={item.key} role="listitem">
                    <p className="metric-label">{item.label}</p>
                    <strong>{item.value}</strong>
                    <small>{item.helper}</small>
                  </article>
                ))}
              </div>
            </section>

            <section className="panel stack">
              <div className="section-head">
                <h3>{t('Kantong Aktif', 'Active Pockets')}</h3>
                <p className="helper">{budgets.length} {t('kantong terdaftar', 'pockets registered')}</p>
              </div>

              <div className="pocket-grid">
                {budgets.length === 0 && (
                  <article className="pocket-card empty">
                    <strong>{t('Belum ada kantong.', 'No pockets yet.')}</strong>
                    <p>{t('Buka tab Transaksi, lalu tambah kantong budget dulu.', 'Open the Transactions tab and add a budget pocket first.')}</p>
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
                    <small>{Math.round(item.progress_percent || 0)}% {t('terpakai', 'used')}</small>
                  </article>
                ))}
              </div>
            </section>

            <section className="panel stack">
              <div className="section-head">
                <h3>{t('Cashflow Bulan Ini', 'This Month Cashflow')}</h3>
                <p className="helper">
                  {t('Perbandingan pemasukan dan pengeluaran bulan berjalan.', 'Income vs expense for the current month.')}
                </p>
              </div>

              <div className="chart-single">
                <div className="chart-single-row">
                  <span>{t('Pemasukan', 'Income')}</span>
                  <div className="progress-wrap">
                    <div
                      className="progress income"
                      style={{ width: `${(monthlyIncome / monthMax) * 100}%` }}
                    />
                  </div>
                  <strong>{currency(monthlyIncome)}</strong>
                </div>
                <div className="chart-single-row">
                  <span>{t('Pengeluaran', 'Expense')}</span>
                  <div className="progress-wrap">
                    <div
                      className="progress expense"
                      style={{ width: `${(monthlyExpense / monthMax) * 100}%` }}
                    />
                  </div>
                  <strong>{currency(monthlyExpense)}</strong>
                </div>
              </div>
            </section>

            <section className="panel stack">
              <div className="split-grid duo dashboard-bottom">
                <article className="inset">
                  <h3>{t('Progress Badge', 'Badge Progress')}</h3>
                  <p>
                    {badges?.summary?.unlocked_count || 0} / {badges?.summary?.total_badges || 0} {t('badge terbuka', 'badges unlocked')}
                  </p>
                  <p className="achievement-level">
                    {t('Level Pencapaian', 'Achievement Level')}: <strong>Lv {achievementLevel}</strong>
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
                            {badge.unlocked ? t('Terbuka', 'Unlocked') : t('Terkunci', 'Locked')}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </article>

                <article className="inset leaderboard-panel">
                  <h3>{t('Leaderboard', 'Leaderboard')}</h3>
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
          <section className="panel stack profile-simple">
            <div className="profile-header">
              <div className="profile-avatar">
                {profilePhoto ? (
                  <img src={profilePhoto} alt={t('Foto profil', 'Profile photo')} />
                ) : (
                  <div className="profile-avatar-fallback">{userInitials}</div>
                )}
              </div>
              <div className="profile-header-main">
                <h2>{user.name || '-'}</h2>
                <p>{user.email || '-'}</p>
                {assessment?.classification !== 'stable' && (
                  <div className="profile-status-chip">
                    <span className={`ml-classify-badge ml-${assessment?.classification || 'unknown'}`}>
                      {assessment ? (assessment.classification || '-').toUpperCase() : t('BELUM ASSESSMENT', 'NOT ASSESSED')}
                    </span>
                  </div>
                )}
                <div className="profile-meta-row">
                  <span>{t('Status akun', 'Account status')}: <strong>{assessment ? t('Aktif', 'Active') : t('Belum assessment', 'Assessment pending')}</strong></span>
                  <span>{t('Bergabung', 'Joined')}: <strong>{user.created_at ? compactDate(user.created_at) : '-'}</strong></span>
                </div>
                <div className="profile-actions">
                  <label className="button ghost tiny" htmlFor="profile-photo-input">
                    {t('Ganti Foto', 'Change Photo')}
                  </label>
                  <input
                    id="profile-photo-input"
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePhotoChange}
                    hidden
                  />
                  {profilePhoto && (
                    <button
                      type="button"
                      className="button ghost tiny"
                      onClick={() => setProfilePhoto('')}
                    >
                      {t('Hapus Foto', 'Remove Photo')}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="split-grid profile-grid">
              <article className="inset profile-card simple">
                <h3>{t('Ringkasan Finansial', 'Financial Summary')}</h3>
                <div className="profile-meta">
                  <p>{t('Kebiasaan belanja', 'Spending habit')}: <strong>{profile?.spending_habit || '-'}</strong></p>
                  <p>{t('Pola pemasukan', 'Income pattern')}: <strong>{profile?.income_pattern || '-'}</strong></p>
                  <p>{t('Perilaku menabung', 'Saving behavior')}: <strong>{profile?.saving_behavior || '-'}</strong></p>
                  <p>{t('Posisi leaderboard', 'Leaderboard position')}: <strong>{userLeaderboardRow ? `#${userLeaderboardRow.rank}` : '-'}</strong></p>
                </div>
              </article>

              <article className="inset profile-card simple profile-prediction-card">
                <div className="profile-card-head">
                  <h3>{t('Prediksi Harian AI', 'Daily AI Prediction')}</h3>
                  <span className="status-pill ready">{profile?.prediction?.source || '-'}</span>
                </div>
                <p className="helper">
                  {t('Otomatis dihitung sekali per hari dari data dashboard dan assessment terbaru.', 'Automatically calculated once per day from dashboard data and the latest assessment.')}
                </p>
                <strong className="predict-balance">
                  {currency(profile?.prediction?.next_month_balance || 0)}
                </strong>
                <div className="prediction-stats">
                  <span>
                    {t('Risiko warning', 'Warning risk')}
                    <strong>{(((profile?.prediction?.warning_probability || 0) * 100)).toFixed(0)}%</strong>
                  </span>
                  <span>
                    {t('Status', 'Status')}
                    <strong>{profile?.prediction?.warning_flag ? t('Perlu perhatian', 'Needs attention') : t('Terkendali', 'Under control')}</strong>
                  </span>
                  <span>
                    {t('Tanggal', 'Date')}
                    <strong>{profile?.prediction?.generated_for || '-'}</strong>
                  </span>
                </div>
              </article>

              <article className="inset profile-card simple">
                <h3>{t('Peringatan & Rekomendasi', 'Warnings & Recommendations')}</h3>
                <ul className="dynamic-profile-warnings">
                  {(profile?.warnings || []).length === 0 && (profile?.recommendations || []).length === 0 && (
                    <li>{t('Tidak ada peringatan. Pertahankan ritme keuanganmu.', 'No warnings yet. Keep up the good rhythm.')}</li>
                  )}
                  {(profile?.warnings || []).map((item) => (
                    <li key={`warning-${item}`}>{item}</li>
                  ))}
                  {(profile?.recommendations || []).map((item) => (
                    <li key={`rec-${item}`}>{item}</li>
                  ))}
                </ul>
              </article>
            </div>

            <article className="inset profile-achievement-card">
              <h3>{t('Achievement Terbaru', 'Latest Achievements')}</h3>
              <p>
                {badges?.summary?.unlocked_count || 0} / {badges?.summary?.total_badges || 0} {t('badge terbuka', 'badges unlocked')}
              </p>

              <div className="profile-achievement-list">
                {latestUnlockedBadges.length === 0 && (
                  <p className="helper">{t('Belum ada badge yang terbuka.', 'No badges unlocked yet.')}</p>
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
          </section>
        )}

        {activeTab === 'transactions' && (
          <section className="panel stack">
            <div className="split-grid transactions-grid">
              <form className="inset form-grid" onSubmit={handleTransactionSubmit}>
                <h3>{t('Input Transaksi', 'Add Transaction')}</h3>
                <label>
                  {t('Tipe', 'Type')}
                  <select
                    value={transactionForm.type}
                    onChange={(e) => setTransactionForm((prev) => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="income">💰 {t('Pemasukan', 'Income')}</option>
                    <option value="expense">💸 {t('Pengeluaran', 'Expense')}</option>
                  </select>
                </label>
                <label>
                  {t('Kantong', 'Pocket')}
                  <select
                    value={selectedPocketCategory}
                    onChange={(e) => setTransactionForm((prev) => ({ ...prev, category: e.target.value }))}
                    disabled={pocketOptions.length === 0}
                    required
                  >
                    {pocketOptions.length === 0 && (
                      <option value="">{t('Belum ada kantong', 'No pockets yet')}</option>
                    )}
                    {pocketOptions.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>
                {pocketOptions.length === 0 && (
                  <p className="helper">{t('Tambah kantong budget dulu agar transaksi bisa dipilih dari dropdown.', 'Create a budget pocket first so you can select it here.')}</p>
                )}
                <label>
                  {t('Nominal', 'Amount')}
                  <input
                    type="number"
                    min="1"
                    value={transactionForm.amount}
                    onChange={(e) => setTransactionForm((prev) => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </label>
                <label>
                  {t('Tanggal', 'Date')}
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
                  {t('Catatan', 'Notes')}
                  <textarea
                    value={transactionForm.note}
                    onChange={(e) => setTransactionForm((prev) => ({ ...prev, note: e.target.value }))}
                  />
                </label>
                <button className="button" disabled={loading || pocketOptions.length === 0}>
                  {t('Simpan Transaksi', 'Save Transaction')}
                </button>
              </form>

              <div className="inset">
                <h3>{t('Kantong Budget', 'Budget Pockets')}</h3>
                <form className="form-grid compact" onSubmit={handleBudgetSubmit}>
                  <label>
                    {t('Kategori', 'Category')}
                    <input
                      list="category-list"
                      value={budgetForm.category}
                      onChange={(e) => setBudgetForm((prev) => ({ ...prev, category: e.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    {t('Periode (YYYY-MM)', 'Period (YYYY-MM)')}
                    <input
                      type="month"
                      value={budgetForm.period}
                      onChange={(e) => setBudgetForm((prev) => ({ ...prev, period: e.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    {t('Limit Bulanan', 'Monthly Limit')}
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
                  <button className="button" disabled={loading}>{t('Simpan Budget', 'Save Budget')}</button>
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

            <div className="split-grid duo transaction-extra">
              <form className="inset form-grid compact" onSubmit={handleLoanUpdateSubmit}>
                <h3>{t('Cicilan Hutang', 'Loan Installment')}</h3>
                <p className="helper">{t('Perbarui cicilan bulanan dari assessment.', 'Update monthly installments from your assessment.')}</p>
                <label>
                  {t('Nominal', 'Amount')}
                  <input
                    type="number"
                    min="0"
                  value={loanUpdateValue}
                    onChange={(e) => setLoanUpdate(e.target.value)}
                    required
                  />
                </label>
                <p className="helper">
                  {t('Nilai saat ini', 'Current value')}: <strong>{currency(loanPayment)}</strong>
                </p>
                <button className="button" disabled={loading || !assessment}>
                  {t('Simpan', 'Save')}
                </button>
                {!assessment && (
                  <p className="helper">{t('Lengkapi assessment dulu agar bisa diperbarui.', 'Complete the assessment before updating this value.')}</p>
                )}
              </form>

              <form className="inset form-grid compact" onSubmit={handleEmergencyUpdateSubmit}>
                <h3>{t('Dana Darurat', 'Emergency Fund')}</h3>
                <p className="helper">{t('Perbarui dana darurat terbaru dari assessment.', 'Update your latest emergency fund value.')}</p>
                <label>
                  {t('Nominal', 'Amount')}
                  <input
                    type="number"
                    min="0"
                  value={emergencyUpdateValue}
                    onChange={(e) => setEmergencyUpdate(e.target.value)}
                    required
                  />
                </label>
                <p className="helper">
                  {t('Nilai saat ini', 'Current value')}: <strong>{currency(emergencyFund)}</strong>
                </p>
                <button className="button" disabled={loading || !assessment}>
                  {t('Simpan', 'Save')}
                </button>
                {!assessment && (
                  <p className="helper">{t('Lengkapi assessment dulu agar bisa diperbarui.', 'Complete the assessment before updating this value.')}</p>
                )}
              </form>
            </div>

            <div className="inset">
              <div className="table-head">
                <h3>{t('Riwayat Transaksi', 'Transaction History')}</h3>
                <button className="button ghost" onClick={handleExportCsv} disabled={loading}>
                  {t('Export CSV', 'Export CSV')}
                </button>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{t('Tanggal', 'Date')}</th>
                      <th>{t('Tipe', 'Type')}</th>
                      <th>{t('Kategori', 'Category')}</th>
                      <th>{t('Nominal', 'Amount')}</th>
                      <th>{t('Aksi', 'Action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((item) => (
                      <tr key={item.id}>
                        <td>{compactDate(item.transaction_date)}</td>
                        <td>{formatTransactionType(item.type)}</td>
                        <td>{item.category}</td>
                        <td>{currency(item.amount)}</td>
                        <td>
                          <button
                            className="button tiny"
                            onClick={() => handleDeleteTransaction(item.id)}
                            disabled={loading}
                          >
                            {t('Hapus', 'Delete')}
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
                <h3>{t('Assessment Finansial', 'Financial Assessment')}</h3>
                <p className="helper">{t('6 field input — dikirim ke model AI (/classify) untuk klasifikasi otomatis.', '6 input fields — sent to the AI model (/classify) for automatic classification.')}</p>

                <label>{t('Pendapatan Bulanan (IDR)', 'Monthly Income (IDR)')}
                  <input type="number" min="1" value={assessmentForm.monthly_income}
                    onChange={(e) => setAssessmentForm((p) => ({ ...p, monthly_income: e.target.value }))} required />
                </label>
                <label>{t('Total Pengeluaran Bulanan (IDR)', 'Total Monthly Expenses (IDR)')}
                  <input type="number" min="0" value={assessmentForm.monthly_expense}
                    onChange={(e) => setAssessmentForm((p) => ({ ...p, monthly_expense: e.target.value }))} required />
                </label>
                <label>{t('Tabungan Aktual Bulan Ini (IDR)', 'Actual Savings This Month (IDR)')}
                  <input type="number" min="0" value={assessmentForm.actual_savings}
                    onChange={(e) => setAssessmentForm((p) => ({ ...p, actual_savings: e.target.value }))} required />
                </label>
                <label>{t('Target Tabungan / Budget Goal (IDR)', 'Savings Target / Budget Goal (IDR)')}
                  <input type="number" min="0" value={assessmentForm.budget_goal}
                    onChange={(e) => setAssessmentForm((p) => ({ ...p, budget_goal: e.target.value }))} required />
                </label>
                <label>{t('Cicilan Hutang / Bulan (IDR)', 'Loan Installment / Month (IDR)')}
                  <input type="number" min="0" value={assessmentForm.loan_payment}
                    onChange={(e) => setAssessmentForm((p) => ({ ...p, loan_payment: e.target.value }))} required />
                </label>
                <label>{t('Dana Darurat saat ini (IDR)', 'Emergency Fund (IDR)')}
                  <input type="number" min="0" value={assessmentForm.emergency_fund}
                    onChange={(e) => setAssessmentForm((p) => ({ ...p, emergency_fund: e.target.value }))} required />
                </label>

                <button className="button" disabled={loading}>
                  {loading ? t('🤖 Menganalisis...', '🤖 Analyzing...') : t('🤖 Simpan & Analisis AI', '🤖 Save & Analyze')}
                </button>
              </form>

              <article className="inset assessment-preview">
                <h3>{t('Hasil Klasifikasi AI', 'AI Classification Result')}</h3>
                {mlClassifyResult ? (
                  <>
                    <div className={`ml-classify-badge ml-${mlClassifyResult.classification}`}>
                      {mlClassifyResult.classification?.toUpperCase()}
                    </div>
                    <p>{t('Kepercayaan', 'Confidence')}: <strong>{(mlClassifyResult.score * 100).toFixed(1)}%</strong></p>
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
                      <h4>{t('Penanda Risiko', 'Risk Flags')}</h4>
                      {Object.entries(mlClassifyResult.risk_flags || {}).map(([k, v]) => (
                        <span key={k} className={`risk-flag ${v ? 'flag-on' : 'flag-off'}`}>
                          {v ? '⚠️' : '✅'} {k.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="helper">{t('Kirim form untuk analisis AI real-time.', 'Submit the form for real-time AI analysis.')}</p>
                    {assessment && (
                      <>
                        <p>{t('Klasifikasi tersimpan', 'Saved classification')}:</p>
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
                <h3>{t('Rekomendasi Side Hustle — AI', 'Side Hustle Recommendations — AI')}</h3>
                <p className="helper">{t('Powered by /recommend-side-hustle AI model.', 'Powered by /recommend-side-hustle AI model.')}</p>
                <label>{t('Level Pengalaman', 'Experience Level')}
                  <select value={recommendForm.experience_level}
                    onChange={(e) => setRecommendForm((p) => ({ ...p, experience_level: e.target.value }))}>
                    {experienceLevelOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </label>
                <label>{t('Kategori Minat', 'Interest Category')}
                  <select value={recommendForm.interest_category}
                    onChange={(e) => setRecommendForm((p) => ({ ...p, interest_category: e.target.value }))}>
                    {interestCategoryOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </label>
                <label>{t('Waktu Luang / minggu (jam)', 'Available hours / week')}
                  <input type="number" min="1" max="168" value={recommendForm.available_hours_per_week}
                    onChange={(e) => setRecommendForm((p) => ({ ...p, available_hours_per_week: e.target.value }))} />
                </label>
                <button className="button" disabled={mlLoading}>
                  {mlLoading ? t('🤖 Mencari...', '🤖 Searching...') : t('🤖 Cari Rekomendasi AI', '🤖 Get AI Recommendations')}
                </button>
              </form>
            </article>

            <div className="recommend-grid">
              <p className="helper recommend-source">
                {t('Sumber rekomendasi', 'Recommendation source')}: <strong>{recommendationSource}</strong>
              </p>
              {displayedSideHustles.map((item, idx) => {
                const platformLogo = getPlatformLogo(item.platform)

                return (
                <article className="recommend-card" key={`${item.job_category}-${idx}`}>
                  <div className="recommend-card-head">
                    <div className="platform-logo" aria-hidden="true">
                      {platformLogo ? (
                        <img
                          src={platformLogo}
                          alt=""
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <span>{(item.platform || '?').slice(0, 1).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <h4>{item.job_category}</h4>
                      <p className="hustle-platform">{item.platform || '-'}</p>
                    </div>
                  </div>
                  <p className="hustle-project">{item.project_type}</p>
                  <p className="hustle-income">{t('Estimasi', 'Estimate')}: <strong>{currency(item.predicted_monthly_earnings_idr)}</strong> / {t('bulan', 'month')}</p>
                </article>
                )
              })}
              {displayedSideHustles.length === 0 && mlSideHustleResult !== null && (
                <p className="helper">{t('Tidak ada rekomendasi. Coba ubah parameter.', 'No recommendations yet. Try adjusting the inputs.')}</p>
              )}
              {displayedSideHustles.length === 0 && mlSideHustleResult === null && (
                <p className="helper">{t('Pilih parameter dan klik "Cari Rekomendasi AI".', 'Choose parameters and click "Get AI Recommendations".')}</p>
              )}
            </div>
          </section>
        )}

        {activeTab === 'forum' && (
          <section className="panel stack">
            <div className="split-grid duo">
              <form className="inset form-grid form-tight" onSubmit={handleForumSubmit}>
                <h3>{t('Post Baru', 'New Post')}</h3>
                <label>
                  {t('Judul', 'Title')}
                  <input
                    value={forumForm.title}
                    onChange={(e) => setForumForm((prev) => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </label>
                <label>
                  {t('Isi', 'Content')}
                  <textarea
                    value={forumForm.body}
                    onChange={(e) => setForumForm((prev) => ({ ...prev, body: e.target.value }))}
                    required
                  />
                </label>
                <label>
                  {t('Tags (pisah koma)', 'Tags (comma separated)')}
                  <input
                    value={forumForm.tags}
                    onChange={(e) => setForumForm((prev) => ({ ...prev, tags: e.target.value }))}
                  />
                </label>
                <button className="button" disabled={loading}>{t('Publikasikan', 'Publish')}</button>
              </form>

              <article className="inset forum-info">
                <h3>{t('Komunitas Finary', 'Finary Community')}</h3>
                <p className="helper">{t('Diskusi, tanya, dan berbagi tips keuangan bersama pengguna lain.', 'Discuss, ask, and share financial tips with others.')}</p>
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
                      <p className="helper">{t('Belum ada balasan.', 'No replies yet.')}</p>
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
                      placeholder={t('Tulis balasan...', 'Write a reply...')}
                      maxLength={1000}
                    />
                    <button className="button tiny" disabled={loading}>{t('Balas', 'Reply')}</button>
                  </form>

                  <div className="meta">
                    <span>{t('oleh', 'by')} {post.user?.name || '-'}</span>
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
