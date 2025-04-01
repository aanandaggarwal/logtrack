# LogTrack Application

## Overview

LogTrack is a personal web application I built to help me stay organized and track my daily progress in coding, studying, and interview prep. It features a customizable template system, dynamic log entry creation, and cloud persistence using Supabase. The app is designed with a modern, dark theme, smooth animations, and comprehensive user-centric design elements for an enjoyable and productive user experience.

## Live Demo

🔗 [Visit LogTrack](https://aanandaggarwal.github.io/logtrack/) (Deployed via GitHub Pages)

## Tech Stack

- **HTML, CSS, JavaScript**
- **Tailwind CSS** for responsive styling
- **Animate.css** for microinteractions and page-level transitions
- **SortableJS** for drag-and-drop support
- **Supabase** for authentication and cloud data storage

## Project Structure

- `index.html`: Main page structure and layout
- `style.css`: Custom dark theme, responsive layout, and animations
- `script.js`: Full client-side logic (authentication, template builder, logs, modals)
- `terms.html`: Comprehensive Terms of Service page
- `privacy.html`: Detailed Privacy Policy page
- `fonts/`: Local hosting of "Century Gothic" font files
- `README.md`: Project summary, changelog, and roadmap
- `CHANGELOG.md`: Full version history and feature changes

## Key Features

### ✨ Customizable Template Builder
- Define reusable templates with tracks, units, and various field types (text, select, checkbox, etc.)
- Supports drag-and-drop reordering
- Templates auto-update if new log structures are saved

### 📋 Dynamic Log Entry Creation
- Logs inherit the structure from your saved template
- Add/delete units per track dynamically
- Dropdown fields are generated dynamically with customizable options
- Auto-scroll and staggered field animations enhance user experience

### ☁️ Cloud Sync with Supabase
- Secure user authentication (email/password + Google OAuth)
- Logs and templates are saved per user securely
- Row-level security protects user data

### 🎨 Polished UI/UX
- Sticky header and footer with responsive mobile layout
- Interactive Privacy and Terms pages with animated page transitions
- Fonts folder with Century Gothic for brand consistency
- Comprehensive spacing and alignment optimization for desktop and mobile
- Animations on login, forms, feedback modals, and log cards
- Feedback system with intuitive modals and status icons
- Consistent and intuitive iconography across application

## What I Did

- **Built a custom template builder** using plain JavaScript, dynamically rendering nested components with drag-and-drop.
- **Developed a robust log management system**, including new/edit/delete flows with intuitive user interactions and transitions.
- **Integrated Supabase** for secure authentication and real-time data persistence with JWT protection.
- **Designed and implemented comprehensive Privacy and Terms of Service pages** with modern UI and responsive design.
- **Crafted an accessible, responsive, and polished UI** that looks good on both desktop and mobile devices, consistent with modern design standards (clean compact, Swedish, Apple-inspired).
- **Resolved various UI/UX and functionality bugs**, such as emoji duplication and spacing issues.

## Future Goals

- 🔍 Advanced filtering, searching, and analytics for logs
- 📈 Visual insights via interactive progress charts
- 🔐 Enhanced authentication options (MFA, more OAuth providers)
- 📦 Modular refactoring into a framework (React or Vue)
- 💾 Offline-first capabilities with robust local caching

## Changelog

📄 [View Full Changelog](./changelog.md)

**Latest Update ([v0.2.0-alpha](./changelog.md)):**
- Major UI enhancements, optimized mobile responsiveness.
- New Privacy Policy and Terms of Service pages added.
- Fonts folder included for local Century Gothic hosting.
- Various bug fixes (including emoji duplication fix).

---

## License

This project is personal and open for educational and portfolio demonstration purposes.

---

Built with 💻 by [Aanand Aggarwal]
