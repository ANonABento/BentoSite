export type PhotoItem = {
  id: string;
  src: string;
  alt: string;
  title: string;
  location: string;
  year: string;
  width: number;
  height: number;
  blurDataURL?: string;
};

export type PhotoManifest = {
  photos: PhotoItem[];
};
