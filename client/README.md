# Campus Crypt - Client

A modern, attractive coming soon page built with React + Vite.

## Features

- ✨ Modern UI with glassmorphic design
- 🎨 Gradient backgrounds and smooth animations
- 📧 Email subscription form
- 🚀 Responsive design (mobile-friendly)
- ⚡ Built with Vite for fast development
- 🎯 Feature cards showcasing key benefits
- 🌙 Dark theme with vibrant accent colors

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

### Development

Start the development server:
```bash
npm run dev
```

The app will open automatically at `http://localhost:3000`

### Build

Create a production build:
```bash
npm run build
```

The optimized build will be in the `dist` folder.

### Preview Production Build

Preview the production build locally:
```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   └── ComingSoon.jsx      # Main coming soon component
├── styles/
│   ├── global.css          # Global styles
│   └── coming-soon.css     # Component styles
├── App.jsx                 # Main app component
└── main.jsx                # Entry point

```

## Design Features

### Visual Elements
- Animated gradient backgrounds
- Floating orb elements
- Grid background pattern
- Smooth fade-in animations on page load

### Interactive Elements
- Email subscription form with success message
- Hover effects on feature cards
- Animated icons from lucide-react
- Responsive button states

### Typography
- Outfit font family for modern look
- Gradient text effects
- Proper font weights and sizing

## Customization

### Colors
Edit `src/styles/coming-soon.css` to change the color scheme:
- Primary gradient: `#6366f1` to `#a855f7`
- Dark background: `#0a0e27`
- Text colors: `#e4e4e7`, `#a1a1aa`

### Content
Edit `src/components/ComingSoon.jsx` to:
- Change the title and subtitle
- Update feature descriptions
- Modify social links
- Add custom branding

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Performance

- Optimized with Vite
- Fast refresh during development
- Minimal bundle size
- Lazy loading ready

## License

See LICENSE in root directory.
