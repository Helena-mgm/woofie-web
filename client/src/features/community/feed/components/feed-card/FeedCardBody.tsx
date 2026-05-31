"use client";

import Image from "next/image";
import { getImageUrl } from "@/infrastructure/config/constants";
import type { Post } from "@/shared/types/forum";

type FeedCardBodyProps = {
  post: Post;
};

function MediaGallery({ images }: { images?: string[] }) {
  if (!images || images.length === 0) {
    return null;
  }

  if (images.length === 1) {
    return (
      <div className="overflow-hidden rounded-3xl">
        <Image
          src={getImageUrl(images[0])}
          alt=""
          width={900}
          height={600}
          className="h-64 w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {images.slice(0, 4).map((image, index) => (
        <div key={image} className="overflow-hidden rounded-3xl">
          <Image
            src={getImageUrl(image)}
            alt=""
            width={600}
            height={400}
            className="h-48 w-full object-cover"
          />
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

export function FeedCardBody({ post }: FeedCardBodyProps) {
  return (
    <section className="space-y-4 text-sm text-[#3E2A1B]">
      <p className="leading-relaxed">{post.content}</p>
      <MediaGallery images={post.images} />
    </section>
  );
}
