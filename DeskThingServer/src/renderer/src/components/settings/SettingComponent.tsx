import { SettingsType } from '@deskthing/types'
import { InfoComponent } from '../InfoComponent'

interface SettingComponentProps {
  setting: SettingsType
  children?: React.ReactNode
  className?: string
}

/**
 * Renders a setting component with a label, description, and optional children.
 * The component is styled with a hover effect and displays additional information
 * about the setting, such as the type and min/max values for number settings.
 *
 * @param setting - An object containing information about the setting, including
 * its type, label, description, min/max values (for number settings), and value.
 * @param children - Optional React nodes to be rendered alongside the setting
 * information.
 * @param className - An optional CSS class name to be applied to the component.
 * @returns A JSX.Element representing the rendered setting component.
 */
const SettingComponent = ({ setting, children, className }: SettingComponentProps): JSX.Element => {
  return (
    <div
      className={`py-3 shrink-0 flex items-center hover:bg-zinc-950/30 justify-between w-full relative ${className} ${setting.disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <div className="w-full flex-1">
        <div className="text-gray-500 font-geistMono absolute -top-2 inset flex justify-between w-full">
          {setting.type === 'number' && (
            <p>
              MIN: {setting.min} | MAX: {setting.max}
            </p>
          )}
        </div>
        <div className="group relative flex flex-wrap w-full">
          <p className="py-5 cursor-help text-lg break-words max-w-xs">{setting.label}</p>
          {setting.description && <InfoComponent description={setting.description} side="right" />}
        </div>
      </div>
      <div className="flex flex-col items-center">
        {setting.type === 'range' && <div>{setting.value}</div>}
        {children}
      </div>
    </div>
  )
}

export default SettingComponent
