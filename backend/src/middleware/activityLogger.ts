import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Middleware to log user activity
 * Should be used after authentication middleware
 */
export const activityLogger = (
  action: string,
  resource: string,
  getResourceId?: (req: Request) => string | undefined
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Store original end function
    const originalEnd = res.end.bind(res);
    const startTime = Date.now();

    // Override end function to log after response
    // Using type assertion to handle the complex overloaded signature
    (res as { end: typeof res.end }).end = function (
      this: Response,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...args: any[]
    ): Response {
      // Restore original end
      res.end = originalEnd;

      // Log activity asynchronously (don't block response)
      if (req.user) {
        const resourceId = getResourceId ? getResourceId(req) : req.params.id;
        const responseTime = Date.now() - startTime;

        prisma.activityLog
          .create({
            data: {
              userId: req.user.id,
              action,
              resource,
              resourceId: resourceId || null,
              details: {
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                responseTime,
                query: Object.keys(req.query).length > 0 ? req.query : undefined,
              },
              ipAddress: getClientIp(req),
              userAgent: req.headers['user-agent'] || null,
            },
          })
          .catch((error) => {
            console.error('Failed to log activity:', error);
          });
      }

      // Call original end with all arguments
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (originalEnd as any).apply(this, args);
    } as typeof res.end;

    next();
  };
};

/**
 * Get client IP address from request
 */
function getClientIp(req: Request): string | null {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return ips.split(',')[0].trim();
  }
  return req.socket.remoteAddress || null;
}

/**
 * Predefined activity loggers for common actions
 */
export const logLogin = activityLogger('LOGIN', 'auth');
export const logLogout = activityLogger('LOGOUT', 'auth');
export const logPasswordChange = activityLogger('PASSWORD_CHANGE', 'auth');

export const logQuotationCreate = activityLogger('CREATE', 'quotation');
export const logQuotationUpdate = activityLogger('UPDATE', 'quotation');
export const logQuotationDelete = activityLogger('DELETE', 'quotation');
export const logQuotationView = activityLogger('VIEW', 'quotation');

export const logCustomerCreate = activityLogger('CREATE', 'customer');
export const logCustomerUpdate = activityLogger('UPDATE', 'customer');
export const logCustomerDelete = activityLogger('DELETE', 'customer');
export const logCustomerView = activityLogger('VIEW', 'customer');

export const logUserStatusChange = activityLogger('STATUS_CHANGE', 'user');
export const logUserRoleChange = activityLogger('ROLE_CHANGE', 'user');
export const logUserPasswordReset = activityLogger('PASSWORD_RESET', 'user');

export const logAnnouncementCreate = activityLogger('CREATE', 'announcement');
export const logAnnouncementUpdate = activityLogger('UPDATE', 'announcement');
export const logAnnouncementDelete = activityLogger('DELETE', 'announcement');

export const logSettingsChange = activityLogger('UPDATE', 'settings');
