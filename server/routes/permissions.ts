import { Router, Request, Response } from 'express';
import { AuthMiddleware } from '../auth/auth-middleware';
import { PermissionSharingService } from '../services/permission-sharing-service';
import { z } from 'zod';

const router = Router();

// Validation schemas
const PermissionRequestSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  kycRecordId: z.string().optional(),
  documentIds: z.array(z.string()).optional(),
  permissions: z.object({
    read: z.boolean().default(false),
    verify: z.boolean().default(true),
    download: z.boolean().default(false)
  }),
  purpose: z.string().min(1, 'Purpose is required'),
  expiresInHours: z.number().min(1).max(8760).default(24), // Max 1 year
  requesterInfo: z.object({
    organizationName: z.string().min(1, 'Organization name is required'),
    organizationType: z.enum(['BANK', 'TELECOM', 'GOVERNMENT', 'UNIVERSITY', 'HEALTHCARE', 'OTHER']),
    contactEmail: z.string().email('Valid email is required'),
    businessLicense: z.string().optional(),
    verificationLevel: z.enum(['BASIC', 'VERIFIED', 'PREMIUM']).default('BASIC')
  })
});

const VerificationRequestSchema = z.object({
  token: z.string().min(1, 'Access token is required'),
  kycRecordId: z.string().optional()
});

const SchemeEligibilitySchema = z.object({
  token: z.string().min(1, 'Access token is required'),
  schemeId: z.string().min(1, 'Scheme ID is required')
});

// Grant access permission to organization
router.post('/grant',
  AuthMiddleware.authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const validatedData = PermissionRequestSchema.parse(req.body);
      
      const request = {
        ...validatedData,
        userId: req.user!.id
      };

      const result = await PermissionSharingService.requestPermission(request);

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.error || 'Failed to grant permission',
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: {
          grantId: result.grant!.id,
          accessToken: result.grant!.token,
          expiresAt: result.grant!.expiresAt,
          permissions: result.grant!.permissions,
          purpose: result.grant!.purpose,
          organizationInfo: result.grant!.requesterInfo
        },
        message: 'Access permission granted successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors,
          timestamp: new Date().toISOString()
        });
      } else {
        console.error('Permission grant error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to grant permission',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    }
  }
);

