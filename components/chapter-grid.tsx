"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, CheckCircle, Clock, Lock } from "lucide-react"
import Link from "next/link"

export function ChapterGrid() {
  const [chapters] = useState(
    Array.from({ length: 60 }, (_, i) => ({
      id: i + 1,
      title: `Chapter ${i + 1}`,
      description: `Learn about important cybersecurity concepts in Chapter ${i + 1}`,
      completed: i < 2,
      locked: i > 2, // Lock all chapters except first 3
    })),
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {chapters.map((chapter) => (
        <Card key={chapter.id} className={`overflow-hidden ${chapter.locked ? "opacity-80" : ""}`}>
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-2">
                {chapter.locked ? (
                  <Badge variant="outline" className="px-2 py-1 bg-gray-100 dark:bg-gray-800">
                    <span className="flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Locked
                    </span>
                  </Badge>
                ) : chapter.completed ? (
                  <Badge
                    variant="success"
                    className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                  >
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Completed
                    </span>
                  </Badge>
                ) : (
                  <Badge variant="outline" className="px-2 py-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Pending
                    </span>
                  </Badge>
                )}
                <span className="text-sm font-medium text-muted-foreground">#{chapter.id}</span>
              </div>
              <h3 className="font-semibold text-lg">{chapter.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{chapter.description}</p>
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-2 flex gap-2">
            {chapter.locked ? (
              <>
                <Button variant="outline" disabled className="flex-1">
                  <Lock className="h-4 w-4 mr-2" />
                  Locked
                </Button>
                <Button disabled className="flex-1">
                  Take Quiz
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline" className="flex-1">
                  <Link href={`/chapters/${chapter.id}`}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Read
                  </Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link href={`/chapters/${chapter.id}`}>Take Quiz</Link>
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
