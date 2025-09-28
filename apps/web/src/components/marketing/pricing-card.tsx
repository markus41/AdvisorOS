import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X } from "lucide-react"
import Link from "next/link"

interface PricingFeature {
  name: string
  included: boolean
  description?: string
}

interface PricingCardProps {
  name: string
  description: string
  price: {
    monthly: number
    annual: number
  }
  features: PricingFeature[]
  cta: {
    text: string
    href: string
  }
  popular?: boolean
  badge?: string
  billing?: 'monthly' | 'annual'
}

export function PricingCard({
  name,
  description,
  price,
  features,
  cta,
  popular = false,
  badge,
  billing = 'monthly'
}: PricingCardProps) {
  const currentPrice = billing === 'annual' ? price.annual : price.monthly
  const savings = billing === 'annual' ? Math.round(((price.monthly * 12) - price.annual) / (price.monthly * 12) * 100) : 0

  return (
    <Card className={`relative h-full flex flex-col ${
      popular
        ? 'border-blue-500 shadow-lg scale-105 bg-blue-50/50 dark:bg-blue-950/20'
        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors'
    }`}>
      {/* Popular Badge */}
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-blue-600 text-white px-4 py-1">
            Most Popular
          </Badge>
        </div>
      )}

      {/* Custom Badge */}
      {badge && !popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge variant="outline" className="bg-white dark:bg-gray-900 px-4 py-1">
            {badge}
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-8">
        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
          {name}
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300 mt-2">
          {description}
        </CardDescription>

        {/* Pricing */}
        <div className="mt-6">
          <div className="flex items-center justify-center">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">
              ${currentPrice}
            </span>
            <span className="text-gray-600 dark:text-gray-400 ml-2">
              /{billing === 'annual' ? 'year' : 'month'}
            </span>
          </div>

          {billing === 'annual' && savings > 0 && (
            <div className="text-sm text-green-600 dark:text-green-400 mt-2">
              Save {savings}% with annual billing
            </div>
          )}

          {billing === 'monthly' && price.annual > 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              ${price.annual}/year (save {Math.round(((price.monthly * 12) - price.annual) / (price.monthly * 12) * 100)}%)
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-4">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <div className={`mt-0.5 mr-3 flex-shrink-0 ${
                feature.included
                  ? 'text-green-500'
                  : 'text-gray-400 dark:text-gray-600'
              }`}>
                {feature.included ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <X className="w-5 h-5" />
                )}
              </div>
              <div>
                <span className={`text-sm ${
                  feature.included
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400 line-through'
                }`}>
                  {feature.name}
                </span>
                {feature.description && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {feature.description}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="pt-6">
        <Button
          asChild
          className={`w-full ${
            popular
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
          }`}
          variant={popular ? 'default' : 'outline'}
        >
          <Link href={cta.href}>
            {cta.text}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}