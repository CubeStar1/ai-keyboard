/**
 * Client-side API functions for conversations.
 * These replace the server actions with direct API calls to the backend.
 */

import { getApiUrl } from "@/lib/api-url";
import { Conversation } from "@/lib/ai/types";
import { UIMessage } from "ai";

export async function getConversations(): Promise<Conversation[]> {
  const response = await fetch(getApiUrl("/api/conversations"), {
    method: "GET",
    credentials: "include",
  });
  const data = await response.json();
  if (!data.success) {
    console.error("Error fetching conversations:", data.error);
    return [];
  }
  return data.conversations;
}

export async function getInterviewConversations(): Promise<Conversation[]> {
  const response = await fetch(getApiUrl("/api/conversations?type=interview"), {
    method: "GET",
    credentials: "include",
  });
  const data = await response.json();
  if (!data.success) {
    console.error("Error fetching interview conversations:", data.error);
    return [];
  }
  return data.conversations;
}

export async function getPrepConversations(): Promise<Conversation[]> {
  const response = await fetch(getApiUrl("/api/conversations?type=prep"), {
    method: "GET",
    credentials: "include",
  });
  const data = await response.json();
  if (!data.success) {
    console.error("Error fetching prep conversations:", data.error);
    return [];
  }
  return data.conversations;
}

export async function getConversationMessages(
  conversationId: string
): Promise<UIMessage[]> {
  const response = await fetch(
    getApiUrl(`/api/conversations/${conversationId}/messages`),
    {
      method: "GET",
      credentials: "include",
    }
  );
  const data = await response.json();
  if (!data.success) {
    console.error("Error fetching messages:", data.error);
    return [];
  }
  return data.messages;
}

export async function deleteConversation(
  conversationId: string
): Promise<{ success: boolean }> {
  const response = await fetch(
    getApiUrl(`/api/conversations/${conversationId}`),
    {
      method: "DELETE",
      credentials: "include",
    }
  );
  const data = await response.json();
  if (!data.success) {
    console.error("Error deleting conversation:", data.error);
  }
  return data;
}

export async function getChatById(
  conversationId: string
): Promise<Conversation | null> {
  const response = await fetch(
    getApiUrl(`/api/conversations/${conversationId}`),
    {
      method: "GET",
      credentials: "include",
    }
  );
  const data = await response.json();
  if (!data.success) {
    console.error("Error fetching conversation:", data.error);
    return null;
  }
  return data.conversation;
}
