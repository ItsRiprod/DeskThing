import { Icon } from '..'

function IconArrowRight(props): JSX.Element {
  const strokeWidth = props.strokeWidth || 2

  const svgContent = `
   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>`

  return <Icon {...props} dangerouslySetInnerHTML={{ __html: svgContent }} />
}

export default IconArrowRight
