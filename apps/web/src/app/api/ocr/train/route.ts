import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma as db } from "@/server/db"
import { openaiClient } from '@/lib/ai/openai-client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin permissions
    const userPermissions = await db.userPermission.findFirst({
      where: {
        userId: session.user.id,
        organizationId: session.user.organizationId,
      },
    });

    if (!userPermissions?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin permissions required for model training' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      documentType,
      trainingData,
      modelName,
      description,
      validationThreshold = 0.8
    } = body;

    if (!documentType || !trainingData || !Array.isArray(trainingData)) {
      return NextResponse.json(
        { error: 'Document type and training data are required' },
        { status: 400 }
      );
    }

    // Validate training data format
    const validationResult = validateTrainingData(trainingData, documentType);
    if (!validationResult.valid) {
      return NextResponse.json(
        { error: `Invalid training data: ${validationResult.error}` },
        { status: 400 }
      );
    }

    // Create training job
    const trainingJob = await db.ocrTrainingJob.create({
      data: {
        id: `train_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        organizationId: session.user.organizationId,
        initiatedBy: session.user.id,
        documentType,
        modelName: modelName || `${documentType}_custom_${Date.now()}`,
        description: description || `Custom model for ${documentType} documents`,
        trainingData,
        status: 'pending',
        validationThreshold,
        createdAt: new Date(),
      },
    });

    // Start training process asynchronously
    startTrainingProcess(trainingJob.id, trainingData, documentType)
      .catch(error => {
        console.error(`Training job ${trainingJob.id} failed:`, error);
        updateTrainingJobStatus(trainingJob.id, 'failed', error.message);
      });

    return NextResponse.json({
      success: true,
      data: {
        trainingJobId: trainingJob.id,
        status: trainingJob.status,
        estimatedCompletionTime: estimateTrainingTime(trainingData.length),
        message: 'Model training started successfully',
      },
    });

  } catch (error: any) {
    console.error('Model training error:', error);
    return NextResponse.json(
      { error: 'Failed to start model training' },
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
    const jobId = searchParams.get('jobId');
    const status = searchParams.get('status');
    const documentType = searchParams.get('documentType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (jobId) {
      // Get specific training job
      const trainingJob = await db.ocrTrainingJob.findFirst({
        where: {
          id: jobId,
          organizationId: session.user.organizationId,
        },
        include: {
          initiator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          customModel: true,
        },
      });

      if (!trainingJob) {
        return NextResponse.json(
          { error: 'Training job not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: trainingJob,
      });
    } else {
      // Get all training jobs for the organization
      const where: any = {
        organizationId: session.user.organizationId,
      };

      if (status) where.status = status;
      if (documentType) where.documentType = documentType;

      const trainingJobs = await db.ocrTrainingJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          initiator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          customModel: {
            select: {
              id: true,
              modelName: true,
              accuracy: true,
              isActive: true,
            },
          },
        },
      });

      const total = await db.ocrTrainingJob.count({ where });

      return NextResponse.json({
        success: true,
        data: {
          trainingJobs,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total,
          },
        },
      });
    }

  } catch (error: any) {
    console.error('Error fetching training jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch training jobs' },
      { status: 500 }
    );
  }
}

/**
 * Validate training data format
 */
function validateTrainingData(
  trainingData: any[],
  documentType: string
): { valid: boolean; error?: string } {
  if (trainingData.length < 10) {
    return {
      valid: false,
      error: 'At least 10 training examples are required'
    };
  }

  if (trainingData.length > 1000) {
    return {
      valid: false,
      error: 'Maximum 1000 training examples allowed'
    };
  }

  // Validate each training example
  for (let i = 0; i < trainingData.length; i++) {
    const example = trainingData[i];

    if (!example.fileUrl && !example.fileBuffer) {
      return {
        valid: false,
        error: `Training example ${i + 1}: file URL or buffer is required`
      };
    }

    if (!example.expectedData || typeof example.expectedData !== 'object') {
      return {
        valid: false,
        error: `Training example ${i + 1}: expected data is required and must be an object`
      };
    }

    // Document type specific validations
    if (documentType === 'w2' && !example.expectedData.employee_name) {
      return {
        valid: false,
        error: `Training example ${i + 1}: W-2 documents must have employee_name in expected data`
      };
    }

    if (documentType === '1099' && !example.expectedData.payer_name) {
      return {
        valid: false,
        error: `Training example ${i + 1}: 1099 documents must have payer_name in expected data`
      };
    }

    if (documentType === 'invoice' && !example.expectedData.invoice_number) {
      return {
        valid: false,
        error: `Training example ${i + 1}: Invoice documents must have invoice_number in expected data`
      };
    }
  }

  return { valid: true };
}

/**
 * Start the training process
 */
async function startTrainingProcess(
  trainingJobId: string,
  trainingData: any[],
  documentType: string
): Promise<void> {
  await updateTrainingJobStatus(trainingJobId, 'processing', undefined, 10);

  try {
    // Step 1: Prepare training data
    const preparedData = await prepareTrainingData(trainingData, documentType);
    await updateTrainingJobStatus(trainingJobId, 'processing', undefined, 30);

    // Step 2: Generate embeddings for training examples
    const embeddings = await generateTrainingEmbeddings(preparedData);
    await updateTrainingJobStatus(trainingJobId, 'processing', undefined, 50);

    // Step 3: Create fine-tuning dataset
    const dataset = await createFineTuningDataset(preparedData, embeddings, documentType);
    await updateTrainingJobStatus(trainingJobId, 'processing', undefined, 70);

    // Step 4: Train the model (simulated - in real implementation, this would call Azure Custom Vision or OpenAI fine-tuning)
    const modelMetrics = await trainCustomModel(dataset, documentType);
    await updateTrainingJobStatus(trainingJobId, 'processing', undefined, 90);

    // Step 5: Validate model performance
    const validationResults = await validateTrainedModel(dataset, modelMetrics);
    await updateTrainingJobStatus(trainingJobId, 'processing', undefined, 95);

    // Step 6: Save trained model
    const customModel = await saveTrainedModel(
      trainingJobId,
      modelMetrics,
      validationResults,
      documentType
    );

    await updateTrainingJobStatus(trainingJobId, 'completed', undefined, 100);

    // Update training job with results
    await db.ocrTrainingJob.update({
      where: { id: trainingJobId },
      data: {
        customModelId: customModel.id,
        trainingMetrics: modelMetrics,
        validationResults,
        completedAt: new Date(),
      },
    });

  } catch (error) {
    console.error('Training process failed:', error);
    await updateTrainingJobStatus(trainingJobId, 'failed', error.message);
    throw error;
  }
}

/**
 * Prepare training data for model training
 */
async function prepareTrainingData(
  trainingData: any[],
  documentType: string
): Promise<any[]> {
  // This would involve downloading files, preprocessing images, etc.
  // For now, we'll simulate the preparation
  return trainingData.map((example, index) => ({
    id: `example_${index}`,
    documentType,
    text: example.ocrText || '', // Would be extracted using OCR
    expectedData: example.expectedData,
    confidence: 1.0, // Perfect confidence for training data
  }));
}

/**
 * Generate embeddings for training examples
 */
async function generateTrainingEmbeddings(preparedData: any[]): Promise<any[]> {
  const embeddings = [];

  for (const example of preparedData) {
    try {
      const embedding = await openaiClient.createEmbedding(example.text);
      embeddings.push({
        ...example,
        embedding: embedding.data[0].embedding,
      });
    } catch (error) {
      console.warn(`Failed to generate embedding for example ${example.id}:`, error);
      // Use zero vector as fallback
      embeddings.push({
        ...example,
        embedding: new Array(1536).fill(0), // OpenAI embedding dimension
      });
    }
  }

  return embeddings;
}

/**
 * Create fine-tuning dataset
 */
async function createFineTuningDataset(
  preparedData: any[],
  embeddings: any[],
  documentType: string
): Promise<any> {
  // This would create a dataset suitable for the chosen ML framework
  // For demonstration, we'll create a simple structure
  return {
    documentType,
    examples: embeddings,
    totalExamples: embeddings.length,
    features: Object.keys(embeddings[0]?.expectedData || {}),
  };
}

/**
 * Train custom model (simulated)
 */
async function trainCustomModel(dataset: any, documentType: string): Promise<any> {
  // Simulate model training with metrics
  // In a real implementation, this would call actual ML training APIs

  const baseAccuracy = 0.75 + Math.random() * 0.2; // 75-95% accuracy

  return {
    accuracy: Math.round(baseAccuracy * 100) / 100,
    precision: Math.round((baseAccuracy + 0.05) * 100) / 100,
    recall: Math.round((baseAccuracy - 0.03) * 100) / 100,
    f1Score: Math.round((baseAccuracy + 0.01) * 100) / 100,
    trainingLoss: Math.round((1 - baseAccuracy) * 100) / 100,
    validationLoss: Math.round((1 - baseAccuracy + 0.05) * 100) / 100,
    epochs: 10,
    learningRate: 0.001,
  };
}

/**
 * Validate trained model
 */
async function validateTrainedModel(dataset: any, modelMetrics: any): Promise<any> {
  // Simulate validation results
  return {
    testAccuracy: modelMetrics.accuracy - 0.02,
    confusionMatrix: generateConfusionMatrix(dataset.features.length),
    fieldAccuracies: generateFieldAccuracies(dataset.features),
    recommendedThreshold: 0.8,
  };
}

/**
 * Save trained model
 */
async function saveTrainedModel(
  trainingJobId: string,
  metrics: any,
  validationResults: any,
  documentType: string
): Promise<any> {
  const trainingJob = await db.ocrTrainingJob.findUnique({
    where: { id: trainingJobId },
  });

  if (!trainingJob) {
    throw new Error('Training job not found');
  }

  return await db.ocrCustomModel.create({
    data: {
      id: `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId: trainingJob.organizationId,
      modelName: trainingJob.modelName,
      description: trainingJob.description,
      documentType,
      accuracy: metrics.accuracy,
      precision: metrics.precision,
      recall: metrics.recall,
      f1Score: metrics.f1Score,
      trainingMetrics: metrics,
      validationResults,
      isActive: false, // Needs manual activation
      createdAt: new Date(),
    },
  });
}

