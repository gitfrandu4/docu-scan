# DocuScan AI - Development Guidelines

This is a React-based web application that uses TensorFlow.js to run YOLOv8 object detection in the browser. The app features a modern, mobile-first camera interface with real-time object detection.

## Project Structure

```
src/
├── components/         # React components
├── utils/             # Utility functions
├── style/             # CSS styles
├── i18n/              # Internationalization
└── App.jsx            # Main application
```

## Key Components

### App.jsx
- Main application container
- Handles model loading and initialization
- Manages the camera/image display and canvas overlay
- Uses the following state:
  - `loading`: Model loading status
  - `model`: TensorFlow model instance
  - `showSplash`: Splash screen visibility

### ButtonHandler
- Controls for camera and image handling
- Features:
  - Camera toggle
  - Image upload
  - Language switching
- Maintains camera stream state

### Design Guidelines

1. UI/UX Principles:
   - Mobile-first design
   - Native camera app look and feel
   - Dark theme with #121212 background
   - Semi-transparent controls with blur effects
   - Responsive layout that preserves video/canvas proportions

2. Critical Elements:
   - Canvas MUST maintain exact proportions (no CSS width/height)
   - Video element must match canvas dimensions
   - Bounding box overlay must align perfectly with video

3. Button Styling:
   - Circular buttons with 50px diameter (40px on mobile)
   - Capture button: 70px diameter with blue border
   - Semi-transparent backgrounds (rgba(0, 0, 0, 0.5))
   - Hover/active states with scale transforms

4. Header:
   - Minimal design with gradient background
   - Animated title with morphing shape
   - Blur effect for depth

## Important Considerations

1. Canvas/Video Synchronization:
   ```javascript
   // NEVER modify these proportions
   <canvas width={model.inputShape[1]} height={model.inputShape[2]} />
   ```

2. Button Container Layout:
   ```css
   .btn-container {
     position: fixed;
     bottom: 20px;
     display: flex;
     justify-content: center;
     gap: 20px;
   }
   ```

3. Language Switcher Integration:
   - Must match other controls' styling
   - Should use same blur effects and transitions
   - Options menu appears above the button

## Accessibility

- All buttons have proper aria-labels
- Color contrast meets WCAG guidelines
- Interactive elements have visible focus states
- Language options are keyboard navigable

## Internationalization

- Uses i18next for translations
- Currently supports:
  - English (en)
  - Spanish (es)
- Translation files in `src/i18n/`

## Performance Guidelines

1. Model Loading:
   - Show loading progress
   - Warm up model with dummy input
   - Dispose of tensors properly

2. Animation Performance:
   - Use transform/opacity for animations
   - Implement will-change for heavy animations
   - Throttle resize handlers

## Testing Considerations

- Verify canvas/video alignment on different devices
- Test camera permissions handling
- Ensure smooth transitions between states
- Validate language switching behavior
