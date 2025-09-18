# Okul Yönetim Sistemi (School Management System)

## Overview

This is a Turkish school management system designed for educational institutions to manage schools, classes, students, and academic assessments. The application provides a comprehensive platform for organizing school data, creating exams, and generating reports. It features a hybrid architecture with both static frontend components and a Node.js backend with JSON-based data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology Stack**: Vanilla HTML, CSS, and JavaScript (static frontend)
- **UI Design**: Single-page application with client-side navigation using JavaScript
- **Styling**: Custom CSS with backdrop filters, gradients, and responsive design
- **Navigation System**: Tab-based interface with conditional page rendering
- **State Management**: JavaScript-based state management with localStorage fallback

### Backend Architecture
- **Framework**: Express.js (Node.js)
- **Server Design**: RESTful API with CORS-enabled endpoints
- **Data Persistence**: JSON file-based storage system using `private_data.json`
- **API Endpoints**: 
  - `/api/sync` for data synchronization
  - `/api/data` for data retrieval
- **Security**: Private data storage outside public access with selective static file serving

### Data Storage Solution
- **Primary Storage**: JSON file-based system (`private_data.json`)
- **Data Structure**: Hierarchical organization with schools, classes, students, and criteria
- **Offline Support**: DatabaseSync class with pending changes queue for offline functionality
- **Data Synchronization**: Automatic sync between frontend and backend with fallback mechanisms

### Application Features
- **School Management**: Add and manage multiple schools
- **Class Management**: Organize classes within schools with student rosters
- **Criteria Management**: Grade-level specific academic criteria (5th-8th grade)
- **Exam Creation**: Assessment tools and exam management
- **Reporting System**: Data analysis and report generation capabilities

### Database Integration Readiness
- **PostgreSQL Compatibility**: Includes `pg` package for future database migration
- **Schema Design**: Current JSON structure can be easily mapped to relational database tables
- **Migration Path**: DatabaseSync class provides abstraction layer for easy database integration

## External Dependencies

### Core Backend Dependencies
- **express**: Web application framework for Node.js API server
- **cors**: Cross-Origin Resource Sharing middleware for API access
- **pg**: PostgreSQL client library (prepared for database migration)

### Frontend Dependencies
- **No external libraries**: Pure HTML, CSS, and JavaScript implementation
- **Browser APIs**: Uses navigator.onLine, fetch API, and localStorage for functionality

### Development Tools
- **Node.js**: Runtime environment for backend server
- **npm**: Package management and script execution

### Third-party Integrations
- **File System**: Node.js fs module for JSON data persistence
- **Path Module**: For secure file path handling and static asset serving
- **Network Status**: Browser online/offline detection for sync management

## Recent Changes

### GitHub Actions APK Build Setup (September 18, 2025)
- **GitHub Integration**: Connected project with GitHub for automated builds
- **CI/CD Workflow**: Implemented `.github/workflows/build-apk.yml` for automatic APK generation
- **Build Configuration**: 
  - Java 17 support for Cordova Android 14
  - Android SDK 34 with appropriate build tools
  - Debug and Release APK generation
  - Automated artifact upload with 30-day retention
  - GitHub Releases integration for main branch pushes
- **Package Management**: Enhanced `okul-app/package.json` with build scripts
- **Documentation**: Added comprehensive README.md with GitHub Actions usage guide

### Key Features Added
- **Automatic APK Building**: Triggered on push/PR to main/master branches
- **Manual Build Trigger**: Available via GitHub Actions interface
- **Multi-format Output**: Both debug and unsigned release APKs
- **Artifact Storage**: Downloadable build artifacts with GitHub retention policy
- **Release Management**: Automated versioning and release creation