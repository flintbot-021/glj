import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useDeleteTourCourse, useInsertTourCourse, useTourCoursesForAdmin, useTourEvent } from '@/hooks/use-data'
import { Skeleton } from '@/components/ui/skeleton'

export function AdminTourCoursesPage() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const { data: ev } = useTourEvent()
  const { data: courses, isLoading } = useTourCoursesForAdmin()
  const insert = useInsertTourCourse()
  const del = useDeleteTourCourse()
  const [name, setName] = useState('')

  if (!profile?.is_admin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 px-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Admin Access Required</h2>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    )
  }

  const onAdd = () => {
    if (!ev || !name.trim()) return
    insert.mutate({ tour_id: ev.id, name: name.trim() }, { onSuccess: () => setName('') })
  }

  return (
    <div className="py-4 px-4">
      <div className="mb-5 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/tour')} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-black tracking-tight">Tour courses</h1>
          <p className="text-sm text-muted-foreground">Courses used by tour days; open a course to edit holes</p>
        </div>
      </div>

      {!ev ? (
        <p className="text-sm text-muted-foreground">Create a tour under Event first.</p>
      ) : isLoading ? (
        <Skeleton className="h-32 rounded-xl" />
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card p-4 mb-4 flex flex-wrap gap-2 items-end">
            <div className="space-y-1 flex-1 min-w-[200px]">
              <Label htmlFor="cname">New course name</Label>
              <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Championship" />
            </div>
            <Button onClick={onAdd} disabled={!name.trim() || insert.isPending}>
              Add course
            </Button>
          </div>

          <ul className="space-y-2">
            {courses?.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/admin/tour/courses/${c.id}/holes`}
                  className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
                >
                  <span className="font-medium">{c.name}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={(e) => {
                        e.preventDefault()
                        if (confirm('Delete this course and its holes? Days referencing it must be updated first.')) {
                          del.mutate(c.id)
                        }
                      }}
                    >
                      Delete
                    </Button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          {courses?.length === 0 && <p className="text-sm text-muted-foreground">No courses yet.</p>}
        </>
      )}
    </div>
  )
}
