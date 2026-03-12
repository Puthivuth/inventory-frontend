"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save } from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [userId, setUserId] = useState<number | null>(null)
  const [profileId, setProfileId] = useState<number | null>(null)
  const [profileData, setProfileData] = useState({
    businessName: "",
    businessAddress: "",
    businessPhone: "",
    businessEmail: "",
    taxId: "",
  })

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token")
      
      // Get current user ID
      const userStr = localStorage.getItem("user")
      if (userStr) {
        const user = JSON.parse(userStr)
        setUserId(user.id)
        
        // Fetch user profile
        const response = await fetch("http://localhost:8000/api/user-profiles/", {
          headers: { Authorization: `Token ${token}` },
        })
        
        if (response.ok) {
          const profiles = await response.json()
          const userProfile = profiles.find((p: any) => p.user === user.id)
          
          if (userProfile) {
            setProfileId(userProfile.profileId)
            setProfileData({
              businessName: userProfile.businessName || "",
              businessAddress: userProfile.businessAddress || "",
              businessPhone: userProfile.businessPhone || "",
              businessEmail: userProfile.businessEmail || "",
              taxId: userProfile.taxId || "",
            })
          }
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!userId) {
      alert("User ID not found")
      return
    }

    setIsSaving(true)
    try {
      const token = localStorage.getItem("token")
      const formData = new FormData()
      
      formData.append("user", userId.toString())
      formData.append("businessName", profileData.businessName)
      formData.append("businessAddress", profileData.businessAddress)
      formData.append("businessPhone", profileData.businessPhone)
      formData.append("businessEmail", profileData.businessEmail)
      formData.append("taxId", profileData.taxId)

      // Check if profile exists
      const checkResponse = await fetch("http://localhost:8000/api/user-profiles/", {
        headers: { Authorization: `Token ${token}` },
      })
      
      let method = "POST"
      let url = "http://localhost:8000/api/user-profiles/"
      
      if (checkResponse.ok) {
        const profiles = await checkResponse.json()
        const existingProfile = profiles.find((p: any) => p.user === userId)
        
        if (existingProfile && profileId) {
          method = "PUT"
          url = `http://localhost:8000/api/user-profiles/${profileId}/`
        }
      }

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Token ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        alert("Settings saved successfully!")
        fetchUserProfile()
      } else {
        const error = await response.text()
        console.error("Error saving:", error)
        alert("Failed to save settings")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      alert("Error saving settings")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              value={profileData.businessName}
              onChange={(e) => setProfileData({ ...profileData, businessName: e.target.value })}
              placeholder="Enter business name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessAddress">Business Address</Label>
            <Input
              id="businessAddress"
              value={profileData.businessAddress}
              onChange={(e) => setProfileData({ ...profileData, businessAddress: e.target.value })}
              placeholder="Enter business address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessPhone">Business Phone</Label>
            <Input
              id="businessPhone"
              value={profileData.businessPhone}
              onChange={(e) => setProfileData({ ...profileData, businessPhone: e.target.value })}
              placeholder="Enter business phone"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessEmail">Business Email</Label>
            <Input
              id="businessEmail"
              type="email"
              value={profileData.businessEmail}
              onChange={(e) => setProfileData({ ...profileData, businessEmail: e.target.value })}
              placeholder="Enter business email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxId">Tax ID / Registration Number</Label>
            <Input
              id="taxId"
              value={profileData.taxId}
              onChange={(e) => setProfileData({ ...profileData, taxId: e.target.value })}
              placeholder="Enter tax ID or registration number"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end mt-6">
        <Button onClick={handleSave} disabled={isSaving} className="bg-orange-600 hover:bg-orange-700">
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  )
}
