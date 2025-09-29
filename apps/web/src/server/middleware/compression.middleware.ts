import { NextRequest, NextResponse } from 'next/server'
import { Redis } from 'ioredis'
import zlib from 'zlib'
import { promisify } from 'util'

const gzip = promisify(zlib.gzip)
const brotliCompress = promisify(zlib.brotliCompress)
const deflate = promisify(zlib.deflate)

interface CompressionOptions {
  threshold: number
  enableBrotli: boolean
  enableGzip: boolean
  enableDeflate: boolean
  level: number
  memLevel: number
  chunkSize: number
  windowBits: number
  strategy: number
  cacheCompressed: boolean
  cacheTTL: number
}

interface CompressionStats {
  originalSize: number
  compressedSize: number
  compressionRatio: number
  algorithm: string
  compressionTime: number
}

class CompressionMiddleware {
  private redis: Redis | null = null
  private options: CompressionOptions
  private stats: Map<string, CompressionStats> = new Map()

  constructor(redis?: Redis, options: Partial<CompressionOptions> = {}) {
    this.redis = redis || null
    this.options = {
      threshold: 1024, // Only compress responses > 1KB
      enableBrotli: true,
      enableGzip: true,
      enableDeflate: true,
      level: 6, // Balanced compression level
      memLevel: 8,
      chunkSize: 16 * 1024,
      windowBits: 15,
      strategy: zlib.constants.Z_DEFAULT_STRATEGY,
      cacheCompressed: true,
      cacheTTL: 3600, // 1 hour
      ...options
    }
  }

  async middleware(request: NextRequest, response: NextResponse): Promise<NextResponse> {
    // Skip compression for certain content types
    if (this.shouldSkipCompression(request, response)) {
      return response
    }

    const acceptEncoding = request.headers.get('accept-encoding') || ''
    const algorithm = this.selectCompressionAlgorithm(acceptEncoding)

    if (!algorithm) {
      return response
    }

    try {
      const responseClone = response.clone()
      const body = await responseClone.text()

      // Skip compression for small responses
      if (body.length < this.options.threshold) {
        return response
      }

      // Check cache for pre-compressed version
      const cacheKey = this.generateCacheKey(request.url, body, algorithm)
      const cached = await this.getFromCache(cacheKey)

      if (cached) {
        return this.createCompressedResponse(response, cached.data, algorithm, cached.stats)
      }

      // Compress the response
      const compressionStart = Date.now()
      const compressed = await this.compressData(body, algorithm)
      const compressionTime = Date.now() - compressionStart

      const stats: CompressionStats = {
        originalSize: body.length,
        compressedSize: compressed.length,
        compressionRatio: compressed.length / body.length,
        algorithm,
        compressionTime
      }

      // Cache compressed version
      if (this.options.cacheCompressed) {
        await this.setCache(cacheKey, { data: compressed, stats })
      }

      // Store stats for monitoring
      this.stats.set(cacheKey, stats)

      return this.createCompressedResponse(response, compressed, algorithm, stats)

    } catch (error) {
      console.error('Compression failed:', error)
      return response
    }
  }

  private shouldSkipCompression(request: NextRequest, response: NextResponse): boolean {
    const contentType = response.headers.get('content-type') || ''
    const method = request.method

    // Skip compression for certain content types
    const skipContentTypes = [
      'image/',
      'video/',
      'audio/',
      'application/pdf',
      'application/zip',
      'application/gzip',
      'application/x-rar-compressed'
    ]

    if (skipContentTypes.some(type => contentType.includes(type))) {
      return true
    }

    // Skip compression for non-GET requests by default
    if (method !== 'GET' && method !== 'POST') {
      return true
    }

    // Skip if already compressed
    if (response.headers.get('content-encoding')) {
      return true
    }

    // Skip if explicitly disabled
    if (response.headers.get('x-no-compression') === 'true') {
      return true
    }

    return false
  }

  private selectCompressionAlgorithm(acceptEncoding: string): string | null {
    const encodings = acceptEncoding.toLowerCase().split(',').map(e => e.trim())

    // Prefer Brotli for better compression
    if (this.options.enableBrotli && encodings.some(e => e.includes('br'))) {
      return 'br'
    }

    // Fall back to Gzip
    if (this.options.enableGzip && encodings.some(e => e.includes('gzip'))) {
      return 'gzip'
    }

    // Last resort: Deflate
    if (this.options.enableDeflate && encodings.some(e => e.includes('deflate'))) {
      return 'deflate'
    }

    return null
  }

