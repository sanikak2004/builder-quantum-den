import { Router, Request, Response } from 'express';
import { AuthMiddleware } from '../auth/auth-middleware';
import { DocumentRetrievalService } from '../services/document-retrieval-service';
import { z } from 'zod';

const router = Router();

// Schema for document retrieval request
const DocumentAccessSchema = z.object({
  purpose: z.string().min(1, 'Purpose is required').default('view'),
  organizationToken: z.string().optional()
});

// Get document by ID (authenticated users only)
router.get('/:documentId', 
  AuthMiddleware.authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { documentId } = req.params;
      const { purpose = 'view' } = req.query;
      
      const accessInfo = {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };

      // Check if user has access to document
      const hasAccess = await DocumentRetrievalService.checkDocumentAccess(
        documentId, 
        req.user!.id
      );

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message: 'Access denied - you do not have permission to view this document',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Retrieve document
      const result = await DocumentRetrievalService.retrieveDocument(
        documentId,
        req.user!.id,
        purpose as string,
        accessInfo
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.error || 'Failed to retrieve document',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Set appropriate headers for file download
      const metadata = result.metadata!;
      res.setHeader('Content-Type', metadata.contentType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${metadata.filename}"`);
      res.setHeader('Content-Length', result.documentData!.length);
      res.setHeader('X-Document-Source', result.source);
      res.setHeader('X-Document-Type', metadata.documentType);

      // Send file data
      res.send(result.documentData);

    } catch (error) {
      console.error('Document retrieval error:', error);
      res.status(500).json({
        success: false,
        message: 'Document retrieval failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

// Get document metadata only (no file content)
router.get('/:documentId/metadata',
  AuthMiddleware.authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { documentId } = req.params;

      const hasAccess = await DocumentRetrievalService.checkDocumentAccess(
        documentId, 
        req.user!.id
      );

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const result = await DocumentRetrievalService.retrieveDocument(
        documentId,
        req.user!.id,
        'metadata_only',
        { ipAddress: req.ip, userAgent: req.get('User-Agent') }
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.error || 'Failed to retrieve document metadata',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Return metadata only (without file content)
      res.json({
        success: true,
        data: {
          ...result.metadata,
          source: result.source,
          hasAccess: true
        },
        message: 'Document metadata retrieved successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Document metadata retrieval error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve document metadata',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

// Get all documents for a KYC record
router.get('/kyc/:kycRecordId',
  AuthMiddleware.authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { kycRecordId } = req.params;
      const { includeContent = 'false' } = req.query;

      const accessInfo = {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };

      const results = await DocumentRetrievalService.retrieveKYCDocuments(
        kycRecordId,
        req.user!.id,
        'kyc_review',
        accessInfo
      );

      const responseData = results.map(result => {
        if (!result.success) {
          return {
            success: false,
            error: result.error,
            source: result.source
          };
        }

        const response: any = {
          success: true,
          metadata: result.metadata,
          source: result.source
        };

        // Include file content if requested
        if (includeContent === 'true' && result.documentData) {
          response.fileContent = result.documentData.toString('base64');
          response.contentEncoding = 'base64';
        }

        return response;
      });

      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;

      res.json({
        success: true,
        data: {
          documents: responseData,
          summary: {
            total: totalCount,
            successful: successCount,
            failed: totalCount - successCount
          }
        },
        message: `Retrieved ${successCount}/${totalCount} documents for KYC record`,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('KYC documents retrieval error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve KYC documents',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

// Generate access token for document sharing with organizations
router.post('/:documentId/share',
  AuthMiddleware.authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { documentId } = req.params;
      const { organizationId, expiresInHours = 24 } = req.body;

      if (!organizationId) {
        res.status(400).json({
          success: false,
          message: 'Organization ID is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Check if user owns the document
      const hasAccess = await DocumentRetrievalService.checkDocumentAccess(
        documentId,
        req.user!.id
      );

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message: 'Access denied - you can only share your own documents',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const result = await DocumentRetrievalService.generateDocumentAccessToken(
        documentId,
        organizationId,
        expiresInHours
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.error || 'Failed to generate access token',
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.json({
        success: true,
        data: {
          token: result.token,
          expiresAt: result.expiresAt,
          documentId,
          organizationId,
          validFor: `${expiresInHours} hours`
        },
        message: 'Document access token generated successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Document sharing error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate document access token',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

// Get document access history (for audit purposes)
router.get('/:documentId/access-history',
  AuthMiddleware.authenticateToken,
  AuthMiddleware.requireRole(['ADMIN', 'VERIFIER']),
  async (req: Request, res: Response) => {
    try {
      const { documentId } = req.params;
      const { limit = '50' } = req.query;

      const history = await DocumentRetrievalService.getDocumentAccessHistory(
        documentId,
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: {
          documentId,
          accessHistory: history,
          totalRecords: history.length
        },
        message: 'Document access history retrieved successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Document access history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve document access history',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

// Organization access endpoint (using access token)
router.get('/org-access/:token',
  async (req: Request, res: Response) => {
    try {
      const { token } = req.params;

      // Verify access token
      const accessToken = await DocumentRetrievalService.verifyAccessToken(token);
      
      if (!accessToken) {
        res.status(401).json({
          success: false,
          message: 'Invalid or expired access token',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const documentId = accessToken.permissions.documentId;
      const result = await DocumentRetrievalService.retrieveDocument(
        documentId,
        accessToken.userId,
        'organization_access',
        { ipAddress: req.ip, userAgent: req.get('User-Agent') }
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.error || 'Failed to retrieve document',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Return verification result instead of actual file
      res.json({
        success: true,
        data: {
          documentVerified: true,
          documentType: result.metadata?.documentType,
          uploadedAt: result.metadata?.uploadedAt,
          kycRecordId: result.metadata?.kycRecordId,
          fileSize: result.metadata?.fileSize,
          source: result.source,
          verificationHash: result.metadata?.documentId // Can be used for verification
        },
        message: 'Document verification completed',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Organization document access error:', error);
      res.status(500).json({
        success: false,
        message: 'Document verification failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

export default router;
