# Okul Yönetim Sistemi

## Overview
This is a Turkish school management application built with React. The system allows users to manage schools and academic criteria for different grade levels (5th-8th grade). The application provides functionality to add schools, define criteria for each grade level, and navigate between different sections through a simple interface. The app is designed as a single-page application with client-side routing and state management.

### Current Features
- **Ana Sayfa (Main Page)**: Three vertical buttons for navigation - Okul Ekle, Kriterler, Sınav Oluştur
- **Okul Ekle (Add School)**: Add schools with text input and display them in a list
- **Kriterler (Criteria)**: Four grade level buttons (5th-8th grade) for accessing criteria management
- **Sınıf Kriterleri (Grade Criteria)**: Individual pages for each grade to add and list academic criteria
- **Navigation System**: Seamless navigation between all pages with back buttons

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 19.1.1 with functional components and hooks
- **State Management**: Local component state using React's useState hook
- **Navigation**: Custom client-side routing system using conditional rendering
- **Component Structure**: Modular component-based architecture with separate files for each page/feature
- **Styling**: CSS-based styling with a central index.css file and component-specific styles

### Application Structure
- **Single Page Application**: All navigation handled through state changes rather than actual page routing
- **Component Hierarchy**: 
  - App.js serves as the main container with navigation logic
  - Individual components for each feature (AnaSayfa, OkulEkle, Kriterler, SinifKriterleri)
  - Props-based communication between parent and child components

### Data Management
- **Client-Side Storage**: All data stored in component state (no persistence)
- **Data Flow**: Unidirectional data flow using props and state lifting
- **No Backend**: Currently operates as a frontend-only application without API integration

### User Interface Design
- **Responsive Design**: Mobile-first approach with viewport meta tags
- **Styling Approach**: Custom CSS with modern features like gradients and box shadows
- **Layout**: Centered container design with maximum width constraints
- **Interactive Elements**: Button-based navigation with hover effects and transitions

### Build System
- **Build Tool**: Create React App (react-scripts 5.0.1)
- **Development Server**: Built-in development server with hot reloading
- **Browser Support**: Modern browser compatibility with specified browserslist configuration

## External Dependencies

### Core Dependencies
- **react**: 19.1.1 - Core React library for building user interfaces
- **react-dom**: 19.1.1 - DOM-specific methods for React
- **react-scripts**: 5.0.1 - Build scripts and configuration for Create React App

### Development Tools
- **Babel**: Code transformation and compilation (included via react-scripts)
- **Webpack**: Module bundling and development server (included via react-scripts)

### Browser Compatibility
- Production: Targets browsers with >0.2% usage, excluding dead browsers and Opera Mini
- Development: Latest versions of Chrome, Firefox, and Safari

### No External Services
- No database connections
- No third-party API integrations
- No authentication services
- No cloud storage or external data persistence