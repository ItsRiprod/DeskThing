import { Icon, findClosestGlyphAvailable } from '..'

function IconHeart(props: any): JSX.Element {
  const strokeWidth = props.strokeWidth || 1

  const iconList = [{
    'size': 16,
    'svgContent': '<path d=\'M1.69 2A4.582 4.582 0 018 2.023 4.583 4.583 0 0111.88.817h.002a4.618 4.618 0 013.782 3.65v.003a4.543 4.543 0 01-1.011 3.84L9.35 14.629a1.765 1.765 0 01-2.093.464 1.762 1.762 0 01-.605-.463L1.348 8.309A4.582 4.582 0 011.689 2zm3.158.252A3.082 3.082 0 002.49 7.337l.005.005L7.8 13.664a.264.264 0 00.311.069.262.262 0 00.09-.069l5.312-6.33a3.043 3.043 0 00.68-2.573 3.118 3.118 0 00-2.551-2.463 3.079 3.079 0 00-2.612.816l-.007.007a1.501 1.501 0 01-2.045 0l-.009-.008a3.082 3.082 0 00-2.121-.861z\'/>'
  }, {
    'size': 24,
    'svgContent': '<path d=\'M5.21 1.57a6.757 6.757 0 016.708 1.545.124.124 0 00.165 0 6.741 6.741 0 015.715-1.78l.004.001a6.802 6.802 0 015.571 5.376v.003a6.689 6.689 0 01-1.49 5.655l-7.954 9.48a2.518 2.518 0 01-3.857 0L2.12 12.37A6.683 6.683 0 01.627 6.714 6.757 6.757 0 015.21 1.57zm3.12 1.803a4.757 4.757 0 00-5.74 3.725l-.001.002a4.684 4.684 0 001.049 3.969l.009.01 7.958 9.485a.518.518 0 00.79 0l7.968-9.495a4.688 4.688 0 001.049-3.965 4.803 4.803 0 00-3.931-3.794 4.74 4.74 0 00-4.023 1.256l-.008.008a2.123 2.123 0 01-2.9 0l-.007-.007a4.757 4.757 0 00-2.214-1.194z\'/>'
  }];

  const closestSize = findClosestGlyphAvailable(iconList, props.iconSize || 24);

  const svgContent = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${closestSize.svgContent}</svg>
  `

  return <Icon {...props} dangerouslySetInnerHTML={{ __html: svgContent }} />
}

export default IconHeart
