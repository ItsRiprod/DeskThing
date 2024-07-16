import { Icon } from '..'

function IconTransfer(props): JSX.Element {
  const strokeWidth = props.strokeWidth || 1.5

  const svgContent = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-down"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>`
  return <Icon {...props} dangerouslySetInnerHTML={{ __html: svgContent }} />
}

export default IconTransfer

