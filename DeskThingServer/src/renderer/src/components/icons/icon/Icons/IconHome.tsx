import { Icon } from '..'

function IconHome(props): JSX.Element {
  const strokeWidth = props.strokeWidth || 2

  const svgContent = `
   <svg fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-house"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`

  return <Icon {...props} dangerouslySetInnerHTML={{ __html: svgContent }} />
}

export default IconHome
