import CrackMapLoader from '@/components/CrackMapLoader';

export default function MapPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Map View</h1>
        <p className="text-gray-600 mt-1">Current detection records from the shared database, plotted by their recorded coordinates.</p>
      </div>

      <CrackMapLoader />
    </div>
  );
}
