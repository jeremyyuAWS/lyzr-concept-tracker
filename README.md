# 🧠 Lyzr Concept Tracker

<div align="center">
  <img src="public/lyzr-logo-cut.png" alt="Lyzr Logo" width="120" height="120">
  <h1>Lyzr Concept Tracker</h1>
  <p>Internal tool for cataloging and managing Lyzr demo applications</p>
  
  [![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue.svg)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.13-blue.svg)](https://tailwindcss.com/)
  [![Vite](https://img.shields.io/badge/Vite-5.4.8-blue.svg)](https://vitejs.dev/)
</div>

---

## 📌 Overview

The Lyzr Concept Tracker is a production-ready internal tool designed to centralize the management of all AI demo concepts developed across Bolt.new and Lovable. This application replaces manual tracking methods and provides a comprehensive platform for cataloging, managing, and analyzing demo applications with rich metadata and secure admin controls.

## ✨ Features

### 🔍 **Demo Catalog**
- **Searchable Grid/List View**: Browse all concept demos with advanced search and filtering
- **Rich Metadata Display**: Title, description, tags, owner, and creation date
- **Quick Access Links**: Direct links to Netlify demo, Excalidraw blueprints, Supabase backend, and admin portals
- **Page View Tracking**: Real-time tracking of demo engagement
- **Screenshot Previews**: Optional thumbnail images for visual recognition

### ➕ **Admin Demo Management**
- **Secure Form Interface**: Admin-only access to add new demo entries
- **Comprehensive Validation**: Form validation with real-time error feedback
- **Rich Metadata Input**: Support for all demo attributes including optional fields
- **Success Notifications**: Toast notifications for successful operations

### 📊 **Analytics Dashboard**
- **Performance Metrics**: Total demos, views, and engagement statistics
- **Interactive Charts**: Bar charts for top-performing demos and pie charts for tag distribution
- **Recent Activity**: Timeline of recently added demos
- **Trend Analysis**: Visual representation of demo popularity and usage patterns

### 🔐 **Admin Controls**
- **Role-Based Access**: Secure admin-only sections (prepared for Supabase Auth)
- **System Management**: Placeholder for future admin features
- **Data Export**: Planned functionality for demo data export

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lyzr-concept-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   http://localhost:5173
   ```

### Build for Production

```bash
npm run build
npm run preview
```

## 🏗️ Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui components
│   ├── DemoCard.tsx     # Demo display card
│   ├── AddDemoForm.tsx  # Admin form for adding demos
│   ├── AnalyticsPanel.tsx # Analytics dashboard
│   └── WelcomeModal.tsx # Welcome/help modal
├── tabs/                # Tab content components
│   ├── CatalogTab.tsx   # Main catalog view
│   ├── AddTab.tsx       # Add demo tab
│   ├── AnalyticsTab.tsx # Analytics tab
│   └── AdminTab.tsx     # Admin controls tab
├── types/               # TypeScript type definitions
│   └── demo.ts          # Demo data types
├── data/                # Mock data (temporary)
│   └── mockDemos.ts     # Sample demo data
├── lib/                 # Utility functions
│   └── utils.ts         # Helper functions
├── hooks/               # Custom React hooks
│   └── use-toast.ts     # Toast notification hook
└── App.tsx              # Main application component
```

## 🎨 Design System

### Color Palette
- **Primary**: `#000000` (Black)
- **Background**: `#ffffff` (White)
- **Text**: `#000000` (Black)
- **Muted**: `#6b7280` (Gray-500)
- **Accent**: Tailwind grayscale variants

### Typography
- **Headings**: Bold, hierarchical sizing
- **Body**: Regular weight, optimal line height
- **Code**: Monospace font for technical elements

### Components
- **Cards**: Subtle shadows, rounded corners
- **Buttons**: Solid black primary, outlined secondary
- **Forms**: Clean inputs with validation states
- **Charts**: Monochrome color scheme

## 🔧 Technology Stack

- **Frontend Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.4.8
- **Styling**: Tailwind CSS 3.4.13
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Charts**: Recharts 2.12.7
- **State Management**: React hooks (useState, useEffect)
- **Notifications**: Sonner toast library

## 📱 Features in Detail

### Catalog View
- **Grid/List Toggle**: Switch between card grid and list view
- **Advanced Search**: Real-time search across title, description, and owner
- **Tag Filtering**: Filter demos by technology tags
- **Sorting Options**: Sort by views, date, or alphabetically
- **Empty States**: Graceful handling of no results

### Add Demo Form
- **Required Fields**: Title, description, tags, Netlify URL, owner
- **Optional Fields**: Excalidraw, Supabase, admin URLs, screenshot
- **Validation**: Real-time form validation with error messages
- **Success Feedback**: Toast notifications on successful submission

### Analytics
- **Key Metrics**: Total demos, views, average views, monthly additions
- **Performance Charts**: Top-performing demos visualization
- **Tag Analysis**: Popular tags distribution
- **Recent Activity**: Timeline of new additions

## 🛣️ Roadmap

### Phase 1: MVP (Current)
- [x] Demo catalog with search and filtering
- [x] Admin form for adding demos
- [x] Basic analytics dashboard
- [x] Page view tracking
- [x] Responsive design

### Phase 2: Backend Integration
- [ ] Supabase database integration
- [ ] User authentication system
- [ ] Real-time data synchronization
- [ ] File upload for screenshots
- [ ] Admin role management

### Phase 3: Advanced Features
- [ ] Demo editing and deletion
- [ ] Bulk operations
- [ ] Advanced analytics
- [ ] Export functionality
- [ ] Notification system

### Phase 4: Enhancements
- [ ] API documentation
- [ ] Mobile app
- [ ] Integration with CI/CD
- [ ] Advanced search with filters
- [ ] Demo categorization

## 🤝 Contributing

### Development Guidelines
1. Follow the established code structure
2. Use TypeScript for type safety
3. Implement responsive design
4. Add proper error handling
5. Include meaningful comments

### Code Style
- Use ESLint configuration
- Follow React best practices
- Implement proper TypeScript types
- Use semantic HTML elements
- Follow accessibility guidelines

### Testing
- Test components in isolation
- Verify responsive behavior
- Test form validation
- Check error states

## 📞 Support

For questions, issues, or feature requests:

- **Email**: [jeremy@lyzr.ai](mailto:jeremy@lyzr.ai)
- **Internal Slack**: #lyzr-tools
- **Documentation**: See inline code comments

## 📄 License

Internal tool - Lyzr AI © 2024

---

<div align="center">
  <p>Built with ❤️ by the Lyzr team</p>
  <p>Version 0.1.0 - MVP Release</p>
</div>