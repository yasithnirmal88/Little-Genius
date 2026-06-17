# Little Genius 🔬

A science learning app for kids ages 5-9, featuring interactive modules, short videos, science battles, and a gamified progression system.

## Features

✨ **User App**
- 🗺️ **Learning Path**: Visual progression through 8 tiers of science modules
- ▶️ **Science Shorts**: Bite-sized video content on various science topics
- ⚔️ **Science Battle**: Interactive quiz mode with voting mechanics
- 🏅 **Rank System**: Progress through 10 ranks as you complete modules
- 👤 **Profile**: Track XP, streaks, and achievements

⚙️ **Admin Panel**
- 📊 Dashboard with content health metrics
- 📦 Module management (create, edit, publish, lock)
- ▶️ Shorts management with domain and duration tracking
- 👥 User management with suspension and XP reset capabilities

## Quick Start

### Option 1: Direct Browser (Recommended)
Simply open `index.html` in your web browser. No installation needed!

### Option 2: Development Setup with npm
```bash
npm install
npm start
```

## Login Credentials

**User Mode:**
- Any username with 3+ characters

**Admin Mode:**
- Username: `admin`
- Password: `admin123`

## Project Structure

```
├── index.html              # Standalone HTML file (easiest to use)
├── public/
│   └── index.html         # Traditional React setup
├── src/
│   ├── App.jsx            # Main app component
│   └── index.js           # React entry point
├── package.json           # npm configuration
└── README.md              # This file
```

## Technologies

- **React 18** - UI library
- **Babel** - JSX transpiler
- **CSS-in-JS** - Styled components with inline styles

## Features Overview

### User App
- **Modules**: 8 modules across 4 tiers with star-based progression
- **Shorts**: 5 published science shorts with domain and duration
- **Users**: 5 sample users with different activity levels
- **XP & Ranks**: Gamified progression system

### Admin Features
- Create/edit modules and shorts
- Publish/draft content management
- Lock/unlock modules for progressive learning
- User status management
- Content health dashboard

## Sample Data

- **8 Modules** covering Space, Biology, Chemistry, Physics
- **5 Short Videos** with 30-60 second durations
- **5 Sample Users** with various activity levels
- **12 Science Domains** for content categorization

## Customization

To add new modules, shorts, or users, modify the `INIT_*` constants in the code:

```javascript
const INIT_MODULES = [
  // Add your modules here
];
```

## Browser Compatibility

Works on all modern browsers:
- Chrome/Edge
- Firefox
- Safari
- Mobile browsers

## License

Educational use

---

**Built with ❤️ for young scientists**
