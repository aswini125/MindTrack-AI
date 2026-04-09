# 🧠 MindTrack AI — Digital Detox & Productivity Tracker

> **AI-Powered Digital Wellness for Students & Professionals**
> Track your screen time, monitor your mood, and build healthier digital habits with smart predictions.

---

## 📸 Screenshots

| Dashboard | Log Day | Study Mode | Insights |
|-----------|---------|------------|----------|
| *(coming soon)* | *(coming soon)* | *(coming soon)* | *(coming soon)* |

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📱 **Screen Time Tracking** | Log daily usage for Instagram, YouTube, WhatsApp & more |
| 😊 **Mood Tracking** | Select from Happy, Neutral, Stressed, Tired |
| 🤖 **AI Habit Prediction** | Rule-based engine predicts tomorrow's behaviour |
| 🎓 **Student Mode (Pomodoro)** | 25-min focus + 5-min break timer with motivational messages |
| 🏆 **Gamification** | Points, levels, streaks, and unlockable badges |
| 📊 **Analytics Dashboard** | Chart.js graphs: screen time bars + mood vs usage overlay |
| 💡 **Smart Suggestions** | Personalised tips based on usage + mood patterns |

---

## 🛠 Tech Stack

### Frontend
- **HTML5** — semantic, accessible markup
- **CSS3** — custom properties, grid/flexbox, animations
- **Vanilla JavaScript** — fetch API, DOM manipulation, Chart.js integration
- **Chart.js** — bar and line charts via CDN
- **Google Fonts** — Syne (headings) + DM Sans (body)

### Backend
- **Python 3.8+**
- **Flask** — lightweight REST API framework
- **Flask-CORS** — cross-origin request handling

### Database
- **SQLite** — embedded file-based database, no setup needed

---

## 📁 Folder Structure

```
mindtrack/
├── frontend/
│   ├── index.html       ← Main UI (all sections: dashboard, log, study, insights)
│   ├── style.css        ← Full responsive styling, CSS variables, animations
│   └── script.js        ← All frontend logic, charts, timer, API calls
│
├── backend/
│   ├── app.py           ← Flask server with all API routes
│   └── mindtrack.db     ← Auto-created SQLite database (after first run)
│
└── README.md            ← You are here
```

---

## 🚀 Getting Started (VS Code)

### Prerequisites
- Python 3.8 or higher installed
- A web browser (Chrome recommended)
- VS Code with the **Live Server** extension (optional but helpful)

---

### Step 1 — Clone or Download the Project

```bash
# If you have git:
git clone https://github.com/aswini125/mindtrack-ai.git
cd mindtrack-ai

# Or just unzip the downloaded folder and open it in VS Code
```

---

### Step 2 — Set Up Python Backend

Open a **terminal** in VS Code (`Ctrl + \``) and run:

```bash
# Navigate to the backend folder
cd backend

# (Recommended) Create a virtual environment
python -m venv venv

# Activate it:
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install required packages
pip install flask flask-cors
```

---

### Step 3 — Start the Flask Server

Still inside the `backend/` folder:

```bash
python app.py
```

You should see:
```
✅ Database initialised at: .../backend/mindtrack.db
🚀 MindTrack AI backend starting...
📡 Running at: http://127.0.0.1:5000
```

> **Keep this terminal open** while using the app.

---

### Step 4 — Open the Frontend

**Option A — Live Server (recommended):**
1. Right-click `frontend/index.html` in VS Code
2. Click **"Open with Live Server"**
3. Browser opens at `http://127.0.0.1:5500/frontend/index.html`

**Option B — Direct open:**
1. Navigate to `frontend/` in your file explorer
2. Double-click `index.html`
3. Browser opens the file directly

---

### Step 5 — Use the App 🎉

1. **Log Day** → Enter screen time minutes + select mood → Save
2. **Dashboard** → View charts and recent logs
3. **Study Mode** → Start the Pomodoro timer
4. **Insights** → View AI predictions, badges, and suggestions

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/` | Health check |
| `POST` | `/add_data` | Save a new daily log |
| `GET`  | `/get_data` | Retrieve all logs |
| `DELETE` | `/clear_data` | Clear all data (dev only) |

### POST `/add_data` — Request Body

```json
{
  "instagram": 45,
  "youtube": 60,
  "whatsapp": 30,
  "other": 20,
  "mood": "Happy"
}
```

### POST `/add_data` — Response

```json
{
  "message": "Log saved successfully!",
  "points_earned": 10,
  "total_minutes": 155,
  "mood": "Happy",
  "date": "2024-01-15T14:30:00"
}
```

---

## 🎮 Gamification System

| Screen Time | Points Earned |
|-------------|---------------|
| Under 60 min | ⚡ 30 points |
| 60–119 min  | ⚡ 20 points |
| 120–179 min | ⚡ 10 points |
| 180–299 min | ⚡ 5 points  |
| 300+ min    | ⚡ 1 point   |

### Badges
| Badge | Unlock Condition |
|-------|-----------------|
| 🌱 First Log | Submit your first daily log |
| 🔥 3-Day Streak | Log 3 consecutive days |
| ⭐ 100 Points | Earn 100 total points |
| 🧘 Low Usage | Log under 60 min on 3+ days |
| 🎓 5 Sessions | Complete 5 Pomodoro sessions |

---

## 🤖 AI Prediction Logic

The prediction engine uses simple rules on the last 3 days of data:

- **Trending upward + high usage** → "You may overuse tomorrow"
- **Trending downward** → Positive reinforcement message
- **Stressed + high usage** → Recommends digital detox
- **Tired pattern** → Recommends early sleep
- **Consistent low usage** → Celebrates the habit

No external API is required — all logic runs locally in Python.

---

## 🔮 Future Improvements

- [ ] 📱 Mobile PWA (installable app)
- [ ] 🔔 Browser push notifications for break reminders
- [ ] 📤 Export data as CSV / PDF report
- [ ] 🔐 User accounts + login system
- [ ] 🌍 Multi-language support
- [ ] 📲 Real screen time integration (via OS APIs)
- [ ] 🤖 OpenAI/Claude API for more nuanced predictions
- [ ] 📅 Weekly email summary report
- [ ] 🌙 Dark mode toggle

---

## 🐛 Troubleshooting

**"Cannot connect to backend"**
→ Make sure Flask is running: `python backend/app.py`
→ Check that port 5000 is not blocked by your firewall

**Charts not showing**
→ Ensure you have an internet connection (Chart.js loads from CDN)
→ Log at least 1 day of data first

**CORS error in browser console**
→ Make sure `flask-cors` is installed: `pip install flask-cors`

**Database not found**
→ The `mindtrack.db` file is auto-created in `backend/` on first run

---

## 👨‍💻 Author

**MindTrack AI** — Built with ❤️ for better digital wellness

- 🌐 GitHub: [github.com/aswini125/mindtrack-ai](https://github.com)
- 📧 Email: aswinirvm@gmail.com

---

