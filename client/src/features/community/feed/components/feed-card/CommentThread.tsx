"use client";

import { useState } from "react";
import type { Comment } from "@/shared/types/forum";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { getImageUrl } from "@/infrastructure/config/constants";

const indent = "pl-10 border-l border-[#F1E5D4]";

type CommentThreadProps = {
  comments?: Comment[];
  onComment: (content: string) => void;
  onDelete: (commentId: number) => void;
  onReply: (commentId: number, content: string) => void;
  onLike: (commentId: number) => void;
};

export function CommentThread({ comments, onComment, onDelete, onReply, onLike }: CommentThreadProps) {
  const [composerOpen, setComposer] = useState(false);
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (!value.trim()) return;
    onComment(value.trim());
    setValue("");
    setComposer(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {comments?.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            level={0}
            onDelete={onDelete}
            onReply={onReply}
            onLike={onLike}
          />
        ))}
      </div>
      {composerOpen ? (
        <div className="space-y-3">
          <Textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Ajoutez votre message…"
            rows={3}
          />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSubmit}>
              Publier
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setComposer(false)}>
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="secondary" size="sm" onClick={() => setComposer(true)}>
          Participer à la discussion
        </Button>
      )}
    </div>
  );
}

type CommentItemProps = {
  comment: Comment;
  level: number;
  onDelete: (id: number) => void;
  onReply: (id: number, content: string) => void;
  onLike: (id: number) => void;
};

function CommentItem({ comment, level, onDelete, onReply, onLike }: CommentItemProps) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [value, setValue] = useState("");

  const submitReply = () => {
    if (!value.trim()) return;
    onReply(comment.id, value.trim());
    setValue("");
    setReplyOpen(false);
  };

  return (
    <article className={level > 0 ? indent : ""}>
      <div className="flex items-start gap-3">
        <Avatar
          src={getImageUrl(comment.user.photo_path)}
          alt={comment.user.nom}
          placeholder={comment.user.nom.charAt(0)}
          className="h-10 w-10"
        />
        <div className="flex-1 rounded-3xl bg-[#FFF9F1] p-4">
          <header className="flex items-center justify-between text-xs text-[#A0522D]">
            <span className="font-semibold text-[#6B4A2B]">{comment.user.nom}</span>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => onLike(comment.id)}>
                {comment.is_liked ? "💛" : "🤎"} {comment.likes_count ?? 0}
              </button>
              <button type="button" onClick={() => onDelete(comment.id)}>
                Supprimer
              </button>
            </div>
          </header>
          <p className="mt-2 text-sm text-[#3E2A1B]">{comment.content}</p>
          <footer className="mt-3 flex items-center gap-3 text-xs text-[#A0522D]">
            <button type="button" onClick={() => setReplyOpen((prev) => !prev)}>
              Répondre
            </button>
          </footer>
          {replyOpen && (
            <div className="mt-3 space-y-2">
              <Textarea
                value={value}
                onChange={(event) => setValue(event.target.value)}
                rows={2}
              />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={submitReply}>
                  Envoyer
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setReplyOpen(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((child) => (
            <CommentItem
              key={child.id}
              comment={child}
              level={level + 1}
              onDelete={onDelete}
              onReply={onReply}
              onLike={onLike}
            />
          ))}
        </div>
      )}
    </article>
  );
}
