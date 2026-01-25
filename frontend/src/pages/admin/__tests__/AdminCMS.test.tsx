import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '../../../test/utils';
import userEvent from '@testing-library/user-event';
import AdminCMS from '../AdminCMS';

// Mock the API module
vi.mock('../../../api/cmsAdmin', () => ({
  fetchCMSPages: vi.fn(),
  fetchPageBlocks: vi.fn(),
  fetchFooterSettings: vi.fn(),
  createCMSPageWithBlocks: vi.fn(),
  updateCMSPage: vi.fn(),
  deleteCMSPage: vi.fn(),
  updateFooterSettings: vi.fn(),
  createFooterTranslation: vi.fn()
}));

// Mock the AIPageBuilderModal component
vi.mock('../../../components/admin/AIPageBuilderModal', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="ai-page-builder-modal">
        <button onClick={onClose}>Close AI Builder</button>
      </div>
    ) : null
}));

// Mock FooterEditor
vi.mock('../../../components/cms/editors/FooterEditor', () => ({
  default: () => <div data-testid="footer-editor">Footer Editor Content</div>
}));

import {
  fetchCMSPages,
  fetchFooterSettings
} from '../../../api/cmsAdmin';

const mockPages = [
  {
    id: 1,
    title: 'Home Page',
    slug: 'home',
    isPublished: true,
    metaDescription: null,
    metaKeywords: null,
    publishedAt: '2024-01-01T00:00:00Z',
    createdBy: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: 2,
    title: 'About Us',
    slug: 'about-us',
    isPublished: false,
    metaDescription: null,
    metaKeywords: null,
    publishedAt: null,
    createdBy: 1,
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z'
  },
  {
    id: 3,
    title: 'Site Header',
    slug: '_global-header',
    isPublished: true,
    metaDescription: null,
    metaKeywords: null,
    publishedAt: '2024-01-01T00:00:00Z',
    createdBy: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z'
  }
];

const mockFooterSettings = {
  brandName: 'Luxia',
  brandTagline: 'Luxury Haircare',
  footerColumns: [],
  contactInfo: {},
  socialLinks: [],
  newsletterTitle: '',
  newsletterDescription: '',
  newsletterPlaceholder: '',
  newsletterButtonText: '',
  copyrightText: '',
  bottomLinks: []
};

