import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../../test/utils';
import CMSPageBlocksPanel from '../CMSPageBlocksPanel';

// Mock the API module
vi.mock('../../../../api/cmsAdmin', () => ({
  fetchPageBlocks: vi.fn()
}));

import { fetchPageBlocks } from '../../../../api/cmsAdmin';

const mockBlocks = [
  {
    id: 1,
    pageId: 1,
    blockKey: 'hero-section',
    blockType: 'hero',
    displayOrder: 0,
    isEnabled: true,
    content: {},
    settings: {},
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    pageId: 1,
    blockKey: 'features-grid',
    blockType: 'features',
    displayOrder: 1,
    isEnabled: false,
    content: {},
    settings: {},
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

describe('CMSPageBlocksPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    pageId: 1,
    isExpanded: false,
    onToggle: vi.fn()
  };

  it('renders View Blocks button', () => {
    render(<CMSPageBlocksPanel {...defaultProps} />);

    expect(screen.getByText('View Blocks')).toBeInTheDocument();
  });

  it('calls onToggle when View Blocks is clicked', () => {
    const onToggle = vi.fn();
    render(<CMSPageBlocksPanel {...defaultProps} onToggle={onToggle} />);

    fireEvent.click(screen.getByText('View Blocks'));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('does NOT fetch blocks when collapsed', () => {
    render(<CMSPageBlocksPanel {...defaultProps} isExpanded={false} />);

    expect(fetchPageBlocks).not.toHaveBeenCalled();
  });

  it('fetches blocks when expanded', async () => {
    (fetchPageBlocks as ReturnType<typeof vi.fn>).mockResolvedValue(mockBlocks);

    render(<CMSPageBlocksPanel {...defaultProps} isExpanded={true} />);

    await waitFor(() => {
      expect(fetchPageBlocks).toHaveBeenCalledWith(1);
    });
  });

  it('displays block keys when expanded and loaded', async () => {
    (fetchPageBlocks as ReturnType<typeof vi.fn>).mockResolvedValue(mockBlocks);

    render(<CMSPageBlocksPanel {...defaultProps} isExpanded={true} />);

    await waitFor(() => {
      expect(screen.getByText('hero-section')).toBeInTheDocument();
      expect(screen.getByText('features-grid')).toBeInTheDocument();
    });
  });

  it('displays block types', async () => {
    (fetchPageBlocks as ReturnType<typeof vi.fn>).mockResolvedValue(mockBlocks);

    render(<CMSPageBlocksPanel {...defaultProps} isExpanded={true} />);

    await waitFor(() => {
      expect(screen.getByText('hero')).toBeInTheDocument();
      expect(screen.getByText('features')).toBeInTheDocument();
    });
  });

  it('shows Enabled badge for enabled blocks', async () => {
    (fetchPageBlocks as ReturnType<typeof vi.fn>).mockResolvedValue(mockBlocks);

    render(<CMSPageBlocksPanel {...defaultProps} isExpanded={true} />);

    await waitFor(() => {
      expect(screen.getByText('Enabled')).toBeInTheDocument();
    });
  });

  it('shows Disabled badge for disabled blocks', async () => {
    (fetchPageBlocks as ReturnType<typeof vi.fn>).mockResolvedValue(mockBlocks);

    render(<CMSPageBlocksPanel {...defaultProps} isExpanded={true} />);

    await waitFor(() => {
      expect(screen.getByText('Disabled')).toBeInTheDocument();
    });
  });

  it('shows empty state when no blocks', async () => {
    (fetchPageBlocks as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    render(<CMSPageBlocksPanel {...defaultProps} isExpanded={true} />);

    await waitFor(() => {
      expect(screen.getByText('No blocks in this page')).toBeInTheDocument();
    });
  });

  it('shows loading spinner while fetching', async () => {
    let resolvePromise: (value: typeof mockBlocks) => void;
    (fetchPageBlocks as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );

    render(<CMSPageBlocksPanel {...defaultProps} isExpanded={true} />);

    // The loading spinner should be visible
    await waitFor(() => {
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    // Resolve the promise to complete the test
    resolvePromise!(mockBlocks);
  });
});
