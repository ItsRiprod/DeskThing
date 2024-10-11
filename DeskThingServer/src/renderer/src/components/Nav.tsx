import React, { useState, useRef, useEffect } from 'react'
import usePageStore from '../stores/pageStore'
import { useNavigate } from 'react-router-dom'
import {
  IconCarThing,
  IconDownload,
  IconHome,
  IconLayoutgrid,
  IconWrench
} from '@renderer/assets/icons'

const Nav: React.FC = () => {
  const currentPage = usePageStore((pageStore) => pageStore.currentPage)
  const setPage = usePageStore((pageStore) => pageStore.setPage)
  const navigate = useNavigate()

  const handleNavigation = (path: string): void => {
    setPage(path)
    navigate(path)
  }

  return (
    <nav className=" text-white w-full">
      <ul className="flex justify-around">
        <li className="w-full h-full group">
          <NavButton
            location="dashboard"
            currentPage={currentPage}
            handleNavigation={handleNavigation}
          >
            <IconHome iconSize={30} />
            <span className="hidden lg:inline group-hover:inline">Dashboard</span>
          </NavButton>
        </li>
        <li className="w-full h-full group">
          <NavButton
            location="clients"
            currentPage={currentPage}
            handleNavigation={handleNavigation}
            subDirectories={['Devices', 'Connections', 'Settings']}
          >
            <IconCarThing iconSize={30} />
            <span className="hidden lg:inline group-hover:inline">Clients</span>
          </NavButton>
        </li>
        <li className="w-full h-full group">
          <NavButton
            location="apps/list"
            currentPage={currentPage}
            handleNavigation={handleNavigation}
          >
            <IconLayoutgrid iconSize={30} />
            <span className="hidden lg:inline group-hover:inline">Apps</span>
          </NavButton>
        </li>
        <li className="w-full h-full group">
          <NavButton
            location="downloads"
            currentPage={currentPage}
            handleNavigation={handleNavigation}
            subDirectories={['App', 'Client']}
          >
            <IconDownload iconSize={30} />
            <span className="hidden lg:inline group-hover:inline">Downloads</span>
          </NavButton>
        </li>
        <li className="w-full h-full group">
          <NavButton
            location="dev"
            currentPage={currentPage}
            handleNavigation={handleNavigation}
            subDirectories={['App', 'ADB', 'Logs']}
          >
            <IconWrench iconSize={30} />
            <span className="hidden lg:inline group-hover:inline">Dev</span>
          </NavButton>
        </li>
      </ul>
    </nav>
  )
}

interface NavProps {
  location: string
  currentPage: string
  handleNavigation: (path: string) => void
  subDirectories?: string[]
  children?: React.ReactNode
}

const NavButton = ({
  location,
  currentPage,
  handleNavigation,
  subDirectories,
  children
}: NavProps): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleClick = (): void => {
    if (subDirectories && subDirectories.length > 0) {
      setIsOpen(!isOpen)
    } else {
      handleNavigation('/' + location)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleClick}
        className={`p-4 h-full w-full text-lg font-medium flex items-center justify-center gap-2 ${
          currentPage.includes(location)
            ? ' text-white border-b border-green-500'
            : 'text-gray-400 hover:bg-zinc-950 hover:text-white'
        }`}
      >
        {children}
      </button>
      {subDirectories && subDirectories.length > 0 && isOpen && (
        <div className="absolute top-full left-0 w-full bg-zinc-900 z-10">
          {subDirectories.map((subDir) => (
            <button
              key={subDir}
              onClick={() => handleNavigation(`/${location}/${subDir}`)}
              className="p-2 w-full text-left text-gray-400 hover:bg-zinc-950 hover:text-white"
            >
              {subDir}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default Nav
