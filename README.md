# 🎓 SkillSwap - The Peer-to-Peer Learning Network

[![Expo](https://img.shields.io/badge/Expo-Go-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

> **Exchange knowledge, not money.** Connect with people who want to learn what you can teach.

---

## 📖 About

**SkillSwap** is a revolutionary peer-to-peer micro-learning platform designed to democratize education. We believe that everyone has something to teach and something to learn. 

Instead of paying for expensive courses, SkillSwap allows you to trade your expertise. You list the skills you can offer and the ones you wish to acquire. Our intelligent matching algorithm then connects you with the perfect learning partners for one-on-one or group sessions, whether online or in-person.

## ✨ Key Features

*   **🤝 Skill Matching**: Find the perfect exchange partner based on mutual learning interests.
*   **🔥 Smart Discovery**: Tinder-style card swiping interface to browse potential tutors/learners.
*   **💬 Real-time Chat**: Integrated messaging to coordinate sessions and discuss topics.
*   **⭐ Rating System**: Build trust within the community through verified reviews and ratings.
*   **👤 Profile Management**: Detailed profiles showcasing your skills, bio, and learning goals.
*   **📍 Location-based**: Discover learners and teachers in your local area for in-person meetups.
*   **⚙️ Flexible Preferences**: Filter matches by learning mode (Online, In-person, Hybrid).

---

## 📱 App Showcase

Explore the SkillSwap interface and features, designed for a seamless peer-to-peer learning experience.

### 🔐 Authentication
Secure and easy entry into the app.

| Login | Register |
|:---:|:---:|
| <img src="ReadMe%20images/login-page.PNG" width="200" alt="Login Screen" /> | <img src="ReadMe%20images/register.PNG" width="200" alt="Register Screen" /> |

### 👤 Profile Setup
Build your identity and showcase what you can teach and learn.

| Create Profile | Select Skills | Completed Profile |
|:---:|:---:|:---:|
| <img src="ReadMe%20images/Create,%20your%20profile%201.PNG" width="200" alt="Create Profile" /> | <img src="ReadMe%20images/select%20your%20skils.PNG" width="200" alt="Select Skills" /> | <img src="ReadMe%20images/Completed%20profile%20example.PNG" width="200" alt="Completed Profile" /> |

### 🔍 Discovery & Matching
Find your perfect learning partner.

| Swipe to Match | Search | Connection Request |
|:---:|:---:|:---:|
| <img src="ReadMe%20images/swap%20page.PNG" width="200" alt="Swap Page" /> | <img src="ReadMe%20images/search%20page.PNG" width="200" alt="Search Page" /> | <img src="ReadMe%20images/send%20connection%20request.PNG" width="200" alt="Connection Request" /> |

### 💬 Messaging
Connect and coordinate with your matches.

| Chat List | Chat View |
|:---:|:---:|
| <img src="ReadMe%20images/chat%20page.PNG" width="200" alt="Chat List" /> | <img src="ReadMe%20images/actual%20chat%20example.PNG" width="200" alt="Chat View" /> |

### ⚙️ Profile Management
Manage your account and preferences.

| Profile Showcase | Edit Profile | Settings | Saved Profiles |
|:---:|:---:|:---:|:---:|
| <img src="ReadMe%20images/profile%20showcase.PNG" width="200" alt="Profile Showcase" /> | <img src="ReadMe%20images/edit%20profile%20screen.PNG" width="200" alt="Edit Profile" /> | <img src="ReadMe%20images/settings%20page.PNG" width="200" alt="Settings" /> | <img src="ReadMe%20images/saved%20page.PNG" width="200" alt="Saved Profiles" /> |

### 🔔 Notifications & Ratings
Stay updated and build trust.

| Notifications | Rating | Full Rating |
|:---:|:---:|:---:|
| <img src="ReadMe%20images/notification%20with%20actual%20notification.PNG" width="200" alt="Notifications" /> | <img src="ReadMe%20images/rating%20screen.PNG" width="200" alt="Rating Screen" /> | <img src="ReadMe%20images/full%20rating%20screen.PNG" width="200" alt="Full Rating Screen" /> |

---

## 🚀 Getting Started

Follow these steps to get the app running on your local machine.

### Prerequisites

Ensure you have the following installed:
*   **Node.js** (v16+): [Download](https://nodejs.org/)
*   **npm**: Included with Node.js
*   **Git**: [Download](https://git-scm.com/)
*   **Expo Go App**:
    *   [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
    *   [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/andreibtm/SkillSwap-The-Peer-to-Peer-Learning-Network.git
    cd SkillSwap-The-Peer-to-Peer-Learning-Network
    ```

2.  **Install dependencies**
    ```bash
    cd app
    npm install
    ```
    *This will install Expo SDK 54, React Native, Firebase, and other required packages.*

3.  **Start the application**
    ```bash
    npx expo start
    ```

### Running the App

Once the development server is running:
1.  Open **Expo Go** on your phone.
2.  **Scan the QR code** displayed in your terminal.
    *   **Android**: Use the Expo Go app to scan.
    *   **iOS**: Use the default Camera app to scan.
3.  Wait for the bundle to load (first time may take a moment).
4.  **Sign Up** and start swapping skills!

> 💡 **Note**: The Firebase backend is pre-configured. No additional setup is required to start testing.

---

## 🛠️ Tech Stack

*   **Framework**: [Expo](https://expo.dev/) (React Native)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Backend**: [Firebase](https://firebase.google.com/) (Auth, Firestore, Storage)
*   **Navigation**: [React Navigation](https://reactnavigation.org/)
*   **Styling**: StyleSheet & Ionicons

---

## 🏗️ Project Structure

```
app/
├── src/
│   ├── constants/      # App constants & Skill lists
│   ├── images/         # Static assets
│   └── screens/        # Application Screens
│       ├── login.screen.tsx
│       ├── signup.screen.tsx
│       ├── swiper.screen.tsx    # Discovery/Matching
│       ├── chats.screen.tsx     # Message List
│       ├── profile.screen.tsx   # User Profile
│       └── ...
├── firebaseConfig.ts   # Firebase Initialization
├── App.tsx            # Entry Point
└── package.json       # Dependencies
```

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Unable to connect** | Ensure phone and PC are on the same WiFi. Try `npx expo start --tunnel`. |
| **App won't load** | Clear cache with `npx expo start --clear`. Restart Expo Go. |
| **Text render error** | Reload the app (Shake device -> Reload). |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

*   Built for **UniHack 2025**
*   Icons by [Ionicons](https://ionic.io/ionicons)
