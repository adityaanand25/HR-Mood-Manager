# HR Mood Manager - Frontend

A beautiful React + TypeScript frontend for the HR Mood Manager application.

## Features

- 🎨 Beautiful, modern UI with gradient backgrounds
- 😊 6 mood options with emojis (Happy, Neutral, Sad, Angry, Anxious, Excited)
- 📊 Intensity slider (1-10 scale)
- 📝 Optional notes section
- ✅ Real-time feedback on submission
- 📱 Responsive design for mobile and desktop

## Setup Instructions

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   Navigate to `http://localhost:3000`

## Build for Production

```bash
npm run build
```

## Technologies Used

- React 18
- TypeScript
- Vite (Build tool)
- CSS3 (Custom styling)

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── MoodSelector.tsx      # Main mood selection component
│   │   └── MoodSelector.css      # Styling for mood selector
│   ├── types/
│   │   └── mood.ts               # TypeScript type definitions
│   ├── App.tsx                   # Main app component
│   ├── App.css                   # App styling
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Global styles
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Integration with Backend

To connect to your Python emotion detection backend, update the proxy configuration in `vite.config.ts` to point to your Flask/FastAPI server.
