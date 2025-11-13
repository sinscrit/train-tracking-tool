# Train Service Tracking Tool


## Features

- **Three View Modes**: Grouped, Spreadsheet, and Calendar views for flexible data visualization
- **Schedule Verification**: Automatic detection of discrepancies between systems
- **Missing Data Detection**: Identifies when systems lack schedule information
- **Régime-Based Filtering**: Filter by Vendredi (Friday) and Samedi (Saturday) schedules
- **Expandable Details**: Station-by-station schedule comparisons
- **Visual Indicators**: Color-coded status for border crossings, schedule changes, and discrepancies
- **Interactive Calendar**: Click dates to view detailed train information with side-by-side system comparisons

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui + Radix UI
- **Server**: Express.js (production)
- **Package Manager**: pnpm

## Quick Start

### Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

```bash
# Build for production
pnpm run build

# Start production server
pnpm run start
```

## Deployment to Railway

This project is configured for seamless deployment on Railway. See **[RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)** for comprehensive deployment instructions.

### Quick Railway Deployment

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy to Railway"
   git push origin main
   ```

2. **Deploy on Railway**:
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway automatically detects configuration and deploys

3. **Access Your App**:
   - Railway provides a public URL after deployment
   - Application is ready in 2-5 minutes

## Project Structure

```
train-tracking-tool/
├── client/                 # React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities and helpers
│   │   └── App.tsx        # Main application
│   └── public/            # Static assets
├── server/                # Express server
│   └── index.ts          # Server entry point
├── shared/               # Shared types and constants
├── dist/                 # Build output (generated)
├── railway.json          # Railway configuration
├── nixpacks.toml         # Build configuration
└── Procfile              # Process definition
```

## Documentation

- **[FEATURES.md](./FEATURES.md)** - Complete feature list
- **[USE_CASES.md](./USE_CASES.md)** - Detailed use cases and implementation details
- **[GHERKIN_SCENARIOS.md](./GHERKIN_SCENARIOS.md)** - BDD test scenarios
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture
- **[DATA_MODEL.md](./DATA_MODEL.md)** - Data structures and models
- **[BUSINESS_LOGIC.md](./BUSINESS_LOGIC.md)** - Verification algorithms
- **[API_SPECIFICATION.md](./API_SPECIFICATION.md)** - API design (future backend)
- **[USER_JOURNEYS.md](./USER_JOURNEYS.md)** - User personas and workflows
- **[RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)** - Railway deployment guide

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Start development server with hot reload |
| `pnpm run build` | Build for production |
| `pnpm run start` | Start production server |
| `pnpm run preview` | Preview production build locally |
| `pnpm run check` | Type-check TypeScript |
| `pnpm run format` | Format code with Prettier |

## Environment Variables

No environment variables are required for basic operation. The application runs entirely client-side with sample data.

For production deployments, Railway automatically sets:
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (production)

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

MIT

## Support

For deployment issues, see [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) troubleshooting section.

---

*Built with ❤️ using React, Vite, and Tailwind CSS*
