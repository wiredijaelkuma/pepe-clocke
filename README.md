# Pepe Clocke

A time tracking application for agents.

## GitHub Pages Deployment

This project is configured to deploy to GitHub Pages. To deploy:

1. Push your changes to the main branch
2. GitHub Actions will automatically build and deploy to GitHub Pages
3. Your site will be available at: https://yourusername.github.io/pepe-clocke/

## Manual Deployment

You can also deploy manually with:

```bash
cd pepe-cls
npm run deploy
```

## Development

```bash
cd pepe-cls
npm install
npm run dev
```

## Appwrite Configuration

Make sure to add your GitHub Pages URL to Appwrite:

1. Go to Appwrite Console → Project Settings → Platforms
2. Add a Web platform with hostname: yourusername.github.io
3. Go to Auth → OAuth2 providers → Google
4. Add your GitHub Pages URL to the callback URLs