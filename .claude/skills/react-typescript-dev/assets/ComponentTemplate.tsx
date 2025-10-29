import { memo } from 'react';

/**
 * Props for the ComponentTemplate component
 */
interface ComponentTemplateProps {
  /**
   * The title text to display
   */
  title: string;
  /**
   * Optional description text
   */
  description?: string;
  /**
   * Click handler for the action button
   */
  onAction?: () => void;
  /**
   * Whether the component is in a loading state
   */
  isLoading?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ComponentTemplate - Example component following React TypeScript best practices
 *
 * Features:
 * - TypeScript interface for props with JSDoc comments
 * - Optional props with default values
 * - Memoized to prevent unnecessary re-renders
 * - Tailwind CSS for styling
 * - Accessible HTML structure
 * - Loading and error states
 *
 * @example
 * ```tsx
 * <ComponentTemplate
 *   title="Welcome"
 *   description="This is an example component"
 *   onAction={() => console.log('Action clicked')}
 * />
 * ```
 */
function ComponentTemplate({
  title,
  description,
  onAction,
  isLoading = false,
  className = '',
}: ComponentTemplateProps) {
  return (
    <div
      className={`
        rounded-lg border border-gray-200 bg-white p-6 shadow-sm
        transition-shadow hover:shadow-md
        ${className}
      `.trim()}
    >
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {description && (
          <p className="mt-2 text-sm text-gray-600">{description}</p>
        )}
      </div>

      {/* Action Button */}
      {onAction && (
        <button
          onClick={onAction}
          disabled={isLoading}
          className="
            rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white
            transition-colors hover:bg-primary-700 focus:outline-none
            focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-50
          "
          type="button"
        >
          {isLoading ? 'Loading...' : 'Take Action'}
        </button>
      )}
    </div>
  );
}

// Export memoized component to prevent unnecessary re-renders
export default memo(ComponentTemplate);
