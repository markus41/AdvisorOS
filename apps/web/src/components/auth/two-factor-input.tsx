'use client'

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface TwoFactorInputProps {
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  length?: number
  placeholder?: string
  className?: string
  disabled?: boolean
  error?: boolean
}

export function TwoFactorInput({
  value,
  onChange,
  onComplete,
  length = 6,
  placeholder = '•',
  className,
  disabled = false,
  error = false,
}: TwoFactorInputProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length)
  }, [length])

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus()
    }
  }, [disabled])

  // Handle value changes
  useEffect(() => {
    if (value.length === length && onComplete) {
      onComplete(value)
    }
  }, [value, length, onComplete])

  const handleChange = (index: number, inputValue: string) => {
    // Only allow numeric input
    const numericValue = inputValue.replace(/[^0-9]/g, '')

    if (numericValue.length > 1) {
      // Handle paste operation
      const pastedValue = numericValue.slice(0, length)
      onChange(pastedValue)

      // Focus the last filled input or the next empty one
      const nextIndex = Math.min(pastedValue.length, length - 1)
      setActiveIndex(nextIndex)
      if (inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex].focus()
      }
      return
    }

    // Update value
    const newValue = value.split('')
    newValue[index] = numericValue
    const updatedValue = newValue.join('').slice(0, length)
    onChange(updatedValue)

    // Move to next input if value was entered
    if (numericValue && index < length - 1) {
      setActiveIndex(index + 1)
      if (inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus()
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // Move to previous input if current is empty
        setActiveIndex(index - 1)
        if (inputRefs.current[index - 1]) {
          inputRefs.current[index - 1].focus()
        }
      } else {
        // Clear current input
        const newValue = value.split('')
        newValue[index] = ''
        onChange(newValue.join(''))
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      setActiveIndex(index - 1)
      if (inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus()
      }
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      setActiveIndex(index + 1)
      if (inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus()
      }
    } else if (e.key === 'Enter' && value.length === length) {
      onComplete?.(value)
    }
  }

  const handleFocus = (index: number) => {
    setActiveIndex(index)
  }

  const handleClick = (index: number) => {
    setActiveIndex(index)
    if (inputRefs.current[index]) {
      inputRefs.current[index].focus()
    }
  }

  return (
    <div className={cn('flex items-center justify-center space-x-2', className)}>
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={() => handleFocus(index)}
          onClick={() => handleClick(index)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-12 h-12 text-center text-lg font-mono border rounded-lg',
            'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'transition-all duration-200',
            'dark:bg-gray-800 dark:text-white',
            {
              'border-red-500 focus:ring-red-500': error,
              'border-gray-300 dark:border-gray-600': !error && !disabled,
              'border-blue-500': !error && !disabled && activeIndex === index,
              'opacity-50 cursor-not-allowed': disabled,
              'bg-gray-50 dark:bg-gray-700': disabled,
            }
          )}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
      ))}
    </div>
  )
}

// Alternative version with a single input field that looks like separate boxes
export function TwoFactorInputSingle({
  value,
  onChange,
  onComplete,
  length = 6,
  className,
  disabled = false,
  error = false,
}: Omit<TwoFactorInputProps, 'placeholder'>) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (value.length === length && onComplete) {
      onComplete(value)
    }
  }, [value, length, onComplete])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/[^0-9]/g, '').slice(0, length)
    onChange(newValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.length === length) {
      onComplete?.(value)
    }
  }

  return (
    <div className={cn('relative', className)}>
      {/* Visual boxes */}
      <div className="flex items-center justify-center space-x-2">
        {Array.from({ length }, (_, index) => (
          <div
            key={index}
            className={cn(
              'w-12 h-12 border rounded-lg flex items-center justify-center text-lg font-mono',
              'transition-all duration-200',
              'dark:bg-gray-800',
              {
                'border-red-500': error,
                'border-gray-300 dark:border-gray-600': !error && !disabled,
                'border-blue-500': !error && !disabled && value.length === index,
                'opacity-50': disabled,
                'bg-gray-50 dark:bg-gray-700': disabled,
              }
            )}
          >
            {value[index] || ''}
          </div>
        ))}
      </div>

      {/* Hidden input */}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-default"
        style={{ caretColor: 'transparent' }}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />
    </div>
  )
}