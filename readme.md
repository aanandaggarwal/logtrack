# LogTrack Application

## Overview

LogTrack is a personal project I built to help me stay organized and track my daily progress in coding, studying, and interview prep. It features a customizable template system, dynamic log entry creation, and cloud persistence using Supabase. The app is designed with a modern, dark theme and smooth animations for an enjoyable user experience.

## Project Structure

The project has been refactored for production readiness by separating the code into distinct files:
- **index.html**: Contains the markup and links to all resources.
- **style.css**: Holds all custom styles and animations.
- **script.js**: Includes all the application logic, from authentication to log entry management.
- **README.md**: This file documents the project, its progress, and future goals.

## What I Did

- **Customizable Template Builder:**  
  I created a flexible system where I can define tracks, units, and fields that serve as a default structure for each log entry. The builder supports drag-and-drop for reordering tracks and units.

- **Dynamic Log Entry Management:**  
  Users can create new log entries or edit existing ones. The new version allows adding unlimited units per track without displaying unit labels—only the track names and field details appear.

- **Cloud Persistence with Supabase:**  
  I integrated Supabase to securely save and retrieve each user's templates and logs. Row-level security ensures that users can only access their own data.

- **Modern UI/UX Enhancements:**  
  The interface uses Tailwind CSS, Animate.css, and SortableJS to deliver a smooth and visually appealing experience. Interactive elements and animations add to the overall usability of the app.

## Future Goals

- **Advanced Search and Filtering:**  
  Enhance search capabilities with advanced filtering and sorting options.

- **Data Visualization:**  
  Incorporate charts or graphs to provide visual insights into progress over time.

- **User Authentication Enhancements:**  
  Consider adding multi-factor authentication and additional social logins for improved security and user convenience.

- **Scalability and Code Optimization:**  
  As I continue to build on LogTrack, I plan to further modularize and optimize the code, potentially moving to a modern framework like React or Vue.

I created this project to help me stay organized and track my progress, and I hope it can be useful to others as well. Enjoy using LogTrack!