describe('AdminCMS', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetchCMSPages as ReturnType<typeof vi.fn>).mockResolvedValue(mockPages);
    (fetchFooterSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockFooterSettings);
  });

  describe('Page Rendering', () => {
    it('renders the CMS Management title', async () => {
      render(<AdminCMS />);

      await waitFor(() => {
        expect(screen.getByText('CMS Management')).toBeInTheDocument();
      });
    });

    it('renders page statistics', async () => {
      render(<AdminCMS />);

      await waitFor(() => {
        // Stats format: "3 pages · 2 published · 1 drafts"
        expect(screen.getByText(/3 pages/)).toBeInTheDocument();
        expect(screen.getByText(/2 published/)).toBeInTheDocument();
        expect(screen.getByText(/1 drafts/)).toBeInTheDocument();
      });
    });

    it('renders global action buttons', async () => {
      render(<AdminCMS />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Edit Footer/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /AI Page Builder/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /New Page/i })).toBeInTheDocument();
      });
    });

    it('renders all page cards', async () => {
      render(<AdminCMS />);

      await waitFor(() => {
        expect(screen.getByText('Home Page')).toBeInTheDocument();
        expect(screen.getByText('About Us')).toBeInTheDocument();
        expect(screen.getByText('Site Header')).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filtering', () => {
    it('renders search input', async () => {
      render(<AdminCMS />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search pages/i)).toBeInTheDocument();
      });
    });

    it('filters pages by search query', async () => {
      const user = userEvent.setup();
      render(<AdminCMS />);

      await waitFor(() => {
        expect(screen.getByText('Home Page')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search pages/i);
      await user.type(searchInput, 'About');

      await waitFor(() => {
        expect(screen.getByText('About Us')).toBeInTheDocument();
        expect(screen.queryByText('Home Page')).not.toBeInTheDocument();
      });
    });

    it('filters pages by status - published', async () => {
      const user = userEvent.setup();
      render(<AdminCMS />);

      await waitFor(() => {
        expect(screen.getByText('Home Page')).toBeInTheDocument();
      });

      const statusSelect = screen.getByTitle('Filter by status');
      await user.selectOptions(statusSelect, 'published');

      await waitFor(() => {
        expect(screen.getByText('Home Page')).toBeInTheDocument();
        expect(screen.getByText('Site Header')).toBeInTheDocument();
        expect(screen.queryByText('About Us')).not.toBeInTheDocument();
      });
    });

    it('filters pages by status - drafts', async () => {
      const user = userEvent.setup();
      render(<AdminCMS />);

      await waitFor(() => {
        expect(screen.getByText('Home Page')).toBeInTheDocument();
      });

      const statusSelect = screen.getByTitle('Filter by status');
      await user.selectOptions(statusSelect, 'draft');

      await waitFor(() => {
        expect(screen.getByText('About Us')).toBeInTheDocument();
        expect(screen.queryByText('Home Page')).not.toBeInTheDocument();
        expect(screen.queryByText('Site Header')).not.toBeInTheDocument();
      });
    });

    it('shows empty state when filters match no pages', async () => {
      const user = userEvent.setup();
      render(<AdminCMS />);

      await waitFor(() => {
        expect(screen.getByText('Home Page')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search pages/i);
      await user.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText('No pages match your filters.')).toBeInTheDocument();
        expect(screen.getByText('Clear filters')).toBeInTheDocument();
      });
    });
  });

  describe('Sorting', () => {
    it('renders sort dropdown', async () => {
      render(<AdminCMS />);

      await waitFor(() => {
        expect(screen.getByTitle('Sort pages')).toBeInTheDocument();
      });
    });

    it('sorts pages by title', async () => {
      const user = userEvent.setup();
      render(<AdminCMS />);

      await waitFor(() => {
        expect(screen.getByText('Home Page')).toBeInTheDocument();
      });

      const sortSelect = screen.getByTitle('Sort pages');
      await user.selectOptions(sortSelect, 'title');

      // After sorting by title A-Z, "About Us" should come first
      await waitFor(() => {
        const pageCards = screen.getAllByText(/(Home Page|About Us|Site Header)/);
        expect(pageCards[0]).toHaveTextContent('About Us');
      });
    });
  });

  describe('Modals', () => {
    it('opens New Page modal when clicking New Page button', async () => {
      const user = userEvent.setup();
      render(<AdminCMS />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /New Page/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /New Page/i }));

      await waitFor(() => {
        expect(screen.getByText('Create New Page')).toBeInTheDocument();
        expect(screen.getByText('Start with Template')).toBeInTheDocument();
      });
    });

    it('opens AI Page Builder modal when clicking AI Page Builder button', async () => {
      const user = userEvent.setup();
      render(<AdminCMS />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /AI Page Builder/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /AI Page Builder/i }));

      await waitFor(() => {
        expect(screen.getByTestId('ai-page-builder-modal')).toBeInTheDocument();
      });
    });

    it('opens Footer Editor when clicking Edit Footer button', async () => {
      const user = userEvent.setup();
      render(<AdminCMS />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Edit Footer/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Edit Footer/i }));

      await waitFor(() => {
        expect(screen.getByTestId('footer-editor')).toBeInTheDocument();
      });
    });
  });

  describe('Page Cards', () => {
    it('renders status badges correctly', async () => {
      render(<AdminCMS />);

      await waitFor(() => {
        // Draft badge should appear exactly once (About Us page)
        const draftBadges = screen.getAllByText('Draft');
        expect(draftBadges.length).toBe(1);
        
        // Stats line shows page counts which includes "published"
        expect(screen.getByText(/2 published/)).toBeInTheDocument();
      });
    });

    it('renders Global Header badge for system pages', async () => {
      render(<AdminCMS />);

      await waitFor(() => {
        // The badge should show "Global Header"
        expect(screen.getByText('Global Header')).toBeInTheDocument();
      });
    });

    it('renders kebab menu for each page', async () => {
      render(<AdminCMS />);

      await waitFor(() => {
        const menuButtons = screen.getAllByTitle('Page actions');
        expect(menuButtons.length).toBe(3);
      });
    });

    it('renders View Blocks toggle for each page', async () => {
      render(<AdminCMS />);

      await waitFor(() => {
        const viewBlocksButtons = screen.getAllByText('View Blocks');
        expect(viewBlocksButtons.length).toBe(3);
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner while fetching pages', async () => {
      let resolvePromise: (value: typeof mockPages) => void;
      (fetchCMSPages as ReturnType<typeof vi.fn>).mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
      );

      render(<AdminCMS />);

      // The loading spinner should be visible
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();

      // Resolve the promise
      resolvePromise!(mockPages);

      await waitFor(() => {
        expect(screen.getByText('Home Page')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no pages exist', async () => {
      (fetchCMSPages as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      render(<AdminCMS />);

      await waitFor(() => {
        expect(screen.getByText('No pages yet.')).toBeInTheDocument();
        expect(screen.getByText('Create your first page')).toBeInTheDocument();
      });
    });
  });
});
