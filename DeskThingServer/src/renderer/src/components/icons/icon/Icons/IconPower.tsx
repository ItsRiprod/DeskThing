import { Icon } from '..'

function IconPower(props): JSX.Element {
  const strokeWidth = props.strokeWidth || 1.5

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-power"><path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.77.04"/></svg>`
  return <Icon {...props} dangerouslySetInnerHTML={{ __html: svgContent }} />
}

export default IconPower

