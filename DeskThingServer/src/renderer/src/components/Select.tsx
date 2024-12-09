import { SettingOption } from '@shared/types'
import React from 'react'
import ReactSelect, { MenuPlacement, MultiValue, SingleValue } from 'react-select'

interface SelectProps {
  options: SettingOption[]
  value: string[] | string
  isMulti?: boolean
  placeholder: string
  menuPlacement?: MenuPlacement
  className?: string
  onChange: (value: SingleValue<SettingOption> | MultiValue<SettingOption>) => void
}
const Select: React.FC<SelectProps> = ({
  options,
  isMulti,
  onChange,
  menuPlacement,
  value,
  placeholder,
  className
}) => {
  // We can't use tailwind css here because of how classes are passed into the child components
  const customStyles = {
    control: (provided) => ({
      ...provided,
      backgroundColor: 'rgb(24, 24, 27)', // Tailwind `bg-zinc-900`
      borderColor: 'rgb(63, 63, 70)', // Tailwind `border-zinc-700`
      color: 'white',
      padding: '0.25rem 0.5rem', // Tailwind `p-2`
      boxShadow: 'none',
      '&:hover': {
        borderColor: 'rgb(113, 113, 122)' // Tailwind `border-zinc-600`
      }
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: 'rgb(24, 24, 27)', // Tailwind `bg-zinc-900`
      color: 'white',
      borderRadius: '0.25rem', // Tailwind `rounded-md`
      padding: '0.5rem' // Tailwind `p-2`
    }),
    menuList: (provided) => ({
      ...provided,
      padding: 0
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? 'rgb(34, 197, 94)' // Tailwind `bg-green-500`
        : state.isFocused
          ? 'rgb(39, 39, 42)' // Tailwind `bg-zinc-800`
          : 'transparent',
      color: state.isSelected ? 'white' : 'rgb(229, 231, 235)', // Tailwind `text-gray-200`
      padding: '0.5rem 1rem', // Tailwind `px-4 py-2`
      '&:hover': {
        backgroundColor: 'rgb(39, 39, 42)', // Tailwind `bg-zinc-800`
        color: 'rgb(229, 231, 235)' // Tailwind `text-gray-200`
      }
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'white'
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: 'rgb(63, 63, 70)', // Tailwind `bg-zinc-700`
      color: 'white'
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: 'rgb(229, 231, 235)' // Tailwind `text-gray-200`
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: 'rgb(229, 231, 235)', // Tailwind `text-gray-200`
      '&:hover': {
        backgroundColor: 'rgb(185, 28, 28)', // Tailwind `bg-red-700`
        color: 'white'
      }
    })
  }

  return (
    <>
      <ReactSelect
        value={
          isMulti
            ? options.filter((option) => value.includes(option.value))
            : options.find((option) => option.value === value)
        }
        options={options}
        className={className}
        isMulti={isMulti}
        menuPlacement={menuPlacement}
        closeMenuOnSelect={!isMulti}
        styles={customStyles}
        placeholder={placeholder}
        onChange={onChange}
      />
    </>
  )
}

export default Select
