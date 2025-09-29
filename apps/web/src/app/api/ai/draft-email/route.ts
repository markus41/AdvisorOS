import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { communicationAssistantService } from '@/lib/ai/communication-assistant';
import { prisma as db } from "@/server/db"
import { z } from 'zod';

const draftEmailSchema = z.object({
  context: z.object({
    recipientType: z.enum(['client', 'colleague', 'vendor', 'authority', 'other']),
    purpose: z.enum(['inquiry', 'update', 'reminder', 'apology', 'proposal', 'followup', 'deadline', 'meeting', 'other']),
    subject: z.string().optional(),
    keyPoints: z.array(z.string()),
    tone: z.enum(['formal', 'professional', 'friendly', 'urgent', 'apologetic']),
    urgency: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    attachments: z.array(z.string()).optional(),
    deadline: z.string().transform((str) => new Date(str)).optional(),
    previousContext: z.string().optional(),
    clientIndustry: z.string().optional(),
    relationshipLevel: z.enum(['new', 'established', 'longterm']).optional(),
  }),
  clientId: z.string().optional(),
  saveAsDraft: z.boolean().default(false),
});

const generateResponseSchema = z.object({
  originalMessage: z.string(),
  context: z.object({
    clientProfile: z.any().optional(),
    previousConversation: z.string().optional(),
    urgency: z.enum(['low', 'medium', 'high']).optional(),
    purpose: z.string().optional(),
  }),
});

const analyzeSentimentSchema = z.object({
  text: z.string(),
});

const extractActionItemsSchema = z.object({
  text: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if AI features are enabled
    if (!communicationAssistantService.isReady()) {
      return NextResponse.json(
        { error: 'AI communication assistant is not available' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'draft';

    const body = await request.json();

    let result;

    switch (action) {
      case 'draft':
        // Validate request for email drafting
        const draftData = draftEmailSchema.parse(body);

        // Draft email
        const emailDraft = await communicationAssistantService.draftEmail(
          draftData.context,
          session.user.organizationId
        );

        // Save as draft if requested
        if (draftData.saveAsDraft) {
          try {
            await db.emailDraft.create({
              data: {
                organizationId: session.user.organizationId,
                clientId: draftData.clientId || null,
                subject: emailDraft.subject,
                body: emailDraft.body,
                recipientType: draftData.context.recipientType,
                purpose: draftData.context.purpose,
                tone: draftData.context.tone,
                urgency: draftData.context.urgency || 'medium',
                confidence: emailDraft.confidence,
                estimatedReadTime: emailDraft.estimatedReadTime,
                createdBy: session.user.id,
                createdAt: new Date(),
              },
            });
          } catch (dbError) {
            console.error('Failed to save email draft:', dbError);
          }
        }

        result = emailDraft;
        break;

      case 'generate-response':
        // Validate request for response generation
        const responseData = generateResponseSchema.parse(body);

        // Generate response suggestions
        const responses = await communicationAssistantService.generateResponseSuggestions(
          responseData.originalMessage,
          responseData.context,
          session.user.organizationId
        );

        result = { responses };
        break;

      case 'analyze-sentiment':
        // Validate request for sentiment analysis
        const sentimentData = analyzeSentimentSchema.parse(body);

        // Analyze sentiment
        const sentiment = await communicationAssistantService.analyzeSentiment(
          sentimentData.text,
          session.user.organizationId
        );

        result = { sentiment };
        break;

      case 'extract-actions':
        // Validate request for action item extraction
        const actionData = extractActionItemsSchema.parse(body);

        // Extract action items
        const actionItems = await communicationAssistantService.extractActionItems(
          actionData.text,
          session.user.organizationId
        );

        result = { actionItems };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error: any) {
    console.error('Communication assistant error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    if (error.message.includes('Rate limit exceeded')) {
      return NextResponse.json(
        { error: 'AI service is currently busy. Please try again later.' },
        { status: 429 }
      );
    }

    if (error.message.includes('Cost limit exceeded')) {
      return NextResponse.json(
        { error: 'Monthly AI usage limit reached for your organization.' },
        { status: 402 }
      );
    }

    return NextResponse.json(
      { error: 'Communication assistant request failed. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const clientId = searchParams.get('clientId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    switch (action) {
      case 'drafts':
        // Get email drafts
        const drafts = await db.emailDraft.findMany({
          where: {
            organizationId: session.user.organizationId,
            ...(clientId ? { clientId } : {}),
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
          select: {
            id: true,
            subject: true,
            recipientType: true,
            purpose: true,
            tone: true,
            urgency: true,
            confidence: true,
            estimatedReadTime: true,
            createdAt: true,
            client: {
              select: {
                id: true,
                name: true,
              },
            },
            creator: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        const totalDrafts = await db.emailDraft.count({
          where: {
            organizationId: session.user.organizationId,
            ...(clientId ? { clientId } : {}),
          },
        });

        return NextResponse.json({
          success: true,
          data: {
            drafts,
            pagination: {
              total: totalDrafts,
              limit,
              offset,
              hasMore: offset + limit < totalDrafts,
            },
          },
        });

      case 'templates':
        // Get communication templates
        const templates = await db.communicationTemplate.findMany({
          where: {
            organizationId: session.user.organizationId,
          },
          orderBy: { usageCount: 'desc' },
          take: limit,
          skip: offset,
        });

        const totalTemplates = await db.communicationTemplate.count({
          where: {
            organizationId: session.user.organizationId,
          },
        });

        return NextResponse.json({
          success: true,
          data: {
            templates,
            pagination: {
              total: totalTemplates,
              limit,
              offset,
              hasMore: offset + limit < totalTemplates,
            },
          },
        });

      case 'analytics':
        // Get communication analytics
        const analytics = await communicationAssistantService.getCommunicationAnalytics(
          session.user.organizationId,
          'month'
        );

        return NextResponse.json({
          success: true,
          data: analytics,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error fetching communication data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch communication data' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const draftId = searchParams.get('draftId');

    if (!draftId) {
      return NextResponse.json(
        { error: 'Draft ID is required' },
        { status: 400 }
      );
    }

    // Delete email draft
    const deleted = await db.emailDraft.deleteMany({
      where: {
        id: draftId,
        organizationId: session.user.organizationId,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Draft deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting draft:', error);
    return NextResponse.json(
      { error: 'Failed to delete draft' },
      { status: 500 }
    );
  }
}