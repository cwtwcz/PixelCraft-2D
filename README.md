# PixelCraft 2D

A simple 2D block exploration game built with vanilla JavaScript and HTML5 Canvas.

## Features

- 2D block-based world generation
- Mining and placing blocks
- Player movement with physics
- Inventory system
- Touch and keyboard controls

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pixelcraft
```

2. Install dependencies:
```bash
npm install
```

## Running the Game

1. Start the development server:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

## Controls

- **Movement**: Arrow keys or A/D
- **Jump**: Space, Up arrow, or W
- **Mine/Place**: Click on blocks
- **Switch Tools**: Use the Mine/Place buttons
- **Select Blocks**: Click on blocks in the hotbar

## Development

The game is built using vanilla JavaScript with ES6 modules. The main components are:

- `main.js`: Core game logic and initialization
- `config.js`: Game configuration and constants
- `blocks.js`: Block definitions and properties
- `world.js`: World generation and management
- `player.js`: Player physics and controls
- `renderer.js`: Canvas rendering
- `ui.js`: User interface elements

## License

MIT License 