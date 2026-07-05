import express from 'express';

export let currentUserId = 'usr-student-1'; // Default immersion user

export function setCurrentUserId(userId: string) {
  currentUserId = userId;
}

export function getActiveUserId(req: express.Request): string {
  return (req.headers['x-user-id'] as string) || currentUserId;
}
