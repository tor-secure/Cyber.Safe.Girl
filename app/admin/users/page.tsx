"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Search, RefreshCw, AlertTriangle, UserPlus, MoreHorizontal } from "lucide-react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface User {
  id: string
  name: string
  email: string
  status: "active" | "inactive" | "completed"
  role: "user" | "admin"
  createdAt: string
  lastLogin: string
}

export default function UsersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [searchField, setSearchField] = useState<"name" | "email" | "id">("name")
  const [refreshing, setRefreshing] = useState(false)
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    role: "user",
    status: "active",
  })
  const [addingUser, setAddingUser] = useState(false)

  // Mock data for demonstration
  useEffect(() => {
    const mockUsers: User[] = [
      {
        id: "usr_1",
        name: "Jane Smith",
        email: "jane.smith@example.com",
        status: "active",
        role: "admin",
        createdAt: "2023-01-15T10:30:00Z",
        lastLogin: "2023-05-08T14:22:00Z",
      },
      {
        id: "usr_2",
        name: "John Doe",
        email: "john.doe@example.com",
        status: "completed",
        role: "user",
        createdAt: "2023-02-20T09:15:00Z",
        lastLogin: "2023-05-07T11:45:00Z",
      },
      {
        id: "usr_3",
        name: "Alice Johnson",
        email: "alice.johnson@example.com",
        status: "active",
        role: "user",
        createdAt: "2023-03-10T14:45:00Z",
        lastLogin: "2023-05-06T16:30:00Z",
      },
      {
        id: "usr_4",
        name: "Bob Williams",
        email: "bob.williams@example.com",
        status: "inactive",
        role: "user",
        createdAt: "2023-04-05T11:20:00Z",
        lastLogin: "2023-04-25T10:15:00Z",
      },
      {
        id: "usr_5",
        name: "Carol Brown",
        email: "carol.brown@example.com",
        status: "completed",
        role: "user",
        createdAt: "2023-03-22T08:50:00Z",
        lastLogin: "2023-05-05T09:40:00Z",
      },
    ]

    setUsers(mockUsers)
    setFilteredUsers(mockUsers)
    setLoading(false)
  }, [])

  // Handle search
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users)
      return
    }

    const filtered = users.filter((user) => {
      const fieldValue = user[searchField]?.toString().toLowerCase() || ""
      return fieldValue.includes(searchTerm.toLowerCase())
    })

    setFilteredUsers(filtered)
  }

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    // In a real app, you would fetch users from an API here
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setRefreshing(false)
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Handle add user
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingUser(true)

    try {
      // In a real app, you would make an API call to add the user
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Add the new user to the list
      const newUser: User = {
        id: `usr_${users.length + 1}`,
        name: newUserData.name,
        email: newUserData.email,
        status: newUserData.status as "active" | "inactive" | "completed",
        role: newUserData.role as "user" | "admin",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      }

      setUsers([...users, newUser])
      setFilteredUsers([...users, newUser])

      // Reset form and close dialog
      setNewUserData({
        name: "",
        email: "",
        role: "user",
        status: "active",
      })
      setShowAddUserDialog(false)
    } catch (err) {
      setError("Failed to add user")
    } finally {
      setAddingUser(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading users...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
          <Button onClick={() => setShowAddUserDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Search Users</CardTitle>
          <CardDescription>Search for users by name, email, or ID</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <Tabs defaultValue="name" onValueChange={(value) => setSearchField(value as any)}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="name">Name</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="id">User ID</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  placeholder={`Search by ${searchField}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            {searchTerm ? `Showing results for "${searchTerm}" in ${searchField}` : "Showing all users"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No users found matching your search." : "No users found."}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.status === "active" ? (
                          <Badge variant="default" className="bg-green-600">
                            Active
                          </Badge>
                        ) : user.status === "completed" ? (
                          <Badge variant="secondary">Completed</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.role === "admin" ? (
                          <Badge variant="default" className="bg-purple-600">
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="outline">User</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell>{formatDate(user.lastLogin)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit User</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Delete User</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddUser} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={newUserData.name}
                onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                placeholder="Enter email address"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={newUserData.role}
                onValueChange={(value) => setNewUserData({ ...newUserData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={newUserData.status}
                onValueChange={(value) => setNewUserData({ ...newUserData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" type="button" onClick={() => setShowAddUserDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addingUser}>
                {addingUser ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add User"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
