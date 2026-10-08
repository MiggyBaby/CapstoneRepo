import CrackMapLoader from '@/components/CrackMapLoader';

export default function MapPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Map View</h1>
        <p className="text-gray-600 mt-1">Example road crack detections across Mindanao</p>
      </div>

      <CrackMapLoader />
    </div>
  );
}
