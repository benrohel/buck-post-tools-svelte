# Buck Post Tools CEP - Developer Guide

## Build Commands
- `bun run dev` - Development mode with hot reloading
- `bun run watch` - Build with TypeScript and watch for changes
- `bun run build` - Production build
- `bun run zxp` - Build and package as Adobe ZXP extension
- `bun run serve` - Preview the panel
- `bun run symlink` - Create symbolic links for development

## Code Style Guidelines
- **TypeScript**: Use strict typing with explicit type annotations
- **Components**: Organize Svelte components with `<script lang="ts">` at top
- **CSS/SCSS**: Use SCSS with variables from `variables.scss`
- **Naming**: PascalCase for components, camelCase for variables/functions
- **Imports**: Group imports by type (Svelte, third-party, project)
- **File Structure**: Place related files in appropriate directories under `src/js/`
- **Error Handling**: Provide clear error messages to users

## Project Structure
- `src/js/components` - Reusable UI components
- `src/js/main` - Main application views
- `src/jsx` - Adobe ExtendScript files for After Effects and Premiere Pro
- `src/js/api` - API and utility functions

Follow existing patterns when adding new features or modifying code.
