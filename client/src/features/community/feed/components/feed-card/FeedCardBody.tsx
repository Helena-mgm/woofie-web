"use client";

import Image from "next/image";
import Link from "next/link";
import { getImageUrl } from "@/infrastructure/config/constants";
import type { Post } from "@/shared/types/forum";
import { renderMentionedContent } from "./mentionUtils";

type FeedCardBodyProps = {
  post: Post;
};

function MediaGallery({ images }: { images?: string[] }) {
  if (!images || images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className="overflow-hidden rounded-3xl">
        <Image src={getImageUrl(images[0])} alt="" width={900} height={600} className="h-64 w-full object-cover" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {images.slice(0, 4).map((image, index) => (
        <div key={image} className="relative overflow-hidden rounded-3xl">
          <Image src={getImageUrl(image)} alt="" width={600} height={400} className="h-48 w-full object-cover" />
          {index === 3 && images.length > 4 && (
            <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-black/40 text-lg font-semibold text-white">
              +{images.length - 4}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TaggedDogs({ dogs }: { dogs?: Post["dogs"] }) {
  if (!dogs || dogs.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {dogs.map((dog) => (
        <Link
          key={dog.id}
          href={`/dog/${dog.id}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#F1E5D4] bg-[#FFF5E6] px-3 py-1 text-xs font-semibold text-[#8B4513] transition hover:bg-[#FFE4C4]"
        >
          🐾 {dog.name}
          {dog.breed && <span className="font-normal text-[#A0522D]">· {dog.breed}</span>}
        </Link>
      ))}
    </div>
  );
}

export function FeedCardBody({ post }: FeedCardBodyProps) {
  return (
    <section className="space-y-4 text-sm text-[#3E2A1B]">
      <p className="leading-relaxed">{renderMentionedContent(post.content)}</p>
      <MediaGallery images={post.images} />
      <TaggedDogs dogs={post.dogs} />
    </section>
  );
}
