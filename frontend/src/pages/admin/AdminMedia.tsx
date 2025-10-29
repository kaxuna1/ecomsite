import MediaLibrary from '../../components/admin/MediaManager/MediaLibrary';

export default function AdminMedia() {
  return (
    <div className="space-y-6">
      <MediaLibrary mode="browse" />
    </div>
  );
}
