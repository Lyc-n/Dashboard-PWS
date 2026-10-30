// import { useEffect, createElement } from 'react' // Import createElement
// import { useLocation, Link } from '@tanstack/react-router'
// import { notifications } from '@mantine/notifications'
// import { useNotifikasi } from '@/hooks/notifikasi/use-notifikasi'
// import {
//   bacaDitampilkan,
//   pilihKandidatToast,
//   tandaiDitampilkan,
//   DURASI_TOAST,
// } from '@/lib/notifikasi/toast-dedup'
// import {
//   SEVERITY_META,
//   WARNING_TYPE_ICON,
//   WARNING_TYPE_LABEL,
// } from '@/components/dashboard/severity'
// import { warningTarget } from '@/lib/dashboard/warning'
// import { labelSingkat } from '@/lib/notifikasi/ringkasan'
// import { Badge } from '@mantine/core'

// export function useToastNotifikasi() {
//   const location = useLocation()
//   const { warnings, loading, error } = useNotifikasi()

//   useEffect(() => {
//     if (loading || error) return
//     if (location.pathname.startsWith('/notifikasi')) return

//     const kandidat = pilihKandidatToast(warnings, bacaDitampilkan())
//     if (kandidat.length === 0) return

//     tandaiDitampilkan(kandidat.map((w) => w.id))

//     kandidat.forEach((item) => {
//       const target = warningTarget(item)
//       const Ikon = WARNING_TYPE_ICON[item.type]

//       notifications.show({
//         id: item.id,
//         autoClose: DURASI_TOAST,
//         withCloseButton: true,
//         // Gunakan createElement alih-alih JSX
//         icon: createElement(Ikon, { size: 16 }),
//         color:
//           item.severity === 'critical'
//             ? 'red'
//             : item.severity === 'attention'
//               ? 'yellow'
//               : 'blue',
//         title: createElement(
//           'div',
//           { className: 'flex items-center gap-1.5 mb-1' },
//           createElement(Badge, { size: 'xs', variant: 'filled' }, SEVERITY_META[item.severity].label),
//           createElement('span', { className: 'text-[10px] font-medium uppercase text-muted' }, WARNING_TYPE_LABEL[item.type]),
//           item.region ? createElement(Badge, { size: 'xs', variant: 'outline', color: 'gray' }, item.region) : null
//         ),
//         message: createElement(
//           'div',
//           null,
//           createElement(
//             Link,
//             {
//               to: target.to,
//               search: target.search as never,
//               onClick: () => notifications.hide(item.id),
//               'aria-label': labelSingkat(item),
//               className: 'font-semibold text-ink hover:underline block text-sm',
//             },
//             item.title
//           ),
//           item.description ? createElement('p', { className: 'text-xs text-muted mt-0.5' }, item.description) : null
//         ),
//       })
//     })
//   }, [loading, error, warnings, location.pathname])
// }
