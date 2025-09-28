import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

interface TestimonialCardProps {
  testimonial: string
  author: {
    name: string
    role: string
    company: string
    avatar?: string
  }
  rating: number
  variant?: 'default' | 'featured'
}

export function TestimonialCard({
  testimonial,
  author,
  rating,
  variant = 'default'
}: TestimonialCardProps) {
  return (
    <Card className={`h-full ${
      variant === 'featured'
        ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
        : 'hover:shadow-lg transition-shadow duration-300'
    }`}>
      <CardContent className="p-6 space-y-4">
        {/* Rating */}
        <div className="flex items-center space-x-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300 dark:text-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Testimonial */}
        <blockquote className="text-gray-700 dark:text-gray-300 italic leading-relaxed">
          "{testimonial}"
        </blockquote>

        {/* Author */}
        <div className="flex items-center space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
            {author.name.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white text-sm">
              {author.name}
            </div>
            <div className="text-gray-600 dark:text-gray-400 text-xs">
              {author.role} at {author.company}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}