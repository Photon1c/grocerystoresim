# Grocery Store Simulation

*A Three.js implementation of a grocery store operation using modularized JavaScript files with an HTML frontend and stats panel GUI overlays.*  

![sample](media/sample.GIF)

A modular, interactive 3D grocery store simulation built with Vite and Three.js. Simulates customer and worker agents, dynamic shopping behaviors, collision detection, and real-time stats tracking.

## Features
- 3D grocery store layout: aisles, bakery, deli, restrooms, warehouse, self-checkout
- WASD + Q/E + arrow key navigation, isometric/top-down/angled camera
- Customer and worker agents with pathfinding, queueing, and collision logic
- Customers pick up baskets, browse the store, check out, and exit (looping)
- Shopping lists are distributed evenly across all aisles, and each item is associated with a specific aisle.
- Customers' waypoints are generated to visit the correct aisles for their shopping list.
- A 'clue' mechanic ensures customers find their items as time passes at an aisle, preventing them from getting lost.
- Stats overlay now has a Show/Hide button and is hidden by default.
- Customer stats card and overlay always display item names and aisles, never [object Object].
- MB Stats panel at the bottom left shows FPS, agent count, and memory usage.
- Dynamic, shuffled browsing paths and unique shopping lists per customer
- Real-time stats overlay and interactive stats card (click a customer to view details)
- Modular codebase: logic, agents, maps, GUI, assets

## Project Structure
```
grocerystoresim/
  ├── public/           # Static assets (SVGs, images, etc.)
  ├── src/
  │   ├── agents/       # Agent classes and logic
  │   ├── assets/       # 3D models, textures, GUI
  │   ├── gui/          # UI overlays and stats
  │   ├── logic/        # Controllers, pathfinding, inventory, etc.
  │   ├── maps/         # Store layout and fixtures
  │   ├── main.js       # Main entry point
  │   └── style.css     # Styles
  ├── logs/             # Progress and session logs
  ├── index.html        # App entry
  └── package.json      # Dependencies
```

## How to Run
1. Install dependencies:
   ```
   npm install
   ```
2. Start the dev server:
   ```
   npm run dev
   ```
3. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Next Steps
- Implement item pickup and basket return
- Add more agent behaviors and mood effects
- Visual improvements: 3D models for agents, shelves, counters, and items
- UI/UX enhancements for stats and controls
- Performance optimization for larger agent counts
- Prepare for deployment (Netlify, asset optimization)
- Add sound effects or background music
- Save/load simulation state or session logs

---
_Last updated: after stats overlay and clue mechanic milestone_
