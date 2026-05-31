// Hook pour la recherche de conversations et groupes
'use client';

import { useState, useMemo } from 'react';
import { Conversation } from '@/shared/types/chat';

export function useSearch(conversations: Conversation[]) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;

    const query = searchQuery.toLowerCase();
    
    return conversations.filter(conv => {
      // Search by name
      if (conv.name?.toLowerCase().includes(query)) return true;

      // Search by participant names
      if (conv.participants.some(p => p.name.toLowerCase().includes(query))) {
        return true;
      }

      // Search in last message
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
