# Habitree 🌳

A gamified habit-tracking web app built with React. Visualize your habit progress as the growth of a tree, earn Leaf Dollars, and unlock new characters!

## Features

- **Main Menu**: Track daily habits with checkboxes and numeric inputs
- **Calendar View**: Monthly progress visualization for each habit
- **Quest Creation**: Choose from pre-made quests or create custom ones
- **Tree & Character View**: Watch your tree grow and unlock new characters
- **Settings**: Manage your profile and account

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/       # Reusable components (BottomNav, etc.)
├── views/           # Main view components (5 screens)
├── assets/          # Images, icons, SVG files
├── styles/          # Global styles and CSS variables
├── App.jsx          # Main app with routing
└── index.jsx        # Entry point
```

## Tech Stack

- **React** - UI framework
- **React Router** - Navigation between views
- **CSS Modules** - Modular styling
- **CSS Variables** - Consistent theming

## Responsive Design

- Mobile: < 640px
- Tablet: 641px - 1024px
- Desktop: > 1024px

## Next Steps

See the documentation below for suggested implementation priorities.

## License

MIT
