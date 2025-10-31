# Global Theme System Implementation Plan
**E-Commerce Platform Theming & Styling Architecture**

**Document Version:** 1.0
**Date:** October 31, 2025
**Status:** Planning Phase

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Research Findings & Best Practices](#research-findings--best-practices)
3. [Architectural Overview](#architectural-overview)
4. [Design Token System](#design-token-system)
5. [CSS Custom Properties Architecture](#css-custom-properties-architecture)
6. [Database Schema](#database-schema)
7. [Backend API Design](#backend-api-design)
8. [Frontend Implementation](#frontend-implementation)
9. [Admin UI/UX Design](#admin-uiux-design)
10. [Implementation Phases](#implementation-phases)
11. [Migration Strategy](#migration-strategy)
12. [Performance Considerations](#performance-considerations)
13. [Testing Strategy](#testing-strategy)
14. [Future Enhancements](#future-enhancements)

---

## Executive Summary

### Current State
The Luxia e-commerce platform currently implements per-block styling with inline styles and Tailwind classes. While functional, this approach has limitations:
- **No global theming** - Colors and styles must be set per block
- **Inconsistent branding** - No centralized theme management
- **Maintenance overhead** - Updates require changing multiple blocks
- **No dark mode support** - Manual implementation per component
- **Limited customization** - No font selection, spacing presets, or advanced styling
- **Performance issues** - Inline styles prevent CSS caching

### Proposed Solution
Implement a comprehensive **Design Token System** with:
- **Global Theme Settings** - Centralized brand configuration
- **CSS Custom Properties** - Dynamic, performant theming
- **Design Tokens** - W3C-compliant JSON-based configuration
- **Multi-theme Support** - Light/dark modes, seasonal themes
- **Advanced Styling** - Typography, spacing, borders, shadows, gradients
- **Admin UI** - Visual theme editor with live preview
- **API-first Architecture** - RESTful theme management

### Success Metrics
- Reduce block configuration time by 70%
- Improve page load performance by 25%
- Enable non-technical users to customize branding
- Support 10+ pre-built themes out of the box
- 100% W3C Design Token specification compliance

---

## Research Findings & Best Practices

### Industry Standards (2025)

#### 1. W3C Design Tokens Specification
- **Status:** First stable version released October 2025
- **Format:** Vendor-neutral JSON specification
- **Color Support:** Display P3, Oklch, CSS Color Module 4
- **Features:** Inheritance, aliases, component-level references

#### 2. Leading E-Commerce Platforms

**Shopify Theme Architecture:**
- JSON-based theme configuration (`settings_schema.json`)
- Section-level settings with presets
- Live theme editor with visual feedback
- Theme inheritance and child themes
- Asset pipeline with CSS preprocessing

**BigCommerce Stencil Framework:**
- Handlebars templating with JSON configuration
- Component-based architecture
- Theme settings via `schema.json`
- Built-in responsive breakpoints
- SCSS with variables and mixins

**Key Takeaways:**
- Use JSON for theme configuration
- Separate content from presentation
- Component-level overrides over global settings
- Mobile-first responsive design (78% mobile traffic in 2025)
- Visual editor with instant preview

#### 3. CSS Custom Properties Best Practices

**Naming Conventions:**
```css
/* ✅ Semantic (Good) */
--color-primary
--color-text
--color-background
--spacing-md
--font-family-display

/* ❌ Context-specific (Avoid) */
--blue-light
--header-bg-color
--sidebar-padding
```

**Theme Detection:**
```css
/* System preference detection */
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: #0f172a;
  }
}

/* Manual override with data attribute */
[data-theme="dark"] {
  --color-background: #0f172a;
}
```

**Organization Pattern:**
1. Define base tokens in `:root`
2. Override with `[data-theme="theme-name"]`
3. Include `@media (prefers-color-scheme)` fallbacks
4. Use semantic naming for maximum reusability

#### 4. Design Token Management Tools

**Style Dictionary:**
- Converts JSON tokens to CSS, SCSS, JavaScript, iOS, Android
- Platform-agnostic token definitions
- Build-time token transformation
- Version control friendly

**Token Structure:**
```json
{
  "color": {
    "brand": {
      "primary": { "value": "#8bba9c" },
      "secondary": { "value": "#e8c7c8" }
    }
  }
}
```

**Output Formats:**
- CSS Custom Properties
- SCSS Variables
- JavaScript Objects
- iOS Swift
- Android XML

---

## Architectural Overview

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    Admin Panel UI                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │Theme Editor  │  │Font Selector │  │Preview Panel │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                 Theme Management API                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │GET /themes   │  │POST /themes  │  │PUT /themes   │  │
│  │GET /active   │  │DELETE        │  │PATCH /active │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Theme Service Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │Token Parser  │  │CSS Generator │  │Validator     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │themes        │  │theme_presets │  │theme_history │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Frontend Theme Provider                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │CSS Injection │  │Context API   │  │SSR Support   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Admin** configures theme via visual editor
2. **API** validates and stores theme as JSON
3. **Service Layer** generates CSS custom properties
4. **Database** persists theme configuration
5. **Frontend** fetches active theme on page load
6. **ThemeProvider** injects CSS variables into `:root`
7. **Components** use CSS variables for styling

---

## Design Token System

### Token Categories

#### 1. Color Tokens
```json
{
  "color": {
    "brand": {
      "primary": {
        "value": "#8bba9c",
        "type": "color",
        "description": "Primary brand color (Jade)"
      },
      "secondary": {
        "value": "#e8c7c8",
        "type": "color",
        "description": "Secondary brand color (Blush)"
      }
    },
    "neutral": {
      "white": { "value": "#ffffff", "type": "color" },
      "black": { "value": "#000000", "type": "color" },
      "gray": {
        "50": { "value": "#f9fafb", "type": "color" },
        "100": { "value": "#f3f4f6", "type": "color" },
        "200": { "value": "#e5e7eb", "type": "color" },
        "300": { "value": "#d1d5db", "type": "color" },
        "400": { "value": "#9ca3af", "type": "color" },
        "500": { "value": "#6b7280", "type": "color" },
        "600": { "value": "#4b5563", "type": "color" },
        "700": { "value": "#374151", "type": "color" },
        "800": { "value": "#1f2937", "type": "color" },
        "900": { "value": "#111827", "type": "color" }
      }
    },
    "semantic": {
      "background": {
        "primary": { "value": "{color.neutral.white}", "type": "color" },
        "secondary": { "value": "{color.neutral.gray.50}", "type": "color" },
        "elevated": { "value": "{color.neutral.white}", "type": "color" }
      },
      "text": {
        "primary": { "value": "{color.neutral.gray.900}", "type": "color" },
        "secondary": { "value": "{color.neutral.gray.600}", "type": "color" },
        "tertiary": { "value": "{color.neutral.gray.400}", "type": "color" },
        "inverse": { "value": "{color.neutral.white}", "type": "color" }
      },
      "border": {
        "default": { "value": "{color.neutral.gray.200}", "type": "color" },
        "strong": { "value": "{color.neutral.gray.300}", "type": "color" }
      },
      "interactive": {
        "default": { "value": "{color.brand.primary}", "type": "color" },
        "hover": { "value": "#7aa88a", "type": "color" },
        "active": { "value": "#6a967a", "type": "color" },
        "disabled": { "value": "{color.neutral.gray.300}", "type": "color" }
      },
      "feedback": {
        "success": { "value": "#10b981", "type": "color" },
        "warning": { "value": "#f59e0b", "type": "color" },
        "error": { "value": "#ef4444", "type": "color" },
        "info": { "value": "#3b82f6", "type": "color" }
      }
    }
  }
}
```

#### 2. Typography Tokens
```json
{
  "font": {
    "family": {
      "display": {
        "value": "'Playfair Display', serif",
        "type": "fontFamily",
        "description": "Decorative headings font"
      },
      "body": {
        "value": "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        "type": "fontFamily",
        "description": "Body text font"
      },
      "mono": {
        "value": "'Fira Code', 'Courier New', monospace",
        "type": "fontFamily"
      }
    },
    "size": {
      "xs": { "value": "0.75rem", "type": "fontSize" },
      "sm": { "value": "0.875rem", "type": "fontSize" },
      "base": { "value": "1rem", "type": "fontSize" },
      "lg": { "value": "1.125rem", "type": "fontSize" },
      "xl": { "value": "1.25rem", "type": "fontSize" },
      "2xl": { "value": "1.5rem", "type": "fontSize" },
      "3xl": { "value": "1.875rem", "type": "fontSize" },
      "4xl": { "value": "2.25rem", "type": "fontSize" },
      "5xl": { "value": "3rem", "type": "fontSize" },
      "6xl": { "value": "3.75rem", "type": "fontSize" },
      "7xl": { "value": "4.5rem", "type": "fontSize" },
      "8xl": { "value": "6rem", "type": "fontSize" },
      "9xl": { "value": "8rem", "type": "fontSize" }
    },
    "weight": {
      "light": { "value": "300", "type": "fontWeight" },
      "normal": { "value": "400", "type": "fontWeight" },
      "medium": { "value": "500", "type": "fontWeight" },
      "semibold": { "value": "600", "type": "fontWeight" },
      "bold": { "value": "700", "type": "fontWeight" },
      "extrabold": { "value": "800", "type": "fontWeight" }
    },
    "lineHeight": {
      "tight": { "value": "1.25", "type": "lineHeight" },
      "normal": { "value": "1.5", "type": "lineHeight" },
      "relaxed": { "value": "1.75", "type": "lineHeight" },
      "loose": { "value": "2", "type": "lineHeight" }
    },
    "letterSpacing": {
      "tight": { "value": "-0.05em", "type": "letterSpacing" },
      "normal": { "value": "0", "type": "letterSpacing" },
      "wide": { "value": "0.025em", "type": "letterSpacing" },
      "wider": { "value": "0.05em", "type": "letterSpacing" },
      "widest": { "value": "0.1em", "type": "letterSpacing" }
    }
  }
}
```

#### 3. Spacing Tokens
```json
{
  "spacing": {
    "preset": {
      "compact": {
        "xs": { "value": "0.125rem", "type": "spacing" },
        "sm": { "value": "0.25rem", "type": "spacing" },
        "md": { "value": "0.5rem", "type": "spacing" },
        "lg": { "value": "0.75rem", "type": "spacing" },
        "xl": { "value": "1rem", "type": "spacing" }
      },
      "normal": {
        "xs": { "value": "0.25rem", "type": "spacing" },
        "sm": { "value": "0.5rem", "type": "spacing" },
        "md": { "value": "1rem", "type": "spacing" },
        "lg": { "value": "1.5rem", "type": "spacing" },
        "xl": { "value": "2rem", "type": "spacing" },
        "2xl": { "value": "3rem", "type": "spacing" },
        "3xl": { "value": "4rem", "type": "spacing" }
      },
      "spacious": {
        "xs": { "value": "0.5rem", "type": "spacing" },
        "sm": { "value": "1rem", "type": "spacing" },
        "md": { "value": "1.5rem", "type": "spacing" },
        "lg": { "value": "2.5rem", "type": "spacing" },
        "xl": { "value": "4rem", "type": "spacing" },
        "2xl": { "value": "6rem", "type": "spacing" }
      }
    },
    "component": {
      "button": {
        "padding-x": { "value": "{spacing.preset.normal.md}", "type": "spacing" },
        "padding-y": { "value": "{spacing.preset.normal.sm}", "type": "spacing" },
        "gap": { "value": "{spacing.preset.normal.xs}", "type": "spacing" }
      },
      "card": {
        "padding": { "value": "{spacing.preset.normal.lg}", "type": "spacing" },
        "gap": { "value": "{spacing.preset.normal.md}", "type": "spacing" }
      }
    }
  }
}
```

#### 4. Border & Shadow Tokens
```json
{
  "border": {
    "width": {
      "none": { "value": "0", "type": "borderWidth" },
      "thin": { "value": "1px", "type": "borderWidth" },
      "medium": { "value": "2px", "type": "borderWidth" },
      "thick": { "value": "4px", "type": "borderWidth" }
    },
    "radius": {
      "none": { "value": "0", "type": "borderRadius" },
      "sm": { "value": "0.25rem", "type": "borderRadius" },
      "md": { "value": "0.5rem", "type": "borderRadius" },
      "lg": { "value": "0.75rem", "type": "borderRadius" },
      "xl": { "value": "1rem", "type": "borderRadius" },
      "2xl": { "value": "1.5rem", "type": "borderRadius" },
      "3xl": { "value": "2rem", "type": "borderRadius" },
      "full": { "value": "9999px", "type": "borderRadius" }
    }
  },
  "shadow": {
    "sm": {
      "value": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      "type": "boxShadow"
    },
    "md": {
      "value": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      "type": "boxShadow"
    },
    "lg": {
      "value": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      "type": "boxShadow"
    },
    "xl": {
      "value": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      "type": "boxShadow"
    },
    "2xl": {
      "value": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      "type": "boxShadow"
    },
    "inner": {
      "value": "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
      "type": "boxShadow"
    }
  }
}
```

#### 5. Gradient Tokens
```json
{
  "gradient": {
    "brand": {
      "primary": {
        "value": "linear-gradient(135deg, {color.brand.primary} 0%, {color.brand.secondary} 100%)",
        "type": "gradient"
      }
    },
    "preset": {
      "sunrise": {
        "value": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        "type": "gradient"
      },
      "ocean": {
        "value": "linear-gradient(135deg, #2e3192 0%, #1bffff 100%)",
        "type": "gradient"
      },
      "sunset": {
        "value": "linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)",
        "type": "gradient"
      }
    }
  }
}
```

---

## CSS Custom Properties Architecture

### Variable Naming Convention

**Format:** `--[category]-[property]-[variant?]`

**Examples:**
```css
/* Colors */
--color-primary
--color-text-primary
--color-background-elevated

/* Typography */
--font-family-display
--font-size-xl
--font-weight-bold

/* Spacing */
--spacing-md
--spacing-component-button-x

/* Borders & Shadows */
--border-radius-lg
--shadow-xl
```

### CSS Structure

#### Base Theme (Light Mode Default)
```css
:root {
  /* ===== Brand Colors ===== */
  --color-brand-primary: #8bba9c;
  --color-brand-secondary: #e8c7c8;
  --color-brand-accent: #0f172a;

  /* ===== Semantic Colors ===== */
  --color-background-primary: #ffffff;
  --color-background-secondary: #f9fafb;
  --color-background-elevated: #ffffff;
  --color-background-overlay: rgba(0, 0, 0, 0.5);

  --color-text-primary: #111827;
  --color-text-secondary: #4b5563;
  --color-text-tertiary: #9ca3af;
  --color-text-inverse: #ffffff;

  --color-border-default: #e5e7eb;
  --color-border-strong: #d1d5db;

  --color-interactive-default: var(--color-brand-primary);
  --color-interactive-hover: #7aa88a;
  --color-interactive-active: #6a967a;
  --color-interactive-disabled: #d1d5db;

  /* ===== Typography ===== */
  --font-family-display: 'Playfair Display', serif;
  --font-family-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-family-mono: 'Fira Code', 'Courier New', monospace;

  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;
  --font-size-5xl: 3rem;

  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;

  /* ===== Spacing ===== */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
  --spacing-3xl: 4rem;

  /* ===== Borders ===== */
  --border-width-thin: 1px;
  --border-width-medium: 2px;
  --border-width-thick: 4px;

  --border-radius-sm: 0.25rem;
  --border-radius-md: 0.5rem;
  --border-radius-lg: 0.75rem;
  --border-radius-xl: 1rem;
  --border-radius-2xl: 1.5rem;
  --border-radius-3xl: 2rem;
  --border-radius-full: 9999px;

  /* ===== Shadows ===== */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

  /* ===== Transitions ===== */
  --transition-fast: 150ms ease-in-out;
  --transition-base: 200ms ease-in-out;
  --transition-slow: 300ms ease-in-out;

  /* ===== Z-Index Scale ===== */
  --z-base: 0;
  --z-dropdown: 1000;
  --z-sticky: 1100;
  --z-fixed: 1200;
  --z-modal-backdrop: 1300;
  --z-modal: 1400;
  --z-popover: 1500;
  --z-tooltip: 1600;
}
```

#### Dark Mode Theme
```css
/* Manual dark mode override */
[data-theme="dark"] {
  --color-background-primary: #0f172a;
  --color-background-secondary: #1e293b;
  --color-background-elevated: #334155;

  --color-text-primary: #f1f5f9;
  --color-text-secondary: #cbd5e1;
  --color-text-tertiary: #94a3b8;

  --color-border-default: #334155;
  --color-border-strong: #475569;

  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.5);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.4);
}

/* System preference dark mode */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    --color-background-primary: #0f172a;
    --color-background-secondary: #1e293b;
    --color-background-elevated: #334155;

    --color-text-primary: #f1f5f9;
    --color-text-secondary: #cbd5e1;
    --color-text-tertiary: #94a3b8;

    --color-border-default: #334155;
    --color-border-strong: #475569;
  }
}
```

#### Spacing Presets
```css
/* Compact spacing preset */
[data-spacing="compact"] {
  --spacing-xs: 0.125rem;
  --spacing-sm: 0.25rem;
  --spacing-md: 0.5rem;
  --spacing-lg: 0.75rem;
  --spacing-xl: 1rem;
  --spacing-2xl: 1.5rem;
  --spacing-3xl: 2rem;
}

/* Spacious spacing preset */
[data-spacing="spacious"] {
  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  --spacing-md: 1.5rem;
  --spacing-lg: 2.5rem;
  --spacing-xl: 4rem;
  --spacing-2xl: 6rem;
  --spacing-3xl: 8rem;
}
```

### Usage in Components

```jsx
// Before (inline styles)
<button style={{ backgroundColor: '#8bba9c', padding: '1rem 2rem' }}>
  Click Me
</button>

// After (CSS variables)
<button className="btn-primary">
  Click Me
</button>

/* CSS */
.btn-primary {
  background-color: var(--color-interactive-default);
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  font-family: var(--font-family-body);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  transition: all var(--transition-base);
}

.btn-primary:hover {
  background-color: var(--color-interactive-hover);
}
```

---

## Database Schema

### Table: `themes`
Stores global theme configurations

```sql
CREATE TABLE themes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Theme configuration (JSON)
  tokens JSONB NOT NULL,

  -- Metadata
  is_active BOOLEAN DEFAULT false,
  is_system_theme BOOLEAN DEFAULT false,
  created_by INTEGER REFERENCES admin_users(id),
  updated_by INTEGER REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Version control
  version INTEGER DEFAULT 1,
  parent_theme_id INTEGER REFERENCES themes(id),

  -- Preview
  thumbnail_url VARCHAR(500),

  CONSTRAINT one_active_theme CHECK (
    NOT is_active OR (
      SELECT COUNT(*) FROM themes WHERE is_active = true AND id != themes.id
    ) = 0
  )
);

-- Indexes
CREATE INDEX idx_themes_active ON themes(is_active) WHERE is_active = true;
CREATE INDEX idx_themes_system ON themes(is_system_theme);
CREATE INDEX idx_themes_tokens ON themes USING GIN(tokens);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_themes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER themes_updated_at
BEFORE UPDATE ON themes
FOR EACH ROW
EXECUTE FUNCTION update_themes_updated_at();
```

### Table: `theme_presets`
Pre-built theme templates

```sql
CREATE TABLE theme_presets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- 'light', 'dark', 'seasonal', 'industry'

  -- Preset configuration
  tokens JSONB NOT NULL,

  -- Preview assets
  thumbnail_url VARCHAR(500),
  preview_url VARCHAR(500),

  -- Metadata
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  tags TEXT[],

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_theme_presets_category ON theme_presets(category);
CREATE INDEX idx_theme_presets_featured ON theme_presets(is_featured) WHERE is_featured = true;
```

### Table: `theme_history`
Audit log for theme changes

```sql
CREATE TABLE theme_history (
  id SERIAL PRIMARY KEY,
  theme_id INTEGER NOT NULL REFERENCES themes(id) ON DELETE CASCADE,

  -- Change details
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'activated', 'deactivated'
  previous_tokens JSONB,
  new_tokens JSONB,

  -- User tracking
  admin_user_id INTEGER REFERENCES admin_users(id),
  admin_user_email VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,

  -- Metadata
  change_summary TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_theme_history_theme ON theme_history(theme_id);
CREATE INDEX idx_theme_history_action ON theme_history(action);
CREATE INDEX idx_theme_history_date ON theme_history(created_at DESC);
```

### Table: `font_library`
Available font families

```sql
CREATE TABLE font_library (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,

  -- Font source
  source VARCHAR(50) NOT NULL, -- 'google', 'adobe', 'custom', 'system'
  font_url VARCHAR(500),

  -- Font properties
  category VARCHAR(50), -- 'serif', 'sans-serif', 'display', 'handwriting', 'monospace'
  weights INTEGER[], -- [300, 400, 500, 600, 700]
  styles VARCHAR[], -- ['normal', 'italic']

  -- Metadata
  is_system_font BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  preview_text TEXT DEFAULT 'The quick brown fox jumps over the lazy dog',

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_font_library_category ON font_library(category);
CREATE INDEX idx_font_library_source ON font_library(source);

-- Insert system fonts
INSERT INTO font_library (name, display_name, source, category, weights, styles, is_system_font) VALUES
('system-ui', 'System UI', 'system', 'sans-serif', ARRAY[400, 500, 600, 700], ARRAY['normal'], true),
('playfair-display', 'Playfair Display', 'google', 'serif', ARRAY[400, 500, 600, 700, 800], ARRAY['normal', 'italic'], true),
('inter', 'Inter', 'google', 'sans-serif', ARRAY[300, 400, 500, 600, 700, 800], ARRAY['normal'], true);
```

### Example Theme JSON Structure

```json
{
  "version": "1.0.0",
  "name": "luxia-default",
  "metadata": {
    "displayName": "Luxia Default",
    "description": "Default Luxia brand theme",
    "author": "Luxia Team",
    "category": "light"
  },
  "tokens": {
    "color": {
      "brand": {
        "primary": "#8bba9c",
        "secondary": "#e8c7c8",
        "accent": "#0f172a"
      },
      "semantic": {
        "background": {
          "primary": "#ffffff",
          "secondary": "#f9fafb",
          "elevated": "#ffffff"
        },
        "text": {
          "primary": "#111827",
          "secondary": "#4b5563",
          "tertiary": "#9ca3af"
        }
      }
    },
    "typography": {
      "fontFamily": {
        "display": "'Playfair Display', serif",
        "body": "'Inter', sans-serif"
      },
      "scale": {
        "base": "16px",
        "ratio": 1.25
      }
    },
    "spacing": {
      "preset": "normal",
      "scale": [0.25, 0.5, 1, 1.5, 2, 3, 4, 6, 8]
    },
    "borders": {
      "radius": {
        "default": "0.5rem",
        "large": "1rem"
      }
    },
    "shadows": {
      "enabled": true,
      "preset": "default"
    }
  }
}
```

---

## Backend API Design

### RESTful Endpoints

#### Theme Management

##### `GET /api/admin/themes`
List all themes

**Request:**
```http
GET /api/admin/themes?include_inactive=false
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "themes": [
      {
        "id": 1,
        "name": "luxia-default",
        "displayName": "Luxia Default",
        "description": "Default brand theme",
        "isActive": true,
        "isSystemTheme": true,
        "thumbnailUrl": "/uploads/themes/luxia-default-thumb.jpg",
        "createdAt": "2025-01-15T10:00:00Z",
        "updatedAt": "2025-01-15T10:00:00Z",
        "version": 1
      }
    ],
    "activeTheme": {
      "id": 1,
      "name": "luxia-default"
    }
  }
}
```

##### `GET /api/admin/themes/:id`
Get theme details with full token configuration

**Response:**
```json
{
  "success": true,
  "data": {
    "theme": {
      "id": 1,
      "name": "luxia-default",
      "displayName": "Luxia Default",
      "tokens": { /* full token JSON */ },
      "css": "/* generated CSS custom properties */",
      "version": 1,
      "parentThemeId": null
    }
  }
}
```

##### `GET /api/admin/themes/active`
Get currently active theme (public endpoint)

**Request:**
```http
GET /api/admin/themes/active
```

**Response:**
```json
{
  "success": true,
  "data": {
    "theme": {
      "name": "luxia-default",
      "tokens": { /* full tokens */ },
      "css": "/* CSS custom properties */"
    }
  }
}
```

##### `POST /api/admin/themes`
Create new theme

**Request:**
```json
{
  "name": "my-custom-theme",
  "displayName": "My Custom Theme",
  "description": "Custom theme for seasonal promotion",
  "tokens": { /* design tokens JSON */ },
  "parentThemeId": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "theme": {
      "id": 5,
      "name": "my-custom-theme",
      "displayName": "My Custom Theme"
    }
  },
  "message": "Theme created successfully"
}
```

##### `PUT /api/admin/themes/:id`
Update theme configuration

**Request:**
```json
{
  "displayName": "Updated Name",
  "tokens": { /* updated tokens */ }
}
```

##### `PATCH /api/admin/themes/:id/activate`
Set theme as active

**Request:**
```http
PATCH /api/admin/themes/5/activate
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Theme 'my-custom-theme' activated successfully",
  "data": {
    "previousTheme": "luxia-default",
    "activeTheme": "my-custom-theme"
  }
}
```

##### `DELETE /api/admin/themes/:id`
Delete theme (cannot delete active or system themes)

#### Theme Presets

##### `GET /api/admin/themes/presets`
List pre-built theme templates

**Response:**
```json
{
  "success": true,
  "data": {
    "presets": [
      {
        "id": 1,
        "name": "minimalist-light",
        "displayName": "Minimalist Light",
        "category": "light",
        "thumbnailUrl": "/assets/presets/minimalist-light.jpg",
        "isFeatured": true
      }
    ],
    "categories": ["light", "dark", "seasonal", "industry"]
  }
}
```

##### `POST /api/admin/themes/presets/:id/apply`
Create theme from preset

**Request:**
```json
{
  "name": "my-theme-from-preset",
  "displayName": "My Theme",
  "customizations": {
    "color.brand.primary": "#ff6b6b"
  }
}
```

#### Font Library

##### `GET /api/admin/fonts`
List available fonts

**Response:**
```json
{
  "success": true,
  "data": {
    "fonts": [
      {
        "id": 1,
        "name": "inter",
        "displayName": "Inter",
        "source": "google",
        "category": "sans-serif",
        "weights": [300, 400, 500, 600, 700],
        "styles": ["normal", "italic"],
        "previewText": "The quick brown fox"
      }
    ]
  }
}
```

#### Theme History

##### `GET /api/admin/themes/:id/history`
Get theme change history

**Response:**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": 42,
        "action": "updated",
        "changeSummary": "Updated primary color from #8bba9c to #10b981",
        "adminUserEmail": "admin@luxia.com",
        "createdAt": "2025-10-31T14:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 42
    }
  }
}
```

### Service Layer

#### `themeService.ts`

```typescript
import { Pool } from 'pg';
import { pool } from '../db/client';

export interface Theme {
  id: number;
  name: string;
  displayName: string;
  description?: string;
  tokens: Record<string, any>;
  isActive: boolean;
  isSystemTheme: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateThemeInput {
  name: string;
  displayName: string;
  description?: string;
  tokens: Record<string, any>;
  parentThemeId?: number;
}

export class ThemeService {
  /**
   * Get all themes
   */
  async getAllThemes(includeInactive: boolean = false): Promise<Theme[]> {
    const query = `
      SELECT id, name, display_name, description, tokens,
             is_active, is_system_theme, version,
             created_at, updated_at, thumbnail_url
      FROM themes
      ${!includeInactive ? 'WHERE is_active = true' : ''}
      ORDER BY is_active DESC, created_at DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Get active theme
   */
  async getActiveTheme(): Promise<Theme | null> {
    const query = `
      SELECT id, name, display_name, tokens, version
      FROM themes
      WHERE is_active = true
      LIMIT 1
    `;

    const result = await pool.query(query);
    return result.rows[0] || null;
  }

  /**
   * Get theme by ID
   */
  async getThemeById(id: number): Promise<Theme | null> {
    const query = `
      SELECT * FROM themes WHERE id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Create new theme
   */
  async createTheme(input: CreateThemeInput, adminUserId: number): Promise<Theme> {
    // Validate tokens
    this.validateTokens(input.tokens);

    const query = `
      INSERT INTO themes (
        name, display_name, description, tokens,
        created_by, updated_by, version
      )
      VALUES ($1, $2, $3, $4, $5, $5, 1)
      RETURNING *
    `;

    const result = await pool.query(query, [
      input.name,
      input.displayName,
      input.description,
      JSON.stringify(input.tokens),
      adminUserId
    ]);

    // Log history
    await this.logThemeHistory(
      result.rows[0].id,
      'created',
      null,
      input.tokens,
      adminUserId
    );

    return result.rows[0];
  }

  /**
   * Update theme
   */
  async updateTheme(
    id: number,
    updates: Partial<CreateThemeInput>,
    adminUserId: number
  ): Promise<Theme> {
    const theme = await this.getThemeById(id);
    if (!theme) {
      throw new Error('Theme not found');
    }

    if (theme.isSystemTheme) {
      throw new Error('Cannot modify system themes');
    }

    // Validate tokens if provided
    if (updates.tokens) {
      this.validateTokens(updates.tokens);
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.displayName) {
      fields.push(`display_name = $${paramIndex++}`);
      values.push(updates.displayName);
    }

    if (updates.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }

    if (updates.tokens) {
      fields.push(`tokens = $${paramIndex++}`);
      values.push(JSON.stringify(updates.tokens));

      fields.push(`version = version + 1`);
    }

    fields.push(`updated_by = $${paramIndex++}`);
    values.push(adminUserId);

    values.push(id);

    const query = `
      UPDATE themes
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    // Log history
    if (updates.tokens) {
      await this.logThemeHistory(
        id,
        'updated',
        theme.tokens,
        updates.tokens,
        adminUserId
      );
    }

    return result.rows[0];
  }

  /**
   * Activate theme
   */
  async activateTheme(id: number, adminUserId: number): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Deactivate current theme
      await client.query('UPDATE themes SET is_active = false WHERE is_active = true');

      // Activate new theme
      await client.query('UPDATE themes SET is_active = true WHERE id = $1', [id]);

      // Log history
      await this.logThemeHistory(id, 'activated', null, null, adminUserId);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete theme
   */
  async deleteTheme(id: number): Promise<void> {
    const theme = await this.getThemeById(id);

    if (!theme) {
      throw new Error('Theme not found');
    }

    if (theme.isSystemTheme) {
      throw new Error('Cannot delete system themes');
    }

    if (theme.isActive) {
      throw new Error('Cannot delete active theme. Please activate another theme first.');
    }

    await pool.query('DELETE FROM themes WHERE id = $1', [id]);
  }

  /**
   * Generate CSS from tokens
   */
  generateCSS(tokens: Record<string, any>): string {
    const cssVars: string[] = [':root {'];

    const flatten = (obj: Record<string, any>, prefix: string = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const cssKey = prefix ? `${prefix}-${key}` : key;

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          if ('value' in value) {
            // Design token format
            cssVars.push(`  --${cssKey}: ${value.value};`);
          } else {
            // Nested object
            flatten(value, cssKey);
          }
        } else if (typeof value === 'string') {
          cssVars.push(`  --${cssKey}: ${value};`);
        }
      }
    };

    flatten(tokens);
    cssVars.push('}');

    return cssVars.join('\n');
  }

  /**
   * Validate token structure
   */
  private validateTokens(tokens: Record<string, any>): void {
    // Basic validation
    if (!tokens || typeof tokens !== 'object') {
      throw new Error('Invalid token structure');
    }

    // Check for required categories
    const requiredCategories = ['color', 'typography', 'spacing'];
    for (const category of requiredCategories) {
      if (!tokens[category]) {
        throw new Error(`Missing required token category: ${category}`);
      }
    }
  }

  /**
   * Log theme history
   */
  private async logThemeHistory(
    themeId: number,
    action: string,
    previousTokens: Record<string, any> | null,
    newTokens: Record<string, any> | null,
    adminUserId: number
  ): Promise<void> {
    const query = `
      INSERT INTO theme_history (
        theme_id, action, previous_tokens, new_tokens, admin_user_id
      )
      VALUES ($1, $2, $3, $4, $5)
    `;

    await pool.query(query, [
      themeId,
      action,
      previousTokens ? JSON.stringify(previousTokens) : null,
      newTokens ? JSON.stringify(newTokens) : null,
      adminUserId
    ]);
  }
}

export const themeService = new ThemeService();
```

---

## Frontend Implementation

### Theme Provider

#### `ThemeProvider.tsx`

```typescript
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getActiveTheme, type Theme } from '../api/themes';

interface ThemeContextValue {
  theme: Theme | null;
  isLoading: boolean;
  error: Error | null;
  themeMode: 'light' | 'dark' | 'system';
  spacingPreset: 'compact' | 'normal' | 'spacious';
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  setSpacingPreset: (preset: 'compact' | 'normal' | 'spacious') => void;
  refreshTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('theme-mode') as any) || 'system';
  });
  const [spacingPreset, setSpacingPreset] = useState<'compact' | 'normal' | 'spacious'>(() => {
    return (localStorage.getItem('spacing-preset') as any) || 'normal';
  });

  // Fetch active theme
  const { data: theme, isLoading, error } = useQuery({
    queryKey: ['active-theme'],
    queryFn: getActiveTheme,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Apply theme CSS to document
  useEffect(() => {
    if (!theme) return;

    // Inject CSS custom properties
    const styleId = 'theme-variables';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = theme.css || generateCSSFromTokens(theme.tokens);
  }, [theme]);

  // Apply theme mode
  useEffect(() => {
    const root = document.documentElement;

    if (themeMode === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', themeMode);
    }

    localStorage.setItem('theme-mode', themeMode);
  }, [themeMode]);

  // Apply spacing preset
  useEffect(() => {
    document.documentElement.setAttribute('data-spacing', spacingPreset);
    localStorage.setItem('spacing-preset', spacingPreset);
  }, [spacingPreset]);

  // Listen for system theme changes
  useEffect(() => {
    if (themeMode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // System theme changed, re-render components
      queryClient.invalidateQueries({ queryKey: ['active-theme'] });
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode, queryClient]);

  const refreshTheme = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['active-theme'] });
  }, [queryClient]);

  const value: ThemeContextValue = {
    theme: theme || null,
    isLoading,
    error: error as Error | null,
    themeMode,
    spacingPreset,
    setThemeMode,
    setSpacingPreset,
    refreshTheme
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Helper function to generate CSS from design tokens
function generateCSSFromTokens(tokens: Record<string, any>): string {
  const cssVars: string[] = [':root {'];

  const flatten = (obj: Record<string, any>, prefix: string = '') => {
    for (const [key, value] of Object.entries(obj)) {
      const cssKey = prefix ? `${prefix}-${key}` : key;

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        if ('value' in value) {
          cssVars.push(`  --${cssKey}: ${value.value};`);
        } else {
          flatten(value, cssKey);
        }
      } else if (typeof value === 'string') {
        cssVars.push(`  --${cssKey}: ${value};`);
      }
    }
  };

  flatten(tokens);
  cssVars.push('}');

  return cssVars.join('\n');
}
```

### API Client

#### `api/themes.ts`

```typescript
import api from './client';

export interface Theme {
  id: number;
  name: string;
  displayName: string;
  description?: string;
  tokens: Record<string, any>;
  css?: string;
  isActive: boolean;
  isSystemTheme: boolean;
  version: number;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThemePreset {
  id: number;
  name: string;
  displayName: string;
  category: string;
  thumbnailUrl?: string;
  isFeatured: boolean;
}

export interface CreateThemeInput {
  name: string;
  displayName: string;
  description?: string;
  tokens: Record<string, any>;
  parentThemeId?: number;
}

/**
 * Get active theme
 */
export async function getActiveTheme(): Promise<Theme> {
  const response = await api.get('/admin/themes/active');
  return response.data.data.theme;
}

/**
 * Get all themes
 */
export async function getAllThemes(includeInactive: boolean = false): Promise<Theme[]> {
  const response = await api.get('/admin/themes', {
    params: { include_inactive: includeInactive }
  });
  return response.data.data.themes;
}

/**
 * Get theme by ID
 */
export async function getTheme(id: number): Promise<Theme> {
  const response = await api.get(`/admin/themes/${id}`);
  return response.data.data.theme;
}

/**
 * Create theme
 */
export async function createTheme(input: CreateThemeInput): Promise<Theme> {
  const response = await api.post('/admin/themes', input);
  return response.data.data.theme;
}

/**
 * Update theme
 */
export async function updateTheme(id: number, updates: Partial<CreateThemeInput>): Promise<Theme> {
  const response = await api.put(`/admin/themes/${id}`, updates);
  return response.data.data.theme;
}

/**
 * Activate theme
 */
export async function activateTheme(id: number): Promise<void> {
  await api.patch(`/admin/themes/${id}/activate`);
}

/**
 * Delete theme
 */
export async function deleteTheme(id: number): Promise<void> {
  await api.delete(`/admin/themes/${id}`);
}

/**
 * Get theme presets
 */
export async function getThemePresets(category?: string): Promise<ThemePreset[]> {
  const response = await api.get('/admin/themes/presets', {
    params: category ? { category } : undefined
  });
  return response.data.data.presets;
}

/**
 * Apply theme preset
 */
export async function applyThemePreset(
  presetId: number,
  customizations: { name: string; displayName: string }
): Promise<Theme> {
  const response = await api.post(`/admin/themes/presets/${presetId}/apply`, customizations);
  return response.data.data.theme;
}

/**
 * Get theme history
 */
export async function getThemeHistory(themeId: number, page: number = 1): Promise<any> {
  const response = await api.get(`/admin/themes/${themeId}/history`, {
    params: { page, limit: 20 }
  });
  return response.data.data;
}
```

---

## Admin UI/UX Design

### Theme Manager Dashboard

#### Layout Structure

```
┌────────────────────────────────────────────────────────────┐
│  Theme Manager                                   [+ Create] │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Active      │  │ My Themes   │  │ Presets     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Current Theme: Luxia Default                ✓ Active│  │
│  │  ┌────────┐                                          │  │
│  │  │Preview │  • Light Mode                            │  │
│  │  │ Image  │  • Created: Jan 15, 2025                 │  │
│  │  └────────┘  • Last Updated: Jan 15, 2025            │  │
│  │                                                        │  │
│  │  [Edit] [Duplicate] [View History]                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  My Custom Themes (3)                                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐          │
│  │ Summer 24  │  │ Holiday    │  │ Minimal    │          │
│  │ [Preview]  │  │ [Preview]  │  │ [Preview]  │          │
│  │            │  │            │  │            │          │
│  │ [Edit]     │  │ [Edit]     │  │ [Edit]     │          │
│  │ [Activate] │  │ [Activate] │  │ [Activate] │          │
│  └────────────┘  └────────────┘  └────────────┘          │
│                                                              │
│  Theme Presets (12)                          [View All →]   │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐          │
│  │ Minimalist │  │ Bold &     │  │ Elegant    │          │
│  │ Light      │  │ Bright     │  │ Dark       │          │
│  │ [Preview]  │  │ [Preview]  │  │ [Preview]  │          │
│  │ [Use This] │  │ [Use This] │  │ [Use This] │          │
│  └────────────┘  └────────────┘  └────────────┘          │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

### Theme Editor Interface

#### Visual Editor Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Edit Theme: Summer 2024                        [Save] [Preview] │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────┐  ┌────────────────────────────────────────┐ │
│  │ Settings Panel  │  │ Live Preview                           │ │
│  │                 │  │                                        │ │
│  │ ┌─────────────┐ │  │  ┌──────────────────────────────────┐ │ │
│  │ │🎨 Colors    │ │  │  │  Hero Section Preview            │ │ │
│  │ │📐 Typography│ │  │  │  ┌────────────┐                  │ │ │
│  │ │📏 Spacing   │ │  │  │  │ Logo Here  │  Luxury Products │ │ │
│  │ │🔲 Borders   │ │  │  │  └────────────┘  Nav Items       │ │ │
│  │ │🌓 Shadows   │ │  │  │                                  │ │ │
│  │ │🌈 Gradients │ │  │  │  Big Headline Text               │ │ │
│  │ └─────────────┘ │  │  │  Subheadline text here           │ │ │
│  │                 │  │  │                                  │ │ │
│  │ 🎨 Colors       │  │  │  [Primary Button] [Secondary]    │ │ │
│  │ ───────────     │  │  │                                  │ │ │
│  │ Brand Primary   │  │  └──────────────────────────────────┘ │ │
│  │ [#8bba9c] 🎨    │  │                                        │ │
│  │                 │  │  ┌──────────────────────────────────┐ │ │
│  │ Brand Secondary │  │  │  Product Cards                   │ │ │
│  │ [#e8c7c8] 🎨    │  │  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐    │ │ │
│  │                 │  │  │  │Img │ │Img │ │Img │ │Img │    │ │ │
│  │ Background      │  │  │  ├────┤ ├────┤ ├────┤ ├────┤    │ │ │
│  │ [#ffffff] 🎨    │  │  │  │Name│ │Name│ │Name│ │Name│    │ │ │
│  │                 │  │  │  │$99 │ │$79 │ │$89 │ │$99 │    │ │ │
│  │ Text Primary    │  │  │  └────┘ └────┘ └────┘ └────┘    │ │ │
│  │ [#111827] 🎨    │  │  └──────────────────────────────────┘ │ │
│  │                 │  │                                        │ │
│  └─────────────────┘  └────────────────────────────────────────┘ │
│                                                                    │
│  [← Back to Manager]                     [Discard] [Save Changes] │
└──────────────────────────────────────────────────────────────────┘
```

### Component Specifications

#### 1. Color Picker Component

```tsx
import { useState } from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  description?: string;
}

export function ColorPicker({ label, value, onChange, description }: ColorPickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-champagne">{label}</label>
      {description && (
        <p className="text-xs text-champagne/60">{description}</p>
      )}

      <div className="flex items-center gap-3">
        {/* Color Preview */}
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="h-10 w-10 rounded-lg border-2 border-white/20 shadow-md transition-transform hover:scale-110"
          style={{ backgroundColor: value }}
          aria-label="Open color picker"
        />

        {/* Hex Input */}
        <HexColorInput
          color={value}
          onChange={onChange}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-champagne focus:border-jade focus:outline-none"
          prefixed
        />
      </div>

      {/* Picker Popover */}
      {showPicker && (
        <div className="relative mt-2">
          <div className="rounded-lg border border-white/10 bg-midnight p-4 shadow-2xl">
            <HexColorPicker color={value} onChange={onChange} />

            {/* Quick Presets */}
            <div className="mt-4 grid grid-cols-8 gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onChange(preset)}
                  className="h-8 w-8 rounded border-2 border-white/20 hover:scale-110 transition-transform"
                  style={{ backgroundColor: preset }}
                  aria-label={`Select color ${preset}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const COLOR_PRESETS = [
  '#000000', '#ffffff', '#ef4444', '#f59e0b',
  '#10b981', '#3b82f6', '#8b5cf6', '#ec4899',
  '#6b7280', '#8bba9c', '#e8c7c8', '#0f172a'
];
```

#### 2. Font Family Selector

```tsx
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getFonts, type Font } from '../../api/fonts';

interface FontSelectorProps {
  label: string;
  value: string;
  onChange: (fontFamily: string) => void;
  category?: 'display' | 'body' | 'mono';
}

export function FontSelector({ label, value, onChange, category }: FontSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: fonts = [] } = useQuery({
    queryKey: ['fonts', category],
    queryFn: () => getFonts(category)
  });

  const filteredFonts = fonts.filter(font =>
    font.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-champagne">{label}</label>

      {/* Current Font Preview */}
      <div
        className="rounded-lg border border-white/10 bg-white/5 p-4"
        style={{ fontFamily: value }}
      >
        <p className="text-lg text-champagne">
          The quick brown fox jumps over the lazy dog
        </p>
        <p className="text-xs text-champagne/60 mt-2">
          Current: {value}
        </p>
      </div>

      {/* Font Search */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search fonts..."
        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-champagne placeholder:text-champagne/40 focus:border-jade focus:outline-none"
      />

      {/* Font List */}
      <div className="max-h-64 overflow-y-auto space-y-2 rounded-lg border border-white/10 bg-white/5 p-2">
        {filteredFonts.map((font) => (
          <button
            key={font.id}
            type="button"
            onClick={() => onChange(font.value)}
            className={`w-full rounded-lg p-3 text-left transition-colors ${
              value === font.value
                ? 'bg-jade/20 border-2 border-jade'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            <div style={{ fontFamily: font.value }}>
              <p className="font-medium text-champagne">{font.displayName}</p>
              <p className="text-sm text-champagne/60">
                {font.previewText || 'The quick brown fox'}
              </p>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-champagne/40">
              <span>{font.category}</span>
              <span>•</span>
              <span>{font.source}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

#### 3. Spacing Preset Selector

```tsx
interface SpacingPresetProps {
  value: 'compact' | 'normal' | 'spacious';
  onChange: (preset: 'compact' | 'normal' | 'spacious') => void;
}

export function SpacingPresetSelector({ value, onChange }: SpacingPresetProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-champagne">Spacing Preset</label>
      <p className="text-xs text-champagne/60">
        Choose the overall spacing density for your site
      </p>

      <div className="grid grid-cols-3 gap-3">
        {/* Compact */}
        <button
          type="button"
          onClick={() => onChange('compact')}
          className={`rounded-lg border-2 p-4 transition-all ${
            value === 'compact'
              ? 'border-jade bg-jade/10'
              : 'border-white/10 bg-white/5 hover:bg-white/10'
          }`}
        >
          <div className="space-y-1">
            {/* Visual representation */}
            <div className="h-2 bg-jade/40 rounded" />
            <div className="h-2 bg-jade/40 rounded" />
            <div className="h-2 bg-jade/40 rounded" />
          </div>
          <p className="mt-3 text-sm font-medium text-champagne">Compact</p>
          <p className="text-xs text-champagne/60">Dense layout</p>
        </button>

        {/* Normal */}
        <button
          type="button"
          onClick={() => onChange('normal')}
          className={`rounded-lg border-2 p-4 transition-all ${
            value === 'normal'
              ? 'border-jade bg-jade/10'
              : 'border-white/10 bg-white/5 hover:bg-white/10'
          }`}
        >
          <div className="space-y-2">
            <div className="h-2 bg-jade/40 rounded" />
            <div className="h-2 bg-jade/40 rounded" />
            <div className="h-2 bg-jade/40 rounded" />
          </div>
          <p className="mt-3 text-sm font-medium text-champagne">Normal</p>
          <p className="text-xs text-champagne/60">Balanced</p>
        </button>

        {/* Spacious */}
        <button
          type="button"
          onClick={() => onChange('spacious')}
          className={`rounded-lg border-2 p-4 transition-all ${
            value === 'spacious'
              ? 'border-jade bg-jade/10'
              : 'border-white/10 bg-white/5 hover:bg-white/10'
          }`}
        >
          <div className="space-y-3">
            <div className="h-2 bg-jade/40 rounded" />
            <div className="h-2 bg-jade/40 rounded" />
            <div className="h-2 bg-jade/40 rounded" />
          </div>
          <p className="mt-3 text-sm font-medium text-champagne">Spacious</p>
          <p className="text-xs text-champagne/60">Open layout</p>
        </button>
      </div>
    </div>
  );
}
```

#### 4. Gradient Builder

```tsx
import { useState } from 'react';

interface GradientBuilderProps {
  value: string;
  onChange: (gradient: string) => void;
}

export function GradientBuilder({ value, onChange }: GradientBuilderProps) {
  const [angle, setAngle] = useState(135);
  const [color1, setColor1] = useState('#8bba9c');
  const [color2, setColor2] = useState('#e8c7c8');
  const [type, setType] = useState<'linear' | 'radial'>('linear');

  useEffect(() => {
    const gradient = type === 'linear'
      ? `linear-gradient(${angle}deg, ${color1} 0%, ${color2} 100%)`
      : `radial-gradient(circle, ${color1} 0%, ${color2} 100%)`;
    onChange(gradient);
  }, [angle, color1, color2, type, onChange]);

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-champagne">Gradient</label>

      {/* Preview */}
      <div
        className="h-24 rounded-lg border border-white/10"
        style={{ background: value }}
      />

      {/* Type Selector */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType('linear')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            type === 'linear'
              ? 'bg-jade text-midnight'
              : 'bg-white/5 text-champagne hover:bg-white/10'
          }`}
        >
          Linear
        </button>
        <button
          type="button"
          onClick={() => setType('radial')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            type === 'radial'
              ? 'bg-jade text-midnight'
              : 'bg-white/5 text-champagne hover:bg-white/10'
          }`}
        >
          Radial
        </button>
      </div>

      {/* Angle (Linear only) */}
      {type === 'linear' && (
        <div>
          <label className="text-xs text-champagne/60">Angle: {angle}°</label>
          <input
            type="range"
            min="0"
            max="360"
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
            className="w-full mt-2"
          />
        </div>
      )}

      {/* Color Stops */}
      <div className="grid grid-cols-2 gap-4">
        <ColorPicker
          label="Start Color"
          value={color1}
          onChange={setColor1}
        />
        <ColorPicker
          label="End Color"
          value={color2}
          onChange={setColor2}
        />
      </div>

      {/* Preset Gradients */}
      <div>
        <p className="text-xs text-champagne/60 mb-2">Presets</p>
        <div className="grid grid-cols-4 gap-2">
          {GRADIENT_PRESETS.map((preset, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onChange(preset.value)}
              className="h-12 rounded-lg border border-white/10 hover:scale-105 transition-transform"
              style={{ background: preset.value }}
              aria-label={preset.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const GRADIENT_PRESETS = [
  { name: 'Brand', value: 'linear-gradient(135deg, #8bba9c 0%, #e8c7c8 100%)' },
  { name: 'Sunrise', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: 'Ocean', value: 'linear-gradient(135deg, #2e3192 0%, #1bffff 100%)' },
  { name: 'Sunset', value: 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)' }
];
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Goal:** Establish core infrastructure

**Tasks:**
1. ✅ Database schema implementation
   - Create `themes`, `theme_presets`, `theme_history`, `font_library` tables
   - Add indexes and constraints
   - Seed default theme and presets

2. ✅ Backend API development
   - Implement `ThemeService` class
   - Create REST endpoints
   - Add validation middleware
   - Write unit tests

3. ✅ Design token structure
   - Define JSON schema
   - Create default token set
   - Document token categories

**Deliverables:**
- Working API endpoints
- Database with seed data
- API documentation

### Phase 2: Theme Provider & CSS System (Week 3)
**Goal:** Frontend theme infrastructure

**Tasks:**
1. ✅ ThemeProvider implementation
   - React Context for theme state
   - CSS variable injection
   - Theme caching

2. ✅ CSS custom properties generation
   - Token-to-CSS converter
   - Dark mode support
   - Spacing presets

3. ✅ Theme fetching and caching
   - React Query integration
   - SSR considerations

**Deliverables:**
- Working ThemeProvider
- CSS variable system
- Theme switching functionality

### Phase 3: Admin UI - Basic Editor (Week 4-5)
**Goal:** Functional theme editor

**Tasks:**
1. ✅ Theme Manager dashboard
   - List all themes
   - Theme cards with preview
   - Activate/deactivate

2. ✅ Color editor
   - Color picker component
   - Brand colors section
   - Semantic colors

3. ✅ Typography editor
   - Font family selector
   - Font size scale
   - Font weight options

**Deliverables:**
- Theme manager page
- Basic theme editor
- Color and typography controls

### Phase 4: Advanced Styling Features (Week 6)
**Goal:** Complete styling capabilities

**Tasks:**
1. ✅ Spacing preset editor
   - Compact/Normal/Spacious options
   - Visual spacing scale

2. ✅ Border & shadow controls
   - Border radius selector
   - Shadow presets
   - Custom shadow builder

3. ✅ Gradient builder
   - Linear and radial gradients
   - Multi-stop gradients
   - Preset library

**Deliverables:**
- Full-featured theme editor
- Advanced styling controls
- Gradient builder

### Phase 5: Theme Presets & Templates (Week 7)
**Goal:** Pre-built themes

**Tasks:**
1. ✅ Preset library
   - 10+ pre-built themes
   - Preview thumbnails
   - Category organization

2. ✅ Theme import/export
   - JSON export
   - JSON import with validation
   - Theme duplication

3. ✅ "Apply Preset" workflow
   - Select preset
   - Customize before applying
   - Create from preset

**Deliverables:**
- Theme preset library
- Import/export functionality
- 10+ production-ready presets

### Phase 6: Live Preview & Polish (Week 8)
**Goal:** Enhanced UX

**Tasks:**
1. ✅ Live preview panel
   - Real-time theme changes
   - Component showcase
   - Responsive preview

2. ✅ Theme history
   - Version tracking
   - Rollback functionality
   - Change diff view

3. ✅ Performance optimization
   - CSS caching
   - Lazy loading
   - Bundle size optimization

**Deliverables:**
- Live preview system
- Theme versioning
- Optimized performance

### Phase 7: Migration & Rollout (Week 9)
**Goal:** Production deployment

**Tasks:**
1. ✅ Migration script
   - Convert existing blocks to use CSS variables
   - Create default theme from current styles
   - Backup existing data

2. ✅ Documentation
   - Admin user guide
   - Developer documentation
   - API reference

3. ✅ Testing
   - E2E tests
   - Visual regression tests
   - Performance tests

**Deliverables:**
- Migration completed
- Full documentation
- Production-ready system

---

## Migration Strategy

### Current State Analysis

**Existing Styling Approach:**
- Per-block inline styles
- Hardcoded Tailwind classes
- No centralized theme management

**Block Types Using Inline Styles:**
- Hero: backgroundColor, textColor, accentColor
- Features: 7 style properties
- Products: 5 style properties
- Testimonials: 6 style properties
- Newsletter: 6 style properties
- CTA: Complex button styling
- All blocks: Various color and spacing

### Migration Steps

#### Step 1: Create Default Theme from Current Styles
**Script:** `scripts/create-default-theme.ts`

```typescript
import { pool } from '../db/client';

export async function createDefaultTheme() {
  const defaultTokens = {
    color: {
      brand: {
        primary: '#8bba9c',   // Current jade
        secondary: '#e8c7c8', // Current blush
        accent: '#0f172a'     // Current midnight
      },
      semantic: {
        background: {
          primary: '#ffffff',
          secondary: '#f5f3e7'  // Current champagne
        },
        text: {
          primary: '#0f172a',   // Current midnight
          secondary: '#64748b'
        }
      }
    },
    typography: {
      fontFamily: {
        display: "'Playfair Display', serif",
        body: "'Inter', sans-serif"
      }
    },
    spacing: {
      preset: 'normal'
    }
  };

  await pool.query(`
    INSERT INTO themes (
      name, display_name, description, tokens, is_active, is_system_theme
    )
    VALUES ($1, $2, $3, $4, true, true)
    ON CONFLICT (name) DO NOTHING
  `, [
    'luxia-default',
    'Luxia Default',
    'Default Luxia brand theme',
    JSON.stringify(defaultTokens)
  ]);

  console.log('✅ Default theme created');
}
```

#### Step 2: Update Block Renderers to Use CSS Variables
**Before:**
```tsx
<section style={{ backgroundColor: content.style?.backgroundColor || '#fef9f3' }}>
```

**After:**
```tsx
<section className="bg-background-primary">
  {/* CSS variable: var(--color-background-primary) */}
</section>
```

#### Step 3: Add Fallback Support
During migration, support both old and new approaches:

```tsx
function FeaturesBlock({ content }: { content: any }) {
  const { style = {} } = content;

  // Use CSS variables if available, fallback to inline styles
  const backgroundColor = style?.backgroundColor
    ? { backgroundColor: style.backgroundColor }
    : {};

  return (
    <section
      className="py-16 md:py-20"
      style={backgroundColor}
    >
      {/* Content */}
    </section>
  );
}
```

#### Step 4: Gradual Rollout
1. Deploy theme system with fallback support
2. Create default theme
3. Update 1-2 block types per day
4. Monitor for issues
5. Complete migration over 1-2 weeks
6. Remove fallback code after 30 days

#### Step 5: Clean Up
Remove inline style props from block editors once migration is complete.

---

## Performance Considerations

### CSS Custom Properties Performance

**Benefits:**
- ✅ Browser-native, highly optimized
- ✅ No JavaScript overhead for styling
- ✅ Enables CSS caching
- ✅ Faster than inline styles
- ✅ Supports CSS containment

**Optimization Strategies:**

1. **Critical CSS Injection**
   ```tsx
   // Inject theme CSS in document <head>
   useEffect(() => {
     const style = document.createElement('style');
     style.textContent = themeCSS;
     document.head.appendChild(style);
     return () => document.head.removeChild(style);
   }, [themeCSS]);
   ```

2. **CSS Caching**
   ```typescript
   // Cache generated CSS
   const cssCache = new Map<string, string>();

   function getThemeCSS(themeId: number): string {
     if (cssCache.has(themeId)) {
       return cssCache.get(themeId)!;
     }
     const css = generateCSS(theme.tokens);
     cssCache.set(themeId, css);
     return css;
   }
   ```

3. **Minimize Repaints**
   - Batch CSS variable updates
   - Use `requestAnimationFrame` for theme switches
   - Apply `:root` changes in single transaction

4. **Bundle Size Optimization**
   - Tree-shake unused token categories
   - Lazy load theme editor components
   - Use dynamic imports for color pickers

### Database Performance

**Indexing Strategy:**
```sql
-- Active theme lookup (most frequent query)
CREATE INDEX idx_themes_active ON themes(is_active) WHERE is_active = true;

-- JSONB token search
CREATE INDEX idx_themes_tokens ON themes USING GIN(tokens);

-- History queries
CREATE INDEX idx_theme_history_date ON theme_history(created_at DESC);
```

**Query Optimization:**
- Cache active theme (5 min TTL)
- Use connection pooling
- Prepare common queries
- Limit history queries (max 100 records)

### Frontend Performance Targets

- **Theme Load Time:** < 100ms
- **Theme Switch Time:** < 300ms (with animation)
- **Editor Paint Time:** < 50ms per change
- **Bundle Size Impact:** < 50KB (gzipped)

---

## Testing Strategy

### Unit Tests

**Backend:**
```typescript
describe('ThemeService', () => {
  describe('validateTokens', () => {
    it('should accept valid token structure', () => {
      const tokens = {
        color: { brand: { primary: '#8bba9c' } },
        typography: { fontFamily: { body: 'Inter' } },
        spacing: { preset: 'normal' }
      };
      expect(() => themeService.validateTokens(tokens)).not.toThrow();
    });

    it('should reject missing required categories', () => {
      const tokens = { color: {} };
      expect(() => themeService.validateTokens(tokens)).toThrow();
    });
  });

  describe('generateCSS', () => {
    it('should convert tokens to CSS custom properties', () => {
      const tokens = {
        color: { brand: { primary: { value: '#8bba9c' } } }
      };
      const css = themeService.generateCSS(tokens);
      expect(css).toContain('--color-brand-primary: #8bba9c;');
    });
  });
});
```

**Frontend:**
```typescript
describe('ThemeProvider', () => {
  it('should inject CSS variables on mount', async () => {
    render(
      <ThemeProvider>
        <div data-testid="child" />
      </ThemeProvider>
    );

    await waitFor(() => {
      const style = document.getElementById('theme-variables');
      expect(style).toBeInTheDocument();
      expect(style?.textContent).toContain('--color-brand-primary');
    });
  });

  it('should update theme mode', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider
    });

    act(() => {
      result.current.setThemeMode('dark');
    });

    expect(result.current.themeMode).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
```

### Integration Tests

**Theme CRUD:**
```typescript
describe('Theme API', () => {
  it('should create, update, and activate theme', async () => {
    // Create
    const created = await createTheme({
      name: 'test-theme',
      displayName: 'Test',
      tokens: validTokens
    });
    expect(created.id).toBeDefined();

    // Update
    const updated = await updateTheme(created.id, {
      displayName: 'Updated Test'
    });
    expect(updated.displayName).toBe('Updated Test');

    // Activate
    await activateTheme(created.id);
    const active = await getActiveTheme();
    expect(active.id).toBe(created.id);
  });
});
```

### E2E Tests (Playwright)

```typescript
test('Admin can create and activate custom theme', async ({ page }) => {
  // Login
  await page.goto('/admin/login');
  await page.fill('[name="email"]', 'admin@luxia.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // Navigate to theme manager
  await page.goto('/admin/themes');
  await page.click('text=Create Theme');

  // Configure theme
  await page.fill('[name="displayName"]', 'My Custom Theme');
  await page.click('text=Colors');
  await page.fill('[data-testid="color-primary"]', '#ff6b6b');

  // Save
  await page.click('text=Save Changes');
  await expect(page.locator('text=Theme saved successfully')).toBeVisible();

  // Activate
  await page.click('text=Activate');
  await expect(page.locator('text=Theme activated')).toBeVisible();

  // Verify on storefront
  await page.goto('/');
  const primaryButton = page.locator('.btn-primary');
  const bgColor = await primaryButton.evaluate(
    el => window.getComputedStyle(el).backgroundColor
  );
  expect(bgColor).toBe('rgb(255, 107, 107)');
});
```

### Visual Regression Tests

Use Chromatic or Percy for visual diffs:

```typescript
test('Theme presets render correctly', async ({ page }) => {
  await page.goto('/admin/themes/presets');

  const presets = ['minimalist-light', 'bold-bright', 'elegant-dark'];

  for (const preset of presets) {
    await page.click(`[data-preset="${preset}"]`);
    await page.waitForTimeout(500); // Allow animations
    await expect(page).toHaveScreenshot(`preset-${preset}.png`);
  }
});
```

---

## Future Enhancements

### Phase 2 Features (Q2 2026)

1. **Advanced Color Management**
   - Color harmonies generator
   - Accessibility contrast checker (WCAG AAA)
   - Color blindness simulator
   - Palette extraction from images

2. **Typography Enhancements**
   - Variable font support
   - Font pairing suggestions
   - Responsive type scale
   - Line length optimization

3. **Theme Marketplace**
   - Buy/sell themes
   - Community ratings
   - Theme licensing
   - Auto-updates

4. **AI-Powered Theme Generation**
   - Brand analysis from logo
   - Competitor theme analysis
   - Auto-generate from industry
   - A/B testing suggestions

5. **Advanced Animations**
   - Motion presets
   - Page transition effects
   - Micro-interactions library
   - Animation timeline editor

6. **Multi-brand Support**
   - Multiple active themes
   - Theme scheduling (seasonal)
   - A/B testing themes
   - Geo-based themes

### Phase 3 Features (Q4 2026)

1. **Theme Analytics**
   - Conversion rate by theme
   - User engagement metrics
   - Heat maps
   - Session recordings

2. **Component-Level Theming**
   - Override global theme per block
   - Component variants
   - Conditional styling rules

3. **Design System Export**
   - Figma plugin
   - Sketch export
   - Style guide generator
   - Design token documentation

4. **Headless CMS Integration**
   - Contentful theme sync
   - Sanity.io integration
   - GraphQL schema

---

## Appendix

### Glossary

- **Design Token:** A key-value pair representing a design decision (e.g., color, spacing)
- **CSS Custom Property:** Browser-native CSS variable (e.g., `--color-primary`)
- **Semantic Naming:** Purpose-based naming (e.g., `--color-text-primary` vs `--color-gray-900`)
- **Token Alias:** Reference to another token (e.g., `{ value: "{color.brand.primary}" }`)
- **Theme Preset:** Pre-configured theme template
- **Spacing Scale:** Consistent spacing values (e.g., 0.25rem, 0.5rem, 1rem)

### References

1. **W3C Design Tokens Specification**
   - https://design-tokens.github.io/community-group/format/
   - Version 1.0.0 (October 2025)

2. **Style Dictionary Documentation**
   - https://amzn.github.io/style-dictionary/

3. **Shopify Theme Architecture**
   - https://shopify.dev/docs/storefronts/themes/architecture

4. **CSS Custom Properties Best Practices**
   - https://css-tricks.com/a-complete-guide-to-custom-properties/

5. **React Context Performance**
   - https://kentcdodds.com/blog/how-to-use-react-context-effectively

---

**Document End**

*For questions or clarifications, contact the development team.*
