# LogTrack Application

## Overview

LogTrack is a personal web application I built to help me stay organized and track my daily progress in coding, studying, and interview prep. It features a customizable template system, dynamic log entry creation, and cloud persistence using Supabase. The app is designed with a modern, dark theme and smooth animations for an enjoyable user experience.

## Live Demo

🔗 [Visit LogTrack](https://aanand-aggarwal.github.io/logtrack/) (Deployed via GitHub Pages)

## Tech Stack

- **HTML, CSS, JavaScript**
- **Tailwind CSS** for responsive styling
- **Animate.css** for microinteractions and page-level transitions
- **SortableJS** for drag-and-drop support
- **Supabase** for authentication and cloud data storage

## Project Structure

- `index.html`: Main page structure and layout
- `style.css`: Custom dark theme, responsive layout, and animations
- `script.js`: Full client-side logic (auth, template builder, logs, modals)
- `README.md`: Project summary, changelog, and roadmap
- `CHANGELOG.md`: Full version history and feature changes

## Key Features

### ✨ Customizable Template Builder
- Define reusable templates with tracks, units, and various field types (text, select, checkbox, etc.)
- Supports drag-and-drop reordering
- Templates auto-update if new log structures are saved

### 📋 Dynamic Log Entry Creation
- Logs inherit the structure from your saved template
- Add/delete units per track
- Dropdown fields are generated dynamically with customizable options
- Auto-scroll and staggered field animations enhance user experience

### ☁️ Cloud Sync with Supabase
- Secure user authentication (email/password + Google OAuth)
- Logs and templates are saved per user
- Row-level security protects user data

### 🎨 Polished UI/UX
- Sticky header with responsive mobile layout
- Animations on login, form creation, feedback modals, and log cards
- Icon-only topbar for mobile screens
- Feedback system with modals and status icons
- Smooth unit transitions and modal behaviors

## What I Did

- **Built a custom template builder** using plain JavaScript, dynamically rendering nested components with drag-and-drop
- **Wrote a full log management system**, complete with new/edit/delete flows and smooth transitions
- **Integrated Supabase** for secure authentication and real-time data persistence
- **Crafted an accessible and responsive UI** that looks good on both desktop and mobile
- **Designed intuitive feedback patterns** to guide the user from template creation to daily entry logging

## Future Goals

- 🔍 Advanced filtering and searching for logs  
- 📈 Visual insights via progress charts  
- 🔐 Enhanced authentication (MFA, login provider options)  
- 📦 Modular refactor with a framework like React or Vue  
- 💾 Offline-first experience with local caching

## Changelog

📄 [View Full Changelog](./CHANGELOG.md)

---

## License

This project is personal and open for educational and portfolio demonstration purposes.

---

Built with 💻 by [Aanand Aggarwal]

