import { GalleryExperience } from "@/components/gallery/gallery-experience";
import { getExhibition } from "@/lib/source";

export default async function GalleryPage() {
  const { works } = await getExhibition();
  return <GalleryExperience works={works} />;
}
