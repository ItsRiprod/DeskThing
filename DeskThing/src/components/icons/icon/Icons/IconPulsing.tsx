import { Icon } from '..'

function IconPulsing(props): JSX.Element {
  const strokeWidth = props.strokeWidth || 1

  const svgContent = `<svg stroke="currentColor" fill="currentColor" stroke-width="${strokeWidth}" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><style>.spinner_98HH{animation:spinner_mnRT 1.6s cubic-bezier(0.52,.6,.25,.99) infinite}.spinner_roCJ{animation-delay:.2s}.spinner_q4Oo{animation-delay:.4s}@keyframes spinner_mnRT{0%{r:0;opacity:1}75%,100%{r:11px;opacity:0}}</style><circle class="spinner_98HH" cx="12" cy="12" r="0"/><circle class="spinner_98HH spinner_roCJ" cx="12" cy="12" r="0"/><circle class="spinner_98HH spinner_q4Oo" cx="12" cy="12" r="0"/></svg>`
  return <Icon {...props} dangerouslySetInnerHTML={{ __html: svgContent }} />
}

export default IconPulsing
