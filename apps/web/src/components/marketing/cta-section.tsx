import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

interface CTASectionProps {
  title: string
  description: string
  primaryCta: {
    text: string
    href: string
  }
  secondaryCta?: {
    text: string
    href: string
  }
  variant?: 'default' | 'gradient' | 'minimal'
  className?: string
}

export function CTASection({
  title,
  description,
  primaryCta,
  secondaryCta,
  variant = 'default',
  className = ""
}: CTASectionProps) {
  const getBackgroundClass = () => {
    switch (variant) {
      case 'gradient':
        return 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
      case 'minimal':
        return 'bg-gray-50 dark:bg-gray-900'
      default:
        return 'bg-blue-600 text-white'
    }
  }

  return (
    <section className={`py-16 ${getBackgroundClass()} ${className}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${
          variant === 'minimal'
            ? 'text-gray-900 dark:text-white'
            : 'text-white'
        }`}>
          {title}
        </h2>

        <p className={`text-xl mb-8 ${
          variant === 'minimal'
            ? 'text-gray-600 dark:text-gray-300'
            : 'text-blue-100'
        }`}>
          {description}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className={`px-8 py-4 text-lg ${
              variant === 'minimal'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : variant === 'gradient'
                ? 'bg-white text-blue-600 hover:bg-gray-100'
                : 'bg-white text-blue-600 hover:bg-gray-100'
            }`}
            variant={variant === 'minimal' ? 'default' : 'secondary'}
          >
            <Link href={primaryCta.href}>
              {primaryCta.text}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>

          {secondaryCta && (
            <Button
              asChild
              variant="outline"
              size="lg"
              className={`px-8 py-4 text-lg ${
                variant === 'minimal'
                  ? 'border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
                  : 'border-white text-white hover:bg-white hover:text-blue-600'
              }`}
            >
              <Link href={secondaryCta.href}>
                {secondaryCta.text}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}