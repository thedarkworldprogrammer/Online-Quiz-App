import express from 'express';
import { dbService } from '../services/dbService';
import { getActiveUserId } from '../utils/session';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const userId = getActiveUserId(req);
    const messages = await dbService.getMessages();
    const filtered = messages.filter(m => m.senderId === userId || m.receiverId === userId);
    res.json(filtered);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { receiverId, content } = req.body;
    const userId = getActiveUserId(req);

    const users = await dbService.getUsers();
    const sender = users.find(u => u.id === userId);
    const receiver = users.find(u => u.id === receiverId);

    if (!sender || !receiver) {
      return res.status(404).json({ error: 'Sender or Receiver not found' });
    }

    const msg = await dbService.addMessage({
      id: `m-${Date.now()}`,
      senderId: userId,
      senderName: sender.name,
      senderRole: sender.role,
      receiverId,
      receiverName: receiver.name,
      content,
      timestamp: new Date().toISOString(),
      isRead: false
    });

    // Add alert notification for target user
    await dbService.addNotification({
      id: `notif-${Date.now()}`,
      userId: receiverId,
      title: `New Message from ${sender.name}`,
      message: content.length > 60 ? content.slice(0, 60) + '...' : content,
      type: 'message',
      isRead: false,
      createdAt: new Date().toISOString()
    });

    res.json(msg);
  } catch (error) {
    next(error);
  }
});

export default router;
