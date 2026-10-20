'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiDownload, FiExternalLink, FiImage, FiSearch } from 'react-icons/fi';
import { fetchCracks } from '@/lib/api-client';
import { getCrackTypeDetails, DPWH_CRACK_TYPES } from '@/lib/crack-types';
import { CRACK_IMAGE_CREDITS, getCrackImageUrl } from '@/lib/crack-images';
import { Crack, CrackType } from '@/lib/types';

const severities: Record<Crack['severity'], string> = {
  low: 'bg-emerald-100 text-emerald-800',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

function safeFilePart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function GalleryPage() {
  const [cracks, setCracks] = useState<Crack[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<CrackType | 'all'>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState('');

  useEffect(() => {
    fetchCracks({ limit: 500 })
      .then(setCracks)
      .catch((error) => setLoadError(error instanceof Error ? error.message : 'Unable to load crack images.'))
      .finally(() => setLoading(false));
  }, []);

  const query = search.trim().toLowerCase();
  const filteredCracks = cracks.filter((crack) => {
    const type = getCrackTypeDetails(crack.crackType);
    const matchesType = selectedType === 'all' || crack.crackType === selectedType;
    const matchesSearch = [crack.location, type.label, type.description].some((value) => value.toLowerCase().includes(query));
    return matchesType && matchesSearch;
  });

  async function downloadImage(crack: Crack) {
    setDownloadingId(crack.id);
    setDownloadError('');
    try {
      const imageUrl = getCrackImageUrl(crack.imageUrl, crack.crackType);
      const anchor = document.createElement('a');
      anchor.href = imageUrl;
      anchor.download = `${safeFilePart(crack.location)}-${crack.crackType}.jpg`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch {
      setDownloadError('Could not download this image. Use “Open image” to save it from your browser.');
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-teal-800">DPWH road condition records</p>
          <h1 className="text-3xl font-bold text-gray-900">Crack Image Gallery</h1>
          <p className="mt-1 text-sm text-gray-600">{cracks.length} crack record{cracks.length === 1 ? '' : 's'}</p>
        </div>
        <label className="relative block w-full sm:w-80">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100" placeholder="Search location or crack type" />
        </label>
      </header>

      <div className="flex flex-wrap items-center gap-2" aria-label="Filter images by crack type">
        <button onClick={() => setSelectedType('all')} className={`rounded border px-3 py-1.5 text-sm ${selectedType === 'all' ? 'border-teal-800 bg-teal-800 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}>All types</button>
        {DPWH_CRACK_TYPES.map((type) => (
          <button key={type} onClick={() => setSelectedType(type)} className={`rounded border px-3 py-1.5 text-sm ${selectedType === type ? 'border-teal-800 bg-teal-800 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}>
            {getCrackTypeDetails(type).label}
          </button>
        ))}
      </div>

      {loadError && <p role="alert" className="border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</p>}
      {downloadError && <p role="alert" className="border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-900">{downloadError}</p>}

      {loading ? (
        <div className="border border-gray-200 bg-white py-16 text-center text-sm text-gray-500">Loading crack images...</div>
      ) : filteredCracks.length ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCracks.map((crack) => {
            const imageUrl = getCrackImageUrl(crack.imageUrl, crack.crackType);
            const isSampleImage = !crack.imageUrl;
            const type = getCrackTypeDetails(crack.crackType);
            const credit = CRACK_IMAGE_CREDITS[crack.crackType];
            return (
              <article key={crack.id} className="overflow-hidden border border-gray-200 bg-white">
                <Link href={`/cracks/${crack.id}`} className="group relative block aspect-[4/3] overflow-hidden bg-gray-100">
                  <Image src={imageUrl} alt={isSampleImage ? `Sample pavement crack image for ${crack.location}` : `Crack at ${crack.location}`} fill unoptimized className="object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                  <span className={`absolute left-3 top-3 rounded px-2.5 py-1 text-xs font-semibold ${severities[crack.severity]}`}>{crack.severity}</span>
                  {isSampleImage && <span className="absolute bottom-3 left-3 rounded bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">Sample image</span>}
                </Link>
                <div className="space-y-3 p-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">{type.label}</p>
                    <h2 className="mt-1 font-semibold text-gray-900">{crack.location}</h2>
                    <p className="mt-1 text-sm leading-5 text-gray-600">{type.description}</p>
                    <p className="mt-2 text-xs text-gray-500">
                      Image: <a href={credit.source} target="_blank" rel="noreferrer" className="underline">{credit.creator}</a> ({credit.license})
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                    <Link href={`/cracks/${crack.id}`} className="text-sm font-medium text-teal-800 hover:underline">Record details</Link>
                    <div className="flex items-center gap-1">
                                  <a href={imageUrl} target="_blank" rel="noreferrer" title="Open image" aria-label={`Open image for ${crack.location}`} className="rounded p-2 text-gray-600 hover:bg-gray-100"><FiExternalLink size={17} /></a>
                      <button onClick={() => void downloadImage(crack)} disabled={downloadingId === crack.id} title="Save image" aria-label={`Save image for ${crack.location}`} className="inline-flex items-center gap-2 rounded bg-teal-800 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-60">
                        <FiDownload size={16} />{downloadingId === crack.id ? 'Saving...' : 'Save image'}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="border border-gray-200 bg-white py-16 text-center">
          <FiImage className="mx-auto mb-3 text-gray-300" size={30} />
          <p className="font-medium text-gray-800">No crack images found</p>
          <p className="mt-1 text-sm text-gray-500">Try changing your search or type filter.</p>
        </div>
      )}

      <footer className="border-t border-gray-200 pt-4 text-xs leading-5 text-gray-500">
        These images are illustrative samples from Wikimedia Commons and are not actual Davao field photographs. Each card links to its source and displays the applicable license.
      </footer>
    </div>
  );
}