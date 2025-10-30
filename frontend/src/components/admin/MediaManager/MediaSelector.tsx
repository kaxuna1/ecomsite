import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import MediaLibrary from './MediaLibrary';
import type { CMSMedia } from '../../../api/media';

interface MediaSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: CMSMedia | CMSMedia[]) => void;
  multiple?: boolean;
  maxSelection?: number;
  title?: string;
  description?: string;
}

export default function MediaSelector({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
  maxSelection,
  title = 'Select Media',
  description
}: MediaSelectorProps) {
  const handleSelect = (media: CMSMedia | CMSMedia[]) => {
    onSelect(media);
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-midnight/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="h-[90vh] w-full max-w-7xl transform overflow-hidden rounded-2xl border border-white/10 bg-midnight shadow-2xl transition-all">
                <MediaLibrary
                  mode="select"
                  onSelect={handleSelect}
                  onClose={onClose}
                  multiple={multiple}
                  maxSelection={maxSelection}
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
