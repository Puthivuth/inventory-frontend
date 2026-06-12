"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save } from "lucide-react"
import { fetchAPI } from "@/lib/api"

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
      // Get current user ID
      const userStr = localStorage.getItem("user")
      if (userStr) {
        const user = JSON.parse(userStr)
        setUserId(user.id)
        
        // Fetch user profile
        const profiles = await fetchAPI("/user-profiles/")
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
      const formData = new FormData()
      
      formData.append("user", userId.toString())
      formData.append("businessName", profileData.businessName)
      formData.append("businessAddress", profileData.businessAddress)
      formData.append("businessPhone", profileData.businessPhone)
      formData.append("businessEmail", profileData.businessEmail)
      formData.append("taxId", profileData.taxId)

      // Check if profile exists
      const profiles = await fetchAPI("/user-profiles/")
      
      let method = "POST"
      let endpoint = "/user-profiles/"
      
      const existingProfile = profiles.find((p: any) => p.user === userId)
      
      if (existingProfile) {
        method = "PUT"
        endpoint = `/user-profiles/${existingProfile.profileId}/`
      }

      await fetchAPI(endpoint, {
        method,
        body: formData,
      })

      alert("Settings saved successfully!")
      fetchUserProfile()
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
