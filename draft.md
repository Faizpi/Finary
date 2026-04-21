# Finary
**Personal Finance Management System with Behavior Analysis & Side Hustle Recommendation**

---

## 📌 Overview

Finary adalah platform manajemen keuangan pribadi berbasis web yang mengintegrasikan:
- Financial tracking (income & expense)
- Behavior analysis
- Personalized financial insights
- Side hustle recommendation engine
- Gamification system

Fokus utama: membantu generasi muda membangun **financial awareness + habit + income growth**.

> Berdasarkan project plan, sistem ini tidak hanya mencatat transaksi, tetapi juga menganalisis perilaku dan memberikan rekomendasi berbasis data :contentReference[oaicite:0]{index=0}

---

## 🎯 Problem Statement

- Rendahnya literasi finansial pada generasi muda  
- Tidak adanya sistem adaptif berbasis behavior  
- Tools existing hanya bersifat tracking, bukan decision support  

---

## 💡 Solution Approach

Finary menggabungkan:

- **Behavior-based financial profiling**
- **Real-time financial insights**
- **AI-driven side hustle recommendation**
- **Gamification untuk retention & habit building**

---

## 🧩 Core Features

### 1. Authentication
- Login
- Register
- Logout

---

### 2. Financial Assessment (Onboarding)
Digunakan untuk membangun profil awal:

- Status finansial
- Kondisi ekonomi & tempat tinggal
- Sumber pemasukan
- Target finansial
- Waktu luang (availability)
- Keahlian (skills clustering)

Output:
- Klasifikasi: `Inflasi | Normal | Resesi`

---

### 3. Dashboard (Analytics)
- Income vs Expense chart
- Saving rate
- Financial status summary
- Real-time insights

---

### 4. Income & Expense Management
- Input transaksi
- Kategorisasi
- Tracking harian
- Monitoring budget

---

### 5. Dynamic Profile (Behavior Analysis)
- Profil berubah berdasarkan:
  - Spending habit
  - Income pattern
  - Saving behavior

- Generate:
  - Warning (overbudget)
  - Prediction (financial condition)
  - Recommendation

---

### 6. Side Hustle Recommendation
- Berdasarkan:
  - Skill
  - Waktu luang
  - Kondisi finansial

- Output:
  - List pekerjaan sampingan
  - Estimated income potential

---

### 7. Gamification System

#### Badge Achievement
#### Leaderboard

Tujuan:
- Increase engagement
- Build habit consistency
- Retention optimization

---

### 8. Kantong (Budgeting System)
- Alokasi dana per kategori
- Kontrol pengeluaran
- Budget enforcement

---

### 9. Chat Forum
- Diskusi antar user
- Sharing pengalaman finansial
- Knowledge exchange

---

### 10. Report Export
- Generate laporan keuangan
- Export ke Excel

---

### 11. Profile Management
- Update profil manual
- Auto-adjust via behavior analysis

---

## 🏆 Badge System Design

### 1. Saving & Wealth
- First Saver → Nabung pertama
- Saving Streak → Konsisten menabung
- Goal Achiever → Target tercapai
- Wealth Builder → Milestone tabungan

**Impact:** habit formation

---

### 2. Spending Control
- Budget Keeper → Tidak overbudget
- Expense Tracker → Konsisten tracking
- Anti Boros → No impulsive spending

**Impact:** cost control discipline

---

### 3. Income & Hustle
- First Income → Income pertama
- Side Hustler → Income tambahan
- Income Growth → Growth %

**Impact:** income expansion

---

### 4. Consistency / Habit
- Daily Logger → Active usage
- Finance Discipline → Konsistensi tracking

**Impact:** retention & engagement

---

### 5. Challenge / Event
- No Spend Challenge → 7 hari tanpa pengeluaran non-esensial
- Saving Sprint → Intensive saving

**Impact:** short-term engagement spike

---

### 6. Special / Hidden
- Perfect Month → Semua target tercapai
- Comeback → Dari defisit ke surplus

**Impact:** emotional reward & milestone recognition

---

## 🏗️ System Architecture (High-Level)

### Frontend
- React
- Vite
- Axios
- Tailwind / Bootstrap

### Backend
- Laravel (REST API)
- Authentication & Business Logic

### Database
- MySQL

### AI / ML Layer
- Financial classification model
- Side hustle recommendation engine

### Integration
- FastAPI / Flask (ML inference)

---

## 📊 Data & Intelligence

### Data Sources
- Personal finance dataset
- Salary dataset (Indonesia)
- Freelance dataset

### Processing
- Data cleaning
- Feature engineering
- Behavioral pattern analysis

---

## ⚙️ Key Differentiators

1. **Behavior-driven system (bukan cuma tracker)**
2. **Side hustle recommendation (income-side solution)**
3. **Gamification deeply integrated**
4. **Dynamic financial profiling**
5. **AI-assisted decision support**

---

## 🚧 Project Scope

- Web-based application
- RESTful architecture
- Rule-based + ML hybrid analysis
- Real-time dashboard
- Excel reporting

---

## ⚠️ Risks & Considerations

- Data accuracy (user input dependent)
- Model reliability (ML limitation)
- User retention (gamification must be meaningful)
- System complexity (multi-layer architecture)

---

## 🚀 Future Improvements

- Mobile app (Flutter)
- Real-time bank integration (Open Banking API)
- Advanced AI (predictive finance planning)
- Personalized financial coaching

---

## 📌 Conclusion

Finary bukan sekadar financial tracker, tetapi **behavior-aware financial system** yang fokus pada:

- Awareness
- Discipline
- Income growth
- Long-term financial stability
