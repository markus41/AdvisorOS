'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Card,
  Title,
  Text,
  Metric,
  ProgressBar,
  Badge,
  Flex,
  BarChart,
  DonutChart,
  Select,
  SelectItem,
} from '@tremor/react'
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  Calendar,
  Award,
  Clock,
  Target,
  Filter,
  Search,
  MoreVertical,
  UserPlus,
  Settings,
  Star,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

// Mock team data
const teamMembers = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@cpafirm.com',
    phone: '+1 (555) 123-4567',
    role: 'Senior Partner',
    department: 'Leadership',
    status: 'active',
    avatar: '/avatars/sarah.jpg',
    joinDate: '2018-03-15',
    billableHours: 165,
    targetHours: 160,
    revenueGenerated: 52500,
    clientSatisfaction: 4.8,
    activeProjects: 8,
    completedTasks: 142,
    permissions: ['admin', 'billing', 'reports', 'team_management'],
    skills: ['Tax Planning', 'Financial Advisory', 'Team Leadership'],
    utilization: 95,
    lastActive: '2 hours ago',
  },
  {
    id: '2',
    name: 'Mike Wilson',
    email: 'mike.wilson@cpafirm.com',
    phone: '+1 (555) 234-5678',
    role: 'Tax Specialist',
    department: 'Tax Services',
    status: 'active',
    avatar: '/avatars/mike.jpg',
    joinDate: '2020-07-22',
    billableHours: 158,
    targetHours: 160,
    revenueGenerated: 47400,
    clientSatisfaction: 4.6,
    activeProjects: 12,
    completedTasks: 98,
    permissions: ['tax_preparation', 'client_communication'],
    skills: ['Corporate Tax', 'Individual Tax', 'Tax Research'],
    utilization: 87,
    lastActive: '30 minutes ago',
  },
  {
    id: '3',
    name: 'Emily Davis',
    email: 'emily.davis@cpafirm.com',
    phone: '+1 (555) 345-6789',
    role: 'Senior Accountant',
    department: 'Accounting',
    status: 'active',
    avatar: '/avatars/emily.jpg',
    joinDate: '2019-11-08',
    billableHours: 172,
    targetHours: 160,
    revenueGenerated: 48300,
    clientSatisfaction: 4.9,
    activeProjects: 6,
    completedTasks: 156,
    permissions: ['bookkeeping', 'financial_statements', 'client_communication'],
    skills: ['Bookkeeping', 'Financial Analysis', 'QuickBooks'],
    utilization: 92,
    lastActive: '1 hour ago',
  },
  {
    id: '4',
    name: 'John Smith',
    email: 'john.smith@cpafirm.com',
    phone: '+1 (555) 456-7890',
    role: 'Junior Accountant',
    department: 'Accounting',
    status: 'active',
    avatar: '/avatars/john.jpg',
    joinDate: '2022-09-05',
    billableHours: 145,
    targetHours: 160,
    revenueGenerated: 36250,
    clientSatisfaction: 4.4,
    activeProjects: 4,
    completedTasks: 73,
    permissions: ['data_entry', 'document_management'],
    skills: ['Data Entry', 'Document Processing', 'Excel'],
    utilization: 78,
    lastActive: '3 hours ago',
  },
  {
    id: '5',
    name: 'Lisa Brown',
    email: 'lisa.brown@cpafirm.com',
    phone: '+1 (555) 567-8901',
    role: 'Financial Advisor',
    department: 'Advisory Services',
    status: 'active',
    avatar: '/avatars/lisa.jpg',
    joinDate: '2021-01-18',
    billableHours: 168,
    targetHours: 160,
    revenueGenerated: 50400,
    clientSatisfaction: 4.7,
    activeProjects: 9,
    completedTasks: 124,
    permissions: ['financial_planning', 'investment_advice', 'client_communication'],
    skills: ['Financial Planning', 'Investment Strategy', 'Risk Assessment'],
    utilization: 89,
    lastActive: '45 minutes ago',
  },
  {
    id: '6',
    name: 'David Chen',
    email: 'david.chen@cpafirm.com',
    phone: '+1 (555) 678-9012',
    role: 'IT Specialist',
    department: 'Technology',
    status: 'on_leave',
    avatar: '/avatars/david.jpg',
    joinDate: '2020-12-01',
    billableHours: 0,
    targetHours: 40,
    revenueGenerated: 0,
    clientSatisfaction: 4.5,
    activeProjects: 0,
    completedTasks: 89,
    permissions: ['system_admin', 'data_security'],
    skills: ['System Administration', 'Data Security', 'Software Integration'],
    utilization: 0,
    lastActive: '2 weeks ago',
  },
]

const departmentData = [
  { name: 'Leadership', count: 1, utilization: 95 },
  { name: 'Tax Services', count: 1, utilization: 87 },
  { name: 'Accounting', count: 2, utilization: 85 },
  { name: 'Advisory Services', count: 1, utilization: 89 },
  { name: 'Technology', count: 1, utilization: 0 },
]

