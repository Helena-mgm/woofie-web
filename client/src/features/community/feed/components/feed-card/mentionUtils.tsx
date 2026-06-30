/**
 * Utilitaires pour parser et afficher :
 *  - Mentions @[Nom](userId)
 *  - Tags chien #dog:[Nom](dogId)
 *  - URLs brutes https://... → liens cliquables
 */
import Link from "next/link";
import type { ReactNode } from "react";

/** Transforme le texte brut en nœuds React cliquables */
export function renderMentionedContent(content: string): ReactNode[] {
  // Ordre : mentions > dog tags > URLs brutes > texte
  const combined =
    /(@\[([^\]]+)\]\((\d+)\)|#dog:\[([^\]]+)\]\((\d+)\)|https?:\/\/[^\s<>"]+)/g;

  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = combined.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{content.slice(lastIndex, match.index)}</span>);
    }

    const token = match[0];

    if (token.startsWith("@")) {
      // @[Nom](id)
      const name = match[2];
      const id = match[3];
      parts.push(
        <Link
          key={key++}
          href={`/profile/${id}`}
          className="font-semibold text-[#8B4513] hover:underline"
        >
          @{name}
        </Link>
      );
    } else if (token.startsWith("#dog:")) {
      // #dog:[Nom](id)
      const name = match[4];
      const id = match[5];
      parts.push(
        <Link
          key={key++}
          href={`/dog/${id}`}
          className="inline-flex items-center gap-1 font-semibold text-[#8B4513] hover:underline"
        >
          🐾{name}
        </Link>
      );
    } else {
      // URL brute
      parts.push(
        <a
          key={key++}
          href={token}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all text-[#8B4513] underline hover:text-[#D2691E]"
        >
          {token}
        </a>
      );
    }

    lastIndex = combined.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(<span key={key++}>{content.slice(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : [<span key={0}>{content}</span>];
}

/** Texte brut sans balises */
export function stripMentions(content: string): string {
  return content
    .replace(/@\[([^\]]+)\]\(\d+\)/g, "@$1")
    .replace(/#dog:\[([^\]]+)\]\(\d+\)/g, "🐾$1");
}
