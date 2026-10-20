import { CrackType } from '@/lib/types';

export const CRACK_SAMPLE_IMAGE_URL = '/images/crack-sample.jpg';

export const CRACK_IMAGES_BY_TYPE: Record<CrackType, string> = {
  transverse: '/images/crack-transverse.jpg',
  longitudinal: '/images/crack-longitudinal.jpg',
  block: '/images/crack-block.jpg',
  corner: '/images/crack-corner.jpg',
  diagonal: '/images/crack-diagonal.jpg',
  meandering: '/images/crack-meandering.jpg',
  reflection: '/images/crack-reflection.jpg',
};

export const CRACK_IMAGE_CREDITS: Record<CrackType, { creator: string; license: string; source: string }> = {
  transverse: {
    creator: 'Donnylad',
    license: 'CC BY-SA 2.0',
    source: 'https://commons.wikimedia.org/wiki/File:Cracks_in_the_surface_-_geograph.org.uk_-_477638.jpg',
  },
  longitudinal: {
    creator: 'W.carter',
    license: 'CC0',
    source: 'https://commons.wikimedia.org/wiki/File:Cracked_asphalt_after_rain_at_blue_hour.jpg',
  },
  block: {
    creator: 'John Harvey',
    license: 'Public domain',
    source: 'https://commons.wikimedia.org/wiki/File:Worn_cracked_asphalt_pavement.jpg',
  },
  corner: {
    creator: 'Mnalis',
    license: 'CC BY-SA 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:Old_cracked_asphalt_road,_Mu%C5%BEilov%C4%8Dica.jpg',
  },
  diagonal: {
    creator: 'Marek Ślusarczyk (Tupungato)',
    license: 'CC BY 3.0',
    source: 'https://commons.wikimedia.org/wiki/File:002_Damaged_road_surface_background_-_cracked_asphalt_blacktop_in_Spain.jpg',
  },
  meandering: {
    creator: 'XoMEoX',
    license: 'CC BY 2.0',
    source: 'https://commons.wikimedia.org/wiki/File:It_starts_with_a_crack..._(35815932072).jpg',
  },
  reflection: {
    creator: 'Sisters.seamless',
    license: 'CC0',
    source: 'https://commons.wikimedia.org/wiki/File:White_painted_lightly_cracked_worn_eroded_asphalt_seamless_texture.jpg',
  },
};

export function getCrackImageUrl(imageUrl?: string | null, crackType?: CrackType) {
  return imageUrl || (crackType ? CRACK_IMAGES_BY_TYPE[crackType] : CRACK_SAMPLE_IMAGE_URL);
}