import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertTriangle, ChevronLeft } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import {
  useInsertTourDayMutation,
  useTourCoursesForAdmin,
  useTourDays,
  useTourEvent,
  useTourFormatsCatalog,
  useUpdateTourDayMutation,
  useDeleteTourDayMutation,
} from '@/hooks/use-data'
import { Skeleton } from '@/components/ui/skeleton'
import type { TourDayStatus } from '@/lib/types'

export function AdminTourDaysPage() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const { data: ev } = useTourEvent()
  const { data: days, isLoading } = useTourDays()
  const { data: courses } = useTourCoursesForAdmin()
  const { data: formats } = useTourFormatsCatalog()
  const insertDay = useInsertTourDayMutation()
  const updateDay = useUpdateTourDayMutation()
  const deleteDay = useDeleteTourDayMutation()

  const missing = useMemo(() => {
    const have = new Set(days?.map((d) => d.day_number) ?? [])
    return ([1, 2, 3] as const).filter((n) => !have.has(n))
  }, [days])

  const [addNum, setAddNum] = useState<string>('1')
  const [addCourse, setAddCourse] = useState('')
  const [addFormat, setAddFormat] = useState('')
  const [addStatus, setAddStatus] = useState<TourDayStatus>('setup')

  useEffect(() => {
    if (missing.length && !missing.includes(Number(addNum) as 1 | 2 | 3)) {
      setAddNum(String(missing[0]))
    }
  }, [missing, addNum])

  if (!profile?.is_admin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 px-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Admin Access Required</h2>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    )
  }

  const courseList = courses ?? []
  const formatList = formats ?? []

  const onAddDay = () => {
    if (!ev) return
    const n = Number(addNum) as 1 | 2 | 3
    if (![1, 2, 3].includes(n) || !addCourse || !addFormat) return
    insertDay.mutate({
      tour_id: ev.id,
      day_number: n,
      course_id: addCourse,
      format_id: addFormat,
      status: addStatus,
      played_at: null,
    })
  }

  return (
    <div className="py-4 px-4 overflow-x-auto">
      <div className="mb-5 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/tour')} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-black tracking-tight">Tour days</h1>
          <p className="text-sm text-muted-foreground">Up to three days: course, format, status</p>
        </div>
      </div>

      {!ev ? (
        <p className="text-sm text-muted-foreground">Create a tour under Event first.</p>
      ) : isLoading ? (
        <Skeleton className="h-48 rounded-xl" />
      ) : (
        <>
          {missing.length > 0 && courseList.length > 0 && formatList.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4 mb-4 space-y-3 max-w-xl">
              <p className="text-sm font-semibold">Add a day</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Day #</Label>
                  <Select value={addNum} onValueChange={(v) => v != null && setAddNum(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {missing.map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          Day {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Course</Label>
                  <Select value={addCourse} onValueChange={(v) => v != null && setAddCourse(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Course…" />
                    </SelectTrigger>
                    <SelectContent>
                      {courseList.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Format</Label>
                  <Select value={addFormat} onValueChange={(v) => v != null && setAddFormat(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Format…" />
                    </SelectTrigger>
                    <SelectContent>
                      {formatList.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select value={addStatus} onValueChange={(v) => setAddStatus(v as TourDayStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="setup">Setup</SelectItem>
                      <SelectItem value="locked">Locked</SelectItem>
                      <SelectItem value="in_progress">In progress</SelectItem>
                      <SelectItem value="complete">Complete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                size="sm"
                onClick={onAddDay}
                disabled={insertDay.isPending || !addCourse || !addFormat}
              >
                {insertDay.isPending ? 'Adding…' : 'Add day'}
              </Button>
            </div>
          )}

          <div className="rounded-xl border border-border min-w-[720px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Day</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Played</TableHead>
                  <TableHead className="w-[200px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {days?.map((d) => (
                  <DayRow
                    key={d.id}
                    day={d}
                    courses={courseList}
                    formats={formatList}
                    onSave={(patch) => updateDay.mutate({ id: d.id, patch })}
                    onDelete={() => {
                      if (confirm('Delete this day and its matches?')) deleteDay.mutate(d.id)
                    }}
                    busy={updateDay.isPending || deleteDay.isPending}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
          {(courseList.length === 0 || formatList.length === 0) && (
            <p className="text-sm text-muted-foreground mt-3">Add at least one course and one format before creating days.</p>
          )}
        </>
      )}
    </div>
  )
}

function DayRow({
  day,
  courses,
  formats,
  onSave,
  onDelete,
  busy,
}: {
  day: {
    id: string
    day_number: number
    course_id: string
    format_id: string
    status: TourDayStatus
    played_at?: string
    course: { id: string; name: string }
    format: { id: string; name: string }
  }
  courses: { id: string; name: string }[]
  formats: { id: string; name: string }[]
  onSave: (patch: {
    course_id?: string
    format_id?: string
    status?: TourDayStatus
    played_at?: string | null
  }) => void
  onDelete: () => void
  busy: boolean
}) {
  const [courseId, setCourseId] = useState(day.course_id)
  const [formatId, setFormatId] = useState(day.format_id)
  const [status, setStatus] = useState<TourDayStatus>(day.status)
  const [played, setPlayed] = useState(day.played_at?.slice(0, 10) ?? '')

  return (
    <TableRow>
      <TableCell className="font-semibold">{day.day_number}</TableCell>
      <TableCell>
        <Select value={courseId} onValueChange={(v) => v != null && setCourseId(v)}>
          <SelectTrigger size="sm" className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Select value={formatId} onValueChange={(v) => v != null && setFormatId(v)}>
          <SelectTrigger size="sm" className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {formats.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Select value={status} onValueChange={(v) => setStatus(v as TourDayStatus)}>
          <SelectTrigger size="sm" className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="setup">Setup</SelectItem>
            <SelectItem value="locked">Locked</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="complete">Complete</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input
          type="date"
          className="h-8 w-[150px]"
          value={played}
          onChange={(e) => setPlayed(e.target.value)}
        />
      </TableCell>
      <TableCell className="space-x-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() =>
            onSave({
              course_id: courseId,
              format_id: formatId,
              status,
              played_at: played === '' ? null : played,
            })
          }
        >
          Save
        </Button>
        <Button size="sm" variant="ghost" className="text-destructive" disabled={busy} onClick={onDelete}>
          Delete
        </Button>
      </TableCell>
    </TableRow>
  )
}