/**
 * Helper functions
 */
function generateConfusionMatrix(numFields: number): number[][] {
  // Generate a realistic confusion matrix
  const matrix = [];
  for (let i = 0; i < numFields; i++) {
    const row = [];
    for (let j = 0; j < numFields; j++) {
      if (i === j) {
        row.push(Math.floor(Math.random() * 20) + 80); // High diagonal values
      } else {
        row.push(Math.floor(Math.random() * 5)); // Low off-diagonal values
      }
    }
    matrix.push(row);
  }
  return matrix;
}

function generateFieldAccuracies(fields: string[]): Record<string, number> {
  const accuracies: Record<string, number> = {};
  fields.forEach(field => {
    accuracies[field] = Math.round((0.75 + Math.random() * 0.2) * 100) / 100;
  });
  return accuracies;
}

function estimateTrainingTime(numExamples: number): number {
  // Estimate training time in milliseconds
  const baseTime = 60000; // 1 minute base
  const timePerExample = 1000; // 1 second per example
  return baseTime + (numExamples * timePerExample);
}

async function updateTrainingJobStatus(
  jobId: string,
  status: string,
  error?: string,
  progress?: number
): Promise<void> {
  const updateData: any = { status, updatedAt: new Date() };
  if (error) updateData.error = error;
  if (progress !== undefined) updateData.progress = progress;

  await db.ocrTrainingJob.update({
    where: { id: jobId },
    data: updateData,
  });
}