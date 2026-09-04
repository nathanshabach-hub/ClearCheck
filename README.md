# ClearCheck

ClearCheck is a responsive React and Vite web app for interpreting pool and spa test-strip readings. Select the shade that most closely matches each test pad, enter the water volume, and ClearCheck provides an estimated chemical recommendation.

The app is designed for quick use on a phone beside a pool or spa. It also includes Progressive Web App (PWA) support so it can be installed to a device home screen and can serve previously visited pages while offline.

## Features

- Pool and spa testing modes with different target ranges
- Six test-strip readings:
  - Free chlorine
  - Total chlorine
  - pH
  - Total alkalinity
  - Cyanuric acid
  - Total hardness
- Color swatch controls with 44px touch targets
- Water-volume units:
  - Liters (L)
  - US gallons (gal)
  - Milliliters (mL)
- Preset pool and spa volumes
- Automatic conversion between volume units
- Recommendations for raising or lowering readings
- Combined-chlorine shock guidance
- Light and dark aquatic themes
- Responsive layout for mobile and desktop screens
- PWA manifest, install metadata, branded icons, and service worker caching
- Cloudflare Pages-compatible production build

## Requirements

- Node.js 18 or newer
- npm
- A modern browser such as Chrome, Edge, Safari, or Firefox

## Project Structure

```text
.
├── DipAndDose.jsx                 # Main calculator component and chemistry rules
├── src/
│   └── main.jsx                   # React application entry point
├── public/
│   ├── manifest.json               # PWA metadata
│   ├── sw.js                       # Service worker
│   └── icons/                      # PWA and home-screen icons
├── index.html                     # HTML entry point and PWA registration
├── package.json                   # Scripts and dependencies
├── package-lock.json              # Locked dependency versions
├── ClearCheck.png                 # Source brand icon
└── COMPONENT-PATCH-NOTES.md       # PWA upgrade notes
```

## Install Dependencies

From the project directory:

```bash
npm install
```

## Run Locally

Start the Vite development server:

```bash
npm run dev
```

Open the URL shown by Vite, normally:

```text
http://localhost:5173/
```

Vite reloads the page automatically when source files change.

## Production Build

Create an optimized production build:

```bash
npm run build
```

The generated files are written to `dist/`. The `dist/` directory is ignored by Git and should not be committed.

To preview a production build locally, run:

```bash
npm run build
npx vite preview
```

## Deploy to Cloudflare Pages with Git

Git-based deployment is recommended because Cloudflare can rebuild the site automatically after every push.

### 1. Create and push a repository

Create an empty repository on GitHub or GitLab, then run the following from this project directory. Replace the remote URL with the URL for your repository.

```bash
git init
git add .
git commit -m "Initial ClearCheck PWA"
git branch -M main
git remote add origin YOUR_REPOSITORY_URL
git push -u origin main
```

The repository should include source files, `public/`, `index.html`, `package.json`, and `package-lock.json`. It should not include `node_modules/`, `dist/`, or secrets.

### 2. Create the Cloudflare Pages project

In the Cloudflare dashboard:

1. Open **Workers & Pages**.
2. Select **Create application**.
3. Choose **Pages** and **Connect to Git**.
4. Authorize GitHub or GitLab if prompted.
5. Select the ClearCheck repository.
6. Configure the build settings below.

| Setting | Value |
|---|---|
| Framework preset | Vite |
| Production branch | `main` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |

No environment variables are currently required.

After the first deployment, Cloudflare provides a `pages.dev` URL. A custom domain can be attached from the Pages project settings.

### Direct deployment alternative

A Git repository is not required for a one-time deployment. Build the app locally and upload the `dist/` directory using Cloudflare's direct upload workflow or Wrangler. Git integration is preferable for ongoing development and automatic deployments.

## PWA Support

The PWA is configured through:

- `public/manifest.json` for app name, colors, display mode, orientation, and icons
- `public/sw.js` for runtime caching and offline support
- `index.html` for manifest, theme-color, Apple mobile metadata, and service-worker registration
- `public/icons/` for standard and maskable app icons

PWA installation requires either `localhost` during development or HTTPS after deployment. Cloudflare Pages serves deployed sites over HTTPS automatically.

### Testing installation

- Chrome or Edge: look for the install control in the address bar or browser menu.
- Android: use the browser menu and choose the install/add-to-home-screen option.
- iPhone or iPad: open the site in Safari, choose Share, then **Add to Home Screen**.

The service worker caches the main app entry, HTML entry point, and manifest. Previously visited resources may remain available offline. A fresh deployment may require a reload before a new service-worker version becomes active.

## Chemistry and Calculation Notes

ClearCheck uses approximate rules of thumb expressed per 1,000 liters. The app converts the entered volume to liters before calculating a recommendation.

The current rates include estimates for:

- Granular chlorine additions
- Soda ash for pH increases
- Dry acid for pH decreases
- Sodium bicarbonate for alkalinity increases
- Muriatic acid for alkalinity decreases
- Cyanuric acid increases
- Calcium chloride increases

The target ranges differ between pool and spa mode. Recommendations are estimates and may vary with product concentration, water temperature, starting chemistry, and local water conditions.

### Important safety guidance

- Always follow the product label and local regulations.
- Never mix pool chemicals together.
- Add acid to water, never water to acid.
- Wear appropriate gloves and eye protection.
- Keep the pump running when the recommendation says to circulate.
- Wait and retest before adding more chemical.
- Do not swim until the water is confirmed safe.

ClearCheck is a calculation aid, not a substitute for product-label instructions or professional water testing.

## Units

Water volume is stored internally as liters for consistent calculations:

- `1 L = 1,000 mL`
- `1 US gal = 3.78541 L`

Milliliters are appropriate for liquid chemical dosing, but very large when used to describe pool volume. For example, `40,000 L` is displayed as `40,000,000 mL` when mL is selected.

Powder-based products are intentionally reported in grams. Converting those products to milliliters would require product-specific density data and would not be chemically reliable.

## Branding and Icons

The ClearCheck logo source is `ClearCheck.png`. The deployed icon files are stored in `public/icons/` using the filenames referenced by `public/manifest.json`.

If the logo changes, replace the icon files with valid PNGs while preserving the declared dimensions:

- Standard icon: 192x192 and 512x512
- Maskable icon: 192x192 and 512x512

After changing icons, reinstall or clear the installed PWA because browsers cache home-screen icons independently from the site.

## Development Notes

- The main component remains named `DipAndDose` for compatibility with the existing source import.
- The visible product name and document title are ClearCheck.
- The service worker is registered only in the browser and does not affect the Vite build.
- Keep `package-lock.json` committed so Cloudflare and other environments install the same dependency versions.
- Keep `node_modules/` and `dist/` out of version control.

## License

No license has been specified for this project yet. Add a license before distributing the code publicly.
