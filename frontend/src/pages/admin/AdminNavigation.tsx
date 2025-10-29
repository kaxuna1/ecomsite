import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  ChevronRightIcon,
  LinkIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  MinusCircleIcon
} from '@heroicons/react/24/outline';
import {
  fetchMenuLocations,
  fetchMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  reorderMenuItems,
  createMenuItemTranslation,
  fetchPageSuggestions
} from '../../api/navigation';
import { fetchCMSPages } from '../../api/cmsAdmin';
import type { MenuItem, CreateMenuItemPayload, UpdateMenuItemPayload, LinkType, PageSuggestion } from '../../types/navigation';

type Language = 'en' | 'ka';

interface MenuItemFormData {
  label: string;
  linkType: LinkType;
  linkUrl: string;
  cmsPageId: number | null;
  parentId: number | null;
  openInNewTab: boolean;
  isEnabled: boolean;
}

export default function AdminNavigation() {
  const queryClient = useQueryClient();
  const [selectedLocationId, setSelectedLocationId] = useState<number>(1); // Default to header (id: 1)
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [formData, setFormData] = useState<MenuItemFormData>({
    label: '',
    linkType: 'internal',
    linkUrl: '',
    cmsPageId: null,
    parentId: null,
    openInNewTab: false,
    isEnabled: true
  });

  // Fetch menu locations
  const { data: locations = [] } = useQuery({
    queryKey: ['navigation-locations'],
    queryFn: fetchMenuLocations
  });

  // Fetch menu items for selected location and language
  const { data: menuItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['navigation-items', selectedLocationId, selectedLanguage],
    queryFn: () => fetchMenuItems(selectedLocationId, selectedLanguage)
  });

  // Fetch CMS pages for dropdown
  const { data: cmsPages = [] } = useQuery({
    queryKey: ['cms-pages'],
    queryFn: fetchCMSPages
  });

  // Fetch page suggestions for autocomplete
  const { data: pageSuggestions = [] } = useQuery({
    queryKey: ['page-suggestions', selectedLanguage],
    queryFn: () => fetchPageSuggestions(selectedLanguage)
  });

  // Create menu item mutation
  const createMutation = useMutation({
    mutationFn: (payload: CreateMenuItemPayload) => createMenuItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navigation-items'] });
      queryClient.invalidateQueries({ queryKey: ['navigation-menu'] });
      toast.success('Menu item created successfully');
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create menu item');
    }
  });

  // Update menu item mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateMenuItemPayload }) =>
      updateMenuItem(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navigation-items'] });
      queryClient.invalidateQueries({ queryKey: ['navigation-menu'] });
      toast.success('Menu item updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update menu item');
    }
  });

  // Delete menu item mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteMenuItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navigation-items'] });
      queryClient.invalidateQueries({ queryKey: ['navigation-menu'] });
      toast.success('Menu item deleted successfully');
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete menu item');
    }
  });

  // Translation mutation
  const translationMutation = useMutation({
    mutationFn: ({ menuItemId, lang, label }: { menuItemId: number; lang: string; label: string }) =>
      createMenuItemTranslation(menuItemId, lang, { label }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navigation-items'] });
      queryClient.invalidateQueries({ queryKey: ['navigation-menu'] });
      toast.success('Translation saved successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save translation');
    }
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: reorderMenuItems,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navigation-items'] });
      queryClient.invalidateQueries({ queryKey: ['navigation-menu'] });
      toast.success('Menu items reordered successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reorder menu items');
    }
  });

  // Load selected item into form
  useEffect(() => {
    if (selectedItemId && !isCreatingNew) {
      const item = menuItems.find(m => m.id === selectedItemId);
      if (item) {
        setFormData({
          label: item.label,
          linkType: item.linkType,
          linkUrl: item.linkUrl || '',
          cmsPageId: item.cmsPageId,
          parentId: item.parentId,
          openInNewTab: item.openInNewTab,
          isEnabled: item.isEnabled
        });
      }
    }
  }, [selectedItemId, menuItems, isCreatingNew]);

  const resetFormData = () => {
    setFormData({
      label: '',
      linkType: 'internal',
      linkUrl: '',
      cmsPageId: null,
      parentId: null,
      openInNewTab: false,
      isEnabled: true
    });
  };

  const resetForm = () => {
    resetFormData();
    setSelectedItemId(null);
    setIsCreatingNew(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.label.trim()) {
      toast.error('Label is required');
      return;
    }

    if (formData.linkType === 'external' && !formData.linkUrl.trim()) {
      toast.error('URL is required for external links');
      return;
    }

    if (formData.linkType === 'internal' && !formData.linkUrl.trim()) {
      toast.error('URL is required for internal links');
      return;
    }

    if (formData.linkType === 'cms_page' && !formData.cmsPageId) {
      toast.error('CMS page is required');
      return;
    }

    if (isCreatingNew) {
      // Creating new item
      const payload: CreateMenuItemPayload = {
        locationId: selectedLocationId,
        label: formData.label,
        linkType: formData.linkType,
        linkUrl: formData.linkType === 'none' ? null : formData.linkUrl || null,
        cmsPageId: formData.linkType === 'cms_page' ? formData.cmsPageId : null,
        parentId: formData.parentId,
        openInNewTab: formData.openInNewTab,
        isEnabled: formData.isEnabled,
        displayOrder: menuItems.length
      };
      createMutation.mutate(payload);
    } else if (selectedItemId) {
      // Updating existing item
      if (selectedLanguage !== 'en') {
        // Save as translation for non-default language
        translationMutation.mutate({
          menuItemId: selectedItemId,
          lang: selectedLanguage,
          label: formData.label
        });
      } else {
        // Update the base item for default language
        const payload: UpdateMenuItemPayload = {
          label: formData.label,
          linkType: formData.linkType,
          linkUrl: formData.linkType === 'none' ? null : formData.linkUrl || null,
          cmsPageId: formData.linkType === 'cms_page' ? formData.cmsPageId : null,
          parentId: formData.parentId,
          openInNewTab: formData.openInNewTab,
          isEnabled: formData.isEnabled
        };
        updateMutation.mutate({ id: selectedItemId, payload });
      }
    }
  };

  const handleDelete = () => {
    if (!selectedItemId) return;
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    deleteMutation.mutate(selectedItemId);
  };

  const handleMoveUp = (item: MenuItem) => {
    const sameLevel = menuItems.filter(m => m.parentId === item.parentId);
    const index = sameLevel.findIndex(m => m.id === item.id);
    if (index <= 0) return;

    const updates = [
      { id: item.id, displayOrder: sameLevel[index - 1].displayOrder },
      { id: sameLevel[index - 1].id, displayOrder: item.displayOrder }
    ];
    reorderMutation.mutate({ items: updates });
  };

  const handleMoveDown = (item: MenuItem) => {
    const sameLevel = menuItems.filter(m => m.parentId === item.parentId);
    const index = sameLevel.findIndex(m => m.id === item.id);
    if (index < 0 || index >= sameLevel.length - 1) return;

    const updates = [
      { id: item.id, displayOrder: sameLevel[index + 1].displayOrder },
      { id: sameLevel[index + 1].id, displayOrder: item.displayOrder }
    ];
    reorderMutation.mutate({ items: updates });
  };

  const handleSaveTranslation = () => {
    if (!selectedItemId) return;
    if (!formData.label.trim()) {
      toast.error('Label is required');
      return;
    }

    translationMutation.mutate({
      menuItemId: selectedItemId,
      lang: selectedLanguage,
      label: formData.label
    });
  };

  // Build hierarchical tree for display
  type MenuItemWithChildren = MenuItem & { children: MenuItemWithChildren[] };

  const buildTree = (items: MenuItem[]): MenuItemWithChildren[] => {
    const map = new Map<number, MenuItemWithChildren>();
    items.forEach(item => map.set(item.id, { ...item, children: [] }));

    const roots: MenuItemWithChildren[] = [];
    items.forEach(item => {
      const node = map.get(item.id)!;
      if (item.parentId === null) {
        roots.push(node);
      } else {
        const parent = map.get(item.parentId);
        if (parent) parent.children.push(node);
      }
    });

    return roots;
  };

  const menuTree = buildTree(menuItems);

  // Render menu tree item
  const renderTreeItem = (item: MenuItemWithChildren, depth: number = 0) => {
    const isSelected = selectedItemId === item.id;
    const Icon =
      item.linkType === 'external' ? GlobeAltIcon :
      item.linkType === 'cms_page' ? DocumentTextIcon :
      item.linkType === 'internal' ? LinkIcon :
      MinusCircleIcon;

    return (
      <div key={item.id}>
        <div
          className={`group flex items-center gap-2 rounded-xl px-3 py-2.5 transition-colors cursor-pointer ${
            isSelected
              ? 'bg-blush/20 text-blush'
              : 'text-champagne/70 hover:bg-white/5 hover:text-champagne'
          }`}
          style={{ paddingLeft: `${depth * 1.5 + 0.75}rem` }}
          onClick={() => {
            setSelectedItemId(item.id);
            setIsCreatingNew(false);
          }}
        >
          <Icon className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1 text-sm font-medium truncate">{item.label}</span>
          {!item.isEnabled && (
            <span className="text-xs text-champagne/40">(disabled)</span>
          )}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleMoveUp(item);
              }}
              className="p-1 hover:text-blush transition-colors"
              title="Move up"
            >
              <ChevronUpIcon className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleMoveDown(item);
              }}
              className="p-1 hover:text-blush transition-colors"
              title="Move down"
            >
              <ChevronDownIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {item.children.map(child => renderTreeItem(child, depth + 1))}
      </div>
    );
  };

  // Get available parent items (exclude self and descendants)
  const getAvailableParents = (): MenuItem[] => {
    if (!selectedItemId) return menuItems.filter(m => m.parentId === null);

    const descendants = new Set<number>();
    const findDescendants = (id: number) => {
      descendants.add(id);
      menuItems.filter(m => m.parentId === id).forEach(child => findDescendants(child.id));
    };
    findDescendants(selectedItemId);

    return menuItems.filter(m => !descendants.has(m.id) && m.parentId === null);
  };

  const availableParents = getAvailableParents();

  return (
    <div className="min-h-screen bg-midnight p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl text-champagne">Navigation Menu</h1>
            <p className="mt-1 text-sm text-champagne/60">
              Manage navigation menus across your site
            </p>
          </div>

          <button
            onClick={() => {
              setIsCreatingNew(true);
              setSelectedItemId(null);
              setSelectedLanguage('en'); // Always create new items in English
              resetFormData();
            }}
            className="flex items-center gap-2 rounded-full bg-blush px-6 py-3 font-semibold text-midnight transition-all hover:bg-blush/90 hover:shadow-lg"
          >
            <PlusIcon className="h-5 w-5" />
            Add Menu Item
          </button>
        </div>

        {/* Location Tabs */}
        <div className="flex gap-2 border-b border-white/10 pb-4">
          {locations.filter(location => !['footer', 'mobile'].includes(location.code)).map(location => (
            <button
              key={location.id}
              onClick={() => {
                setSelectedLocationId(location.id);
                resetForm();
              }}
              className={`rounded-xl px-6 py-2.5 font-semibold transition-all ${
                selectedLocationId === location.id
                  ? 'bg-blush text-midnight shadow-lg'
                  : 'bg-white/5 text-champagne/70 hover:bg-white/10 hover:text-champagne'
              }`}
            >
              {location.name}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Menu Tree */}
          <aside className="col-span-5">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg text-champagne">Menu Items</h2>
                {itemsLoading && (
                  <ArrowPathIcon className="h-5 w-5 animate-spin text-champagne/40" />
                )}
              </div>

              {/* Language Selector */}
              <div className="mb-4 flex gap-2">
                <button
                  onClick={() => setSelectedLanguage('en')}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    selectedLanguage === 'en'
                      ? 'bg-blush text-midnight'
                      : 'bg-white/10 text-champagne/70 hover:bg-white/20'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setSelectedLanguage('ka')}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    selectedLanguage === 'ka'
                      ? 'bg-blush text-midnight'
                      : 'bg-white/10 text-champagne/70 hover:bg-white/20'
                  }`}
                >
                  ქართული
                </button>
              </div>

              {/* Menu Tree */}
              <div className="space-y-1">
                {menuTree.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-sm text-champagne/40">No menu items yet</p>
                    <p className="mt-1 text-xs text-champagne/30">Click "Add Menu Item" to create one</p>
                  </div>
                ) : (
                  menuTree.map(item => renderTreeItem(item))
                )}
              </div>
            </div>
          </aside>

          {/* Right: Edit Form */}
          <main className="col-span-7">
            {selectedItemId || isCreatingNew ? (
              <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="font-display text-xl text-champagne">
                    {isCreatingNew ? 'New Menu Item' : 'Edit Menu Item'}
                  </h2>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-champagne/40 transition-colors hover:text-champagne"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Label */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-champagne">
                      Label <span className="text-blush">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.label}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-champagne placeholder-champagne/40 transition-all focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
                      placeholder="Enter menu label"
                      required
                    />
                    {!isCreatingNew && selectedItemId && (
                      <button
                        type="button"
                        onClick={handleSaveTranslation}
                        disabled={translationMutation.isPending}
                        className="mt-2 text-xs text-blush hover:underline"
                      >
                        {translationMutation.isPending ? 'Saving...' : 'Save translation only'}
                      </button>
                    )}
                  </div>

                  {/* Link Type */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-champagne">
                      Link Type <span className="text-blush">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['internal', 'external', 'cms_page', 'none'] as LinkType[]).map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({ ...formData, linkType: type })}
                          className={`rounded-lg px-4 py-2.5 text-sm font-semibold capitalize transition-colors ${
                            formData.linkType === type
                              ? 'bg-blush text-midnight'
                              : 'bg-white/10 text-champagne/70 hover:bg-white/20'
                          }`}
                        >
                          {type.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Conditional Fields Based on Link Type */}
                  {formData.linkType === 'internal' && (
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-champagne">
                        Internal URL <span className="text-blush">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.linkUrl}
                        onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                        className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-champagne placeholder-champagne/40 transition-all focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
                        placeholder="/products"
                        list="page-suggestions"
                      />
                      <datalist id="page-suggestions">
                        {pageSuggestions
                          .filter(s => s.type === 'static')
                          .map((suggestion, idx) => (
                            <option key={idx} value={suggestion.url}>
                              {suggestion.label}
                            </option>
                          ))}
                      </datalist>
                      <p className="mt-1 text-xs text-champagne/40">e.g., /products, /about</p>
                    </div>
                  )}

                  {formData.linkType === 'external' && (
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-champagne">
                        External URL <span className="text-blush">*</span>
                      </label>
                      <input
                        type="url"
                        value={formData.linkUrl}
                        onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                        className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-champagne placeholder-champagne/40 transition-all focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
                        placeholder="https://example.com"
                      />
                    </div>
                  )}

                  {formData.linkType === 'cms_page' && (
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-champagne">
                        CMS Page <span className="text-blush">*</span>
                      </label>
                      <select
                        value={formData.cmsPageId || ''}
                        onChange={(e) => setFormData({ ...formData, cmsPageId: Number(e.target.value) || null })}
                        className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-champagne transition-all focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
                      >
                        <option value="">Select a page...</option>
                        {cmsPages.map(page => (
                          <option key={page.id} value={page.id}>
                            {page.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Parent Item */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-champagne">
                      Parent Item (Optional)
                    </label>
                    <select
                      value={formData.parentId || ''}
                      onChange={(e) => setFormData({ ...formData, parentId: Number(e.target.value) || null })}
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-champagne transition-all focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
                    >
                      <option value="">None (root level)</option>
                      {availableParents.map(parent => (
                        <option key={parent.id} value={parent.id}>
                          {parent.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-champagne/40">Select a parent to nest this item</p>
                  </div>

                  {/* Open in New Tab */}
                  {formData.linkType !== 'none' && (
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="openInNewTab"
                        checked={formData.openInNewTab}
                        onChange={(e) => setFormData({ ...formData, openInNewTab: e.target.checked })}
                        className="h-5 w-5 rounded border-white/20 bg-white/10 text-blush focus:ring-2 focus:ring-blush/20"
                      />
                      <label htmlFor="openInNewTab" className="text-sm font-medium text-champagne">
                        Open in new tab
                      </label>
                    </div>
                  )}

                  {/* Enabled Toggle */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="enabled"
                      checked={formData.isEnabled}
                      onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                      className="h-5 w-5 rounded border-white/20 bg-white/10 text-blush focus:ring-2 focus:ring-blush/20"
                    />
                    <label htmlFor="enabled" className="text-sm font-medium text-champagne">
                      Enabled (visible on site)
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 border-t border-white/10 pt-6">
                    <button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="flex flex-1 items-center justify-center gap-2 rounded-full bg-blush px-6 py-3 font-semibold text-midnight transition-all hover:bg-blush/90 disabled:opacity-50"
                    >
                      {createMutation.isPending || updateMutation.isPending ? (
                        <>
                          <ArrowPathIcon className="h-5 w-5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="h-5 w-5" />
                          {isCreatingNew ? 'Create' : 'Save Changes'}
                        </>
                      )}
                    </button>

                    {!isCreatingNew && selectedItemId && (
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                        className="flex items-center gap-2 rounded-full bg-red-500/20 px-6 py-3 font-semibold text-red-400 transition-all hover:bg-red-500/30 disabled:opacity-50"
                      >
                        <TrashIcon className="h-5 w-5" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </form>
            ) : (
              <div className="flex h-96 items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
                <div>
                  <ChevronRightIcon className="mx-auto h-12 w-12 text-champagne/20" />
                  <p className="mt-4 text-champagne/70">Select a menu item to edit</p>
                  <p className="mt-1 text-sm text-champagne/40">or click "Add Menu Item" to create a new one</p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