const performanceData = [
  { month: 'Jan', 'Team Utilization': 85, 'Revenue per Employee': 42000 },
  { month: 'Feb', 'Team Utilization': 88, 'Revenue per Employee': 45000 },
  { month: 'Mar', 'Team Utilization': 91, 'Revenue per Employee': 48000 },
  { month: 'Apr', 'Team Utilization': 87, 'Revenue per Employee': 46500 },
  { month: 'May', 'Team Utilization': 93, 'Revenue per Employee': 51000 },
  { month: 'Jun', 'Team Utilization': 89, 'Revenue per Employee': 49500 },
]

interface TeamMemberCardProps {
  member: typeof teamMembers[0]
  onEdit: (member: typeof teamMembers[0]) => void
  onDelete: (id: string) => void
}

function TeamMemberCard({ member, onEdit, onDelete }: TeamMemberCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge color="green" size="sm">Active</Badge>
      case 'on_leave':
        return <Badge color="yellow" size="sm">On Leave</Badge>
      case 'inactive':
        return <Badge color="red" size="sm">Inactive</Badge>
      default:
        return <Badge color="gray" size="sm">Unknown</Badge>
    }
  }

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'red'
    if (utilization >= 80) return 'yellow'
    return 'green'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={member.avatar} alt={member.name} />
            <AvatarFallback>
              {member.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {member.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {member.role}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {member.department}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(member.status)}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onEdit(member)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Meeting
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(member.id)}
                className="text-red-600 dark:text-red-400"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-4">
        {/* Contact Info */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Mail className="w-4 h-4" />
            <span>{member.email}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Phone className="w-4 h-4" />
            <span>{member.phone}</span>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Text className="text-xs text-gray-500">Utilization</Text>
            <div className="flex items-center space-x-2 mt-1">
              <Text className="text-sm font-medium">{member.utilization}%</Text>
              <ProgressBar
                value={member.utilization}
                color={getUtilizationColor(member.utilization)}
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <Text className="text-xs text-gray-500">Satisfaction</Text>
            <div className="flex items-center space-x-1 mt-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <Text className="text-sm font-medium">{member.clientSatisfaction}</Text>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <Text className="text-xs text-gray-500">Projects</Text>
            <Text className="text-sm font-medium">{member.activeProjects}</Text>
          </div>
          <div>
            <Text className="text-xs text-gray-500">Tasks</Text>
            <Text className="text-sm font-medium">{member.completedTasks}</Text>
          </div>
          <div>
            <Text className="text-xs text-gray-500">Revenue</Text>
            <Text className="text-sm font-medium">${(member.revenueGenerated / 1000).toFixed(0)}K</Text>
          </div>
        </div>

        {/* Skills */}
        <div>
          <Text className="text-xs text-gray-500 mb-2">Skills</Text>
          <div className="flex flex-wrap gap-1">
            {member.skills.slice(0, 3).map((skill) => (
              <Badge key={skill} color="blue" size="sm" variant="light">
                {skill}
              </Badge>
            ))}
            {member.skills.length > 3 && (
              <Badge color="gray" size="sm" variant="light">
                +{member.skills.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500">
          Last active: {member.lastActive}
        </div>
      </div>
    </motion.div>
  )
}

interface AddTeamMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (member: any) => void
}

function AddTeamMemberModal({ isOpen, onClose, onSave }: AddTeamMemberModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    targetHours: 160,
  })

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      id: Date.now().toString(),
      status: 'active',
      joinDate: new Date().toISOString().split('T')[0],
      billableHours: 0,
      revenueGenerated: 0,
      clientSatisfaction: 0,
      activeProjects: 0,
      completedTasks: 0,
      permissions: [],
      skills: [],
      utilization: 0,
      lastActive: 'just now',
    })
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: '',
      department: '',
      targetHours: 160,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4"
      >
        <h2 className="text-xl font-semibold mb-4">Add Team Member</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
              <SelectItem value="Junior Accountant">Junior Accountant</SelectItem>
              <SelectItem value="Senior Accountant">Senior Accountant</SelectItem>
              <SelectItem value="Tax Specialist">Tax Specialist</SelectItem>
              <SelectItem value="Financial Advisor">Financial Advisor</SelectItem>
              <SelectItem value="Partner">Partner</SelectItem>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Department</label>
            <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
              <SelectItem value="Accounting">Accounting</SelectItem>
              <SelectItem value="Tax Services">Tax Services</SelectItem>
              <SelectItem value="Advisory Services">Advisory Services</SelectItem>
              <SelectItem value="Technology">Technology</SelectItem>
              <SelectItem value="Leadership">Leadership</SelectItem>
            </Select>
          </div>
          <div className="flex space-x-3 pt-4">
            <Button type="submit" className="flex-1">
              Add Member
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function TeamPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedRole, setSelectedRole] = useState('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [members, setMembers] = useState(teamMembers)

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = selectedDepartment === 'all' || member.department === selectedDepartment
    const matchesRole = selectedRole === 'all' || member.role === selectedRole

    return matchesSearch && matchesDepartment && matchesRole
  })

  const handleEditMember = (member: typeof teamMembers[0]) => {
    // In a real implementation, this would open an edit modal
    console.log('Edit member:', member)
  }

  const handleDeleteMember = (id: string) => {
    if (confirm('Are you sure you want to remove this team member?')) {
      setMembers(members.filter(m => m.id !== id))
    }
  }

  const handleAddMember = (newMember: any) => {
    setMembers([...members, newMember])
  }

  const activeMembers = members.filter(m => m.status === 'active')
  const avgUtilization = activeMembers.reduce((sum, m) => sum + m.utilization, 0) / activeMembers.length
  const totalRevenue = activeMembers.reduce((sum, m) => sum + m.revenueGenerated, 0)
  const avgSatisfaction = activeMembers.reduce((sum, m) => sum + m.clientSatisfaction, 0) / activeMembers.length

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Team Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your team members, roles, and performance metrics
              </p>
            </div>
            <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center space-x-2">
              <UserPlus className="w-4 h-4" />
              <span>Add Team Member</span>
            </Button>
          </div>
        </motion.div>

        {/* Team Overview KPIs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Text className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Team Members
                  </Text>
                  <Metric className="text-2xl font-bold mt-2">{members.length}</Metric>
                  <div className="flex items-center mt-2 space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <Text className="text-sm text-green-600">{activeMembers.length} active</Text>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Text className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Average Utilization
                  </Text>
                  <Metric className="text-2xl font-bold mt-2">{avgUtilization.toFixed(1)}%</Metric>
                  <div className="flex items-center mt-2 space-x-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <Text className="text-sm text-green-600">+2.3% vs last month</Text>
                  </div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Text className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Revenue Generated
                  </Text>
                  <Metric className="text-2xl font-bold mt-2">${(totalRevenue / 1000).toFixed(0)}K</Metric>
                  <div className="flex items-center mt-2 space-x-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <Text className="text-sm text-green-600">This quarter</Text>
                  </div>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Text className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Avg Client Satisfaction
                  </Text>
                  <Metric className="text-2xl font-bold mt-2">{avgSatisfaction.toFixed(1)}/5.0</Metric>
                  <div className="flex items-center mt-2 space-x-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <Text className="text-sm text-gray-600">Excellent rating</Text>
                  </div>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <Award className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Department Overview and Performance Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <Title>Department Overview</Title>
              <Text>Team distribution and utilization by department</Text>
              <div className="mt-6 space-y-4">
                {departmentData.map((dept) => (
                  <div key={dept.name}>
                    <Flex className="mb-2">
                      <Text className="font-medium">{dept.name}</Text>
                      <Text>{dept.count} members • {dept.utilization}% utilization</Text>
                    </Flex>
                    <ProgressBar
                      value={dept.utilization}
                      color={dept.utilization >= 90 ? "red" : dept.utilization >= 80 ? "yellow" : "green"}
                      className="mb-1"
                    />
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <Title>Team Performance Trends</Title>
              <Text>Monthly utilization and revenue per employee</Text>
              <BarChart
                className="h-72 mt-4"
                data={performanceData}
                index="month"
                categories={["Team Utilization"]}
                colors={["blue"]}
                valueFormatter={(value) => `${value}%`}
                showLegend={false}
                showGridLines={true}
              />
            </Card>
          </div>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 mb-6">
              <Title>Team Members ({filteredMembers.length})</Title>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search team members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Leadership">Leadership</SelectItem>
                  <SelectItem value="Tax Services">Tax Services</SelectItem>
                  <SelectItem value="Accounting">Accounting</SelectItem>
                  <SelectItem value="Advisory Services">Advisory Services</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                </Select>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="Senior Partner">Senior Partner</SelectItem>
                  <SelectItem value="Partner">Partner</SelectItem>
                  <SelectItem value="Senior Accountant">Senior Accountant</SelectItem>
                  <SelectItem value="Junior Accountant">Junior Accountant</SelectItem>
                  <SelectItem value="Tax Specialist">Tax Specialist</SelectItem>
                  <SelectItem value="Financial Advisor">Financial Advisor</SelectItem>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredMembers.map((member) => (
                <TeamMemberCard
                  key={member.id}
                  member={member}
                  onEdit={handleEditMember}
                  onDelete={handleDeleteMember}
                />
              ))}
            </div>

            {filteredMembers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <Text className="text-gray-500">No team members match your search criteria</Text>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Add Team Member Modal */}
        <AddTeamMemberModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleAddMember}
        />
      </div>
    </DashboardLayout>
  )
}