// Verify citizen status (for organizations)
router.post('/verify',
  async (req: Request, res: Response) => {
    try {
      const { token, kycRecordId } = VerificationRequestSchema.parse(req.body);

      const result = await PermissionSharingService.verifyCitizenStatus(token, kycRecordId);

      res.json({
        success: result.success,
        data: {
          citizenStatus: result.citizenStatus,
          verificationLevel: result.verificationLevel,
          lastUpdated: result.lastUpdated,
          documentHashes: result.documentHashes,
          blockchainTxHash: result.blockchainTxHash
        },
        message: result.success 
          ? 'Citizen verification completed'
          : result.error || 'Verification failed',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors,
          timestamp: new Date().toISOString()
        });
      } else {
        console.error('Citizen verification error:', error);
        res.status(500).json({
          success: false,
          message: 'Citizen verification failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    }
  }
);

// Check scheme eligibility (for government departments)
router.post('/eligibility',
  async (req: Request, res: Response) => {
    try {
      const { token, schemeId } = SchemeEligibilitySchema.parse(req.body);

      const result = await PermissionSharingService.checkSchemeEligibility(token, schemeId);

      res.json({
        success: result.success,
        data: {
          eligible: result.eligible,
          reason: result.reason,
          lastUpdated: result.lastUpdated,
          schemeId
        },
        message: result.success 
          ? `Eligibility check completed for scheme: ${schemeId}`
          : result.error || 'Eligibility check failed',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors,
          timestamp: new Date().toISOString()
        });
      } else {
        console.error('Scheme eligibility error:', error);
        res.status(500).json({
          success: false,
          message: 'Scheme eligibility check failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    }
  }
);

// Get user's active access grants
router.get('/grants',
  AuthMiddleware.authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const grants = await PermissionSharingService.getUserAccessGrants(req.user!.id);

      res.json({
        success: true,
        data: {
          grants: grants.map(grant => ({
            id: grant.id,
            organizationInfo: grant.requesterInfo,
            permissions: grant.permissions,
            purpose: grant.purpose,
            expiresAt: grant.expiresAt,
            usageCount: grant.usageCount,
            maxUsage: grant.maxUsage,
            createdAt: grant.createdAt,
            isActive: grant.isActive
          })),
          total: grants.length
        },
        message: 'Access grants retrieved successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Get access grants error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve access grants',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

// Get organization's granted accesses
router.get('/org-accesses',
  AuthMiddleware.authenticateToken,
  AuthMiddleware.requireOrganization,
  async (req: Request, res: Response) => {
    try {
      const accesses = await PermissionSharingService.getOrganizationAccesses(req.user!.id);

      res.json({
        success: true,
        data: {
          accesses: accesses.map(access => ({
            id: access.id,
            grantedBy: access.grantedBy,
            permissions: access.permissions,
            purpose: access.purpose,
            expiresAt: access.expiresAt,
            usageCount: access.usageCount,
            maxUsage: access.maxUsage,
            createdAt: access.createdAt
          })),
          total: accesses.length
        },
        message: 'Organization accesses retrieved successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Get organization accesses error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve organization accesses',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

// Revoke access grant
router.delete('/grants/:grantId',
  AuthMiddleware.authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { grantId } = req.params;

      const result = await PermissionSharingService.revokeAccess(grantId, req.user!.id);

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.error || 'Failed to revoke access',
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.json({
        success: true,
        message: 'Access grant revoked successfully',
        data: { grantId },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Revoke access error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to revoke access',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

// Generate QR code for access token
router.post('/qr-code',
  AuthMiddleware.authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          success: false,
          message: 'Access token is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const result = await PermissionSharingService.generateQRCode(token);

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.error || 'Failed to generate QR code',
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.json({
        success: true,
        data: {
          qrCode: result.qrCode
        },
        message: 'QR code generated successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('QR code generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate QR code',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

// Organization verification portal endpoint
router.get('/portal/verify/:token',
  async (req: Request, res: Response) => {
    try {
      const { token } = req.params;

      const result = await PermissionSharingService.verifyCitizenStatus(token);

      // Return HTML page for organizations
      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authen Ledger - Citizen Verification</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .status { padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; font-weight: bold; }
          .verified { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
          .pending { background-color: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
          .rejected { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
          .info { background-color: #e2e3e5; padding: 15px; border-radius: 5px; margin: 10px 0; }
          .header { text-align: center; color: #2c3e50; margin-bottom: 30px; }
          .footer { text-align: center; color: #6c757d; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Authen Ledger</h1>
            <h2>Citizen Verification Portal</h2>
          </div>
          
          <div class="status ${result.citizenStatus.toLowerCase()}">
            ${result.success ? '✅' : '❌'} Status: ${result.citizenStatus}
          </div>
          
          <div class="info">
            <strong>Verification Level:</strong> ${result.verificationLevel}<br>
            <strong>Last Updated:</strong> ${new Date(result.lastUpdated).toLocaleString()}<br>
            ${result.blockchainTxHash ? `<strong>Blockchain TX:</strong> ${result.blockchainTxHash}<br>` : ''}
            <strong>Verification Time:</strong> ${new Date().toLocaleString()}
          </div>
          
          ${result.success && result.citizenStatus === 'VERIFIED' ? `
            <div class="info">
              <strong>✅ Citizen Status:</strong> VERIFIED Indian Citizen<br>
              <strong>📊 Documents:</strong> ${result.documentHashes?.length || 0} verified documents<br>
              <strong>🔒 Security:</strong> Blockchain verified
            </div>
          ` : `
            <div class="info">
              <strong>❌ Verification Result:</strong> ${result.error || 'Citizen verification failed'}<br>
              <strong>ℹ️ Note:</strong> Please ensure valid documents are submitted and verified.
            </div>
          `}
          
          <div class="footer">
            Powered by Authen Ledger - Secure Blockchain Identity Verification<br>
            This verification is cryptographically secured and immutable.
          </div>
        </div>
      </body>
      </html>
      `;

      res.setHeader('Content-Type', 'text/html');
      res.send(html);

    } catch (error) {
      console.error('Organization portal error:', error);
      res.status(500).send(`
        <html>
        <body style="font-family: Arial, sans-serif; text-align: center; margin-top: 100px;">
          <h1>❌ Verification Failed</h1>
          <p>Unable to verify citizen status. Please try again later.</p>
          <p><small>Error: ${error instanceof Error ? error.message : 'Unknown error'}</small></p>
        </body>
        </html>
      `);
    }
  }
);

// Health check for permission service
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Permission sharing service is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;
