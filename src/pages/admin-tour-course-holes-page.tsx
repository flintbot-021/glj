import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertTriangle, ChevronLeft } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useSeedTourHoles, useTourCourseByIdQuery, useTourHolesForCourse, useUpsertTourHoleMutation } from '@/hooks/use-data'
import { Skeleton } from '@/components/ui/skeleton'

export function AdminTourCourseHolesPage() {
  const navigate = useNavigate()
  const { courseId } = useParams<{ courseId: string }>()
  const profile = useAuthStore((s) => s.profile)
  const { data: course, isLoading: cLoading } = useTourCourseByIdQuery(courseId)
  const { data: holes, isLoading: hLoading } = useTourHolesForCourse(courseId)
  const seed = useSeedTourHoles()
  const upsert = useUpsertTourHoleMutation()

  if (!profile?.is_admin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 px-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Admin Access Required</h2>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    )
  }

  const loading = cLoading || hLoading

  return (
    <div className="py-4 px-4 pb-10">
      <div className="mb-5 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/tour/courses')} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-black tracking-tight">{course?.name ?? 'Course holes'}</h1>
          <p className="text-sm text-muted-foreground">Par, stroke index, yardage</p>
        </div>
      </div>

      {loading || !courseId ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={seed.isPending || (holes?.length ?? 0) > 0}
              onClick={() => seed.mutate(courseId)}
            >
              {holes?.length ? 'Holes already seeded' : seed.isPending ? 'Seeding…' : 'Create 18 placeholder holes'}
            </Button>
          </div>

          <div className="rounded-xl border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">#</TableHead>
                  <TableHead>Par</TableHead>
                  <TableHead>SI</TableHead>
                  <TableHead>Yards</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {holes?.map((h) => (
                  <HoleRow key={h.id} courseId={courseId} hole={h} onSave={(payload) => upsert.mutate(payload)} busy={upsert.isPending} />
                ))}
              </TableBody>
            </Table>
          </div>
          {!holes?.length && <p className="text-sm text-muted-foreground mt-3">No holes — seed placeholders, then edit.</p>}
        </>
      )}
    </div>
  )
}

function HoleRow({
  courseId,
  hole,
  onSave,
  busy,
}: {
  courseId: string
  hole: { hole_number: number; par: number; stroke_index: number; yardage?: number | null }
  onSave: (p: {
    course_id: string
    hole_number: number
    par: number
    stroke_index: number
    yardage: number | null
  }) => void
  busy: boolean
}) {
  const [par, setPar] = useState(String(hole.par))
  const [si, setSi] = useState(String(hole.stroke_index))
  const [yd, setYd] = useState(hole.yardage != null ? String(hole.yardage) : '')

  return (
    <TableRow>
      <TableCell className="font-mono">{hole.hole_number}</TableCell>
      <TableCell>
        <Input className="h-8 w-16" value={par} onChange={(e) => setPar(e.target.value)} inputMode="numeric" />
      </TableCell>
      <TableCell>
        <Input className="h-8 w-16" value={si} onChange={(e) => setSi(e.target.value)} inputMode="numeric" />
      </TableCell>
      <TableCell>
        <Input className="h-8 w-20" value={yd} onChange={(e) => setYd(e.target.value)} inputMode="numeric" placeholder="—" />
      </TableCell>
      <TableCell>
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() =>
            onSave({
              course_id: courseId,
              hole_number: hole.hole_number,
              par: Math.min(6, Math.max(3, Number(par) || 4)),
              stroke_index: Math.min(18, Math.max(1, Number(si) || 1)),
              yardage: yd.trim() === '' ? null : Number(yd),
            })
          }
        >
          Save
        </Button>
      </TableCell>
    </TableRow>
  )
}
