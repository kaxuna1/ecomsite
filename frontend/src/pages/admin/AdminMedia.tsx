import MediaLibrary from '../../components/admin/MediaManager/MediaLibrary';
import PageHeader from '../../components/admin/PageHeader';

export default function AdminMedia() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Media Library"
        description="Browse and manage uploaded images and assets"
      />
      <MediaLibrary mode="browse" />
    </div>
  );
}
