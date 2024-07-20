import { Icon } from '..'

function IconLightbulbOn(props): JSX.Element {
  const strokeWidth = props.strokeWidth || 2

  const svgContent = `
   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-lightbulb"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`

  return <Icon {...props} dangerouslySetInnerHTML={{ __html: svgContent }} />
}

export default IconLightbulbOn
