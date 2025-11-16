# SkillSwap - The Peer-to-Peer Learning Network

A React Native mobile application that connects people who want to learn new skills with those who can teach them. Built with Expo, Firebase, and TypeScript.

SkillSwap is a peer-to-peer micro-learning platform where users exchange knowledge instead of money. Each user lists the skills they can teach and the ones they want to learn, and our matching algorithm connects them for one-on-one or group sessions, online or in person.

## 📱 Features

- **Skill Matching**: Discover people based on skills you want to learn and skills they can teach
- **Smart Discovery**: Tinder-style swiping with intelligent matching algorithm
- **Real-time Chat**: Connect and coordinate with your matches
- **Rating System**: Rate your learning experiences and see others' ratings
- **Profile Management**: Showcase your skills and learning interests
- **Location-based**: Find learners/teachers in your area
- **Flexible Preferences**: Choose in-person, online, or hybrid learning

## 🚀 Getting Started

### Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download here](https://git-scm.com/)
- **Expo Go app** on your phone:
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Step 1: Clone the Repository

```bash
git clone https://github.com/andreibtm/SkillSwap-The-Peer-to-Peer-Learning-Network.git
cd SkillSwap-The-Peer-to-Peer-Learning-Network
```

### Step 2: Install Dependencies

Navigate to the app directory and install all required packages:

```bash
cd app
npm install
```

This will install all required packages including:
- Expo SDK 54
- React Native
- Firebase
- React Navigation
- And more...

⏳ This may take a few minutes depending on your internet connection.

### Step 3: Start the Development Server

Choose one of these methods based on your network setup:

#### Option A: Local Network (Recommended)
```bash
npx expo start
```
- This works when your phone and computer are on the same WiFi network
- Scan the QR code with Expo Go app (Android) or Camera app (iOS)

#### Option B: Tunnel Mode (For network restrictions)
```bash
npx expo start --tunnel
```
- Uses ngrok tunneling when you can't connect via LAN
- Takes longer to start but works across different networks
- May be blocked by some ISPs/networks

#### Option C: Development Build
```bash
npx expo start --dev-client
```
- For custom native modules or production-like testing

### Step 4: Open the App on Your Phone

1. **Make sure Expo Go is installed** on your phone (see Prerequisites)

2. **Scan the QR code** that appears in your terminal:
   - **Android**: Open Expo Go app → Scan QR code
   - **iOS**: Open Camera app → Point at QR code → Tap notification

3. Wait for the app to load (first load may take a minute)

4. **Create an account** or sign in to start using SkillSwap!

> 💡 **Note**: The Firebase backend is already configured and running - just install dependencies and start the app!

## 🎯 Using the App

### First Time Setup

1. **Sign Up**: Create an account with email and password
2. **Complete Profile**: 
   - Add your name and bio
   - Set your location
   - Add skills you can teach
   - Add skills you want to learn
   - Choose your preferences (in-person/online/hybrid)

### Main Features

- **Discover Tab**: Swipe through profiles of potential matches
  - Swipe right to connect
  - Swipe left to pass
  - Profiles are sorted by skill matching and ratings
  
- **Search Tab**: Search for users by name
  - View ratings and skills
  - See how many skills match your interests

- **Chats Tab**: Message your matches
  - Real-time messaging
  - Click profile picture to view full profile
  - Rate users after learning sessions

- **Saved Tab**: View profiles you've super-liked
  - Quick access to favorite teachers/learners
  
- **Profile Tab**: Manage your account
  - Edit skills and interests
  - View your ratings
  - Update preferences
  - Sign out

## 🛠️ Development Commands

```bash
# Start development server
npm start

# Start with tunnel
npm start -- --tunnel

# Clear cache and restart
npm start -- --clear

# Install new dependencies
npm install <package-name>
```


## 🔧  Common Prooblems Troubleshooting

### "Unable to connect" Error
- Make sure your phone and computer are on the same WiFi
- Try tunnel mode: `npx expo start --tunnel`
- Check if firewall is blocking Expo
- Restart the Metro bundler

### Firebase/Connection Errors
- Ensure you're connected to the internet
- Firebase backend is already configured and should work out of the box

### App Won't Load
- Try clearing cache: `npx expo start --clear`
- Restart the Expo Go app on your phone
- Make sure all dependencies are installed: `npm install`

### "Text strings must be rendered within a <Text> component"
- This is usually fixed by reloading the app
- Shake your device → Press "Reload"

## 📱 Testing

- Test on both Android and iOS if possible
- Try all main flows: signup → profile setup → discovery → matching → chat
- Test rating system after chat sessions
- Verify notifications work correctly

## 🏗️ Project Structure

```
app/
├── src/
│   ├── constants/      # Skills list and other constants
│   ├── images/         # App images and assets
│   └── screens/        # All app screens
│       ├── login.screen.tsx
│       ├── signup.screen.tsx
│       ├── newuser.screen.tsx
│       ├── swiper.screen.tsx (Discovery)
│       ├── search.screen.tsx
│       ├── chats.screen.tsx
│       ├── chatdetail.screen.tsx
│       ├── saved.screen.tsx
│       ├── profile.screen.tsx
│       ├── userprofile.screen.tsx
│       ├── rate.screen.tsx
│       └── notifications.screen.tsx
├── firebaseConfig.ts   # Firebase setup
├── App.tsx            # Main app component
└── package.json       # Dependencies
```

## 📄 License

This project is built for educational purposes as part of UniHack 2025.

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev/)
- Powered by [Firebase](https://firebase.google.com/)
- UI components from [React Native](https://reactnative.dev/)
- Icons from [Expo Vector Icons](https://icons.expo.fyi/)

## 📞 Support

If you encounter any issues:
1. Check the Troubleshooting section above
2. Open an issue on GitHub
3. Review Firebase Console for backend errors

---

**Happy Learning! 🚀📚**
