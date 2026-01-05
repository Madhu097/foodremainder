# 🍎 Food Reminder - Never Let Food Go to Waste

A smart food inventory management system that helps you track expiry dates and prevents food waste through timely notifications.

![Status](https://img.shields.io/badge/status-active-success.svg)
![Database](https://img.shields.io/badge/database-Firebase-orange.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

---

## ✨ Features

- 📱 **User Authentication** - Secure registration and login system
- 🍎 **Food Inventory** - Track all your food items with purchase and expiry dates
- 🔔 **Smart Notifications** - Email (Resend), SMS & WhatsApp (Twilio), Telegram (Free!)
- ⏰ **Auto Scheduler** - Automatic daily notification checks
- 📊 **Dashboard** - Visual overview of your food inventory
- 🔥 **Firebase Integration** - Cloud-based persistent storage
- 🌙 **Dark Mode** - Beautiful dark theme for comfortable viewing
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

---

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- NPM or Yarn
- Firebase account (free tier works great!)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Madhu097/foodremainder.git
   cd FoodRemainder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase** (see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md))
   - Create a Firebase project
   - Enable Firestore Database
   - Download service account credentials
   - Update `.env` file

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your Firebase credentials
   ```

5. **Run in development mode**
   ```bash
   npm run dev
   ```

6. **Build for production**
   ```bash
   npm run build
   npm run start
   ```

The application will be available at `http://localhost:5000`

---

## 📁 Project Structure

```
FoodRemainder/
├── client/              # React frontend application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   └── lib/         # Utilities and hooks
├── server/              # Express backend application
│   ├── firebase.ts      # Firebase initialization
│   ├── firebaseStorage.ts # Firebase storage implementation
│   ├── storage.ts       # Storage interface
│   ├── routes.ts        # API routes
│   └── index.ts         # Server entry point
├── shared/              # Shared code between client and server
│   └── schema.ts        # Data models and validation
├── .env                 # Environment variables (create from .env.example)
└── dist/                # Production build output
```

---

## 🔧 Configuration

### Firebase Setup

Create a `.env` file with your Firebase credentials:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

For detailed instructions, see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

### Notifications (Optional but Recommended!)

**⚡ Quick Setup (3 minutes):**  
See [NOTIFICATIONS_QUICKSTART.md](./NOTIFICATIONS_QUICKSTART.md) for the fastest way to get notifications working!

**📧 Email with Resend (FREE - Recommended):**
```env
EMAIL_SERVICE=resend
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=Food Reminder <onboarding@resend.dev>
```

**📱 SMS with Twilio:**
```env
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_SMS_FROM=+15551234567
```

**💬 WhatsApp with Twilio:**
```env
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

**✈️ Telegram (Free & Unlimited):**
```env
TELEGRAM_BOT_TOKEN=your_bot_token
```

**⏰ Scheduler:**
```env
NOTIFICATION_SCHEDULE=0 9 * * *  # Daily at 9 AM
TIMEZONE=UTC
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[NOTIFICATION_SETUP.md](./NOTIFICATION_SETUP.md)** | **🔔 Complete automatic notification setup (5x/day)** |
| **[NOTIFICATION_TROUBLESHOOTING.md](./NOTIFICATION_TROUBLESHOOTING.md)** | **🔧 Fix notification issues** |
| **[NOTIFICATIONS_QUICKSTART.md](./NOTIFICATIONS_QUICKSTART.md)** | **⚡ 3-min notification setup** |
| [COMPLETE_NOTIFICATION_GUIDE.md](./COMPLETE_NOTIFICATION_GUIDE.md) | Complete notification reference |
| **[TELEGRAM_SETUP_GUIDE.md](./TELEGRAM_SETUP_GUIDE.md)** | **✈️ Telegram setup guide** |
| **[FREE_EMAIL_SETUP_GUIDE.md](./FREE_EMAIL_SETUP_GUIDE.md)** | **Free email service options** |
| [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) | Complete Firebase setup guide |
| [FIREBASE_TROUBLESHOOTING.md](./FIREBASE_TROUBLESHOOTING.md) | Common issues and solutions |
| [DATA_STORAGE_GUIDE.md](./DATA_STORAGE_GUIDE.md) | Understanding data storage |
| [HOW_TO_RUN.md](./HOW_TO_RUN.md) | Detailed running instructions |
| [USER_GUIDE.md](./USER_GUIDE.md) | User manual |

---

## 🛠️ Available Scripts

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm run start

# Type checking
npm run check
```

---

## 🗄️ Database

The application uses **Firebase Firestore** for data storage:

### Collections

- **`users`** - User accounts and preferences
- **`foodItems`** - Food inventory items

### Benefits

- ✅ Real-time synchronization
- ✅ Automatic scaling
- ✅ Built-in security
- ✅ Free tier available
- ✅ Generous limits (50K reads/day)

---

## 🔔 Notifications

### Multi-Channel Notifications

Never miss expiring food with notifications via:

#### 📧 Email
- **Resend** (Recommended): 100 emails/day FREE, no credit card!
- **Gmail**: Use your existing Gmail account
- **Other SMTP**: SendGrid, Brevo, Mailgun, etc.
- Beautiful HTML templates with food item details

#### 📱 SMS
- **Twilio**: $15 FREE credit (~2,000 messages)
- Text message alerts for urgent expirations
- Works on any mobile phone

#### 💬 WhatsApp
- **Twilio Sandbox**: Unlimited FREE messages for testing
- Instant delivery to WhatsApp
- Rich formatting with emojis

#### ✈️ Telegram
- **Telegram Bot**: Completely FREE and unlimited!
- Private and secure messaging
- Zero cost solution for notifications

### ⏰ Automatic Scheduling

- Set-and-forget: Runs automatically daily
- Customizable time (e.g., 9 AM, 6 PM)
- Timezone-aware notifications
- Cron-based scheduling for flexibility

### ⚙️ User Customization

- Enable/disable each notification channel
- Set notification days (e.g., 3 days before expiry)
- Test notifications anytime
- Per-user preferences

---

## 🎨 Tech Stack

### Frontend
- **React** - UI library
- **TanStack Query** - Server state management
- **Wouter** - Lightweight routing
- **Tailwind CSS** - Styling
- **Shadcn/UI** - Component library
- **Framer Motion** - Animations

### Backend
- **Express** - Web framework
- **Firebase Admin SDK** - Database
- **Passport** - Authentication
- **Resend** - Email service (recommended)
- **Nodemailer** - SMTP email fallback
- **Twilio** - SMS & WhatsApp service
- **node-telegram-bot-api** - Telegram integration
- **Node-cron** - Task scheduling

### Build Tools
- **Vite** - Frontend bundler
- **esbuild** - Backend bundler
- **TypeScript** - Type safety

---

## 🔒 Security

- Passwords hashed with industry-standard algorithms
- Secure session management
- Firebase security rules
- Environment variable protection
- HTTPS recommended for production

---

## 📊 Data Privacy

- Data stored securely in Firebase Firestore
- User data is private and isolated
- No third-party data sharing
- Compliant with privacy best practices

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👨‍💻 Author

**Madhu097**

- GitHub: [@Madhu097](https://github.com/Madhu097)
- Repository: [foodremainder](https://github.com/Madhu097/foodremainder)

---

## 🙏 Acknowledgments

- Firebase for excellent cloud infrastructure
- shadcn/ui for beautiful components
- All open-source contributors

---

## 📞 Support

If you encounter any issues:

1. Check the [FIREBASE_TROUBLESHOOTING.md](./FIREBASE_TROUBLESHOOTING.md) guide
2. Review [HOW_TO_RUN.md](./HOW_TO_RUN.md) for setup instructions
3. Open an issue on GitHub

---

## 🌟 Star History

If you find this project useful, please consider giving it a star! ⭐

---

**Happy Food Tracking!** 🍎🥗🥛

*Never let food go to waste again!*
