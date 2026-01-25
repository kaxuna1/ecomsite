import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Link } from 'react-router-dom';
import {
  EllipsisVerticalIcon,
  EyeIcon,
  PencilSquareIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface CMSPageActionsMenuProps {
  pageId: number;
  slug: string;
  isPublished: boolean;
  onToggleStatus: () => void;
  onDelete: () => void;
}

export default function CMSPageActionsMenu({
  pageId,
  slug,
  isPublished,
  onToggleStatus,
  onDelete
}: CMSPageActionsMenuProps) {
  const handleViewLive = () => {
    window.open(`/en/${slug}`, '_blank');
  };

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-secondary transition-colors"
        title="Page actions"
      >
        <EllipsisVerticalIcon className="h-5 w-5" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-bg-elevated border border-border-default rounded-lg shadow-xl z-50 py-1 focus:outline-none">
          {/* View Live - only if published */}
          {isPublished && (
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleViewLive}
                  className={`${
                    active ? 'bg-primary/10' : ''
                  } w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary transition-colors`}
                >
                  <EyeIcon className="h-4 w-4 text-primary" />
                  View Live
                </button>
              )}
            </Menu.Item>
          )}

          {/* Inline Edit */}
          <Menu.Item>
            {({ active }) => (
              <Link
                to={`/admin/cms/inline-edit/${pageId}`}
                className={`${
                  active ? 'bg-primary/10' : ''
                } w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary transition-colors`}
              >
                <PencilSquareIcon className="h-4 w-4 text-text-secondary" />
                Inline Edit
              </Link>
            )}
          </Menu.Item>

          {/* Advanced */}
          <Menu.Item>
            {({ active }) => (
              <Link
                to={`/admin/cms/edit/${pageId}`}
                className={`${
                  active ? 'bg-primary/10' : ''
                } w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary transition-colors`}
              >
                <Cog6ToothIcon className="h-4 w-4 text-text-secondary" />
                Advanced
              </Link>
            )}
          </Menu.Item>

          {/* Divider */}
          <div className="my-1 border-t border-border-default" />

          {/* Publish / Unpublish */}
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={onToggleStatus}
                className={`${
                  active ? 'bg-primary/10' : ''
                } w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isPublished ? 'text-warning' : 'text-primary'
                }`}
              >
                {isPublished ? (
                  <>
                    <XCircleIcon className="h-4 w-4" />
                    Unpublish
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4" />
                    Publish
                  </>
                )}
              </button>
            )}
          </Menu.Item>

          {/* Divider */}
          <div className="my-1 border-t border-border-default" />

          {/* Delete */}
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={onDelete}
                className={`${
                  active ? 'bg-error/10' : ''
                } w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error transition-colors`}
              >
                <TrashIcon className="h-4 w-4" />
                Delete
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
