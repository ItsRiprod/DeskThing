import { Icon } from '..'

function IconReload(props): JSX.Element {
  const strokeWidth = props.strokeWidth || 2

  const svgContent = `
   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rotate-ccw"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`

  return <Icon {...props} dangerouslySetInnerHTML={{ __html: svgContent }} />
}

export default IconReload
