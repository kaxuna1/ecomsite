---
name: frontend-developer-agent
description: Frontend specialist for React + TypeScript + Tailwind development, component creation, state management, and UI implementation. Use this skill when building React applications, creating UI components, implementing frontend features, or working with modern frontend technologies including TypeScript, Tailwind CSS, and state management solutions.
---

# Frontend Developer Agent

## Overview

This skill provides specialized guidance for frontend development using React, TypeScript, and Tailwind CSS. It encompasses component development, state management, API integration, routing, accessibility, and modern frontend best practices.

## Capabilities

This skill supports the following frontend development capabilities:

- **React Component Development** - Building functional components with proper TypeScript typing
- **Tailwind CSS Styling** - Implementing responsive, mobile-first designs using utility classes
- **Form Handling & Validation** - Creating forms with proper validation and error handling
- **API Integration** - Connecting to backends using React Query or SWR for data fetching
- **State Management** - Implementing state solutions (Context API, Zustand, Redux)
- **Routing** - Setting up and managing navigation with React Router
- **Accessibility** - Ensuring ARIA compliance and keyboard navigation support

## Implementation Approach

When working on frontend tasks, follow this systematic workflow:

### 1. Review Task Requirements
Start by understanding the task requirements and acceptance criteria. Identify what components need to be built, what functionality is required, and what the expected user experience should be.

### 2. Check Existing Component Library
Before creating new components, search the codebase for existing components that can be reused or extended. This maintains consistency and reduces code duplication.

### 3. Create/Update Components with Proper Typing
Develop components with strong TypeScript typing. Define interfaces for props, state, and any data structures. Avoid using `any` types.

### 4. Implement Responsive Design with Tailwind
Apply Tailwind CSS utility classes following a mobile-first approach. Ensure the design works across all screen sizes using responsive modifiers (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`).

### 5. Add Error Handling and Loading States
Implement proper error boundaries, error states, and loading indicators. Provide meaningful feedback to users during asynchronous operations.

### 6. Write Unit Tests
Create tests for components, hooks, and utility functions. Focus on testing behavior and user interactions rather than implementation details.

### 7. Document Props and Usage
Document component props using TypeScript interfaces with JSDoc comments. Include usage examples for complex components.

## Code Quality Standards

Maintain these standards throughout all frontend development:

### TypeScript
- Use proper TypeScript typing for all components, functions, and hooks
- Never use `any` type - use `unknown` or specific types instead
- Define interfaces for all props, state, and data structures
- Leverage TypeScript's type inference where appropriate

### Component Design
- Use descriptive names for components and props that clearly indicate purpose
- Keep components focused on a single responsibility
- Extract reusable logic into custom hooks
- Implement proper error boundaries for fault isolation

### Styling
- Follow mobile-first responsive design principles
- Use Tailwind utility classes consistently
- Extract repeated utility combinations into component classes when beneficial
- Ensure designs are responsive across all breakpoints

### Accessibility
- Use semantic HTML elements
- Include proper ARIA attributes where needed
- Ensure keyboard navigation works correctly
- Maintain sufficient color contrast ratios
- Provide alternative text for images and meaningful labels for form inputs

### Code Organization
- Co-locate related files (component, styles, tests, types)
- Use consistent file naming conventions
- Keep components small and focused
- Separate business logic from presentation logic
