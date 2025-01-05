# Deploying to GitHub Pages

This document explains how to deploy this React application to GitHub Pages.

## Prerequisites

- A GitHub account
- Git installed on your local machine
- Node.js and npm installed
- Your project pushed to a GitHub repository

## Automatic Deployment

This project is configured to automatically deploy to GitHub Pages when you push to the `master` branch. The deployment is handled by a GitHub Actions workflow.

### How it works

1. When you push to the `master` branch, the GitHub Actions workflow will:
   - Set up Node.js with npm caching
   - Install dependencies using `npm ci`
   - Build the project
   - Deploy the built files to the `gh-pages` branch

2. The deployment configuration is defined in:
   - `.github/workflows/deploy.yml` - Contains the GitHub Actions workflow
   - `vite.config.js` - Contains the base URL configuration
   - `package.json` - Contains the deployment scripts

## Manual Deployment

You can also deploy manually from your local machine:

1. Install the required dependencies:
   ```bash
   npm ci
   ```

2. Run the deploy script:
   ```bash
   npm run deploy
   ```

This will build the project and push the contents of the `dist` folder to the `gh-pages` branch.

## First-time Setup

If you're setting this up for the first time:

1. Make sure your repository has GitHub Pages enabled:
   - Go to your repository on GitHub
   - Navigate to Settings > Pages
   - Under "Source", select the `gh-pages` branch
   - Save the changes

2. Update the `base` property in `vite.config.js` with your repository name:
   ```javascript
   base: '/your-repo-name/',
   ```

3. Install the gh-pages package if not already installed:
   ```bash
   npm install --save-dev gh-pages
   ```

4. Ensure repository permissions are correct:
   - Go to Settings > Actions > General
   - Under "Workflow permissions", select "Read and write permissions"
   - Save the changes

## Accessing Your Deployed Site

Once deployed, your site will be available at:
```
https://[your-github-username].github.io/[repository-name]/
```

## Troubleshooting

If your deployment isn't working:

1. Check the Actions tab in your GitHub repository to see if there are any workflow errors
2. Verify that GitHub Pages is enabled and configured to use the `gh-pages` branch
3. Make sure the `base` property in `vite.config.js` matches your repository name
4. Check that all dependencies are properly installed
5. Ensure you have the necessary permissions to deploy to the repository

Common Issues:
- If you get permission errors, check the repository's Actions permissions in Settings
- If the site is not updating, make sure the GitHub Pages source branch is set to `gh-pages`
- If builds fail, try running `npm ci` locally first to verify your dependencies

## Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Vite Deploy Static Site Guide](https://vitejs.dev/guide/static-deploy.html)
- [GitHub Actions Documentation](https://docs.github.com/en/actions) 