  private async compressData(data: string, algorithm: string): Promise<Buffer> {
    const buffer = Buffer.from(data, 'utf8')

    switch (algorithm) {
      case 'br':
        return await brotliCompress(buffer, {
          params: {
            [zlib.constants.BROTLI_PARAM_QUALITY]: this.options.level,
            [zlib.constants.BROTLI_PARAM_SIZE_HINT]: buffer.length
          }
        })

      case 'gzip':
        return await gzip(buffer, {
          level: this.options.level,
          memLevel: this.options.memLevel,
          chunkSize: this.options.chunkSize,
          windowBits: this.options.windowBits,
          strategy: this.options.strategy
        })

      case 'deflate':
        return await deflate(buffer, {
          level: this.options.level,
          memLevel: this.options.memLevel,
          chunkSize: this.options.chunkSize,
          windowBits: this.options.windowBits,
          strategy: this.options.strategy
        })

      default:
        throw new Error(`Unsupported compression algorithm: ${algorithm}`)
    }
  }

  private createCompressedResponse(
    originalResponse: NextResponse,
    compressedData: Buffer,
    algorithm: string,
    stats: CompressionStats
  ): NextResponse {
    const headers = new Headers(originalResponse.headers)

    headers.set('content-encoding', algorithm)
    headers.set('content-length', compressedData.length.toString())
    headers.set('vary', 'accept-encoding')

    // Add compression stats headers (for monitoring)
    headers.set('x-compression-ratio', stats.compressionRatio.toFixed(3))
    headers.set('x-compression-algorithm', algorithm)
    headers.set('x-original-size', stats.originalSize.toString())
    headers.set('x-compressed-size', stats.compressedSize.toString())

    return new NextResponse(compressedData, {
      status: originalResponse.status,
      statusText: originalResponse.statusText,
      headers
    })
  }

  private generateCacheKey(url: string, data: string, algorithm: string): string {
    const hash = require('crypto')
      .createHash('sha256')
      .update(url + data + algorithm)
      .digest('hex')
      .substring(0, 16)

    return `compression:${algorithm}:${hash}`
  }

  private async getFromCache(key: string): Promise<{ data: Buffer; stats: CompressionStats } | null> {
    if (!this.redis) return null

    try {
      const cached = await this.redis.get(key)
      if (cached) {
        const parsed = JSON.parse(cached)
        return {
          data: Buffer.from(parsed.data, 'base64'),
          stats: parsed.stats
        }
      }
    } catch (error) {
      console.error('Cache read error:', error)
    }

    return null
  }

  private async setCache(key: string, value: { data: Buffer; stats: CompressionStats }): Promise<void> {
    if (!this.redis) return

    try {
      const serialized = JSON.stringify({
        data: value.data.toString('base64'),
        stats: value.stats
      })

      await this.redis.setex(key, this.options.cacheTTL, serialized)
    } catch (error) {
      console.error('Cache write error:', error)
    }
  }

  // Performance monitoring methods
  getCompressionStats(): {
    totalRequests: number
    averageCompressionRatio: number
    averageCompressionTime: number
    algorithmDistribution: Record<string, number>
    sizeReduction: {
      totalOriginal: number
      totalCompressed: number
      totalSaved: number
    }
  } {
    const stats = Array.from(this.stats.values())

    if (stats.length === 0) {
      return {
        totalRequests: 0,
        averageCompressionRatio: 0,
        averageCompressionTime: 0,
        algorithmDistribution: {},
        sizeReduction: {
          totalOriginal: 0,
          totalCompressed: 0,
          totalSaved: 0
        }
      }
    }

    const totalOriginal = stats.reduce((sum, s) => sum + s.originalSize, 0)
    const totalCompressed = stats.reduce((sum, s) => sum + s.compressedSize, 0)

    const algorithmDistribution = stats.reduce((acc, s) => {
      acc[s.algorithm] = (acc[s.algorithm] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalRequests: stats.length,
      averageCompressionRatio: stats.reduce((sum, s) => sum + s.compressionRatio, 0) / stats.length,
      averageCompressionTime: stats.reduce((sum, s) => sum + s.compressionTime, 0) / stats.length,
      algorithmDistribution,
      sizeReduction: {
        totalOriginal,
        totalCompressed,
        totalSaved: totalOriginal - totalCompressed
      }
    }
  }

  clearStats(): void {
    this.stats.clear()
  }

  // Adaptive compression based on client capabilities and network conditions
  adaptiveCompressionLevel(request: NextRequest): number {
    const userAgent = request.headers.get('user-agent') || ''
    const connection = request.headers.get('connection') || ''

    // Higher compression for mobile devices (slower CPUs, limited bandwidth)
    if (this.isMobileDevice(userAgent)) {
      return Math.min(this.options.level + 2, 9)
    }

    // Lower compression for fast connections
    if (connection.includes('keep-alive') && this.isHighSpeedConnection(request)) {
      return Math.max(this.options.level - 1, 1)
    }

    return this.options.level
  }

  private isMobileDevice(userAgent: string): boolean {
    const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'tablet']
    return mobileKeywords.some(keyword => userAgent.toLowerCase().includes(keyword))
  }

  private isHighSpeedConnection(request: NextRequest): boolean {
    // This is a simplified heuristic
    // In a real implementation, you might use network information API or other indicators
    const effectiveType = request.headers.get('downlink') || ''
    return parseFloat(effectiveType) > 1.0 // > 1 Mbps
  }
}

// Express-style middleware for API routes
export function createCompressionMiddleware(redis?: Redis, options?: Partial<CompressionOptions>) {
  const compression = new CompressionMiddleware(redis, options)

  return async function compressionMiddleware(req: NextRequest, res: NextResponse) {
    return await compression.middleware(req, res)
  }
}

// React hook for compression statistics
export function useCompressionStats(compression: CompressionMiddleware) {
  const [stats, setStats] = useState(compression.getCompressionStats())

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(compression.getCompressionStats())
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [compression])

