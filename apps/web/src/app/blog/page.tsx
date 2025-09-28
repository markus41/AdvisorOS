import { Navigation } from "@/components/marketing/navigation"
import { Footer } from "@/components/marketing/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Calendar,
  Clock,
  User,
  ArrowRight,
  Search,
  TrendingUp,
  FileText,
  Users,
  Lightbulb
} from "lucide-react"
import Link from "next/link"

const featuredPost = {
  id: 1,
  title: "The Future of CPA Firms: Embracing AI and Automation",
  excerpt: "Discover how artificial intelligence and automation are transforming the accounting industry and what this means for your practice.",
  content: "As the accounting industry evolves, CPA firms that embrace AI and automation are positioning themselves for success...",
  author: {
    name: "Sarah Chen",
    role: "CTO & Co-Founder"
  },
  publishedAt: "2024-01-15",
  readTime: 8,
  category: "Technology",
  image: "/blog/ai-automation.jpg",
  tags: ["AI", "Automation", "Future", "Technology"]
}

const blogPosts = [
  {
    id: 2,
    title: "5 Ways to Reduce Client Onboarding Time by 75%",
    excerpt: "Learn proven strategies to streamline your client onboarding process and improve the client experience.",
    author: {
      name: "David Rodriguez",
      role: "VP of Product"
    },
    publishedAt: "2024-01-10",
    readTime: 6,
    category: "Best Practices",
    tags: ["Onboarding", "Efficiency", "Client Experience"]
  },
  {
    id: 3,
    title: "QuickBooks Integration Best Practices for CPA Firms",
    excerpt: "Maximize the value of your QuickBooks integration with these expert tips and workflow optimizations.",
    author: {
      name: "Jennifer Walsh",
      role: "VP of Customer Success"
    },
    publishedAt: "2024-01-08",
    readTime: 5,
    category: "Integrations",
    tags: ["QuickBooks", "Integration", "Workflow"]
  },
  {
    id: 4,
    title: "Tax Season Preparation: A Digital-First Approach",
    excerpt: "Get ready for tax season with modern tools and processes that eliminate manual work and reduce stress.",
    author: {
      name: "Marcus Johnson",
      role: "CEO & Co-Founder"
    },
    publishedAt: "2024-01-05",
    readTime: 7,
    category: "Tax Season",
    tags: ["Tax Season", "Preparation", "Digital Tools"]
  },
  {
    id: 5,
    title: "Building Stronger Client Relationships Through Technology",
    excerpt: "Discover how modern CPA firms use technology to enhance communication and provide better client service.",
    author: {
      name: "Lisa Park",
      role: "VP of Marketing"
    },
    publishedAt: "2024-01-03",
    readTime: 4,
    category: "Client Relations",
    tags: ["Client Relations", "Communication", "Technology"]
  },
  {
    id: 6,
    title: "Security Best Practices for CPA Firms in 2024",
    excerpt: "Protect your firm and clients with these essential cybersecurity measures and compliance requirements.",
    author: {
      name: "Michael Thompson",
      role: "VP of Engineering"
    },
    publishedAt: "2024-01-01",
    readTime: 6,
    category: "Security",
    tags: ["Security", "Compliance", "Best Practices"]
  }
]

const categories = [
  { name: "All Posts", count: 25, active: true },
  { name: "Technology", count: 8 },
  { name: "Best Practices", count: 6 },
  { name: "Tax Season", count: 4 },
  { name: "Client Relations", count: 3 },
  { name: "Security", count: 2 },
  { name: "Integrations", count: 2 }
]

const popularTags = [
  "QuickBooks", "Automation", "AI", "Tax Season", "Client Experience",
  "Security", "Workflow", "Integration", "Best Practices", "Technology"
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />

      {/* Header */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              CPA Industry Insights
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              Stay ahead of industry trends, learn best practices, and discover how technology
              is transforming the world of accounting and advisory services.
            </p>

            {/* Search */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search articles..."
                className="pl-10 pr-4 py-3 rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-8">
              {/* Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {categories.map((category, index) => (
                    <button
                      key={index}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        category.active
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm">{category.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {category.count}
                        </span>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Popular Tags */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Popular Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {popularTags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Newsletter Signup */}
              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-900 dark:text-blue-100">
                    Stay Updated
                  </CardTitle>
                  <CardDescription className="text-blue-700 dark:text-blue-300">
                    Get the latest insights delivered to your inbox
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Your email address" />
                  <Button className="w-full">Subscribe</Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-12">
            {/* Featured Post */}
            <Card className="overflow-hidden border-2 border-blue-200 dark:border-blue-800">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 p-8 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white mb-4 mx-auto">
                      <TrendingUp className="w-8 h-8" />
                    </div>
                    <Badge className="bg-blue-600 text-white mb-4">Featured Post</Badge>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <Badge variant="outline">{featuredPost.category}</Badge>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(featuredPost.publishedAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="w-4 h-4 mr-1" />
                      {featuredPost.readTime} min read
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    {featuredPost.title}
                  </h2>

                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {featuredPost.excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-semibold mr-3">
                        {featuredPost.author.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {featuredPost.author.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {featuredPost.author.role}
                        </div>
                      </div>
                    </div>

                    <Button asChild>
                      <Link href={`/blog/${featuredPost.id}`}>
                        Read More
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Recent Posts */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                Recent Posts
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                {blogPosts.map((post) => (
                  <Card key={post.id} className="hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                      <div className="flex items-center space-x-4 mb-3">
                        <Badge variant="outline">{post.category}</Badge>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(post.publishedAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="w-4 h-4 mr-1" />
                          {post.readTime} min
                        </div>
                      </div>

                      <CardTitle className="text-xl leading-tight">
                        <Link
                          href={`/blog/${post.id}`}
                          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          {post.title}
                        </Link>
                      </CardTitle>

                      <CardDescription>
                        {post.excerpt}
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 text-sm font-semibold mr-3">
                            {post.author.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {post.author.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {post.author.role}
                            </div>
                          </div>
                        </div>

                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/blog/${post.id}`}>
                            Read More
                            <ArrowRight className="ml-1 w-4 h-4" />
                          </Link>
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-4">
                        {post.tags.map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Load More */}
            <div className="text-center">
              <Button variant="outline" size="lg">
                Load More Posts
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}