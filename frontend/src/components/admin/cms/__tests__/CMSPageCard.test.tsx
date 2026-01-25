import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../../test/utils';
import CMSPageCard from '../CMSPageCard';

const mockPage = {
  id: 1,
  title: 'About Us',
  slug: 'about-us',
  isPublished: true
};

describe('CMSPageCard', () => {
  const defaultProps = {
    ...mockPage,
    isExpanded: false,
    onToggleExpand: vi.fn(),
    onToggleStatus: vi.fn(),
    onDelete: vi.fn()
  };

  it('renders page title and slug', () => {
    render(<CMSPageCard {...defaultProps} />);

    expect(screen.getByText('About Us')).toBeInTheDocument();
    expect(screen.getByText('/about-us')).toBeInTheDocument();
  });

  it('shows Published badge when isPublished is true', () => {
    render(<CMSPageCard {...defaultProps} isPublished={true} />);

    expect(screen.getByText('Published')).toBeInTheDocument();
  });

  it('shows Draft badge when isPublished is false', () => {
    render(<CMSPageCard {...defaultProps} isPublished={false} />);

    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('shows Global Header badge for _global-header slug', () => {
    render(<CMSPageCard {...defaultProps} slug="_global-header" />);

    expect(screen.getByText('Global Header')).toBeInTheDocument();
  });

  it('shows System badge for other _ prefixed slugs', () => {
    render(<CMSPageCard {...defaultProps} slug="_system-page" />);

    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('renders kebab menu button', () => {
    render(<CMSPageCard {...defaultProps} />);

    expect(screen.getByTitle('Page actions')).toBeInTheDocument();
  });

  it('renders View Blocks toggle', () => {
    render(<CMSPageCard {...defaultProps} />);

    expect(screen.getByText('View Blocks')).toBeInTheDocument();
  });

  it('calls onToggleExpand when View Blocks is clicked', () => {
    const onToggleExpand = vi.fn();
    render(<CMSPageCard {...defaultProps} onToggleExpand={onToggleExpand} />);

    fireEvent.click(screen.getByText('View Blocks'));

    expect(onToggleExpand).toHaveBeenCalledTimes(1);
  });
});
