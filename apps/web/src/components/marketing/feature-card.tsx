import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  features: string[]
  image?: string
  cta?: {
    text: string
    href: string
  }
  variant?: 'default' | 'featured'
}

export function FeatureCard({
  icon,
  title,
  description,
  features,
  image,
  cta,
  variant = 'default'
}: FeatureCardProps) {
  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 ${
      variant === 'featured'
        ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20'
        : 'hover:border-blue-200 dark:hover:border-blue-800'
    }`}>
      <CardHeader className="pb-4">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${
          variant === 'featured'
            ? 'bg-blue-600 text-white'
            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
        }`}>
          {icon}
        </div>
        <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
          {title}
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Feature List */}
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              {feature}
            </li>
          ))}
        </ul>

        {/* Image */}
        {image && (
          <div className="relative h-48 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-gray-400 dark:text-gray-600 text-sm">Feature Preview</div>
            </div>
          </div>
        )}

        {/* CTA */}
        {cta && (
          <Button
            asChild
            variant={variant === 'featured' ? 'default' : 'ghost'}
            className="w-full group-hover:bg-blue-600 group-hover:text-white transition-colors"
          >
            <Link href={cta.href}>
              {cta.text}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}