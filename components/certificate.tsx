"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Share2 } from "lucide-react"

export function Certificate() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Your Certificate</CardTitle>
          <CardDescription>Congratulations on completing the Cyber Safe Girl course</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-8 bg-slate-50">
            <div className="text-center space-y-6">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-blue-600">Cyber Safe Girl</h2>
                <p className="text-sm text-muted-foreground">Certificate of Completion</p>
              </div>

              <div className="space-y-2">
                <p className="text-lg">This is to certify that</p>
                <p className="text-2xl font-semibold">SHREYAS H.S</p>
                <p className="text-lg">has successfully completed the</p>
                <p className="text-xl font-medium">Cyber Safe Girl Course</p>
                <p className="text-lg">with a score of</p>
                <p className="text-2xl font-semibold">80%</p>
              </div>

              <div className="pt-6 border-t mt-6">
                <div className="flex justify-between">
                  <div className="text-left">
                    <p className="text-sm font-medium">Date Issued</p>
                    <p className="text-sm">April 10, 2025</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Certificate ID</p>
                    <p className="text-sm">CSG-2025-04-10-12345</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            Download Certificate
          </Button>
          <Button variant="outline" className="flex-1">
            <Share2 className="mr-2 h-4 w-4" />
            Share Certificate
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verification</CardTitle>
          <CardDescription>Your certificate can be verified using the details below</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Certificate ID</p>
                <p className="text-sm">CSG-2025-04-10-12345</p>
              </div>
              <div>
                <p className="text-sm font-medium">Verification URL</p>
                <p className="text-sm break-all">https://cybersafegirl.com/verify/CSG-2025-04-10-12345</p>
              </div>
              <div>
                <p className="text-sm font-medium">Issued By</p>
                <p className="text-sm">Dr. Ananth Prabhu G</p>
              </div>
              <div>
                <p className="text-sm font-medium">Valid Until</p>
                <p className="text-sm">No Expiration</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
