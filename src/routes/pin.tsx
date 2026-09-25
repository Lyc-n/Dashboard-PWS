import { createFileRoute, redirect } from '@tanstack/react-router'
import { getSessionToken } from '#/lib/utils.functions'

/* ALUR LOGIN
1. cek sessionToken pake beforeLoad di /laporan (form)
2. sessionToken di crosscheck ke validSessions di DB
3. kalo gk ada kredensial redirect ke pin
4. pin valid redirect ke /laporan
5. update expireTime sessionToken kalo akses /laporan
*/

export const Route = createFileRoute('/pin')({
  component: RouteComponent,
  beforeLoad: async () => {
    try {
      await getSessionToken();
      throw redirect({ to: '/laporan' })
    } catch (error) {
      throw redirect({ to: '/' })
    }
  },
})

function RouteComponent() {
  return( 
  <div>
    <div> PIN PAD </div>
    <form action="">
      <input type="number" />
    </form>
    Hello "/pin"!
  </div>
  )
}
