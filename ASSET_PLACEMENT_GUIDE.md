# Habitree Asset Placement Guide

## 📁 Folder Structure

Create the following folders in your `public` directory:

```
public/
├── assets/
│   ├── characters/
│   │   ├── mape-icon.png
│   │   ├── mape-animated.riv
│   │   ├── ban-icon.png
│   │   ├── ban-animated.riv
│   │   ├── saku-icon.png
│   │   └── saku-animated.riv
│   ├── backgrounds/
│   │   ├── mape-background.jpg
│   │   ├── ban-background.jpg
│   │   └── saku-background.jpg
│   └── trees/
│       ├── tree-level-0.riv
│       ├── tree-level-1.riv
│       ├── tree-level-2.riv
│       ├── tree-level-3.riv
│       ├── tree-level-4.riv
│       ├── tree-level-5.riv
│       ├── tree-level-6.riv
│       ├── tree-level-7.riv
│       ├── tree-level-8.riv
│       └── tree-level-9.riv
```

## 🌳 Tree Rive Animation Files (10 files)

Place your tree Rive files in: `public/assets/trees/`

**File naming:**
- `tree-level-0.riv` → 0-10% progress
- `tree-level-1.riv` → 11-20% progress
- `tree-level-2.riv` → 21-30% progress
- `tree-level-3.riv` → 31-40% progress
- `tree-level-4.riv` → 41-50% progress
- `tree-level-5.riv` → 51-60% progress
- `tree-level-6.riv` → 61-70% progress
- `tree-level-7.riv` → 71-80% progress
- `tree-level-8.riv` → 81-90% progress
- `tree-level-9.riv` → 91-100% progress

**Format:** Rive animation file (.riv)
**Rendered size:** 200x200px
**Behavior:** Animations will automatically play and loop

## 👥 Character Files

### Mape
- **Icon** (for profile picture, main menu, calendar): `public/assets/characters/mape-icon.png`
  - Format: PNG
  - Recommended size: 64x64px minimum
- **Animated Rive** (for animation screen): `public/assets/characters/mape-animated.riv`
  - Format: Rive animation file (.riv)
  - Animation will automatically play and loop
  - Rendered size: 180x180px
- **Background** (for animation screen): `public/assets/backgrounds/mape-background.jpg`
  - Format: JPG
  - Recommended size: Match your animation screen width (around 400-600px)

### Ban
- **Icon**: `public/assets/characters/ban-icon.png`
- **Animated Rive**: `public/assets/characters/ban-animated.riv`
- **Background**: `public/assets/backgrounds/ban-background.jpg`

### Saku
- **Icon**: `public/assets/characters/saku-icon.png`
- **Animated Rive**: `public/assets/characters/saku-animated.riv`
- **Background**: `public/assets/backgrounds/saku-background.jpg`

## 💬 Character Dialogues

You can customize the dialogues for each character by editing:
`src/utils/charactersStorage.ts`

### Current Dialogues:

**Mape:**
- "Let's grow together! 🍁"
- "Every small step counts!"
- "You're doing amazing!"
- "Keep going, friend!"
- "Progress is progress! 🌱"
- "I believe in you!"
- "One day at a time!"
- "You've got this! 💪"

**Ban:**
- "Strength comes from consistency! 🌿"
- "Your efforts are paying off!"
- "Keep nurturing your habits!"
- "Steady progress is the key!"
- "You're building something great!"
- "Stay focused and strong! 💚"
- "Every habit is a new leaf!"
- "Growth takes time and care!"

**Saku:**
- "Bloom where you are planted! 🌸"
- "Your journey is beautiful!"
- "Each day brings new growth!"
- "You're blossoming wonderfully!"
- "Keep nurturing yourself! 🌺"
- "Your potential is endless!"
- "Embrace the process!"
- "You're doing great! ✨"

To add or change dialogues, edit the `dialogues` array in each character object.

## 🎮 How It Works

1. **First Character Assignment**: When a user opens the app for the first time, they are randomly assigned one of the three characters (Mape, Ban, or Saku) for free.

2. **Unlocking Additional Characters**: The other two characters cost 50 Leaf Dollars each and can be purchased in the shop (accessed via the tree icon in the main menu).

3. **Character Icons**: Used in:
   - Profile picture (Settings screen)
   - Main menu header (top right)
   - Calendar screen
   - Companion slots

4. **Animated Rive files**: Only used in the animation screen (accessed by clicking the tree icon in the main menu header). Animations will play automatically and loop continuously.

5. **Backgrounds**: Each character has a unique background that displays behind them in the animation screen.

6. **Tree Progress**: The tree visual changes based on your quest completion percentage (0-100%), cycling through 10 different growth stages.

## ⚙️ Implementation Status

✅ Character data structure with names, dialogues, and asset paths
✅ Random first character assignment
✅ Tree level Rive animation system (10 levels based on progress)
✅ Character-specific backgrounds for animation screen
✅ Character-specific dialogue system
✅ Shop system updated (50 Leaf Dollars per character)
✅ Rive animation support for both trees and characters (using @rive-app/react-canvas)
✅ Settings screen fully integrated with new character system
✅ All TypeScript errors resolved

## 🔧 Next Steps

After placing your files, the system will automatically:
- Display the correct tree level based on quest progress
- Show your animated character in the animation screen
- Apply character-specific backgrounds
- Display character icons throughout the app
- Show character-specific dialogue messages in the main menu

If any images don't load, check:
1. File names match exactly (case-sensitive)
2. Files are in the correct folders
3. File formats are correct (PNG for icons, .riv for animations, JPG for backgrounds)

## 📦 Rive Animation Notes

The app now uses Rive for all animations (trees and characters):
- Rive is a powerful animation runtime that allows for interactive, real-time animations
- All `.riv` files will automatically play and loop
- The Rive React library (`@rive-app/react-canvas`) is already installed
- No additional configuration needed - just place your `.riv` files in the correct locations
- You can create Rive animations at [rive.app](https://rive.app)
- Total files needed: 10 tree animations + 3 character animations = 13 `.riv` files
