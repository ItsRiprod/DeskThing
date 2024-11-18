import React, { useEffect, useState } from 'react'
import { WithContext as ReactTags } from 'react-tag-input'
import { Tag } from 'react-tag-input/types/components/SingleTag'

type TagListProps = {
  value: string[]
  maxValues?: number
  placeholder?: string
  unique?: boolean
  orderable?: boolean
  onChange: (values: string[]) => void
}

const TagList: React.FC<TagListProps> = ({
  onChange,
  value,
  placeholder,
  maxValues,
  unique = false,
  orderable = true
}) => {
  const [tags, setTags] = useState<Tag[]>(value.map((text) => ({ id: text, text, className: '' })))

  // Synchronize changes in the tag state with the onChange callback
  useEffect(() => {
    onChange(tags.map((tag) => tag.text))
  }, [tags, onChange])

  const handleDelete = (index: number): void => {
    setTags(tags.filter((_, i) => i !== index))
  }

  const onTagUpdate = (index: number, newTag: Tag): void => {
    const updatedTags = [...tags]
    updatedTags.splice(index, 1, newTag)
    setTags(updatedTags)
  }

  const handleAddition = (tag: Tag): void => {
    setTags((prevTags) => {
      return [...prevTags, tag]
    })
  }

  const handleDrag = (tag: Tag, currPos: number, newPos: number): void => {
    const newTags = tags.slice()

    newTags.splice(currPos, 1)
    newTags.splice(newPos, 0, tag)

    // re-render
    setTags(newTags)
  }

  const handleTagClick = (index: number): void => {
    console.log('The tag at index ' + index + ' was clicked')
  }

  const onClearAll = (): void => {
    setTags([])
  }

  return (
    <ReactTags
      tags={tags}
      handleDelete={handleDelete}
      handleAddition={handleAddition}
      handleDrag={handleDrag}
      handleTagClick={handleTagClick}
      onTagUpdate={onTagUpdate}
      placeholder={placeholder ?? 'Press enter to add new item'}
      inputFieldPosition="bottom"
      classNames={{
        tags: '',
        tagInput: '',
        selected: '',
        suggestions: '',
        activeSuggestion: '',
        editTagInput: '',
        editTagInputField: '',
        tag: 'bg-zinc-700 px-2 py-1 mr-1 rounded-md hover:ring-indigo-500',
        remove: 'ml-3 mt-3',
        tagInputField:
          'mt-2 block px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm w-96 max-w-s',
        clearAll:
          'mt-1 block px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md shadow-sm hover:outline-none hover:ring-red-500 hover:border-red-500 sm:text-sm'
      }}
      allowUnique={unique}
      allowDragDrop={orderable}
      clearAll
      onClearAll={onClearAll}
      maxTags={maxValues}
    />
  )
}

export default TagList
