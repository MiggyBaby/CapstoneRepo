import dynamic from 'next/dynamic';

const CrackMap = dynamic(() => import('@/components/CrackMap'), {
  ssr: false,
  loading: () => (
    <div className="card flex h-[32rem] items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto" />
        <p className="text-gray-600 font-medium mt-4">Loading map...</p>
      </div>
    </div>
  ),
});

export default function MapPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Map View</h1>
        <p className="text-gray-600 mt-1">Visualize detected cracks across the city</p>
      </div>

      <CrackMap />
    </div>
  );
}
