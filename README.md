# Buck Post Tools CEP

Buck Post Tools CEP is an Adobe Creative Cloud Extension Panel (CEP) designed to streamline and automate common video post-production workflows. This extension integrates with Adobe After Effects and Premiere Pro to provide tools for asset management, project setup, export, and more.

![Demo](create-bolt-cep--demo.gif)

## Features

- **Project Management**

  - Create standardized projects with templates
  - Apply consistent settings across projects
  - Configure aspect ratios and project settings

- **Asset Ingest**

  - Import and organize footage with version control
  - Shot library management
  - Support for image sequences and video files

- **Rename Tools**

  - Find and replace
  - Prefix and suffix
  - Sequential renaming
  - Version control
  - Asset relinking

- **Export**

  - Export compositions and sequences
  - Custom output path building with tokens
  - Export still frames
  - Render queue with multiple output modules
  - Export presets

- **After Effects Tools**

  - Expression management
  - Render queue integration
  - Asset replacement
  - Template system

- **Premiere Pro Tools**
  - Sequence export
  - XML export
  - Clip management
  - Conform tools

## Installation

### Production Installation

1. Download the latest ZXP installer from the releases page
2. Launch After Effects or Premiere Pro and access the panel via Window > Extensions > Buck Post Tools

### Development Setup

1. Clone this repository
2. Install dependencies:
   ```
   yarn install
   ```
3. Create symbolic links for development:
   ```
   yarn symlink
   ```
4. Start development server:
   ```
   yarn dev
   ```

## Development Guide

### Build Commands

- `yarn dev` - Development mode with hot reloading
- `yarn watch` - Build with TypeScript and watch for changes
- `yarn build` - Production build
- `yarn zxp` - Build and package as Adobe ZXP extension
- `yarn serve` - Preview the panel
- `yarn symlink` - Create symbolic links for development

### Code Style Guidelines

- **TypeScript**: Use strict typing with explicit type annotations
- **Components**: Organize Svelte components with `<script lang="ts">` at top
- **CSS/SCSS**: Use SCSS with variables from `variables.scss`
- **Naming**: PascalCase for components, camelCase for variables/functions
- **Imports**: Group imports by type (Svelte, third-party, project)
- **File Structure**: Place related files in appropriate directories under `src/js/`
- **Error Handling**: Provide clear error messages to users

### Project Structure

- `src/js/components` - Reusable UI components
- `src/js/main` - Main application views
- `src/jsx` - Adobe ExtendScript files for After Effects and Premiere Pro
- `src/js/api` - API and utility functions
- `src/js/stores` - Svelte stores for state management
- `src/assets` - Templates and static assets

## Changelog

All notable changes to Buck Post Tools CEP are documented in the [CHANGELOG.md](CHANGELOG.md) file.

### Recent Changes

#### [1.0.2] - 2025-04-21

**Fixed**

- Fixed windows support and compatibility
- Fixed output module issues
- Fixed package.json configuration

**Changed**

- Moved assets and changed bundling of ffmpeg
- Improved Windows and Export presets

#### [1.0.1] - Previous Release

**Added**

- Added tooltips system throughout the application
- Added property reference picker
- Added settings for export presets and version warnings
- Added progress bar for various operations
- Added export path builder with token-based rendering

**Improved**

- Enhanced expression modal UI
- Improved toggle styling
- Updated modal styling with darker background
- Refactored export system with dedicated exporter directory
- Implemented render queue with multiple output modules support
- Improved clip name truncation and tooltip implementation

**Fixed**

- Fixed Windows dialog functionality
- Fixed folder token handling
- Fixed panel display issues with hyphens in names
- Fixed Windows file path handling for After Effects

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
