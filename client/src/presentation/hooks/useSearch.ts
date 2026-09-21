'use client';

import { useState, useMemo } from 'react';
import { Conversation } from '@/shared/types/chat';

export function useSearch(conversations: Conversation[]) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;

    const query = searchQuery.toLowerCase();
    
    return conversations.filter(conv => {
      if (conv.name?.toLowerCase().includes(query)) return true;

      if (conv.participants.some(p => p.name.toLowerCase().includes(query))) {
        return true;
      }

      if (conv.lastMessage?.content.toLowerCase().includes(query)) {
        return true;
      }

      return false;
    });
  }, [conversations, searchQuery]);

  const clearSearch = () => setSearchQuery('');

  return {
    searchQuery,
    setSearchQuery,
    filteredConversations,
    clearSearch,
    hasResults: filteredConversations.length > 0,
  };
}
