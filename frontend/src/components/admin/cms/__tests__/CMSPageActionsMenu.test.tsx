import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../../test/utils';
import CMSPageActionsMenu from '../CMSPageActionsMenu';

describe('CMSPageActionsMenu', () => {
  const defaultProps = {
    pageId: 1,
    slug: 'about-us',
    isPublished: true,
    onToggleStatus: vi.fn(),
    onDelete: vi.fn()
  };

  it('renders kebab menu button', () => {
    render(<CMSPageActionsMenu {...defaultProps} />);

    expect(screen.getByTitle('Page actions')).toBeInTheDocument();
  });

  it('opens menu when button is clicked', async () => {
    render(<CMSPageActionsMenu {...defaultProps} />);

    fireEvent.click(screen.getByTitle('Page actions'));

    await waitFor(() => {
      expect(screen.getByText('Inline Edit')).toBeInTheDocument();
      expect(screen.getByText('Advanced')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });

  it('shows View Live option when page is published', async () => {
    render(<CMSPageActionsMenu {...defaultProps} isPublished={true} />);

    fireEvent.click(screen.getByTitle('Page actions'));

    await waitFor(() => {
      expect(screen.getByText('View Live')).toBeInTheDocument();
    });
  });

  it('hides View Live option when page is draft', async () => {
    render(<CMSPageActionsMenu {...defaultProps} isPublished={false} />);

    fireEvent.click(screen.getByTitle('Page actions'));

    await waitFor(() => {
      expect(screen.queryByText('View Live')).not.toBeInTheDocument();
    });
  });

  it('shows Unpublish option when page is published', async () => {
    render(<CMSPageActionsMenu {...defaultProps} isPublished={true} />);

    fireEvent.click(screen.getByTitle('Page actions'));

    await waitFor(() => {
      expect(screen.getByText('Unpublish')).toBeInTheDocument();
    });
  });

  it('shows Publish option when page is draft', async () => {
    render(<CMSPageActionsMenu {...defaultProps} isPublished={false} />);

    fireEvent.click(screen.getByTitle('Page actions'));

    await waitFor(() => {
      expect(screen.getByText('Publish')).toBeInTheDocument();
    });
  });

  it('has correct links to edit pages', async () => {
    render(<CMSPageActionsMenu {...defaultProps} pageId={42} />);

    fireEvent.click(screen.getByTitle('Page actions'));

    await waitFor(() => {
      const inlineEditLink = screen.getByText('Inline Edit');
      const advancedLink = screen.getByText('Advanced');

      expect(inlineEditLink.closest('a')).toHaveAttribute('href', '/admin/cms/inline-edit/42');
      expect(advancedLink.closest('a')).toHaveAttribute('href', '/admin/cms/edit/42');
    });
  });

  it('calls onToggleStatus when publish/unpublish is clicked', async () => {
    const onToggleStatus = vi.fn();
    render(<CMSPageActionsMenu {...defaultProps} onToggleStatus={onToggleStatus} />);

    fireEvent.click(screen.getByTitle('Page actions'));

    await waitFor(() => {
      fireEvent.click(screen.getByText('Unpublish'));
    });

    expect(onToggleStatus).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when delete is clicked', async () => {
    const onDelete = vi.fn();
    render(<CMSPageActionsMenu {...defaultProps} onDelete={onDelete} />);

    fireEvent.click(screen.getByTitle('Page actions'));

    await waitFor(() => {
      fireEvent.click(screen.getByText('Delete'));
    });

    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
