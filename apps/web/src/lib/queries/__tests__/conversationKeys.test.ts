/**
 * Conversation Query Key Factory Tests
 *
 * Tests that the query key factory produces consistent, hierarchical keys.
 */

import { describe, expect, it } from 'vitest';

import { conversationKeys } from '../conversationKeys';

describe('conversationKeys', () => {
  describe('all', () => {
    it('returns the root key for all conversations', () => {
      expect(conversationKeys.all).toEqual(['conversations']);
    });

    it('is readonly (as const)', () => {
      // TypeScript enforces this, but we can verify the structure
      expect(Object.isFrozen(conversationKeys.all)).toBe(false); // as const doesn't freeze
      expect(conversationKeys.all.length).toBe(1);
    });
  });

  describe('lists', () => {
    it('returns key for all list queries', () => {
      expect(conversationKeys.lists()).toEqual(['conversations', 'list']);
    });

    it('extends the all key', () => {
      const lists = conversationKeys.lists();
      expect(lists[0]).toBe(conversationKeys.all[0]);
    });
  });

  describe('list', () => {
    it('returns key for a specific user list', () => {
      const userId = 'user-123';
      expect(conversationKeys.list(userId)).toEqual(['conversations', 'list', 'user-123']);
    });

    it('produces different keys for different users', () => {
      const user1Key = conversationKeys.list('user-1');
      const user2Key = conversationKeys.list('user-2');

      expect(user1Key).not.toEqual(user2Key);
      expect(user1Key[2]).toBe('user-1');
      expect(user2Key[2]).toBe('user-2');
    });

    it('extends the lists key', () => {
      const lists = conversationKeys.lists();
      const list = conversationKeys.list('user-123');

      expect(list.slice(0, 2)).toEqual(lists);
    });
  });

  describe('details', () => {
    it('returns key for all detail queries', () => {
      expect(conversationKeys.details()).toEqual(['conversations', 'detail']);
    });
  });

  describe('detail', () => {
    it('returns key for a specific conversation detail', () => {
      const conversationId = 'conv-456';
      expect(conversationKeys.detail(conversationId)).toEqual([
        'conversations',
        'detail',
        'conv-456',
      ]);
    });

    it('produces different keys for different conversations', () => {
      const conv1Key = conversationKeys.detail('conv-1');
      const conv2Key = conversationKeys.detail('conv-2');

      expect(conv1Key).not.toEqual(conv2Key);
    });
  });

  describe('messages', () => {
    it('returns key for messages within a conversation', () => {
      const conversationId = 'conv-789';
      expect(conversationKeys.messages(conversationId)).toEqual([
        'conversations',
        'detail',
        'conv-789',
        'messages',
      ]);
    });

    it('extends the detail key', () => {
      const conversationId = 'conv-789';
      const detail = conversationKeys.detail(conversationId);
      const messages = conversationKeys.messages(conversationId);

      expect(messages.slice(0, 3)).toEqual(detail);
      expect(messages[3]).toBe('messages');
    });

    it('produces nested keys for different conversations', () => {
      const messages1 = conversationKeys.messages('conv-1');
      const messages2 = conversationKeys.messages('conv-2');

      expect(messages1[2]).toBe('conv-1');
      expect(messages2[2]).toBe('conv-2');
      expect(messages1[3]).toBe(messages2[3]); // Both 'messages'
    });
  });

  describe('key hierarchy', () => {
    it('maintains proper nesting structure', () => {
      // This test verifies the invalidation pattern works correctly
      // Invalidating conversationKeys.all should match all other keys
      const all = conversationKeys.all;
      const lists = conversationKeys.lists();
      const list = conversationKeys.list('user-1');
      const details = conversationKeys.details();
      const detail = conversationKeys.detail('conv-1');
      const messages = conversationKeys.messages('conv-1');

      // All keys start with 'conversations'
      expect(all[0]).toBe('conversations');
      expect(lists[0]).toBe('conversations');
      expect(list[0]).toBe('conversations');
      expect(details[0]).toBe('conversations');
      expect(detail[0]).toBe('conversations');
      expect(messages[0]).toBe('conversations');
    });
  });
});
