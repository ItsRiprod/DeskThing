import { Icon } from '..'

function IconHeartActive(props): JSX.Element {
  const strokeWidth = props.strokeWidth || 2

  const svgContent = `
   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-lightbulb-off"><path d='M8.667 1.912a6.257 6.257 0 00-7.462 7.677c.24.906.683 1.747 1.295 2.457l7.955 9.482a2.015 2.015 0 003.09 0l7.956-9.482a6.188 6.188 0 001.382-5.234l-.49.097.49-.099a6.303 6.303 0 00-5.162-4.98h-.002a6.24 6.24 0 00-5.295 1.65.623.623 0 01-.848 0 6.257 6.257 0 00-2.91-1.568z'/></svg>`

  return <Icon {...props} dangerouslySetInnerHTML={{ __html: svgContent }} />
}

export default IconHeartActive
