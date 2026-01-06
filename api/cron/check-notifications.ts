// Vercel Cron Job Handler for Automatic Notifications
// This serverless function is triggered by Vercel Cron at scheduled times

import type { Request, Response } from 'express';

// Import notification checker
async function checkNotifications() {
  try {
    // Dynamic import to handle serverless environment
    const { notificationChecker } = await import('../../server/notificationChecker.js');
    
    console.log('[Vercel Cron] Starting notification check...');
    const result = await notificationChecker.checkAndNotifyAll();
    
    return {
      success: true,
      message: 'Notification check completed',
      notificationsSent: result.length,
      results: result,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[Vercel Cron] Error:', error);
    throw error;
  }
}

export default async function handler(
  req: Request,
  res: Response
) {
  // Verify the request is from Vercel Cron or authenticated
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'] || (req.query.apiKey as string);
  const cronSecret = process.env.CRON_SECRET || process.env.NOTIFICATION_API_KEY;

  // Check if request is from Vercel Cron (has special header)
  const isVercelCron = req.headers['x-vercel-cron'];
  
  // Check if request has valid auth token
  const isAuthenticated = authHeader === `Bearer ${cronSecret}` || apiKey === cronSecret;

  if (!isVercelCron && !isAuthenticated) {
    console.error('[Vercel Cron] Unauthorized request');
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid authentication. This endpoint is protected.' 
    });
  }

  try {
    console.log('[Vercel Cron] ========================================');
    console.log('[Vercel Cron] Received cron trigger');
    console.log('[Vercel Cron] Time:', new Date().toISOString());
    console.log('[Vercel Cron] Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
    console.log('[Vercel Cron] ========================================');
    
    const result = await checkNotifications();
    
    console.log(`[Vercel Cron] ✅ Notifications sent: ${result.notificationsSent}`);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('[Vercel Cron] Handler error:', error);
    return res.status(500).json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
