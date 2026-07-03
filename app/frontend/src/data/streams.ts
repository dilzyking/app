
Action: file_editor create /app/frontend/src/data/streams.ts --file-text "// Sample MPEG-DASH (.mpd) streams for ExoPlay
// All streams are publicly available test streams

export type Stream = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: 'HD' | '4K' | 'SD' | 'DRM';
  duration: string;
  year: string;
  thumbnail: string;
  manifestUri: string;
  drm?: {
    type: 'widevine' | 'clearkey';
    licenseServer?: string;
    // ClearKey in-manifest (kid:key pairs) — pass null and let manifest supply
    clearKeys?: Record<string, string>;
  };
};

export const STREAMS: Stream[] = [
  {
    id: 'bbb-30fps',
    title: 'Big Buck Bunny',
    subtitle: 'Animation • Blender Foundation',
    description:
      'A large and lovable rabbit deals with three tiny bullies in this open-source animated short. 30fps DASH multi-bitrate.',
    category: 'HD',
    duration: '10:34',
    year: '2008',
    thumbnail:
      'https://images.unsplash.com/photo-1702485581927-4337697bd723?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzV8MHwxfHNlYXJjaHwxfHwzZCUyMGFuaW1hdGlvbiUyMGNoYXJhY3RlciUyMG1vdmllJTIwZnJhbWV8ZW58MHx8fHwxNzgzMDczMjY3fDA&ixlib=rb-4.1.0&q=85',
    manifestUri:
      'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd',
  },
  {
    id: 'tears-of-steel',
    title: 'Tears of Steel',
    subtitle: 'Sci-Fi Short • Blender',
    description:
      'A team of warriors and scientists must confront the ancient evil that once brought Earth to the brink. Multi-rate DASH sample.',
    category: '4K',
    duration: '12:14',
    year: '2012',
    thumbnail:
      'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDB8MHwxfHNlYXJjaHwxfHxjaW5lbWF0aWMlMjBzY2ktZmklMjBtb3ZpZSUyMHBvc3RlciUyMDRrfGVufDB8fHx8MTc4MzA3MzI2N3ww&ixlib=rb-4.1.0&q=85',
    manifestUri:
      'https://dash.akamaized.net/dash264/TestCases/1c/qualcomm/2/MultiRate.mpd',
  },
  {
    id: 'sintel-widevine',
    title: 'Sintel (Widevine DRM)',
    subtitle: 'Fantasy • DRM Protected',
    description:
      'A lonely young woman finds and befriends a baby dragon. This stream is encrypted with Widevine — license fetched from Shaka test server.',
    category: 'DRM',
    duration: '14:48',
    year: '2010',
    thumbnail:
      'https://images.unsplash.com/photo-1466971060667-16467c7d04ee?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NjZ8MHwxfHNlYXJjaHwxfHxiZWF1dGlmdWwlMjBuYXR1cmUlMjBsYW5kc2NhcGUlMjA0ayUyMGRvY3VtZW50YXJ5fGVufDB8fHx8MTc4MzA3MzI2N3ww&ixlib=rb-4.1.0&q=85',
    manifestUri:
      'https://storage.googleapis.com/shaka-demo-assets/sintel-widevine/dash.mpd',
    drm: {
      type: 'widevine',
      licenseServer: 'https://cwip-shaka-proxy.appspot.com/no_auth',
    },
  },
  {
    id: 'angel-one-clearkey',
    title: 'Angel One (ClearKey)',
    subtitle: 'Demo • ClearKey DRM',
    description:
      'Multilingual Blender open movie encrypted with ClearKey CENC. Demonstrates in-app key delivery without a license server.',
    category: 'DRM',
    duration: '11:12',
    year: '2015',
    thumbnail:
      'https://images.unsplash.com/photo-1638864616270-64041b699a50?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzV8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwYWJzdHJhY3QlMjBwbGF5JTIwYnV0dG9uJTIwbG9nb3xlbnwwfHx8fDE3ODMwNzMyNjd8MA&ixlib=rb-4.1.0&q=85',
    manifestUri:
      'https://storage.googleapis.com/shaka-demo-assets/angel-one-clearkey/dash.mpd',
    drm: {
      type: 'clearkey',
    },
  },
  {
    id: 'envivio-live',
    title: 'Envivio Multi-Rate',
    subtitle: 'Test Stream • DASH-IF',
    description:
      'DASH-IF reference stream with multiple bitrates. Great to validate adaptive streaming and quality switching.',
    category: 'HD',
    duration: '02:00',
    year: '2016',
    thumbnail:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&q=80',
    manifestUri:
      'https://dash.akamaized.net/envivio/EnvivioDash3/manifest.mpd',
  },
  {
    id: 'itec-caminandes',
    title: 'Caminandes: Llama Drama',
    subtitle: 'Animation • ITEC',
    description:
      'Comedic Blender open short following an unlucky llama. ITEC-hosted DASH low-bitrate for network stress testing.',
    category: 'SD',
    duration: '01:30',
    year: '2013',
    thumbnail:
      'https://images.unsplash.com/photo-1518676590629-3dcba9c5a555?w=1200&q=80',
    manifestUri:
      'https://dash.akamaized.net/dash264/TestCasesHD/MultiRate/1/ToS/ToS_1080p_240s.mpd',
  },
];

export const CATEGORIES: Array<Stream['category'] | 'ALL'> = [
  'ALL',
  'HD',
  '4K',
  'DRM',
  'SD',
];

export function getStreamById(id: string): Stream | undefined {
  return STREAMS.find((s) => s.id === id);
}
"
Observation: Create successful: /app/frontend/src/data/streams.ts
