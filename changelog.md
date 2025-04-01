# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [0.2.0-alpha] - 2025-04-01

### Added
- Comprehensive Terms of Service (`terms.html`) and Privacy Policy (`privacy.html`) pages:
    - Interactive and responsive design with clear, readable typography.
    - Animations: Title fade-in and content fade-in-up for immersive user experience.
    - Back and Home navigation buttons with intuitive icons.
- "fonts" folder added for local hosting of "Century Gothic" font files (woff2, woff).
- Footer with subtle links to Terms, Privacy, and Developer Contact (mailto).
- `getDisplayValue()` helper function to manage emojis without duplication for prefilled log entries.

### Changed
- **Major UI/UX Refinements:**
    - Unified consistent font usage (Century Gothic, Inter, monospace).
    - Optimized mobile responsiveness, especially for login/signup pages and header/footer areas.
    - Footer aligned to header's dark-gray design, links underline smoothly in purple on hover.
    - Button and icon sizing standardized across desktop and mobile for superior usability.
    - New log entry and template builder forms spacing and alignment improved drastically.
    - "Add Field" and "Delete" icons/buttons fully aligned and optimized on all devices.
- Enhanced animation experience:
    - Smooth fading animations when opening/closing forms.
    - Page load animations refined for privacy and terms pages, ensuring cohesive visual flow.

### Fixed
- Autoscroll issues causing layout shifts resolved by modifying scroll behavior on load.
- Duplicate emojis in prefilled and rendered logs completely resolved.
- UI alignment issues for newly added dynamic fields fixed.
- Unwanted blank vertical space below footer on Terms and Privacy pages corrected.

### Removed
- Unnecessary instant autoscroll behavior that disrupted visual harmony during page transitions.

### Known Issues
- Next steps needed in data storage/security.
- Further testing and optimization required (especially device-specific).
- Advanced search, filters, analytics, visualizations remain pending implementation.

---

## [0.1.0-alpha] - 2025-03-31
### Added
- Initial release of LogTrack web application
- Customizable template builder with tracks, units, and fields
- Drag-and-drop support for tracks and units via SortableJS
- Dynamic log entry creation based on saved templates
- Select field support with live-editable dropdown options
- Editable and deletable logs with smooth UI flow
- Cloud-based authentication and data storage using Supabase
- Email/password login, Google OAuth, password reset
- Full CRUD with real-time updates
- Export feature to download logs and template as JSON
- Responsive sticky topbar with icon-only view on small screens
- Smooth animations throughout app using Animate.css
- Feedback modals for actions (save, delete, export, template update)
- Auto-scroll into view when adding units
- Staggered animations for field entry
- Immersive app entry animation on login

### Changed
- Unified visual theme using Tailwind CSS dark mode palette

### Known Issues
- Chasing down bugs, always
- No advanced search or filters yet
- No analytics or visualizations
- Basic mobile support (improvements planned in next release)

---