  return stats
}

// Response compression for tRPC
export function createTRPCCompressionMiddleware(redis?: Redis) {
  const compression = new CompressionMiddleware(redis, {
    threshold: 512, // Lower threshold for API responses
    cacheCompressed: true,
    cacheTTL: 1800 // 30 minutes
  })

  return {
    middleware: compression,
    // tRPC-specific compression wrapper
    wrapHandler: (handler: any) => {
      return async (opts: any) => {
        const result = await handler(opts)

        // Only compress successful responses with substantial data
        if (result && typeof result === 'object' && JSON.stringify(result).length > 512) {
          // Add compression hint to response
          if (opts.ctx.res) {
            opts.ctx.res.setHeader('x-compress-response', 'true')
          }
        }

        return result
      }
    }
  }
}

// File compression for document uploads
export class FileCompressionService {
  private redis: Redis | null

  constructor(redis?: Redis) {
    this.redis = redis || null
  }

  async compressFile(
    buffer: Buffer,
    mimeType: string,
    filename: string
  ): Promise<{
    compressedBuffer: Buffer
    originalSize: number
    compressedSize: number
    compressionRatio: number
    algorithm: string
  }> {
    // Skip compression for already compressed formats
    const skipFormats = ['image/jpeg', 'image/png', 'application/pdf', 'video/', 'audio/']
    if (skipFormats.some(format => mimeType.includes(format))) {
      return {
        compressedBuffer: buffer,
        originalSize: buffer.length,
        compressedSize: buffer.length,
        compressionRatio: 1,
        algorithm: 'none'
      }
    }

    const originalSize = buffer.length

    // Use Brotli for better compression of text-based files
    const algorithm = mimeType.includes('text/') || mimeType.includes('application/json') ? 'br' : 'gzip'

    let compressedBuffer: Buffer

    if (algorithm === 'br') {
      compressedBuffer = await brotliCompress(buffer, {
        params: {
          [zlib.constants.BROTLI_PARAM_QUALITY]: 8, // Higher quality for file storage
          [zlib.constants.BROTLI_PARAM_SIZE_HINT]: originalSize
        }
      })
    } else {
      compressedBuffer = await gzip(buffer, { level: 8 })
    }

    const compressionRatio = compressedBuffer.length / originalSize

    // Only use compressed version if it's significantly smaller
    if (compressionRatio > 0.9) {
      return {
        compressedBuffer: buffer,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1,
        algorithm: 'none'
      }
    }

    return {
      compressedBuffer,
      originalSize,
      compressedSize: compressedBuffer.length,
      compressionRatio,
      algorithm
    }
  }

  async decompressFile(
    compressedBuffer: Buffer,
    algorithm: string
  ): Promise<Buffer> {
    if (algorithm === 'none') {
      return compressedBuffer
    }

    const decompress = promisify(
      algorithm === 'br' ? zlib.brotliDecompress : zlib.gunzip
    )

    return await decompress(compressedBuffer)
  }
}

export { CompressionMiddleware }
export type { CompressionOptions, CompressionStats }